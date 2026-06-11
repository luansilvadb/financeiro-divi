import { ref, computed, onMounted, onUnmounted, reactive, type UnwrapRef, type Ref } from 'vue'
import { tenantSessionService } from '../shared/container'
import { useToast } from '../composables/useToast'
import type { TenantSummary } from '../models/services/TenantSessionService'
import { mensagemErro } from '../shared/utils/mensagemErro'

/**
 * Handles the core tenant session state and synchronization.
 */
function useTenantSessionState() {
  const isAuthed = ref(tenantSessionService.isAuthenticated())
  const activeTenantId = ref(tenantSessionService.getActiveTenantId())
  const casas = ref<TenantSummary[]>(tenantSessionService.getTenants())

  const activeTenantObj = computed(() => {
    return casas.value.find(c => c.id === activeTenantId.value) || null
  })

  const sincronizarCasas = () => {
    casas.value = tenantSessionService.getTenants()
    activeTenantId.value = tenantSessionService.getActiveTenantId()
  }

  return {
    isAuthed,
    activeTenantId,
    casas,
    activeTenantObj,
    sincronizarCasas
  }
}

/**
 * Handles creating and joining houses (tenants).
 */
function useTenantManagement(sincronizarCasas: () => void, toast: ReturnType<typeof useToast>) {
  const isCreating = ref(false)
  const isEntering = ref(false)
  const form = reactive({
    nomeNovaCasa: '',
    codigoConvite: '',
    errorCasa: ''
  })

  const criarNovaCasa = async () => {
    form.errorCasa = ''
    if (!form.nomeNovaCasa.trim()) {
      form.errorCasa = 'Digite o nome da casa'
      return
    }

    isCreating.value = true
    try {
      await tenantSessionService.criarCasa(form.nomeNovaCasa.trim())
      sincronizarCasas()
      form.nomeNovaCasa = ''
      toast.show('Casa criada com sucesso!', 'success')
    } catch (err: unknown) {
      form.errorCasa = mensagemErro(err, 'Falha de conexão com o servidor')
      toast.show(form.errorCasa, 'error')
    } finally {
      isCreating.value = false
    }
  }

  const entrarPorCodigo = async () => {
    form.errorCasa = ''
    const cleanedCode = form.codigoConvite.trim().toUpperCase()
    if (!cleanedCode) {
      form.errorCasa = 'Digite o código de convite'
      return
    }

    isEntering.value = true
    try {
      await tenantSessionService.entrarCasa(cleanedCode)
      sincronizarCasas()
      form.codigoConvite = ''
      toast.show('Você entrou na casa!', 'success')
    } catch (err: unknown) {
      form.errorCasa = mensagemErro(err, 'Falha de conexão com o servidor')
      toast.show(form.errorCasa, 'error')
    } finally {
      isEntering.value = false
    }
  }

  return {
    form,
    isCreating,
    isEntering,
    criarNovaCasa,
    entrarPorCodigo
  }
}

/**
 * Handles UI interactions related to tenants (bottom sheet, clipboard).
 */
function useTenantUI(activeTenantId: Ref<string | null>, toast: ReturnType<typeof useToast>) {
  const showBottomSheetCasas = ref(false)
  const copiedCode = ref<string | null>(null)

  const selecionarCasa = (id: string) => {
    tenantSessionService.setActiveTenant(id)
    activeTenantId.value = id
    showBottomSheetCasas.value = false
    window.dispatchEvent(new CustomEvent('divi:tenant-changed'))
  }

  const copyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      copiedCode.value = code
      toast.show('Link de convite copiado!', 'success')
      setTimeout(() => { copiedCode.value = null }, 2000)
    } catch (err) {
      toast.show('Não foi possível copiar o link', 'error')
      console.error('Falha ao copiar:', err)
    }
  }

  return {
    showBottomSheetCasas,
    copiedCode,
    selecionarCasa,
    copyInviteCode
  }
}

export function useCasasMultitenant() {
  const toast = useToast()

  const {
    isAuthed,
    activeTenantId,
    casas,
    activeTenantObj,
    sincronizarCasas
  } = useTenantSessionState()

  const {
    form,
    isCreating,
    isEntering,
    criarNovaCasa,
    entrarPorCodigo
  } = useTenantManagement(sincronizarCasas, toast)

  const {
    showBottomSheetCasas,
    copiedCode,
    selecionarCasa,
    copyInviteCode
  } = useTenantUI(activeTenantId, toast)

  const carregarCasas = async () => {
    if (!isAuthed.value) return
    try {
      await tenantSessionService.inicializarSessao()
      isAuthed.value = tenantSessionService.isAuthenticated()
      if (!isAuthed.value) {
        window.location.reload()
        return
      }
      sincronizarCasas()
    } catch (err) {
      console.error('Erro ao carregar casas:', err)
    }
  }

  const handleLogoutClick = async () => {
    await tenantSessionService.logout()
    window.location.reload()
  }

  onMounted(() => {
    if (isAuthed.value) {
      carregarCasas()
    }
    window.addEventListener('divi:tenant-changed', sincronizarCasas)
  })

  onUnmounted(() => {
    window.removeEventListener('divi:tenant-changed', sincronizarCasas)
  })

  return {
    isAuthed,
    activeTenantId,
    casas,
    showBottomSheetCasas,
    isCreating,
    isEntering,
    form,
    copiedCode,
    activeTenantObj,
    carregarCasas,
    selecionarCasa,
    criarNovaCasa,
    entrarPorCodigo,
    copyInviteCode,
    handleLogoutClick
  }
}

type CasasMultitenantViewModel = ReturnType<typeof useCasasMultitenant>
type CasasMultitenantView = {
  [K in keyof CasasMultitenantViewModel]: UnwrapRef<CasasMultitenantViewModel[K]>
}
export type CasasModalView = Pick<
  CasasMultitenantView,
  'casas' | 'activeTenantId' | 'copiedCode' | 'form' | 'isCreating' | 'isEntering' |
  'selecionarCasa' | 'criarNovaCasa' | 'entrarPorCodigo' | 'copyInviteCode' | 'handleLogoutClick'
>
