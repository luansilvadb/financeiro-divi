import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
// @ts-expect-error Vitest executes this source check in Node while the app tsconfig omits Node types.
import { readFileSync } from 'node:fs'
import SkeletonMimic from './SkeletonMimic.vue'

const mimicSource = readFileSync('src/views/components/ui/SkeletonMimic.vue', 'utf8')
const mainCssSource = readFileSync('src/main.css', 'utf8')

describe('SkeletonMimic', () => {
  it('anuncia a carga uma vez e esconde a arvore visual', () => {
    const wrapper = mount(SkeletonMimic)
    expect(wrapper.get('[data-testid="skeleton-mimic"]').attributes('aria-busy')).toBe('true')
    expect(wrapper.get('[role="status"]').text()).toBe('Carregando dados do dashboard')
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
    expect(mimicSource).toContain('.skeleton-theme')
    expect(mimicSource).toContain(':global(.dark) .skeleton-theme')
    expect(mimicSource).toContain('--skeleton-duration: 1.8s')
    expect(mimicSource).toContain('--skeleton-ease:')
  })

  it('remove o shimmer global legado', () => {
    expect(mainCssSource).not.toContain('shimmer-premium')
    expect(mainCssSource).not.toContain('.animate-shimmer')
  })
})
