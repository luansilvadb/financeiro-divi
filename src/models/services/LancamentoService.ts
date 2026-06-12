import type { IGastoRepository } from '../repositories/IGastoRepository'
import type { IFaturaRepository } from '../repositories/IFaturaRepository'
import type { ICartaoRepository } from '../repositories/ICartaoRepository'
import { Gasto } from '../entities/Gasto'
import { Dinheiro } from '../entities/Dinheiro'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'
import { Fatura } from '../entities/Fatura'
import type { LancarGastoInput } from './GastoService'
import { resolverCartao } from './CartaoResolver'

export class LancamentoService {
  constructor(
    private gastoRepo: IGastoRepository,
    private faturaRepo: IFaturaRepository,
    private cartaoRepo: ICartaoRepository
  ) {}

  async lancarGastoOuEmprestimo(dados: LancarGastoInput): Promise<void> {
    const total = Dinheiro.deReais(dados.valor)
    const todosCartoes = await this.cartaoRepo.listarTodos()
    const { cartaoId, cardOwner: resolvedCardOwner, responsavelFaturaId } = resolverCartao(
      dados.paymentMethod,
      dados.cardOwnerId,
      dados.compradorId,
      todosCartoes
    )
    
    const faturaAtiva = cartaoId
      ? await this.faturaRepo.assegurarObterOuCriarFatura(cartaoId, dados.periodo.mes, dados.periodo.ano, responsavelFaturaId)
      : null
    
    if (dados.paymentMethod === 'card' && dados.installments > 1) {
      if (!faturaAtiva) throw new Error('Não foi possível obter fatura para compra parcelada em cartão')
      const grupoParcelasId = crypto.randomUUID()
      const faturasParaSalvar: Fatura[] = []
      const gastosParaSalvar: Gasto[] = [
        new Gasto({ id: crypto.randomUUID(), faturaId: faturaAtiva.id, descricao: dados.descricao, valorTotal: total, compradorId: dados.compradorId, divisoes: dados.divisoes, installments: dados.installments, totalInstallments: dados.installments, isLoan: false, method: 'card', cardOwner: resolvedCardOwner, grupoParcelasId, isPrivate: dados.isPrivate || false })
      ]

      let { mes, ano } = faturaAtiva.periodo
      const todasFaturas = await this.faturaRepo.listarTodas()

      for (let i = 2; i <= dados.installments; i++) {
        if (++mes > 12) { mes = 1; ano++ }
        const faturaFutura = await this.obterOuCriarFaturaMemoria(faturaAtiva.cartaoId!, mes, ano, responsavelFaturaId, faturasParaSalvar, todasFaturas)
        gastosParaSalvar.push(new Gasto({ id: crypto.randomUUID(), faturaId: faturaFutura.id, descricao: dados.descricao, valorTotal: total, compradorId: dados.compradorId, divisoes: [...dados.divisoes], installments: dados.installments - i + 1, totalInstallments: dados.installments, isLoan: false, method: 'card', cardOwner: resolvedCardOwner, grupoParcelasId, isPrivate: dados.isPrivate || false }))
      }

      if (faturasParaSalvar.length > 0) await this.faturaRepo.salvarMuitas(faturasParaSalvar)
      await this.gastoRepo.salvarMuitos(gastosParaSalvar)
    } else {
      await this.gastoRepo.salvar(new Gasto({
        id: crypto.randomUUID(), faturaId: faturaAtiva?.id ?? null, descricao: dados.flow === 'loan' ? (dados.descricao.trim() || 'Empréstimo Pessoal') : dados.descricao, valorTotal: total, compradorId: dados.compradorId, divisoes: dados.divisoes, installments: dados.installments, totalInstallments: dados.installments, isLoan: dados.flow === 'loan', borrowerId: dados.borrowerId, method: dados.paymentMethod, cardOwner: resolvedCardOwner, grupoParcelasId: null, isPrivate: dados.isPrivate || false
      }))
    }
  }

  async obterOuCriarFaturaMemoria(cartaoId: string, mes: number, ano: number, responsavelId: string, acumuladorMemoria: Fatura[], todasFaturasPersistidas: Fatura[]): Promise<Fatura> {
    const finder = (f: Fatura) => f.cartaoId === cartaoId && f.periodo.mes === mes && f.periodo.ano === ano
    let fatura = todasFaturasPersistidas.find(finder) || acumuladorMemoria.find(finder)
    if (fatura) return fatura

    const novaFatura = new Fatura({ id: `${cartaoId}-${mes}-${ano}`, cartaoId, periodo: { mes, ano }, responsavelId, status: 'ABERTA' })
    acumuladorMemoria.push(novaFatura)
    return novaFatura
  }

  async lancarGastoContaFixa(dados: { faturaId: string | null; conta: { id: string; name: string }; valorCentavos: number; compradorId: string; participantes: string[] }): Promise<void> {
    const total = Dinheiro.deCentavos(dados.valorCentavos)
    const divisoes = dados.participantes.map((membroId, i) => new DivisaoDeGasto(membroId, total.valorNoIndice(dados.participantes.length, i)))
    await this.gastoRepo.salvar(new Gasto({ id: `bill-${dados.faturaId || 'avulso'}-${dados.conta.id}`, faturaId: dados.faturaId, descricao: `Talão: ${dados.conta.name}`, valorTotal: total, compradorId: dados.compradorId, divisoes, recurringBillId: dados.conta.id, installments: 1, isLoan: false }))
  }
}
