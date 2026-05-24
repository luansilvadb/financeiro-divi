import type { SupabaseClient } from '@supabase/supabase-js'
import type { LocalStorageMembroRepository } from '../repositories/local/LocalStorageMembroRepository'
import type { LocalStorageCartaoRepository } from '../repositories/local/LocalStorageCartaoRepository'
import type { LocalStorageFaturaRepository } from '../repositories/local/LocalStorageFaturaRepository'
import type { LocalStorageGastoRepository } from '../repositories/local/LocalStorageGastoRepository'
import type { LocalStorageContaFixaRepository } from '../repositories/local/LocalStorageContaFixaRepository'
import type { LocalStorageAcertoMembroRepository } from '../repositories/local/LocalStorageAcertoMembroRepository'
import type { LocalStorageEventStore } from '../repositories/local/LocalStorageEventStore'

export class MigrationService {
  constructor(
    private supabase: SupabaseClient,
    private localMembro: LocalStorageMembroRepository,
    private localCartao: LocalStorageCartaoRepository,
    private localFatura: LocalStorageFaturaRepository,
    private localGasto: LocalStorageGastoRepository,
    private localContaFixa: LocalStorageContaFixaRepository,
    private localAcerto: LocalStorageAcertoMembroRepository,
    private localEventStore: LocalStorageEventStore
  ) {}

  async migrar(tenantId: string, currentUserId: string): Promise<void> {
    // 1. Migrar Membros
    const membros = await this.localMembro.listarTodos()
    for (const m of membros) {
      // Se for o criador atual do banco, associa ao user_id
      const isCurrentUser = m.id === currentUserId || m.nome.toLowerCase() === localStorage.getItem('divi_username')?.toLowerCase()
      const { error } = await this.supabase.from('membros_casa').insert({
        id: m.id,
        tenant_id: tenantId,
        nome: m.nome,
        avatar: m.nome.substring(0, 2).toUpperCase(),
        user_id: isCurrentUser ? currentUserId : null
      })
      if (error) throw new Error(`Erro de migração de membro: ${error.message}`)
    }

    // 2. Migrar Cartões
    const cartoes = await this.localCartao.listarTodos()
    for (const c of cartoes) {
      const { error } = await this.supabase.from('cartoes').insert({
        id: c.id,
        tenant_id: tenantId,
        nome: c.nome,
        dia_fechamento: c.diaFechamento,
        responsavel_padrao_id: c.responsavelPadraoId
      })
      if (error) throw new Error(`Erro de migração de cartão: ${error.message}`)
    }

    // 3. Migrar Faturas
    const faturas = await this.localFatura.listarTodas()
    for (const f of faturas) {
      const { error } = await this.supabase.from('faturas').insert({
        id: f.id,
        tenant_id: tenantId,
        cartao_id: f.cartaoId,
        mes: f.periodo.mes,
        ano: f.periodo.ano,
        responsavel_id: f.responsavelId,
        status: f.status,
        data_pagamento_banco: f.dataPagamentoBanco ? f.dataPagamentoBanco.toISOString() : null
      })
      if (error) throw new Error(`Erro de migração de fatura: ${error.message}`)
    }

    // 4. Migrar Gastos e Divisões
    const gastos = await this.localGasto.listarTodos()
    for (const g of gastos) {
      const { error: gError } = await this.supabase.from('gastos').insert({
        id: g.id,
        tenant_id: tenantId,
        fatura_id: g.faturaId,
        descricao: g.descricao,
        valor_total_centavos: g.valorTotal.centavos,
        comprador_id: g.compradorId,
        installments: g.installments,
        total_installments: g.totalInstallments,
        is_loan: g.isLoan,
        borrower_id: g.borrowerId,
        recurring_bill_id: g.recurringBillId,
        is_settlement: g.isSettlement,
        settlement_details: g.settlementDetails,
        method: g.method,
        card_owner_id: g.cardOwner,
        grupo_parcelas_id: g.grupoParcelasId
      })
      if (gError) throw new Error(`Erro de migração de gasto: ${gError.message}`)

      // Migrar divisões
      const divisoes = g.divisoes.map(d => ({
        tenant_id: tenantId,
        gasto_id: g.id,
        membro_id: d.membroId,
        valor_centavos: d.valor.centavos
      }))

      if (divisoes.length > 0) {
        const { error: dError } = await this.supabase.from('divisoes_gasto').insert(divisoes)
        if (dError) throw new Error(`Erro de migração de divisões de gasto: ${dError.message}`)
      }
    }

    // 5. Migrar Contas Fixas
    const contasFixas = await this.localContaFixa.listarTodas()
    for (const cf of contasFixas) {
      const { error } = await this.supabase.from('contas_fixas').insert({
        id: cf.id,
        tenant_id: tenantId,
        name: cf.name,
        icon: cf.icon,
        fixed_value_centavos: cf.fixedValue !== null ? Math.round(cf.fixedValue) : null,
        default_split: cf.defaultSplit
      })
      if (error) throw new Error(`Erro de migração de conta fixa: ${error.message}`)
    }

    // 6. Migrar Acertos de Membros
    const acertos = await this.localAcerto.listarTodos()
    for (const a of acertos) {
      const { error } = await this.supabase.from('acertos_membro').insert({
        id: a.id,
        tenant_id: tenantId,
        fatura_id: a.faturaId,
        membro_id: a.membroId,
        total_consumido_centavos: a.totalConsumido.centavos,
        valor_pago_centavos: a.valorPago.centavos,
        pago: a.pago,
        data_pagamento: a.dataPagamento ? a.dataPagamento.toISOString() : null
      })
      if (error) throw new Error(`Erro de migração de acerto: ${error.message}`)
    }

    // 7. Migrar Eventos da Ledger
    const events = await this.localEventStore.getStream()
    if (events.length > 0) {
      const dtos = events.map(e => ({
        id: e.id,
        tenant_id: tenantId,
        type: e.type,
        timestamp: e.timestamp,
        version: e.version,
        payload: e.payload
      }))
      const { error } = await this.supabase.from('ledger_events').insert(dtos)
      if (error) throw new Error(`Erro de migração de ledger events: ${error.message}`)
    }

    // 8. Limpeza do LocalStorage local para marcar como migrado e prevenir re-migração
    localStorage.setItem('divi_migrado_saas', 'true')
    localStorage.removeItem('divi_event_stream')
    localStorage.removeItem('divi_gastos_cartao')
    localStorage.removeItem('divi_faturas')
    localStorage.removeItem('divi_cartoes')
    localStorage.removeItem('divi_membros')
    localStorage.removeItem('divi_contas_fixas')
    localStorage.removeItem('divi_acertos_membro')
  }
}
