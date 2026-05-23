import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BottomSheetConfigurarContaFixa from './BottomSheetConfigurarContaFixa.vue'
import type { ContaFixa } from '../../../models/entities/ContaFixa'

const bill: ContaFixa = {
  id: 'energia',
  name: 'Energia',
  icon: '💡',
  fixedValue: 120,
  defaultSplit: ['luan', 'maria'],
}

// Apenas moradores ativos passados para a prop membros
const membrosAtivos = [
  { id: 'luan', nome: 'Luan' },
  { id: 'maria', nome: 'Maria' },
]

describe('BottomSheetConfigurarContaFixa', () => {
  it('renderiza os moradores ativos e o status de seleção padrão', () => {
    const wrapper = mount(BottomSheetConfigurarContaFixa, {
      props: {
        visible: true,
        bill,
        membros: membrosAtivos,
      },
      global: { stubs: { Teleport: true } }
    })

    expect(wrapper.text()).toContain('Configurar Conta Fixa')
    expect(wrapper.text()).toContain('Luan')
    expect(wrapper.text()).toContain('Maria')
  })

  it('filtra moradores inativos (inexistentes na prop membros) do defaultSplit ao carregar a conta', async () => {
    // Conta com defaultSplit contendo um ID inativo ('joao')
    const billWithInactive: ContaFixa = {
      ...bill,
      defaultSplit: ['luan', 'joao']
    }

    const wrapper = mount(BottomSheetConfigurarContaFixa, {
      props: {
        visible: true,
        bill: billWithInactive,
        membros: membrosAtivos,
      },
      global: { stubs: { Teleport: true } }
    })

    // Busca o botão com texto "Salvar" especificamente
    const saveButton = wrapper.findAll('button').find(btn => btn.text().includes('Salvar'))
    await saveButton?.trigger('click')

    const saveEvents = wrapper.emitted('save')
    expect(saveEvents).toBeTruthy()
    expect(saveEvents?.[0][0]).toEqual({
      id: 'energia',
      name: 'Energia',
      icon: '💡',
      fixedValue: 120,
      defaultSplit: ['luan'] // 'joao' foi removido porque não está na prop membros
    })
  })
})
