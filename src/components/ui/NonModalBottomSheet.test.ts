import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NonModalBottomSheet from './NonModalBottomSheet.vue'

describe('NonModalBottomSheet', () => {
  it('deve renderizar o conteudo do slot quando visible for true', () => {
    const wrapper = mount(NonModalBottomSheet, {
      props: { visible: true },
      slots: {
        default: '<div id="test-content">Conteudo de Teste</div>'
      }
    })
    expect(wrapper.find('#test-content').exists()).toBe(true)
    expect(wrapper.text()).toContain('Conteudo de Teste')
  })

  it('nao deve renderizar o conteudo quando visible for false', () => {
    const wrapper = mount(NonModalBottomSheet, {
      props: { visible: false },
      slots: {
        default: '<div>Conteudo</div>'
      }
    })
    expect(wrapper.find('div').exists()).toBe(false)
  })
})
