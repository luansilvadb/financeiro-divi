import type { SupabaseClient } from '@supabase/supabase-js'
import type { IEventStore } from '../IEventStore'
import type { LedgerEvent } from '../../entities/LedgerEvent'

export class SupabaseEventStore implements IEventStore {
  constructor(
    private supabase: SupabaseClient,
    private getActiveTenantId: () => string
  ) {}

  async append(events: LedgerEvent[]): Promise<void> {
    const tenantId = this.getActiveTenantId()
    if (!tenantId) throw new Error('Nenhuma casa ativa selecionada')

    const dtos = events.map(event => ({
      id: event.id,
      tenant_id: tenantId,
      type: event.type,
      timestamp: event.timestamp,
      version: event.version,
      payload: event.payload
    }))

    const { error } = await this.supabase.from('ledger_events').insert(dtos)
    if (error) throw new Error(`Erro ao anexar eventos na stream do Supabase: ${error.message}`)
  }

  async getStream(): Promise<LedgerEvent[]> {
    const tenantId = this.getActiveTenantId()
    if (!tenantId) return []

    const { data, error } = await this.supabase
      .from('ledger_events')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('version', { ascending: true })

    if (error) throw new Error(`Erro ao obter stream de eventos: ${error.message}`)
    if (!data) return []

    return data.map(e => ({
      id: e.id,
      type: e.type,
      timestamp: Number(e.timestamp),
      version: e.version,
      payload: e.payload
    }))
  }

  async clear(): Promise<void> {
    const tenantId = this.getActiveTenantId()
    if (!tenantId) return

    const { error } = await this.supabase
      .from('ledger_events')
      .delete()
      .eq('tenant_id', tenantId)

    if (error) throw new Error(`Erro ao limpar stream de eventos: ${error.message}`)
  }
}
