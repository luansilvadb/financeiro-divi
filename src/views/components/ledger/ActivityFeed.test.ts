import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ActivityFeed from './ActivityFeed.vue'
import { Gasto } from '../../../models/entities/Gasto'
import { Dinheiro } from '../../../models/entities/Dinheiro'
import { DivisaoDeGasto } from '../../../models/entities/DivisaoDeGasto'

describe('ActivityFeed', () => {
  it('nao mostra aviso de mes arquivado quando recebe periodo fechado', () => {
    const gasto = new Gasto({
      id: 'g1',
      faturaId: 'f1',
      descricao: 'Mercado',
      valorTotal: Dinheiro.deReais(100),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(100))]
    })

    const wrapper = mount(ActivityFeed, {
      props: {
        gastos: [gasto],
        membros: [{ id: 'm1', nome: 'Luan' }],
        isMonthClosed: true
      }
    })

    expect(wrapper.text()).toContain('Mercado')
    expect(wrapper.text()).not.toContain('Mês arquivado')
  })
})
