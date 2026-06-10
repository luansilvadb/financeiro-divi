import { HttpBaseRepository } from './HttpBaseRepository'
import { Membro } from '../../entities/Membro'
import { Cargo } from '../../entities/Cargo'
import type { MembroRole } from '../../entities/Membro'
import type { IMembroRepository } from '../IMembroRepository'

interface MembroDto {
  id: string
  nome: string
  ativo?: boolean
  role?: MembroRole
  cargoId?: string
  cargo?: { id: string; nome: string; cor?: string; permissoes?: string[] }
  createdAt?: string
  userId?: string
  username?: string
  email?: string
}

export class HttpMembroRepository extends HttpBaseRepository implements IMembroRepository {
  async listarTodos(): Promise<Membro[]> {
    const list = await this.request<MembroDto[]>('/financeiro/membros')
    return list.map(item => new Membro({
      id: item.id,
      nome: item.nome,
      ativo: item.ativo ?? true,
      role: item.role,
      cargoId: item.cargoId,
      cargo: item.cargo ? new Cargo({
        id: item.cargo.id,
        nome: item.cargo.nome,
        cor: item.cargo.cor,
        permissoes: item.cargo.permissoes || []
      }) : undefined,
      dataCriacao: item.createdAt ? new Date(item.createdAt) : undefined,
      userId: item.userId,
      username: item.username
    }))
  }

  async buscarPorId(id: string): Promise<Membro | null> {
    const list = await this.listarTodos()
    return list.find(m => m.id === id) || null
  }

  async salvar(membro: Membro, credentials?: { email?: string; password?: string }): Promise<void> {
    await this.request('/financeiro/membros', {
      method: 'POST',
      body: JSON.stringify({
        id: membro.id,
        nome: membro.nome,
        ativo: membro.ativo,
        role: membro.role,
        cargoId: membro.cargoId,
        createdAt: membro.dataCriacao,
        ...(credentials || {})
      })
    })
  }
}
