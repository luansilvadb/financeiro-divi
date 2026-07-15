import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useToast } from './useToast'

describe('useToast', () => {
  beforeEach(() => {
    const { hide } = useToast()
    hide()
    vi.useFakeTimers()
  })

  it('deve iniciar com estado invisivel e mensagem vazia', () => {
    const { visible, message, type } = useToast()
    expect(visible.value).toBe(false)
    expect(message.value).toBe('')
    expect(type.value).toBe('info')
  })

  it('deve exibir o toast com mensagem e tipo corretos e fechar apos o tempo limite', () => {
    const { visible, message, type, show } = useToast()
    show('Mensagem de erro', 'error', 3000)

    expect(visible.value).toBe(true)
    expect(message.value).toBe('Mensagem de erro')
    expect(type.value).toBe('error')

    vi.advanceTimersByTime(3000)
    expect(visible.value).toBe(false)
  })

  it('deve ocultar o toast imediatamente ao chamar hide', () => {
    const { visible, show, hide } = useToast()
    show('Teste', 'info')
    expect(visible.value).toBe(true)

    hide()
    expect(visible.value).toBe(false)
  })
})
