import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardSaldos from './DashboardSaldos.vue'

describe('DashboardSaldos - Cartões & Faturas', () => {
  it('deve exibir as faturas fechadas aguardando acerto', () => {
    const wrapper = mount(DashboardSaldos, {
      props: {
        membros: [{ id: 'm1', nome: 'João' }, { id: 'm2', nome: 'Maria' }],
        faturasFechadas: [{ id: 'f1', cartaoId: 'c1', responsavelId: 'm1', status: 'FECHADA', periodo: { mes: 5, ano: 2026 } }] as any,
        acertosPendentes: [{ id: 'a1', faturaId: 'f1', membroId: 'm2', valorAcerto: { centavos: 8000 }, tipo: 'MEMBRO_PAGA', pago: false }] as any,
        faturasAbertas: [] as any,
        cartoes: [{ id: 'c1', nome: 'Nubank' }] as any,
        calcularConsumo: () => 0
      }
    })

    expect(wrapper.text()).toContain('Faturas Fechadas')
    expect(wrapper.text()).toContain('Maria deve para João')
    expect(wrapper.text()).toContain('R$ 80,00')
  })

  it('deve exibir o saldo devedor líquido deduzindo os adiantamentos', () => {
    const wrapper = mount(DashboardSaldos, {
      props: {
        membros: [{ id: 'm1', nome: 'João' }, { id: 'm2', nome: 'Maria' }],
        faturasFechadas: [] as any,
        acertosPendentes: [] as any,
        faturasAbertas: [{ id: 'f1', cartaoId: 'c1', responsavelId: 'm1', status: 'ABERTA', periodo: { mes: 6, ano: 2026 } }] as any,
        cartoes: [{ id: 'c1', nome: 'Nubank' }] as any,
        calcularConsumo: () => 15000, // R$ 150,00
        calcularAdiantamento: () => 5000 // R$ 50,00 adiantados
      }
    })

    expect(wrapper.text()).toContain('Consumo: R$ 150,00')
    expect(wrapper.text()).toContain('Adiantado: - R$ 50,00')
    expect(wrapper.text()).toContain('Pendente: R$ 100,00')
  })
})
