import type { IGastoRepository } from '../IGastoRepository'
import { Gasto } from '../../entities/Gasto'
import { Dinheiro } from '../../entities/Dinheiro'
import { DivisaoDeGasto } from '../../entities/DivisaoDeGasto'
import { StorageLock } from '../../../shared/utils/StorageLock'

export class LocalStorageGastoRepository implements IGastoRepository {
  private readonly STORAGE_KEY = 'divi_gastos_cartao'

  async salvar(gasto: Gasto): Promise<void> {
    await StorageLock.executarAtomico('lock_divi_gastos_cartao', async () => {
      const todos = this.listarTodosInternal()
      const index = todos.findIndex(g => g.id === gasto.id)
      if (index >= 0) {
        todos[index] = gasto
      } else {
        todos.push(gasto)
      }
      this.persistirInternal(todos)
    })
  }

  async salvarMuitos(gastos: Gasto[]): Promise<void> {
    await StorageLock.executarAtomico('lock_divi_gastos_cartao', async () => {
      const todos = this.listarTodosInternal()
      for (const gasto of gastos) {
        const index = todos.findIndex(g => g.id === gasto.id)
        if (index >= 0) {
          todos[index] = gasto
        } else {
          todos.push(gasto)
        }
      }
      this.persistirInternal(todos)
    })
  }

  async buscarPorFatura(faturaId: string): Promise<Gasto[]> {
    const todos = await this.listarTodos()
    return todos.filter(g => g.faturaId === faturaId)
  }

  async buscarPorId(id: string): Promise<Gasto | null> {
    const todos = await this.listarTodos()
    return todos.find(g => g.id === id) || null
  }

  async excluir(id: string): Promise<void> {
    await StorageLock.executarAtomico('lock_divi_gastos_cartao', async () => {
      const todos = this.listarTodosInternal()
      const filtrados = todos.filter(g => g.id !== id)
      this.persistirInternal(filtrados)
    })
  }

  async excluirMuitos(ids: string[]): Promise<void> {
    await StorageLock.executarAtomico('lock_divi_gastos_cartao', async () => {
      const todos = this.listarTodosInternal()
      const filtrados = todos.filter(g => !ids.includes(g.id))
      this.persistirInternal(filtrados)
    })
  }

  async listarTodos(): Promise<Gasto[]> {
    return await StorageLock.executarAtomico('lock_divi_gastos_cartao', async () => {
      return this.listarTodosInternal()
    })
  }

  private listarTodosInternal(): Gasto[] {
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
          compradorId,
          divisoes,
          installments: g.installments || 1,
          totalInstallments: g.totalInstallments || g.installments || 1,
          isLoan: g.isLoan || false,
          borrowerId: g.borrowerId || null,
          recurringBillId: g.recurringBillId || null,
          isSettlement: g.isSettlement || false,
          settlementDetails: g.settlementDetails || null,
          method: g.method || 'pix',
          cardOwner: g.cardOwner || null,
          grupoParcelasId: g.grupoParcelasId || null
        })
      })
    } catch (e) {
      console.error('Erro grave de integridade no banco de dados local de gastos:', e)
      throw new Error('Banco de dados local de gastos corrompido. Operação abortada para evitar perda de dados.')
    }
  }

  private persistirInternal(todos: Gasto[]): void {
    const dtos = todos.map(g => ({
      id: g.id,
      faturaId: g.faturaId,
      descricao: g.descricao,
      valorTotalCentavos: g.valorTotal.centavos,
      compradorId: g.compradorId,
      divisoes: g.divisoes.map(d => ({ membroId: d.membroId, centavos: d.valor.centavos })),
      installments: g.installments,
      totalInstallments: g.totalInstallments,
      isLoan: g.isLoan,
      borrowerId: g.borrowerId,
      recurringBillId: g.recurringBillId,
      isSettlement: g.isSettlement,
      settlementDetails: g.settlementDetails,
      method: g.method,
      cardOwner: g.cardOwner,
      grupoParcelasId: g.grupoParcelasId
    }))
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dtos))
  }
}
