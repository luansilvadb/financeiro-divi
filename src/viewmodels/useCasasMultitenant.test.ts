import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createApp, defineComponent, nextTick } from 'vue'
import { useCasasMultitenant } from './useCasasMultitenant'
import { tenantSessionService } from '../shared/container'

const tenantServiceMock = vi.hoisted(() => ({
  isAuthenticated: vi.fn(() => true),
  getActiveTenantId: vi.fn(() => 'tenant-123'),
  getCurrentUserId: vi.fn(() => 'user-abc'),
  getTenants: vi.fn((): { id: string; name: string; inviteCode: string }[] => []),
  inicializarSessao: vi.fn().mockResolvedValue(undefined),
  criarCasa: vi.fn(),
  entrarCasa: vi.fn(),
  setActiveTenant: vi.fn(),
  logout: vi.fn()
}))

vi.mock('../shared/container', () => ({
  tenantSessionService: tenantServiceMock
}))

const reloadMock = vi.fn()
Object.defineProperty(window, 'location', {
  value: {
    reload: reloadMock
  },
  configurable: true
})

const writeTextMock = vi.fn().mockResolvedValue(undefined)
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: writeTextMock
  },
  configurable: true
})

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
    reloadMock.mockClear()
    writeTextMock.mockClear()
    tenantServiceMock.getTenants.mockReturnValue([])
    tenantServiceMock.getActiveTenantId.mockReturnValue('tenant-123')
    tenantServiceMock.inicializarSessao.mockResolvedValue(undefined)
    tenantServiceMock.criarCasa.mockReset()
    tenantServiceMock.entrarCasa.mockReset()
  })

  it('deve inicializar com o estado padrão', async () => {
    const [{ isAuthed, casas, showBottomSheetCasas }, app] = withSetup(() => useCasasMultitenant())
    expect(isAuthed.value).toBe(true)
    expect(casas.value).toEqual([])
    expect(showBottomSheetCasas.value).toBe(false)
    
    await nextTick()
    app.unmount()
  })

  it('deve carregar as casas e obter o objeto do tenant ativo', async () => {
    tenantServiceMock.getTenants.mockReturnValue([
      { id: 'tenant-123', name: 'Casa Feliz', inviteCode: 'CODE123' }
    ])

    const [vm, app] = withSetup(() => useCasasMultitenant())
    
    await vm.carregarCasas()

    expect(vm.casas.value.length).toBe(1)
    expect(vm.casas.value[0].name).toBe('Casa Feliz')
    expect(vm.activeTenantObj.value).toEqual({ id: 'tenant-123', name: 'Casa Feliz', inviteCode: 'CODE123' })
    app.unmount()
  })

  it('deve criar uma nova casa com sucesso', async () => {
    const novaCasa = { id: 'new-tenant-id', name: 'República Central', inviteCode: 'CODE456' }
    tenantServiceMock.criarCasa.mockResolvedValue(novaCasa)
    tenantServiceMock.getTenants.mockReturnValue([novaCasa])
    tenantServiceMock.getActiveTenantId.mockReturnValue(novaCasa.id)

    const [vm, app] = withSetup(() => useCasasMultitenant())
    await nextTick()
    
    vm.form.nomeNovaCasa = 'República Central'
    await vm.criarNovaCasa()

    expect(tenantSessionService.criarCasa).toHaveBeenCalledWith('República Central')
    expect(vm.activeTenantId.value).toBe('new-tenant-id')
    expect(reloadMock).not.toHaveBeenCalled()
    app.unmount()
  })

  it('deve entrar em uma casa por código de convite com sucesso', async () => {
    const casaConvidada = { id: 'tenant-convidado', name: 'Casa Convidada', inviteCode: 'CONVITE12' }
    tenantServiceMock.entrarCasa.mockResolvedValue(casaConvidada)
    tenantServiceMock.getTenants.mockReturnValue([casaConvidada])
    tenantServiceMock.getActiveTenantId.mockReturnValue(casaConvidada.id)

    const [vm, app] = withSetup(() => useCasasMultitenant())
    await nextTick()
    
    vm.form.codigoConvite = 'CONVITE12'
    await vm.entrarPorCodigo()

    expect(tenantSessionService.entrarCasa).toHaveBeenCalledWith('CONVITE12')
    expect(vm.activeTenantId.value).toBe('tenant-convidado')
    expect(reloadMock).not.toHaveBeenCalled()
    app.unmount()
  })

  it('deve copiar o código de convite e dar feedback visual', async () => {
    vi.useFakeTimers()
    try {
      const [vm, app] = withSetup(() => useCasasMultitenant())
      await nextTick()

      await vm.copyInviteCode('CONVITE12')

      expect(writeTextMock).toHaveBeenCalledWith('CONVITE12')
      expect(vm.copiedCode.value).toBe('CONVITE12')

      vi.advanceTimersByTime(2100)
      expect(vm.copiedCode.value).toBeNull()
      app.unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('deve deslogar e recarregar a tela', async () => {
    const [vm, app] = withSetup(() => useCasasMultitenant())
    await nextTick()

    await vm.handleLogoutClick()

    expect(tenantSessionService.logout).toHaveBeenCalled()
    expect(reloadMock).toHaveBeenCalled()
    app.unmount()
  })
})
