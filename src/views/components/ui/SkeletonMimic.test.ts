import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SkeletonMimic from './SkeletonMimic.vue'
import skeletonMimicSource from './SkeletonMimic.vue?raw'
import mainCssSource from '../../../main.css?raw'

const mimicSource = skeletonMimicSource

describe('SkeletonMimic', () => {
  it('anuncia a carga uma vez e esconde a arvore visual', () => {
    const wrapper = mount(SkeletonMimic)
    const busySection = wrapper.get('[data-testid="skeleton-mimic"]')

    expect(wrapper.get('[role="status"]').text()).toBe('Carregando dados do dashboard')
    expect(busySection.attributes('aria-busy')).toBe('true')
    expect(busySection.attributes('aria-live')).toBeUndefined()
    expect(busySection.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="skeleton-visual"]').attributes('aria-hidden')).toBe('true')
  })

  it('espelha as secoes principais da aba hoje', () => {
    const wrapper = mount(SkeletonMimic, { props: { variant: 'hoje', memberRows: 2, fixedBillRows: 4, activityRows: 3 } })
    expect(wrapper.find('[data-testid="skeleton-balance-panel"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="skeleton-balance-row"]')).toHaveLength(2)
    expect(wrapper.find('[data-testid="skeleton-fixed-bills-panel"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="skeleton-fixed-bill-row"]')).toHaveLength(4)
    expect(wrapper.find('[data-testid="skeleton-add-fixed-bill"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="skeleton-activity-panel"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="skeleton-activity-row"]')).toHaveLength(3)
  })

  it('renderiza acertos somente quando existem linhas solicitadas', async () => {
    const wrapper = mount(SkeletonMimic, { props: { variant: 'hoje', nettingRows: 0 } })
    expect(wrapper.find('[data-testid="skeleton-netting-panel"]').exists()).toBe(false)
    await wrapper.setProps({ nettingRows: 2 })
    expect(wrapper.find('[data-testid="skeleton-netting-panel"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="skeleton-netting-row"]')).toHaveLength(2)
  })

  it('espelha status e analise detalhada da aba faturas', () => {
    const wrapper = mount(SkeletonMimic, { props: { variant: 'faturas', memberRows: 2 } })
    expect(wrapper.find('[data-testid="skeleton-period-status"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="skeleton-breakdown-panel"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="skeleton-member-breakdown"]')).toHaveLength(2)
    expect(wrapper.findAll('[data-testid="skeleton-financial-summary"]')).toHaveLength(6)
  })

  it('mantem tokens locais para light dark e velocidade customizavel', () => {
    const lightTokens = mimicSource.match(/\.skeleton-theme\s*{([\s\S]*?)}/)?.[1]
    const darkTokens = mimicSource.match(/:global\(\.dark\) \.skeleton-theme\s*{([\s\S]*?)}/)?.[1]

    expect(lightTokens).toContain('--skeleton-base:')
    expect(lightTokens).toContain('--skeleton-soft:')
    expect(lightTokens).toContain('--skeleton-strong:')
    expect(lightTokens).toContain('--skeleton-highlight:')
    expect(lightTokens).toContain('--skeleton-duration: 1.8s')
    expect(lightTokens).toContain('--skeleton-ease:')
    expect(darkTokens).toContain('--skeleton-base:')
    expect(darkTokens).toContain('--skeleton-soft:')
    expect(darkTokens).toContain('--skeleton-strong:')
    expect(darkTokens).toContain('--skeleton-highlight:')
  })

  it('remove o shimmer global legado', () => {
    expect(mainCssSource).not.toContain('shimmer-premium')
    expect(mainCssSource).not.toContain('.animate-shimmer')
  })
})
