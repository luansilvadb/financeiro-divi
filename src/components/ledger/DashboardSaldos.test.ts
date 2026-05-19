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

    expect(wrapper.text()).toContain('Maria → João')
    expect(wrapper.text()).toContain('R$ 80,00')
  })

  it('deve exibir o saldo unificado baseado nos gastos', async () => {
    const wrapper = mount(DashboardSaldos, {
      props: {
        membros: [{ id: 'm1', nome: 'João' }, { id: 'm2', nome: 'Maria' }],
        faturasFechadas: [] as any,
        acertosPendentes: [] as any,
        faturasAbertas: [{ id: 'f1', cartaoId: 'c1', responsavelId: 'm1', status: 'ABERTA', periodo: { mes: 6, ano: 2026 } }] as any,
        cartoes: [{ id: 'c1', nome: 'Nubank' }] as any,
        calcularConsumo: () => 0,
        calcularAdiantamento: () => 0
      }
    })

    const { useCartoesEFaturas } = await import('../../modules/ledger/composables/useCartoesEFaturas')
    const { Dinheiro } = await import('../../shared/primitives/Dinheiro')
    const { Gasto } = await import('../../modules/ledger/core/domain/Gasto')
    const { DivisaoDeGasto } = await import('../../modules/ledger/core/domain/DivisaoDeGasto')

    const mockG = new Gasto({
      id: 'g-teste-saldo',
      faturaId: 'f1',
      descricao: 'Teste',
      valorTotal: Dinheiro.deCentavos(10000),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m2', Dinheiro.deCentavos(10000))]
    })

    useCartoesEFaturas().gastos.value = [mockG]
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('João')
    expect(wrapper.text()).toContain('+R$ 100,00')
    expect(wrapper.text()).toContain('Maria')
    expect(wrapper.text()).toContain('R$ -100,00')
  })

  it('nao renderiza mais a listagem de proximas faturas', () => {
    const wrapper = mount(DashboardSaldos, {
      props: {
        membros: [{ id: 'm1', nome: 'Joao' }, { id: 'm2', nome: 'Maria' }],
        faturasFechadas: [] as any,
        acertosPendentes: [] as any,
        faturasAbertas: [{ id: 'f1', cartaoId: 'c1', responsavelId: 'm1', status: 'ABERTA', periodo: { mes: 6, ano: 2026 } }] as any,
        cartoes: [{ id: 'c1', nome: 'Nubank' }] as any,
        calcularConsumo: () => 15000,
        calcularAdiantamento: () => 0
      }
    })

    const card = wrapper.find('[data-testid="proximas-faturas-card-f1"]')
    expect(card.exists()).toBe(false)
  })

  it('deve disparar a abertura do modal de ajuste ao clicar no botao de ajustar', async () => {
    const wrapper = mount(DashboardSaldos, {
      props: {
        membros: [{ id: 'm1', nome: 'João' }, { id: 'm2', nome: 'Maria' }],
        faturasFechadas: [] as any,
        acertosPendentes: [] as any,
        faturasAbertas: [{ id: 'f1', cartaoId: 'c1', responsavelId: 'm1', status: 'ABERTA', periodo: { mes: 6, ano: 2026 } }] as any,
        cartoes: [{ id: 'c1', nome: 'Nubank', responsavelPadraoId: 'm1' }] as any,
        calcularConsumo: () => 0,
        gastos: [] as any
      }
    })

    // Mock do inicializar do useCartoesEFaturas para conter gastos ativos
    const { useCartoesEFaturas } = await import('../../modules/ledger/composables/useCartoesEFaturas')
    const { Dinheiro } = await import('../../shared/primitives/Dinheiro')
    const { Gasto } = await import('../../modules/ledger/core/domain/Gasto')
    const { DivisaoDeGasto } = await import('../../modules/ledger/core/domain/DivisaoDeGasto')

    const mockG = new Gasto({
      id: 'g-teste-feed',
      faturaId: 'f1',
      descricao: 'Lanche Barato',
      valorTotal: Dinheiro.deCentavos(1000),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deCentavos(1000))]
    })

    useCartoesEFaturas().gastos.value = [mockG]
    await wrapper.vm.$nextTick()

    // Verifica presença do botão de ajuste no feed
    expect(wrapper.text()).toContain('Lanche Barato')
    expect(wrapper.text()).toContain('Ajustar')
  })

  it('deve renderizar o Detalhamento Granular de Contas', async () => {
    const wrapper = mount(DashboardSaldos, {
      props: {
        membros: [{ id: 'm1', nome: 'João' }, { id: 'm2', nome: 'Maria' }],
        faturasFechadas: [] as any,
        acertosPendentes: [] as any,
        faturasAbertas: [{ id: 'f1', cartaoId: 'c1', responsavelId: 'm1', status: 'ABERTA', periodo: { mes: 6, ano: 2026 } }] as any,
        cartoes: [{ id: 'c1', nome: 'Nubank', responsavelPadraoId: 'm1' }] as any,
        calcularConsumo: () => 0,
        gastos: [] as any
      }
    })

    await wrapper.vm.$nextTick()
    
    // Deve conter o título do card
    expect(wrapper.text()).toContain('Detalhamento Granular')
    // Deve conter os rótulos das colunas
    expect(wrapper.text()).toContain('PIX')
    expect(wrapper.text()).toContain('Cartão')
    expect(wrapper.text()).toContain('Empréstimo')
  })

  it('deve renderizar o novo Brand centralizado no header', () => {
    const wrapper = mount(DashboardSaldos, {
      props: {
        membros: [],
        faturasAbertas: [],
        faturasFechadas: [],
        acertosPendentes: [],
        cartoes: [],
        calcularConsumo: () => 0
      }
    })

    expect(wrapper.text()).toContain('DIVI.')
    expect(wrapper.text()).toContain('Finanças Residenciais')
  })
})
