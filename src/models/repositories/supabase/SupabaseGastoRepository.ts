import type { SupabaseClient } from '@supabase/supabase-js'
import type { IGastoRepository } from '../IGastoRepository'
import { Gasto } from '../../entities/Gasto'
import { Dinheiro } from '../../entities/Dinheiro'
import { DivisaoDeGasto } from '../../entities/DivisaoDeGasto'

export class SupabaseGastoRepository implements IGastoRepository {
  constructor(
    private supabase: SupabaseClient,
    private getActiveTenantId: () => string
  ) {}

  async salvar(gasto: Gasto): Promise<void> {
    const tenantId = this.getActiveTenantId()
    if (!tenantId) throw new Error('Nenhuma casa ativa selecionada')

    // Insere ou atualiza o gasto
    const { error: gastoError } = await this.supabase.from('gastos').upsert({
      id: gasto.id,
      tenant_id: tenantId,
      fatura_id: gasto.faturaId,
      descricao: gasto.descricao,
      valor_total_centavos: gasto.valorTotal.centavos,
      comprador_id: gasto.compradorId,
      installments: gasto.installments,
      total_installments: gasto.totalInstallments,
      is_loan: gasto.isLoan,
      borrower_id: gasto.borrowerId,
      recurring_bill_id: gasto.recurringBillId,
      is_settlement: gasto.isSettlement,
      settlement_details: gasto.settlementDetails,
      method: gasto.method,
      card_owner_id: gasto.cardOwner,
      grupo_parcelas_id: gasto.grupoParcelasId
    })

    if (gastoError) throw new Error(`Erro ao salvar gasto: ${gastoError.message}`)

    // Limpa e reinsere as divisões do gasto
    await this.supabase.from('divisoes_gasto').delete().eq('gasto_id', gasto.id)

    const divisoesInserir = gasto.divisoes.map(d => ({
      tenant_id: tenantId,
      gasto_id: gasto.id,
      membro_id: d.membroId,
      valor_centavos: d.valor.centavos
    }))

    if (divisoesInserir.length > 0) {
      const { error: divError } = await this.supabase.from('divisoes_gasto').insert(divisoesInserir)
      if (divError) throw new Error(`Erro ao salvar divisões do gasto: ${divError.message}`)
    }
  }

  async salvarMuitos(gastos: Gasto[]): Promise<void> {
    for (const gasto of gastos) {
      await this.salvar(gasto)
    }
  }

  async buscarPorFatura(faturaId: string): Promise<Gasto[]> {
    const tenantId = this.getActiveTenantId()
    const { data, error } = await this.supabase
      .from('gastos')
      .select(`
        *,
        divisoes_gasto:divisoes_gasto (*)
      `)
      .eq('tenant_id', tenantId)
      .eq('fatura_id', faturaId)

    if (error) throw new Error(`Erro ao buscar gastos: ${error.message}`)
    if (!data) return []

    return data.map((g: any) => {
      const divisoes = (g.divisoes_gasto || []).map((d: any) => 
        new DivisaoDeGasto(d.membro_id, Dinheiro.deCentavos(Number(d.valor_centavos)))
      )
      return new Gasto({
        id: g.id,
        faturaId: g.fatura_id,
        descricao: g.descricao,
        valorTotal: Dinheiro.deCentavos(Number(g.valor_total_centavos)),
        compradorId: g.comprador_id,
        divisoes,
        installments: g.installments,
        totalInstallments: g.total_installments,
        isLoan: g.is_loan,
        borrowerId: g.borrower_id,
        recurringBillId: g.recurring_bill_id,
        isSettlement: g.is_settlement,
        settlementDetails: g.settlement_details,
        method: g.method,
        cardOwner: g.card_owner_id,
        grupoParcelasId: g.grupo_parcelas_id
      })
    })
  }

  async buscarPorId(id: string): Promise<Gasto | null> {
    const { data, error } = await this.supabase
      .from('gastos')
      .select(`
        *,
        divisoes_gasto:divisoes_gasto (*)
      `)
      .eq('id', id)
      .single()

    if (error || !data) return null

    const divisoes = (data.divisoes_gasto || []).map((d: any) => 
      new DivisaoDeGasto(d.membro_id, Dinheiro.deCentavos(Number(d.valor_centavos)))
    )

    return new Gasto({
      id: data.id,
      faturaId: data.fatura_id,
      descricao: data.descricao,
      valorTotal: Dinheiro.deCentavos(Number(data.valor_total_centavos)),
      compradorId: data.comprador_id,
      divisoes,
      installments: data.installments,
      totalInstallments: data.total_installments,
      isLoan: data.is_loan,
      borrowerId: data.borrower_id,
      recurringBillId: data.recurring_bill_id,
      isSettlement: data.is_settlement,
      settlementDetails: data.settlement_details,
      method: data.method,
      cardOwner: data.card_owner_id,
      grupoParcelasId: data.grupo_parcelas_id
    })
  }

  async excluir(id: string): Promise<void> {
    const { error } = await this.supabase.from('gastos').delete().eq('id', id)
    if (error) throw new Error(`Erro ao excluir gasto: ${error.message}`)
  }

  async excluirMuitos(ids: string[]): Promise<void> {
    const { error } = await this.supabase.from('gastos').delete().in('id', ids)
    if (error) throw new Error(`Erro ao excluir gastos: ${error.message}`)
  }

  async listarTodos(): Promise<Gasto[]> {
    const tenantId = this.getActiveTenantId()
    const { data, error } = await this.supabase
      .from('gastos')
      .select(`
        *,
        divisoes_gasto:divisoes_gasto (*)
      `)
      .eq('tenant_id', tenantId)

    if (error) throw new Error(`Erro ao listar todos os gastos: ${error.message}`)
    if (!data) return []

    return data.map((g: any) => {
      const divisoes = (g.divisoes_gasto || []).map((d: any) => 
        new DivisaoDeGasto(d.membro_id, Dinheiro.deCentavos(Number(d.valor_centavos)))
      )
      return new Gasto({
        id: g.id,
        faturaId: g.fatura_id,
        descricao: g.descricao,
        valorTotal: Dinheiro.deCentavos(Number(g.valor_total_centavos)),
        compradorId: g.comprador_id,
        divisoes,
        installments: g.installments,
        totalInstallments: g.total_installments,
        isLoan: g.is_loan,
        borrowerId: g.borrower_id,
        recurringBillId: g.recurring_bill_id,
        isSettlement: g.is_settlement,
        settlementDetails: g.settlement_details,
        method: g.method,
        cardOwner: g.card_owner_id,
        grupoParcelasId: g.grupo_parcelas_id
      })
    })
  }
}
