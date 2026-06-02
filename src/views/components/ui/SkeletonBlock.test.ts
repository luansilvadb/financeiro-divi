import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SkeletonBlock from './SkeletonBlock.vue'

const source = readFileSync(resolve(process.cwd(), 'src/views/components/ui/SkeletonBlock.vue'), 'utf8')

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

describe('SkeletonBlock CSS', () => {
  it('mantem o shimmer animado na GPU', () => {
    expect(source).toMatch(
      /\.skeleton-block::after\s*{[\s\S]*?transform:\s*translate3d\(-110%, 0, 0\);[\s\S]*?animation:\s*skeleton-shimmer[\s\S]*?will-change:\s*transform;/
    )
    expect(source).toMatch(
      /@keyframes skeleton-shimmer\s*{[\s\S]*?transform:\s*translate3d\(110%, 0, 0\);/
    )
  })

  it('oferece variantes de tom para dark mode', () => {
    expect(source).toContain(':global(.dark) .skeleton-block')
    expect(source).toContain(':global(.dark) .skeleton-block--soft')
    expect(source).toContain(':global(.dark) .skeleton-block--base')
    expect(source).toContain(':global(.dark) .skeleton-block--strong')
  })

  it('desativa animacao e hints de movimento quando reduced motion esta ativo', () => {
    const reducedMotion = source.match(
      /@media \(prefers-reduced-motion: reduce\)\s*{\s*\.skeleton-block::after\s*{([\s\S]*?)}\s*}/
    )?.[1]

    expect(reducedMotion).toContain('animation: none')
    expect(reducedMotion).toContain('transform: none')
    expect(reducedMotion).toContain('will-change: auto')
  })
})
