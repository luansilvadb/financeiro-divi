import type { IFaturaRepository } from '../repositories/IFaturaRepository'
import type { IGastoRepository } from '../repositories/IGastoRepository'
import { Gasto } from '../entities/Gasto'
import { Fatura } from '../entities/Fatura'
import { Dinheiro } from '../entities/Dinheiro'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'
import { calcularTransacoesNetting } from './NettingService'
import { NOMES_MESES } from '../../shared/utils/meses'
import type { IFaturaRolloverService } from './IFaturaRolloverService'

export class FaturaRolloverService implements IFaturaRolloverService {
  constructor(
    private faturaRepo: IFaturaRepository,
    private gastoRepo: IGastoRepository
  ) {}

  processarRolloverParcelas(novaFaturaId: string, gastosAnteriores: Gasto[]): Gasto[] {
    return gastosAnteriores
      .filter(g => g.installments > 1 && !g.grupoParcelasId)
      .map(g => {
        return new Gasto({
          id: crypto.randomUUID(),
          faturaId: novaFaturaId,
          descricao: g.descricao,
          valorTotal: g.valorTotal,
          compradorId: g.compradorId,
          divisoes: [...g.divisoes],
          installments: g.installments - 1,
          totalInstallments: g.totalInstallments || g.installments,
          isLoan: g.isLoan,
          borrowerId: g.borrowerId,
          recurringBillId: g.recurringBillId
        })
      })
  }

  gerarTransacoesNettingSaldoInicial(
    novaFaturaId: string,
    nomePeriodoAnterior: string,
    saldosAnteriores: Record<string, number>
  ): Gasto[] {
    const transferencias = calcularTransacoesNetting(saldosAnteriores)

    return transferencias.map(t => {
      const total = Dinheiro.deReais(t.val)
      return new Gasto({
        id: `carry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        faturaId: novaFaturaId,
        descricao: `Saldo Inicial Pendente (${nomePeriodoAnterior})`,
        valorTotal: total,
        compradorId: t.to,
        divisoes: [new DivisaoDeGasto(t.from, total)],
        installments: 1,
        isSettlement: true
      })
    })
  }

  async executarRolloverPeriodo(dados: {
    nomeNovoPeriodo: string
    faturasAbertas: Fatura[]
    cartoes: any[]
    saldosAcumulados: Record<string, number>
    nomePeriodoAnterior: string
  }): Promise<void> {
    const { nomeNovoPeriodo, faturasAbertas, cartoes, saldosAcumulados, nomePeriodoAnterior } = dados
    if (faturasAbertas.length === 0) return

    // 1. Fechar as faturas abertas do período diretamente via repositório
    for (const f of faturasAbertas) {
      f.fechar({ responsavelId: f.responsavelId, dataPagamentoBanco: new Date() })
      await this.faturaRepo.salvar(f)
    }

    // 2. Criar faturas e período no novo mês
    const [mesStr, anoStr] = nomeNovoPeriodo.split(' ')
    const mesNum = NOMES_MESES.indexOf(mesStr as typeof NOMES_MESES[number]) + 1 || new Date().getMonth() + 1
    const anoNum = parseInt(anoStr) || new Date().getFullYear()

    const novasFaturas: Fatura[] = []

    for (const card of cartoes) {
      const novaFatura = new Fatura({
        id: crypto.randomUUID(),
        cartaoId: card.id,
        periodo: { mes: mesNum, ano: anoNum },
        responsavelId: card.responsavelPadraoId,
        status: 'ABERTA'
      })
      await this.faturaRepo.salvar(novaFatura)
      novasFaturas.push(novaFatura)
    }

    const novaFaturaIdPrincipal = novasFaturas[0]?.id

    if (novaFaturaIdPrincipal) {
      // 3. Decrementar parcelas ativas
      const todosGastosAnteriores: Gasto[] = []
      for (const f of faturasAbertas) {
        const porFatura = await this.gastoRepo.buscarPorFatura(f.id)
        todosGastosAnteriores.push(...porFatura)
      }

      const gastosParceladosNovos = this.processarRolloverParcelas(novaFaturaIdPrincipal, todosGastosAnteriores)
      for (const g of gastosParceladosNovos) {
        await this.gastoRepo.salvar(g)
      }

      // 4. Aplicar Netting final e carregar saldos devedores/credores como "Saldo Inicial Pendente"
      const transacoesCarryover = this.gerarTransacoesNettingSaldoInicial(
        novaFaturaIdPrincipal,
        nomePeriodoAnterior,
        saldosAcumulados
      )
      for (const g of transacoesCarryover) {
        await this.gastoRepo.salvar(g)
      }
    }
  }
}
