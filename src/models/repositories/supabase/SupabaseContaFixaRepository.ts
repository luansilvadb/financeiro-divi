import type { SupabaseClient } from '@supabase/supabase-js'
import type { IContaFixaRepository } from '../IContaFixaRepository'
import type { ContaFixa } from '../../entities/ContaFixa'

export class SupabaseContaFixaRepository implements IContaFixaRepository {
  constructor(
    private supabase: SupabaseClient,
    private getActiveTenantId: () => string
  ) {}

  async salvar(conta: ContaFixa): Promise<void> {
    const tenantId = this.getActiveTenantId()
    if (!tenantId) throw new Error('Nenhuma casa ativa selecionada')

    const { error } = await this.supabase.from('contas_fixas').upsert({
      id: conta.id,
      tenant_id: tenantId,
      name: conta.name,
      icon: conta.icon,
      fixed_value_centavos: conta.fixedValueCentavos,
      default_split: conta.defaultSplit
    })

    if (error) throw new Error(`Erro ao salvar conta fixa: ${error.message}`)
  }

  async listarTodas(): Promise<ContaFixa[]> {
    const tenantId = this.getActiveTenantId()
    if (!tenantId) return []

    const { data, error } = await this.supabase
      .from('contas_fixas')
      .select('*')
      .eq('tenant_id', tenantId)

    if (error) throw new Error(`Erro ao listar contas fixas: ${error.message}`)
    if (!data) return []

    return data.map(c => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      fixedValueCentavos: c.fixed_value_centavos !== null ? Number(c.fixed_value_centavos) : null,
      defaultSplit: Array.isArray(c.default_split) ? c.default_split : []
    }))
  }

  async excluir(id: string): Promise<void> {
    const { error } = await this.supabase.from('contas_fixas').delete().eq('id', id)
    if (error) throw new Error(`Erro ao excluir conta fixa: ${error.message}`)
  }
}
