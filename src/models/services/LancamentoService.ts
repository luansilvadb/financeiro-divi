import type { IGastoRepository } from '../repositories/IGastoRepository'
import type { IFaturaRepository } from '../repositories/IFaturaRepository'
import type { ICartaoRepository } from '../repositories/ICartaoRepository'
import type { IMembroRepository } from '../repositories/IMembroRepository'
import { Gasto } from '../entities/Gasto'
import { Dinheiro } from '../entities/Dinheiro'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'
import { Fatura } from '../entities/Fatura'
import type { Cartao } from '../entities/Cartao'
import type { LancarGastoInput } from './IGastoService'

export interface ILancamentoService {
  lancarGastoOuEmprestimo(dados: LancarGastoInput): Promise<void>
  lancarGastoContaFixa(dados: {
    faturaId: string
    conta: { id: string; name: string }
    valorCentavos: number
    compradorId: string
    participantes: string[]
  }): Promise<void>
  validarMembrosAtivos(membroIds: string[]): Promise<void>
  obterOuCriarFaturaMemoria(
    cartaoId: string,
    mes: number,
    ano: number,
    responsavelId: string,
    acumuladorMemoria: Fatura[],
    todasFaturasPersistidas: Fatura[]
  ): Promise<Fatura>
}

export class LancamentoService implements ILancamentoService {
  constructor(
    private gastoRepo: IGastoRepository,
    private faturaRepo: IFaturaRepository,
    private cartaoRepo: ICartaoRepository,
    private membroRepo?: IMembroRepository
  ) {}

  async lancarGastoOuEmprestimo(dados: LancarGastoInput): Promise<void> {
    const { flow, paymentMethod, compradorId, valor, descricao, divisoes, installments, cardOwnerId, borrowerId, periodo } = dados

    const membrosEnvolvidos = [compradorId]
    if (borrowerId) {
      membrosEnvolvidos.push(borrowerId)
    }
    divisoes.forEach(d => {
      if (!membrosEnvolvidos.includes(d.membroId)) {
        membrosEnvolvidos.push(d.membroId)
      }
    })
    await this.validarMembrosAtivos(membrosEnvolvidos)

    const total = Dinheiro.deReais(valor)

    const todosCartoes = await this.cartaoRepo.listarTodos()
    let cartaoReal: Cartao | undefined = undefined
    if (paymentMethod === 'card' && cardOwnerId) {
      cartaoReal = todosCartoes.find(c => c.id === cardOwnerId || c.responsavelPadraoId === cardOwnerId)
    }

    const cartaoId = (paymentMethod === 'card')
      ? (cartaoReal ? cartaoReal.id : (todosCartoes.length > 0 ? todosCartoes[0].id : 'PIX_DEFAULT_ID'))
      : 'PIX_DEFAULT_ID'
    const resolvedCardOwner = cartaoReal ? cartaoReal.responsavelPadraoId : null

    const responsavelFaturaId = cartaoReal ? cartaoReal.responsavelPadraoId : compradorId
    const faturaAtiva = await this.faturaRepo.assegurarObterOuCriarFatura(cartaoId, periodo.mes, periodo.ano, responsavelFaturaId)
    if (faturaAtiva && typeof faturaAtiva.validarOperacaoPermitida === 'function') {
      faturaAtiva.validarOperacaoPermitida()
    }

    if (paymentMethod === 'card' && installments > 1) {
      await this.projetarGastosParcelados({
        total,
        divisoes,
        faturaAtiva,
        descricao,
        compradorId,
        installments,
        cardOwner: resolvedCardOwner,
        responsavelFaturaId
      })
    } else {
      const novoGasto = new Gasto({
        id: crypto.randomUUID(),
        faturaId: faturaAtiva.id,
        descricao: flow === 'loan' ? (descricao.trim() || 'Empréstimo Pessoal') : descricao,
        valorTotal: total,
        compradorId,
        divisoes,
        installments,
        totalInstallments: installments,
        isLoan: flow === 'loan',
        borrowerId,
        method: paymentMethod,
        cardOwner: resolvedCardOwner,
        grupoParcelasId: null
      })
      await this.gastoRepo.salvar(novoGasto)
    }
  }

  private construirGasto(dados: {
    faturaId: string
    descricao: string
    valorTotal: Dinheiro
    compradorId: string
    divisoes: ReadonlyArray<DivisaoDeGasto>
    installments: number
    totalInstallments: number
    isLoan: boolean
    borrowerId?: string | null
    method: 'pix' | 'card'
    cardOwner?: string | null
    grupoParcelasId?: string | null
  }): Gasto {
    return new Gasto({
      id: crypto.randomUUID(),
      ...dados
    })
  }

