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
      /\.skeleton-block::after\s*{[\s\S]*?transform:\s*translate3d\(-110%, 0, 0\);[\s\S]*?animation:\s*skeleton-shimmer\s+var\(--skeleton-duration, 1\.8s\)\s+var\(--skeleton-ease, cubic-bezier\(0\.4, 0, 0\.2, 1\)\)\s+var\(--skeleton-delay\)\s+infinite;[\s\S]*?will-change:\s*transform;/
    )
    expect(source).toMatch(
      /@keyframes skeleton-shimmer\s*{[\s\S]*?transform:\s*translate3d\(110%, 0, 0\);/
    )
  })

  it('permite customizar os tons por tokens herdados', () => {
    expect(source).toContain('--skeleton-fill: var(--skeleton-soft, var(--skeleton-default-soft));')
    expect(source).toContain('--skeleton-fill: var(--skeleton-base, var(--skeleton-default-base));')
    expect(source).toContain('--skeleton-fill: var(--skeleton-strong, var(--skeleton-default-strong));')
  })

  it('define fallbacks dark sem sobrescrever tokens herdados', () => {
    const darkDefaults = source.match(/:global\(\.dark\) \.skeleton-block\s*{([\s\S]*?)}/)?.[1]

    expect(darkDefaults).toContain('--skeleton-default-soft: rgb(255 255 255 / 6%)')
    expect(darkDefaults).toContain('--skeleton-default-base: rgb(255 255 255 / 10%)')
    expect(darkDefaults).toContain('--skeleton-default-strong: rgb(255 255 255 / 16%)')
    expect(darkDefaults).toContain('--skeleton-default-highlight: rgb(255 255 255 / 12%)')
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
