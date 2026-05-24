import type { SupabaseClient } from '@supabase/supabase-js'
import type { ICartaoRepository } from '../ICartaoRepository'
import { Cartao } from '../../entities/Cartao'

export class SupabaseCartaoRepository implements ICartaoRepository {
  constructor(
    private supabase: SupabaseClient,
    private getActiveTenantId: () => string
  ) {}

  async salvar(cartao: Cartao): Promise<void> {
    const tenantId = this.getActiveTenantId()
    if (!tenantId) throw new Error('Nenhuma casa ativa selecionada')

    const { error } = await this.supabase.from('cartoes').upsert({
      id: cartao.id,
      tenant_id: tenantId,
      nome: cartao.nome,
      dia_fechamento: cartao.diaFechamento,
      responsavel_padrao_id: cartao.responsavelPadraoId
    })

    if (error) throw new Error(`Erro ao salvar cartão: ${error.message}`)
  }

  async buscarPorId(id: string): Promise<Cartao | null> {
    const tenantId = this.getActiveTenantId()
    if (!tenantId) return null

    const { data, error } = await this.supabase
      .from('cartoes')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .single()

    if (error || !data) return null

    return new Cartao({
      id: data.id,
      nome: data.nome,
      diaFechamento: data.dia_fechamento,
      responsavelPadraoId: data.responsavel_padrao_id
    })
  }

  async listarTodos(): Promise<Cartao[]> {
    const tenantId = this.getActiveTenantId()
    if (!tenantId) return []

    const { data, error } = await this.supabase
      .from('cartoes')
      .select('*')
      .eq('tenant_id', tenantId)

    if (error) throw new Error(`Erro ao listar cartões: ${error.message}`)
    if (!data) return []

    return data.map(c => new Cartao({
      id: c.id,
      nome: c.nome,
      diaFechamento: c.dia_fechamento,
      responsavelPadraoId: c.responsavel_padrao_id
    }))
  }

  async excluir(id: string): Promise<void> {
    const { error } = await this.supabase.from('cartoes').delete().eq('id', id)
    if (error) throw new Error(`Erro ao excluir cartão: ${error.message}`)
  }
}
