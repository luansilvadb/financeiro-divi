import type { IGastoRepository } from '../core/ports/IGastoRepository'
import { Gasto } from '../core/domain/Gasto'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'
import { DivisaoDeGasto } from '../core/domain/DivisaoDeGasto'
import { StorageLock } from '../../../shared/utils/StorageLock'

export class LocalStorageGastoRepository implements IGastoRepository {
  private readonly STORAGE_KEY = 'divi_gastos_cartao'

  async salvar(gasto: Gasto): Promise<void> {
    await StorageLock.executarAtomico('lock_divi_gastos_cartao', async () => {
      const todos = await this.listarTodos()
      const index = todos.findIndex(g => g.id === gasto.id)
      if (index >= 0) {
        todos[index] = gasto
      } else {
        todos.push(gasto)
      }
      const dtos = todos.map(g => ({
        id: g.id,
        faturaId: g.faturaId,
        descricao: g.descricao,
        valorTotalCentavos: g.valorTotal.centavos,
        compradorId: g.compradorId, // <- NOVO
        divisoes: g.divisoes.map(d => ({ membroId: d.membroId, centavos: d.valor.centavos })),
        installments: g.installments,
        isLoan: g.isLoan,
        borrowerId: g.borrowerId,
        recurringBillId: g.recurringBillId,
        isSettlement: g.isSettlement,
        settlementDetails: g.settlementDetails,
        method: g.method,
        cardOwner: g.cardOwner
      }))
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dtos))
    })
  }

  async buscarPorFatura(faturaId: string): Promise<Gasto[]> {
    const todos = await this.listarTodos()
    return todos.filter(g => g.faturaId === faturaId)
  }

  async excluir(id: string): Promise<void> {
    await StorageLock.executarAtomico('lock_divi_gastos_cartao', async () => {
      const todos = await this.listarTodos()
      const filtrados = todos.filter(g => g.id !== id)
      const dtos = filtrados.map(g => ({
        id: g.id,
        faturaId: g.faturaId,
        descricao: g.descricao,
        valorTotalCentavos: g.valorTotal.centavos,
        compradorId: g.compradorId,
        divisoes: g.divisoes.map(d => ({ membroId: d.membroId, centavos: d.valor.centavos })),
        installments: g.installments,
        isLoan: g.isLoan,
        borrowerId: g.borrowerId,
        recurringBillId: g.recurringBillId,
        isSettlement: g.isSettlement,
        settlementDetails: g.settlementDetails,
        method: g.method,
        cardOwner: g.cardOwner
      }))
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dtos))
    })
  }

  private async listarTodos(): Promise<Gasto[]> {
    const data = localStorage.getItem(this.STORAGE_KEY)
    if (!data) return []
    try {
      const raw = JSON.parse(data) as any[]
      return raw.map(g => {
        const divisoes = g.divisoes.map((d: any) => new DivisaoDeGasto(d.membroId, Dinheiro.deCentavos(d.centavos)))
        
        // Retrocompatibilidade: Se compradorId não existir, pega o primeiro das divisões
        const compradorId = g.compradorId || divisoes[0]?.membroId || 'membro_padrao'

        return new Gasto({
          id: g.id,
          faturaId: g.faturaId,
          descricao: g.descricao,
          valorTotal: Dinheiro.deCentavos(g.valorTotalCentavos),
          compradorId, // <- NOVO
          divisoes,
          installments: g.installments || 1,
          isLoan: g.isLoan || false,
          borrowerId: g.borrowerId || null,
          recurringBillId: g.recurringBillId || null,
          isSettlement: g.isSettlement || false,
          settlementDetails: g.settlementDetails || null,
          method: g.method || 'pix',
          cardOwner: g.cardOwner || null
        })
      })
    } catch (e) {
      console.error(e)
      return []
    }
  }
}
