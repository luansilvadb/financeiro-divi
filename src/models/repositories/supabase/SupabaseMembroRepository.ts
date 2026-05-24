import type { SupabaseClient } from '@supabase/supabase-js'
import type { IMembroRepository } from '../IMembroRepository'
import { Membro } from '../../entities/Membro'

export class SupabaseMembroRepository implements IMembroRepository {
  constructor(
    private supabase: SupabaseClient,
    private getActiveTenantId: () => string,
    private getCurrentUserId: () => string | null
  ) {}

  async salvar(membro: Membro): Promise<void> {
    const tenantId = this.getActiveTenantId()
    if (!tenantId) throw new Error('Nenhuma casa ativa selecionada')

    // Se o membro que está sendo salvo for o próprio usuário logado,
    // ou se o ID dele bater com o mapeamento, associamos o user_id.
    const currentUserId = this.getCurrentUserId()
    const isCurrentUser = membro.id === currentUserId || membro.nome.toLowerCase() === localStorage.getItem('divi_username')?.toLowerCase()

    const { error } = await this.supabase.from('membros_casa').upsert({
      id: membro.id,
      tenant_id: tenantId,
      nome: membro.nome,
      avatar: membro.nome.substring(0, 2).toUpperCase(), // Default avatar: iniciais
      user_id: isCurrentUser ? currentUserId : null
    })

    if (error) throw new Error(`Erro ao salvar membro: ${error.message}`)
  }

  async listarTodos(): Promise<Membro[]> {
    const tenantId = this.getActiveTenantId()
    if (!tenantId) return []

    const { data, error } = await this.supabase
      .from('membros_casa')
      .select('*')
      .eq('tenant_id', tenantId)

    if (error) throw new Error(`Erro ao listar membros: ${error.message}`)
    if (!data) return []

    return data.map(m => new Membro({
      id: m.id,
      nome: m.nome,
      ativo: true, // Por padrão todos são ativos na tabela membros_casa
      dataCriacao: new Date(m.created_at)
    }))
  }

  async buscarPorId(id: string): Promise<Membro | null> {
    const tenantId = this.getActiveTenantId()
    if (!tenantId) return null

    const { data, error } = await this.supabase
      .from('membros_casa')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .single()

    if (error || !data) return null

    return new Membro({
      id: data.id,
      nome: data.nome,
      ativo: true,
      dataCriacao: new Date(data.created_at)
    })
  }
}