  private async projetarGastosParcelados(dados: {
    total: Dinheiro
    divisoes: ReadonlyArray<DivisaoDeGasto>
    faturaAtiva: Fatura
    descricao: string
    compradorId: string
    installments: number
    cardOwner: string | null
    responsavelFaturaId: string
  }): Promise<void> {
    const { total, divisoes, faturaAtiva, descricao, compradorId, installments, cardOwner, responsavelFaturaId } = dados
    const grupoParcelasId = crypto.randomUUID()
    const faturasParaSalvar: Fatura[] = []
    const gastosParaSalvar: Gasto[] = []

    const primeiroGasto = this.construirGasto({
      faturaId: faturaAtiva.id,
      descricao,
      valorTotal: total,
      compradorId,
      divisoes,
      installments,
      totalInstallments: installments,
      isLoan: false,
      borrowerId: null,
      method: 'card',
      cardOwner,
      grupoParcelasId
    })
    gastosParaSalvar.push(primeiroGasto)

    let currentMes = faturaAtiva.periodo.mes
    let currentAno = faturaAtiva.periodo.ano

    const todasFaturasPersistidas = await this.faturaRepo.listarTodas()

    for (let i = 2; i <= installments; i++) {
      currentMes++
      if (currentMes > 12) {
        currentMes = 1
        currentAno++
      }

      const faturaFutura = await this.obterOuCriarFaturaMemoria(
        faturaAtiva.cartaoId,
        currentMes,
        currentAno,
        responsavelFaturaId,
        faturasParaSalvar,
        todasFaturasPersistidas
      )


      const gastoFuturo = this.construirGasto({
        faturaId: faturaFutura.id,
        descricao,
        valorTotal: total,
        compradorId,
        divisoes: [...divisoes],
        installments: installments - i + 1,
        totalInstallments: installments,
        isLoan: false,
        borrowerId: null,
        method: 'card',
        cardOwner,
        grupoParcelasId
      })
      gastosParaSalvar.push(gastoFuturo)
    }

    if (faturasParaSalvar.length > 0) {
      await this.faturaRepo.salvarMuitas(faturasParaSalvar)
    }
    await this.gastoRepo.salvarMuitos(gastosParaSalvar)
  }

  async obterOuCriarFaturaMemoria(
    cartaoId: string,
    mes: number,
    ano: number,
    responsavelId: string,
    acumuladorMemoria: Fatura[],
    todasFaturasPersistidas: Fatura[]
  ): Promise<Fatura> {
    // Primeiro procura nas faturas persistidas passadas no cache
    let fatura = todasFaturasPersistidas.find(f => f.cartaoId === cartaoId && f.periodo.mes === mes && f.periodo.ano === ano)
    if (fatura) return fatura

    // Depois procura no acumulador temporário
    fatura = acumuladorMemoria.find(f => f.cartaoId === cartaoId && f.periodo.mes === mes && f.periodo.ano === ano)
    if (fatura) return fatura

    // Cria nova se não existir em nenhum lugar
    const novaFatura = new Fatura({
      id: `${cartaoId}-${mes}-${ano}`,
      cartaoId,
      periodo: { mes, ano },
      responsavelId,
      status: 'ABERTA'
    })
    acumuladorMemoria.push(novaFatura)
    return novaFatura
  }

  async lancarGastoContaFixa(dados: {
    faturaId: string
    conta: { id: string; name: string }
    valorCentavos: number
    compradorId: string
    participantes: string[]
  }): Promise<void> {
    const total = Dinheiro.deCentavos(dados.valorCentavos)
    const partes = total.distribuir(dados.participantes.length)
    const divisoes = dados.participantes.map((id, idx) => new DivisaoDeGasto(id, partes[idx]))

    const deterministicId = `bill-${dados.faturaId}-${dados.conta.id}`
    const novoGasto = new Gasto({
      id: deterministicId,
      faturaId: dados.faturaId,
      descricao: `Talão: ${dados.conta.name}`,
      valorTotal: total,
      compradorId: dados.compradorId,
      divisoes,
      recurringBillId: dados.conta.id,
      installments: 1,
      isLoan: false
    })

    await this.gastoRepo.salvar(novoGasto)
  }

  async validarMembrosAtivos(membroIds: string[]): Promise<void> {
    if (!this.membroRepo) return
    for (const mId of membroIds) {
      const membro = await this.membroRepo.buscarPorId(mId)
      if (!membro || !membro.ativo) {
        throw new Error('Não é possível associar gastos a moradores inativos ou inexistentes.')
      }
    }
  }
}
