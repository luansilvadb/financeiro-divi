import { IGastoRepository } from '../core/ports/IGastoRepository'
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
        divisoes: g.divisoes.map(d => ({ membroId: d.membroId, centavos: d.valor.centavos }))
      }))
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dtos))
    })
  }

  async buscarPorFatura(faturaId: string): Promise<Gasto[]> {
    const todos = await this.listarTodos()
    return todos.filter(g => g.faturaId === faturaId)
  }

  private async listarTodos(): Promise<Gasto[]> {
    const data = localStorage.getItem(this.STORAGE_KEY)
    if (!data) return []
    try {
      const raw = JSON.parse(data) as any[]
      return raw.map(g => new Gasto({
        id: g.id,
        faturaId: g.faturaId,
        descricao: g.descricao,
        valorTotal: Dinheiro.deCentavos(g.valorTotalCentavos),
        divisoes: g.divisoes.map((d: any) => new DivisaoDeGasto(d.membroId, Dinheiro.deCentavos(d.centavos)))
      }))
    } catch (e) {
      console.error(e)
      return []
    }
  }
}
