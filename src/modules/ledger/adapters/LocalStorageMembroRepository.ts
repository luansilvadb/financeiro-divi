import type { IMembroRepository } from '../core/ports/IMembroRepository'
import { Membro } from '../core/domain/Membro'

export class LocalStorageMembroRepository implements IMembroRepository {
  private readonly STORAGE_KEY = 'divi_membros'

  async salvar(membro: Membro): Promise<void> {
    const membros = await this.listarTodos()
    const index = membros.findIndex(m => m.id === membro.id)
    
    if (index >= 0) {
      membros[index] = membro
    } else {
      membros.push(membro)
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(membros))
  }

  async listarTodos(): Promise<Membro[]> {
    const data = localStorage.getItem(this.STORAGE_KEY)
    if (!data) return []
    
    const raw = JSON.parse(data)
    return raw.map((m: any) => new Membro({
      ...m,
      dataCriacao: new Date(m.dataCriacao)
    }))
  }

  async buscarPorId(id: string): Promise<Membro | null> {
    const todos = await this.listarTodos()
    return todos.find(m => m.id === id) || null
  }
}
