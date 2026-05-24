import type { SupabaseClient } from '@supabase/supabase-js'
import type { IAcertoMembroRepository } from '../IAcertoMembroRepository'
import { AcertoMembro } from '../../entities/AcertoMembro'
import { Dinheiro } from '../../entities/Dinheiro'

export class SupabaseAcertoMembroRepository implements IAcertoMembroRepository {
  constructor(
    private supabase: SupabaseClient,
    private getActiveTenantId: () => string
  ) {}

  async salvar(acerto: AcertoMembro): Promise<void> {
    const tenantId = this.getActiveTenantId()
    if (!tenantId) throw new Error('Nenhuma casa ativa selecionada')

    const { error } = await this.supabase.from('acertos_membro').upsert({
      id: acerto.id,
      tenant_id: tenantId,
      fatura_id: acerto.faturaId,
      membro_id: acerto.membroId,
      total_consumido_centavos: acerto.totalConsumido.centavos,
      valor_pago_centavos: acerto.valorPago.centavos,
      pago: acerto.pago,
      data_pagamento: acerto.dataPagamento ? acerto.dataPagamento.toISOString() : null
    })

    if (error) throw new Error(`Erro ao salvar acerto de membro: ${error.message}`)
  }

  async buscarPorId(id: string): Promise<AcertoMembro | null> {
    const tenantId = this.getActiveTenantId()
    if (!tenantId) return null

    const { data, error } = await this.supabase
      .from('acertos_membro')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .single()

    if (error || !data) return null

    return new AcertoMembro({
      id: data.id,
      faturaId: data.fatura_id,
      membroId: data.membro_id,
      totalConsumido: Dinheiro.deCentavos(Number(data.total_consumido_centavos)),
      valorPago: Dinheiro.deCentavos(Number(data.valor_pago_centavos)),
      pago: data.pago,
      dataPagamento: data.data_pagamento ? new Date(data.data_pagamento) : undefined
    })
  }

  async buscarPorFatura(faturaId: string): Promise<AcertoMembro[]> {
    const tenantId = this.getActiveTenantId()
    if (!tenantId) return []

    const { data, error } = await this.supabase
      .from('acertos_membro')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('fatura_id', faturaId)

    if (error) throw new Error(`Erro ao buscar acertos por fatura: ${error.message}`)
    if (!data) return []

    return data.map(a => new AcertoMembro({
      id: a.id,
      faturaId: a.fatura_id,
      membroId: a.membro_id,
      totalConsumido: Dinheiro.deCentavos(Number(a.total_consumido_centavos)),
      valorPago: Dinheiro.deCentavos(Number(a.valor_pago_centavos)),
      pago: a.pago,
      dataPagamento: a.data_pagamento ? new Date(a.data_pagamento) : undefined
    }))
  }

  async excluirPorFatura(faturaId: string): Promise<void> {
    const { error } = await this.supabase.from('acertos_membro').delete().eq('fatura_id', faturaId)
    if (error) throw new Error(`Erro ao excluir acertos de fatura: ${error.message}`)
  }

  async listarTodos(): Promise<AcertoMembro[]> {
    const tenantId = this.getActiveTenantId()
    if (!tenantId) return []

    const { data, error } = await this.supabase
      .from('acertos_membro')
      .select('*')
      .eq('tenant_id', tenantId)

    if (error) throw new Error(`Erro ao listar acertos: ${error.message}`)
    if (!data) return []

    return data.map(a => new AcertoMembro({
      id: a.id,
      faturaId: a.fatura_id,
      membroId: a.membro_id,
      totalConsumido: Dinheiro.deCentavos(Number(a.total_consumido_centavos)),
      valorPago: Dinheiro.deCentavos(Number(a.valor_pago_centavos)),
      pago: a.pago,
      dataPagamento: a.data_pagamento ? new Date(a.data_pagamento) : undefined
    }))
  }
}
