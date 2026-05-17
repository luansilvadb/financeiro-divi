import type { ICartaoRepository } from '../core/ports/ICartaoRepository'
import { Cartao } from '../core/domain/Cartao'
import { StorageLock } from '../../../shared/utils/StorageLock'

export class LocalStorageCartaoRepository implements ICartaoRepository {
  private readonly STORAGE_KEY = 'divi_cartoes'

  async salvar(cartao: Cartao): Promise<void> {
    await StorageLock.executarAtomico('lock_divi_cartoes', async () => {
      const todos = await this.listarTodos()
      const index = todos.findIndex(c => c.id === cartao.id)
      if (index >= 0) {
        todos[index] = cartao
      } else {
        todos.push(cartao)
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(todos))
    })
  }

  async buscarPorId(id: string): Promise<Cartao | null> {
    const todos = await this.listarTodos()
    return todos.find(c => c.id === id) || null
  }

  async listarTodos(): Promise<Cartao[]> {
    const data = localStorage.getItem(this.STORAGE_KEY)
    if (!data) return []
    try {
      const raw = JSON.parse(data) as any[]
      return raw.map(c => new Cartao(c))
    } catch (e) {
      console.error(e)
      return []
    }
  }
}
