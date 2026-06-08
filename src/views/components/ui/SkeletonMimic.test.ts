import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SkeletonMimic from './SkeletonMimic.vue'

describe('SkeletonMimic', () => {
  it('anuncia a carga uma vez e esconde a arvore visual', () => {
    const wrapper = mount(SkeletonMimic)

    expect(wrapper.get('.skeleton-theme').attributes('aria-busy')).toBe('true')
  })

  it('renderiza os blocos essenciais', () => {
    const wrapper = mount(SkeletonMimic)

    expect(wrapper.find('header').exists()).toBe(true)
    expect(wrapper.findAll('.p-4.rounded-2xl')).toHaveLength(3)
  })
})
