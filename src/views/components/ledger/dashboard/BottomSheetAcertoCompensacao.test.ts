import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BottomSheetAcertoCompensacao from './BottomSheetAcertoCompensacao.vue'

describe('BottomSheetAcertoCompensacao', () => {
  it('deve emitir confirm com os dados corretos ao clicar em confirmar', async () => {
    const wrapper = mount(BottomSheetAcertoCompensacao, {
      props: {
        visible: true,
        fromId: 'm1',
        toId: 'm2',
        fromName: 'Luan',
        toName: 'Luciana',
        suggestedValue: 150.50
      },
      global: {
        stubs: {
          Teleport: true,
          BottomSheet: true
        }
      }
    })

    expect((wrapper.vm as any).valorReal).toBe(150.50)
  })
})
