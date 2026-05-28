import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ToastNotification from './ToastNotification.vue'
import { useToast } from '../../../composables/useToast'

describe('ToastNotification', () => {
  beforeEach(() => {
    const { hide } = useToast()
    hide()
  })

  it('nao deve renderizar nada se visible for falso', () => {
    const wrapper = mount(ToastNotification)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('deve renderizar a mensagem e botao fechar se visible for verdadeiro', async () => {
    const { show } = useToast()
    show('Mensagem de Teste Toast')
    
    const wrapper = mount(ToastNotification)
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Mensagem de Teste Toast')
    
    // Ao clicar no botão de fechar, o toast deve sumir
    await wrapper.find('button').trigger('click')
    const { visible } = useToast()
    expect(visible.value).toBe(false)
  })
})
