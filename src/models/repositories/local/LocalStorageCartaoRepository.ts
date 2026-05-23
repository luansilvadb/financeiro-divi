import type { ICartaoRepository } from '../ICartaoRepository'
import { Cartao } from '../../entities/Cartao'
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
      console.error('Erro grave de integridade no banco de dados local de cartões:', e)
      throw new Error('Banco de dados local de cartões corrompido. Operação abortada para evitar perda de dados.')
    }
  }

  async excluir(id: string): Promise<void> {
    await StorageLock.executarAtomico('lock_divi_cartoes', async () => {
      const todos = await this.listarTodos()
      const filtrados = todos.filter(c => c.id !== id)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtrados))
    })
  }
}
