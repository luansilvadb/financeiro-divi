import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ModalAcertoCompensacao from './ModalAcertoCompensacao.vue'

describe('ModalAcertoCompensacao', () => {
  it('deve ter o campo de descrição como readonly e com estilo de cursor default', () => {
    const wrapper = mount(ModalAcertoCompensacao, {
      props: {
        visible: true,
        suggestedValue: 100,
        fromName: 'Luan',
        toName: 'Maria'
      }
    })

    const inputDescricao = wrapper.find('input[type="text"]')
    
    // Verifica se o atributo readonly está presente
    expect(inputDescricao.attributes()).toHaveProperty('readonly')
    
    // Verifica se possui a classe de cursor default e não possui a de foco de edição
    expect(inputDescricao.classes()).toContain('cursor-default')
    expect(inputDescricao.classes()).not.toContain('focus:border-ember')
  })
})
