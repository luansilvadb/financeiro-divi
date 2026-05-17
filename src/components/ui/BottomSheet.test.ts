import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BottomSheet from './BottomSheet.vue'

describe('BottomSheet', () => {
  it('deve renderizar o conteudo do slot quando modelValue for true', () => {
    const wrapper = mount(BottomSheet, {
      props: { modelValue: true },
      slots: {
        default: '<div id="test-content">Conteudo de Teste</div>'
      }
    })
    expect(wrapper.find('#test-content').exists()).toBe(true)
    expect(wrapper.text()).toContain('Conteudo de Teste')
  })

  it('nao deve renderizar o conteudo quando modelValue for false', () => {
    const wrapper = mount(BottomSheet, {
      props: { modelValue: false },
      slots: {
        default: '<div>Conteudo</div>'
      }
    })
    expect(wrapper.find('div').exists()).toBe(false)
  })
})
