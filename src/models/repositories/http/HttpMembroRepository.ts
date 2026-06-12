import { HttpBaseRepository } from './HttpBaseRepository'
import { Membro } from '../../entities/Membro'
import type { MembroRole } from '../../entities/Membro'
import type { IMembroRepository, RolePermissions } from '../IMembroRepository'

interface MembroDto {
  id: string
  nome: string
  ativo?: boolean
  role?: MembroRole
  createdAt?: string
  userId?: string
  username?: string
  email?: string
  rendaCentavos?: number
}

export class HttpMembroRepository extends HttpBaseRepository implements IMembroRepository {
  async listarTodos(): Promise<Membro[]> {
    const list = await this.request<MembroDto[]>('/financeiro/membros')
    return list.map(item => new Membro({
      id: item.id,
      nome: item.nome,
      ativo: item.ativo ?? true,
      role: item.role,
      dataCriacao: item.createdAt ? new Date(item.createdAt) : undefined,
      userId: item.userId,
      username: item.username,
      rendaCentavos: item.rendaCentavos
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
        createdAt: membro.dataCriacao,
        rendaCentavos: membro.rendaCentavos,
        ...(credentials || {})
      })
    })
  }

  async obterPermissions(): Promise<Record<string, RolePermissions>> {
    return this.request<Record<string, RolePermissions>>('/financeiro/tenants/permissions')
  }

  async atualizarPermissions(role: string, permissions: Partial<RolePermissions>): Promise<Record<string, RolePermissions>> {
    return this.request<Record<string, RolePermissions>>(`/financeiro/tenants/permissions/${role}`, {
      method: 'PATCH',
      body: JSON.stringify(permissions)
    })
  }
}
