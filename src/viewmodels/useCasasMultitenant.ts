import { ref, computed, onMounted, reactive } from 'vue'
import { tenantSessionService } from '../shared/container'

export function useCasasMultitenant() {
  const isAuthed = ref(tenantSessionService.isAuthenticated())
  const activeTenantId = ref(tenantSessionService.getActiveTenantId())
  const casas = ref<any[]>([])
  const showBottomSheetCasas = ref(false)
  const form = reactive({
    nomeNovaCasa: '',
    codigoConvite: '',
    errorCasa: ''
  })
  const copiedCode = ref<string | null>(null)

  const activeTenantObj = computed(() => {
    return casas.value.find(c => c.id === activeTenantId.value) || null
  })

  const getApiUrl = () => {
    return (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000'
  }

  const getHeaders = () => {
    const token = localStorage.getItem('divi_jwt_token')
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }

  const carregarCasas = async () => {
    if (!isAuthed.value) return
    try {
      const response = await fetch(`${getApiUrl()}/auth/me`, {
        headers: getHeaders()
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleLogoutClick()
        }
        return
      }

      const data = await response.json()
      casas.value = data.tenants || []

      const isValido = casas.value.some(c => c.id === activeTenantId.value)
      if (!isValido || !activeTenantId.value) {
        if (casas.value.length > 0) {
          selecionarCasa(casas.value[0].id)
        } else {
          tenantSessionService.setActiveTenant('')
          activeTenantId.value = ''
        }
      }
    } catch (err) {
      console.error('Erro ao carregar casas:', err)
    }
  }

  const selecionarCasa = (id: string) => {
    tenantSessionService.setActiveTenant(id)
    activeTenantId.value = id
    showBottomSheetCasas.value = false
    window.dispatchEvent(new CustomEvent('divi:tenant-changed'))
  }

  const criarNovaCasa = async () => {
    form.errorCasa = ''
    if (!form.nomeNovaCasa.trim()) {
      form.errorCasa = 'Digite o nome da casa'
      return
    }

    try {
      const response = await fetch(`${getApiUrl()}/financeiro/tenants`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name: form.nomeNovaCasa.trim() })
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        form.errorCasa = err.message || 'Erro ao criar casa'
        return
      }

      await response.json()
      form.nomeNovaCasa = ''
      await carregarCasas()
    } catch (err) {
      form.errorCasa = 'Falha de conexão com o servidor'
      console.error(err)
    }
  }

  const entrarPorCodigo = async () => {
    form.errorCasa = ''
    const cleanedCode = form.codigoConvite.trim().toUpperCase()
    if (!cleanedCode) {
      form.errorCasa = 'Digite o código de convite'
      return
    }

    try {
      const response = await fetch(`${getApiUrl()}/financeiro/tenants/entrar`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ inviteCode: cleanedCode })
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        form.errorCasa = err.message || 'Código de convite inválido ou casa não encontrada.'
        return
      }

      await response.json()
      form.codigoConvite = ''
      await carregarCasas()
    } catch (err) {
      form.errorCasa = 'Falha de conexão com o servidor'
      console.error(err)
    }
  }

  const copyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      copiedCode.value = code
      setTimeout(() => { copiedCode.value = null }, 2000)
    } catch (err) {
      console.error('Falha ao copiar:', err)
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
  })

  return {
    isAuthed,
    activeTenantId,
    casas,
    showBottomSheetCasas,
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
