import type { IMembroRepository } from '../IMembroRepository'
import { Membro } from '../../entities/Membro'
import { StorageLock } from '../../../shared/utils/StorageLock'

export class LocalStorageMembroRepository implements IMembroRepository {
  private readonly STORAGE_KEY = 'divi_membros'

  async salvar(membro: Membro): Promise<void> {
    await StorageLock.executarAtomico('lock_divi_membros', async () => {
      const membros = await this.listarTodos()
      const index = membros.findIndex(m => m.id === membro.id)
      
      if (index >= 0) {
        membros[index] = membro
      } else {
        membros.push(membro)
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(membros))
    })
  }

  async listarTodos(): Promise<Membro[]> {
    const data = localStorage.getItem(this.STORAGE_KEY)
    if (!data) return []
    try {
      const raw = JSON.parse(data)
      return raw.map((m: any) => new Membro({
        ...m,
        dataCriacao: new Date(m.dataCriacao)
      }))
    } catch (e) {
      console.error('Erro grave de integridade no banco de dados local de membros:', e)
      throw new Error('Banco de dados local de membros corrompido. Operação abortada para evitar perda de dados.')
    }
  }

  async buscarPorId(id: string): Promise<Membro | null> {
    const todos = await this.listarTodos()
    return todos.find(m => m.id === id) || null
  }
}
