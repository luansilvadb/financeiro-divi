import { HttpBaseRepository } from './HttpBaseRepository'
import { Membro } from '../../entities/Membro'
import type { MembroRole } from '../../entities/Membro'
import type { IMembroRepository, RolePermissions, MembroPatch } from '../IMembroRepository'
import {
  MembroFlexibleListResponseSchema,
  MembroResponseSchema,
  CreateMembroRequestSchema,
  CreateMembroWithAccountRequestSchema,
  UpdateMembroRequestSchema,
  PermissionsResponseSchema,
  normalizeFlexibleResponse,
} from '../../../shared/validation/apiSchemas'

interface MembroDto {
  id: string
  nome: string
  avatar: string
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
    const raw = await this.validatedRequest(MembroFlexibleListResponseSchema, '/membros')
    const list = normalizeFlexibleResponse<MembroDto>(raw)
    return list.map(item => new Membro({
      id: item.id,
      nome: item.nome,
      avatar: item.avatar,
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
    const hasCredentials = credentials?.email && credentials?.password
    const endpoint = hasCredentials ? '/membros/with-account' : '/membros'

    const body = {
      nome: membro.nome,
      avatar: membro.avatar,
      ...(credentials || {})
    }

    if (hasCredentials) {
      CreateMembroWithAccountRequestSchema.parse(body)
    } else {
      CreateMembroRequestSchema.parse(body)
    }

    await this.validatedRequest(MembroResponseSchema, endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    })
  }

  async atualizar(id: string, patch: MembroPatch): Promise<void> {
    UpdateMembroRequestSchema.parse(patch)
    await this.validatedRequest(MembroResponseSchema, `/membros/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patch)
    })
  }

  async obterPermissions(): Promise<Record<string, RolePermissions>> {
    return this.validatedRequest(PermissionsResponseSchema, '/tenants/permissions')
  }

  async atualizarPermissions(role: string, permissions: Partial<RolePermissions>): Promise<Record<string, RolePermissions>> {
    return this.request<Record<string, RolePermissions>>(`/tenants/permissions/${role}`, {
      method: 'PATCH',
      body: JSON.stringify(permissions)
    })
  }
}
