import { HttpBaseRepository } from './HttpBaseRepository'
import { Membro } from '../../entities/Membro'
import type { IMembroRepository } from '../IMembroRepository'

export class HttpMembroRepository extends HttpBaseRepository implements IMembroRepository {
  async listarTodos(): Promise<Membro[]> {
    const list = await this.request<any[]>('/financeiro/membros')
    return list.map(item => new Membro({
      id: item.id,
      nome: item.nome,
      ativo: item.ativo ?? true,
      dataCriacao: item.createdAt ? new Date(item.createdAt) : undefined
    }))
  }

  async buscarPorId(id: string): Promise<Membro | null> {
    const list = await this.listarTodos()
    return list.find(m => m.id === id) || null
  }

  async salvar(membro: Membro): Promise<void> {
    await this.request('/financeiro/membros', {
      method: 'POST',
      body: JSON.stringify({
        id: membro.id,
        nome: membro.nome,
        ativo: membro.ativo,
        createdAt: membro.dataCriacao
      })
    })
  }
}
