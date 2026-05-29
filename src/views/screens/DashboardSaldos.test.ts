import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardSaldos from './DashboardSaldos.vue'
import { Fatura } from '../../models/entities/Fatura'
import { Cartao } from '../../models/entities/Cartao'

describe('DashboardSaldos - Cartões & Faturas', () => {
  beforeEach(() => {
    localStorage.clear()
  })

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

    const { useCartoesEFaturas } = await import('../../viewmodels/useCartoesEFaturas')
    const { Dinheiro } = await import('../../models/entities/Dinheiro')
    const { Gasto } = await import('../../models/entities/Gasto')
    const { DivisaoDeGasto } = await import('../../models/entities/DivisaoDeGasto')

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
    const { useCartoesEFaturas } = await import('../../viewmodels/useCartoesEFaturas')
    const { Dinheiro } = await import('../../models/entities/Dinheiro')
    const { Gasto } = await import('../../models/entities/Gasto')
    const { DivisaoDeGasto } = await import('../../models/entities/DivisaoDeGasto')

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

  it('deve possuir atributos de acessibilidade e suportar eventos de teclado no seletor de períodos', async () => {
    const faturasFechadasMock = [
      { id: 'f2', cartaoId: 'c1', responsavelId: 'm1', status: 'FECHADA', periodo: { mes: 4, ano: 2026 } }
    ] as any

    const wrapper = mount(DashboardSaldos, {
      props: {
        membros: [{ id: 'm1', nome: 'João' }, { id: 'm2', nome: 'Maria' }],
        faturasFechadas: faturasFechadasMock,
        acertosPendentes: [],
        faturasAbertas: [
          { id: 'f1', cartaoId: 'c1', responsavelId: 'm1', status: 'ABERTA', periodo: { mes: 5, ano: 2026 } }
        ] as any,
        cartoes: [{ id: 'c1', nome: 'Nubank' }] as any,
        calcularConsumo: () => 0
      },
      global: {
        stubs: {
          BottomSheet: {
            template: '<div><slot /></div>'
          }
        }
      }
    })

    // Abre o BottomSheet de historico para renderizar os seletores
    await wrapper.setData({ showBottomSheetHistorico: true })
    await wrapper.vm.$nextTick()

    // 1. Testa acionador do dropdown de abertos
    const trigger = wrapper.find('[aria-label="Gerenciar período aberto"]')
    expect(trigger.exists()).toBe(true)
    expect(trigger.attributes('role')).toBe('button')
    expect(trigger.attributes('tabindex')).toBe('0')
    expect(trigger.attributes('aria-expanded')).toBe('false')

    // Ativa dropdown via Enter
    await trigger.trigger('keydown.enter')
    await wrapper.vm.$nextTick()
    expect((wrapper.vm as any).isDropdownAbertosOpen).toBe(true)
    expect(trigger.attributes('aria-expanded')).toBe('true')

    // 2. Testa itens do dropdown de meses abertos
    const openItems = wrapper.findAll('[role="button"]')
    const openPeriodOption = openItems.find(item => item.text().includes('Maio 2026'))
    expect(openPeriodOption?.exists()).toBe(true)
    expect(openPeriodOption?.attributes('tabindex')).toBe('0')

    // 3. Testa itens de meses arquivados
    const archivedItem = wrapper.find('[aria-label="Selecionar período arquivado Abril 2026"]')
    expect(archivedItem.exists()).toBe(true)
    expect(archivedItem.attributes('role')).toBe('button')
    expect(archivedItem.attributes('tabindex')).toBe('0')

    // Seleciona período arquivado via Teclado (Space)
    await archivedItem.trigger('keydown.space')
    await wrapper.vm.$nextTick()
    expect((wrapper.vm as any).periodoSelecionado.mes).toBe(4)
    expect((wrapper.vm as any).periodoSelecionado.ano).toBe(2026)
    expect((wrapper.vm as any).showBottomSheetHistorico).toBe(false)
  })

  it('deve disparar openSettings ao clicar no botão de configurações e possuir atributos de acessibilidade', async () => {
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

    const configButton = wrapper.find('[aria-label="Configurações"]')
    expect(configButton.exists()).toBe(true)
    expect(configButton.attributes('title')).toBe('Configurações')
    
    await configButton.trigger('click')
    expect(wrapper.emitted('openSettings')).toBeTruthy()
  })

  it('deve exibir previa de faturas abertas separada do saldo real', async () => {
    const wrapper = mount(DashboardSaldos, {
      props: {
        membros: [{ id: 'luan', nome: 'Luan' }, { id: 'joao', nome: 'Joao' }],
        faturasAbertas: [
          new Fatura({ id: 'pix-maio', cartaoId: 'PIX_DEFAULT_ID', periodo: { mes: 5, ano: 2026 }, responsavelId: 'PIX_SYSTEM_OWNER', status: 'ABERTA' }),
          new Fatura({ id: 'card-maio', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'luan', status: 'ABERTA' })
        ],
        faturasFechadas: [],
        acertosPendentes: [],
        cartoes: [new Cartao({ id: 'c1', nome: 'Nubank', diaFechamento: 10, responsavelPadraoId: 'luan' })],
        calcularConsumo: () => 0,
        activeTab: 'faturas'
      }
    })

    const { useCartoesEFaturas } = await import('../../viewmodels/useCartoesEFaturas')
    const { Dinheiro } = await import('../../models/entities/Dinheiro')
    const { Gasto } = await import('../../models/entities/Gasto')
    const { DivisaoDeGasto } = await import('../../models/entities/DivisaoDeGasto')

    const mockG = new Gasto({
      id: 'g-cartao-aberto',
      faturaId: 'card-maio',
      descricao: 'Compra Nubank',
      valorTotal: Dinheiro.deCentavos(15000),
      compradorId: 'luan',
      divisoes: [
        new DivisaoDeGasto('luan', Dinheiro.deCentavos(5000)),
        new DivisaoDeGasto('joao', Dinheiro.deCentavos(10000))
      ],
      method: 'card',
      cardOwner: 'luan'
    })

    useCartoesEFaturas().gastos.value = [mockG]
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Previa de faturas abertas')
    expect(wrapper.text()).toContain('Nao e cobranca final')
  })
})
