import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SkeletonBlock from './SkeletonBlock.vue'

describe('SkeletonBlock', () => {
  it('aplica forma, tom e custom properties configuraveis', () => {
    const wrapper = mount(SkeletonBlock, {
      props: {
        shape: 'circle',
        tone: 'strong',
        width: '3rem',
        height: '3rem',
        radius: '9999px',
        delay: '160ms'
      }
    })

    const block = wrapper.get('[data-testid="skeleton-block"]')

    expect(block.classes()).toContain('skeleton-block--circle')
    expect(block.classes()).toContain('skeleton-block--strong')
    expect(block.attributes('style')).toContain('--skeleton-width: 3rem')
    expect(block.attributes('style')).toContain('--skeleton-height: 3rem')
    expect(block.attributes('style')).toContain('--skeleton-radius: 9999px')
    expect(block.attributes('style')).toContain('--skeleton-delay: 160ms')
  })

  it('mantem o bloco decorativo oculto para leitores de tela', () => {
    const wrapper = mount(SkeletonBlock)

    expect(wrapper.get('[data-testid="skeleton-block"]').attributes('aria-hidden')).toBe('true')
  })
})
