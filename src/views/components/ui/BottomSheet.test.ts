import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BottomSheet from './BottomSheet.vue'

describe('BottomSheet', () => {
  it('deve renderizar o conteudo do slot quando modelValue for true', () => {
    const wrapper = mount(BottomSheet, {
      props: { modelValue: true },
      slots: {
        default: '<div id="test-content">Conteudo de Teste</div>'
      },
      global: {
        stubs: {
          Teleport: true
        }
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

  it('deve renderizar o rodape quando o slot footer for fornecido', () => {
    const wrapper = mount(BottomSheet, {
      props: { modelValue: true },
      slots: {
        footer: '<div id="test-footer">Botao de Acao</div>'
      },
      global: {
        stubs: {
          Teleport: true
        }
      }
    })
    expect(wrapper.find('#test-footer').exists()).toBe(true)
  })

  it('deve aplicar a classe contentClass ao container de conteudo', () => {
    const wrapper = mount(BottomSheet, {
      props: { 
        modelValue: true,
        contentClass: 'custom-padding'
      },
      global: {
        stubs: {
          Teleport: true
        }
      }
    })
    const contentContainer = wrapper.find('.overflow-y-auto.flex-1')
    expect(contentContainer.classes()).toContain('custom-padding')
  })
})
