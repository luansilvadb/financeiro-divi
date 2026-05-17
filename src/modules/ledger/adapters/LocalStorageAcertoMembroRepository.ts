import { IAcertoMembroRepository } from '../core/ports/IAcertoMembroRepository'
import { AcertoMembro } from '../core/domain/AcertoMembro'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'
import { StorageLock } from '../../../shared/utils/StorageLock'

export class LocalStorageAcertoMembroRepository implements IAcertoMembroRepository {
  private readonly STORAGE_KEY = 'divi_acertos_membro'

  async salvar(acerto: AcertoMembro): Promise<void> {
    await StorageLock.executarAtomico('lock_divi_acertos_membro', async () => {
      const todos = await this.listarTodos()
      const index = todos.findIndex(a => a.id === acerto.id)
      if (index >= 0) {
        todos[index] = acerto
      } else {
        todos.push(acerto)
      }
      const dtos = todos.map(a => ({
        id: a.id,
        faturaId: a.faturaId,
        membroId: a.membroId,
        totalConsumidoCentavos: a.totalConsumido.centavos,
        totalAntecipadoCentavos: a.totalAntecipado.centavos,
        pago: a.pago,
        dataPagamento: a.dataPagamento ? a.dataPagamento.toISOString() : undefined
      }))
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dtos))
    })
  }

  async buscarPorId(id: string): Promise<AcertoMembro | null> {
    const todos = await this.listarTodos()
    return todos.find(a => a.id === id) || null
  }

  async buscarPorFatura(faturaId: string): Promise<AcertoMembro[]> {
    const todos = await this.listarTodos()
    return todos.filter(a => a.faturaId === faturaId)
  }

  private async listarTodos(): Promise<AcertoMembro[]> {
    const data = localStorage.getItem(this.STORAGE_KEY)
    if (!data) return []
    try {
      const raw = JSON.parse(data) as any[]
      return raw.map(a => new AcertoMembro({
        id: a.id,
        faturaId: a.faturaId,
        membroId: a.membroId,
        totalConsumido: Dinheiro.deCentavos(a.totalConsumidoCentavos),
        totalAntecipado: Dinheiro.deCentavos(a.totalAntecipadoCentavos),
        pago: a.pago,
        dataPagamento: a.dataPagamento ? new Date(a.dataPagamento) : undefined
      }))
    } catch (e) {
      console.error(e)
      return []
    }
  }
}
