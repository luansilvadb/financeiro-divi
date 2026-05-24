import type { SupabaseClient } from '@supabase/supabase-js'
import type { IFaturaRepository } from '../IFaturaRepository'
import { Fatura } from '../../entities/Fatura'
import type { FaturaPeriodo } from '../../entities/Fatura'

export class SupabaseFaturaRepository implements IFaturaRepository {
  constructor(
    private supabase: SupabaseClient,
    private getActiveTenantId: () => string
  ) {}

  async salvar(fatura: Fatura): Promise<void> {
    const tenantId = this.getActiveTenantId()
    if (!tenantId) throw new Error('Nenhuma casa ativa selecionada')

    const { error } = await this.supabase.from('faturas').upsert({
      id: fatura.id,
      tenant_id: tenantId,
      cartao_id: fatura.cartaoId,
      mes: fatura.periodo.mes,
      ano: fatura.periodo.ano,
      responsavel_id: fatura.responsavelId,
      status: fatura.status,
      data_pagamento_banco: fatura.dataPagamentoBanco ? fatura.dataPagamentoBanco.toISOString() : null
    })

    if (error) throw new Error(`Erro ao salvar fatura: ${error.message}`)
  }

  async salvarMuitas(faturas: Fatura[]): Promise<void> {
    for (const fatura of faturas) {
      await this.salvar(fatura)
    }
  }

  async buscarPorId(id: string): Promise<Fatura | null> {
    const tenantId = this.getActiveTenantId()
    if (!tenantId) return null

    const { data, error } = await this.supabase
      .from('faturas')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .single()

    if (error || !data) return null

    return new Fatura({
      id: data.id,
      cartaoId: data.cartao_id,
      periodo: { mes: data.mes, ano: data.ano },
      responsavelId: data.responsavel_id,
      status: data.status,
      dataPagamentoBanco: data.data_pagamento_banco ? new Date(data.data_pagamento_banco) : undefined
    })
  }

  async buscarPorCartaoEPeriodo(cartaoId: string, periodo: FaturaPeriodo): Promise<Fatura | null> {
    const tenantId = this.getActiveTenantId()
    if (!tenantId) return null

    const { data, error } = await this.supabase
      .from('faturas')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('cartao_id', cartaoId)
      .eq('mes', periodo.mes)
      .eq('ano', periodo.ano)
      .single()

    if (error || !data) return null

    return new Fatura({
      id: data.id,
      cartaoId: data.cartao_id,
      periodo: { mes: data.mes, ano: data.ano },
      responsavelId: data.responsavel_id,
      status: data.status,
      dataPagamentoBanco: data.data_pagamento_banco ? new Date(data.data_pagamento_banco) : undefined
    })
  }

  async listarTodas(): Promise<Fatura[]> {
    const tenantId = this.getActiveTenantId()
    if (!tenantId) return []

    const { data, error } = await this.supabase
      .from('faturas')
      .select('*')
      .eq('tenant_id', tenantId)

    if (error) throw new Error(`Erro ao listar faturas: ${error.message}`)
    if (!data) return []

    return data.map(f => new Fatura({
      id: f.id,
      cartaoId: f.cartao_id,
      periodo: { mes: f.mes, ano: f.ano },
      responsavelId: f.responsavel_id,
      status: f.status as any,
      dataPagamentoBanco: f.data_pagamento_banco ? new Date(f.data_pagamento_banco) : undefined
    }))
  }

  async executarMigracoesEDesduplicacao(): Promise<void> {
    // No Supabase relacional com restrições e políticas de segurança unificadas,
    // não há necessidade de desduplicar faturas no client
    return Promise.resolve()
  }

  async assegurarObterOuCriarFatura(cartaoId: string, mes: number, ano: number, responsavelId: string): Promise<Fatura> {
    const existente = await this.buscarPorCartaoEPeriodo(cartaoId, { mes, ano })
    if (existente) return existente

    const novaFatura = new Fatura({
      id: crypto.randomUUID(),
      cartaoId,
      periodo: { mes, ano },
      responsavelId,
      status: 'ABERTA'
    })

    await this.salvar(novaFatura)
    return novaFatura
  }

  async excluirFaturasAbertasSemGastosPorCartao(cartaoId: string): Promise<void> {
    const tenantId = this.getActiveTenantId()
    if (!tenantId) return

    // Busca todas as faturas abertas do cartão
    const { data: faturas, error: fError } = await this.supabase
      .from('faturas')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('cartao_id', cartaoId)
      .eq('status', 'ABERTA')

    if (fError || !faturas || faturas.length === 0) return

    for (const f of faturas) {
      // Verifica se há gastos vinculados a esta fatura
      const { count, error: cError } = await this.supabase
        .from('gastos')
        .select('*', { count: 'exact', head: true })
        .eq('fatura_id', f.id)

      if (!cError && count === 0) {
        // Exclui a fatura se não tiver gastos
        await this.supabase.from('faturas').delete().eq('id', f.id)
      }
    }
  }
}
