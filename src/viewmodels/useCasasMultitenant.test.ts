import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createApp, defineComponent } from 'vue'
import { useCasasMultitenant } from './useCasasMultitenant'

function withSetup<T>(composable: () => T) {
  let result: T
  const app = createApp(defineComponent({
    setup() {
      result = composable()
      return () => {}
    }
  }))
  app.mount(document.createElement('div'))
  return [result!, app] as const
}

describe('useCasasMultitenant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve inicializar com o estado padrão', () => {
    const [{ isAuthed, casas, showBottomSheetCasas }] = withSetup(() => useCasasMultitenant())
    expect(isAuthed.value).toBe(false)
    expect(casas.value).toEqual([])
    expect(showBottomSheetCasas.value).toBe(false)
  })
})
