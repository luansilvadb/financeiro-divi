import { ref, computed, onMounted } from 'vue'
import { tenantSessionService } from '../shared/container'
import { supabase } from '../shared/supabase'

export function useCasasMultitenant() {
  const isAuthed = ref(tenantSessionService.isAuthenticated())
  const activeTenantId = ref(tenantSessionService.getActiveTenantId())
  const casas = ref<any[]>([])
  const showBottomSheetCasas = ref(false)
  const nomeNovaCasa = ref('')
  const codigoConvite = ref('')
  const errorCasa = ref('')
  const copied = ref(false)

  const activeTenantObj = computed(() => {
    return casas.value.find(c => c.id === activeTenantId.value) || null
  })

  const carregarCasas = async () => {
    if (!isAuthed.value) return
    const { data: members, error: mError } = await supabase
      .from('membros_casa')
      .select('tenant_id')
      .eq('user_id', tenantSessionService.getCurrentUserId())
    
    if (mError || !members) return

    const tenantIds = members.map(m => m.tenant_id)
    if (tenantIds.length === 0) {
      casas.value = []
      return
    }

    const { data: tenantsList, error: tError } = await supabase
      .from('tenants')
      .select('*')
      .in('id', tenantIds)

    if (!tError && tenantsList) {
      casas.value = tenantsList
      const isValido = tenantsList.some(c => c.id === activeTenantId.value)
      if (!isValido || !activeTenantId.value) {
        if (tenantsList.length > 0) {
          selecionarCasa(tenantsList[0].id)
        } else {
          tenantSessionService.setActiveTenant('')
          activeTenantId.value = ''
        }
      }
    }
  }

  const selecionarCasa = (id: string) => {
    tenantSessionService.setActiveTenant(id)
    activeTenantId.value = id
    showBottomSheetCasas.value = false
    window.location.reload()
  }

  const criarNovaCasa = async () => {
    errorCasa.value = ''
    if (!nomeNovaCasa.value.trim()) {
      errorCasa.value = 'Digite o nome da casa'
      return
    }

    const uuid = crypto.randomUUID()
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase()
    const code = `CASA-${randomSuffix}`

    // 1. Inserir Tenant
    const { error: tError } = await supabase.from('tenants').insert({
      id: uuid,
      name: nomeNovaCasa.value.trim(),
      invite_code: code
    })

    if (tError) {
      errorCasa.value = 'Erro ao criar casa: ' + tError.message
      return
    }

    // 2. Inserir Membro Fundador
    const { error: mError } = await supabase.from('membros_casa').insert({
      id: tenantSessionService.getCurrentUserId()!,
      tenant_id: uuid,
      nome: localStorage.getItem('divi_username') || 'Membro Fundador',
      avatar: (localStorage.getItem('divi_username') || 'MF').substring(0, 2).toUpperCase(),
      user_id: tenantSessionService.getCurrentUserId()!
    })

    if (mError) {
      errorCasa.value = 'Erro ao associar membro: ' + mError.message
      return
    }

    nomeNovaCasa.value = ''
    await carregarCasas()
    selecionarCasa(uuid)
  }

  const entrarPorCodigo = async () => {
    errorCasa.value = ''
    const cleanedCode = codigoConvite.value.trim().toUpperCase()
    if (!cleanedCode) {
      errorCasa.value = 'Digite o código de convite'
      return
    }

    const { data: tenantData, error: tError } = await supabase
      .from('tenants')
      .select('*')
      .eq('invite_code', cleanedCode)
      .single()

    if (tError || !tenantData) {
      errorCasa.value = 'Código de convite inválido ou casa não encontrada.'
      return
    }

    const userId = tenantSessionService.getCurrentUserId()!
    const username = localStorage.getItem('divi_username') || 'Convidado'

    const { data: perfilExistente, error: pError } = await supabase
      .from('membros_casa')
      .select('*')
      .eq('tenant_id', tenantData.id)
      .eq('nome', username)
      .is('user_id', null)
      .limit(1)

    if (!pError && perfilExistente && perfilExistente.length > 0) {
      const { error: uError } = await supabase
        .from('membros_casa')
        .update({ user_id: userId })
        .eq('tenant_id', tenantData.id)
        .eq('id', perfilExistente[0].id)

      if (uError) {
        errorCasa.value = 'Erro ao vincular perfil: ' + uError.message
        return
      }
    } else {
      const { error: mError } = await supabase.from('membros_casa').insert({
        id: userId,
        tenant_id: tenantData.id,
        nome: username,
        avatar: username.substring(0, 2).toUpperCase(),
        user_id: userId
      })

      if (mError) {
        errorCasa.value = 'Erro ao entrar na casa: ' + mError.message
        return
      }
    }

    codigoConvite.value = ''
    await carregarCasas()
    selecionarCasa(tenantData.id)
  }

  const copyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      copied.value = true
      setTimeout(() => { copied.value = false }, 2000)
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
    nomeNovaCasa,
    codigoConvite,
    errorCasa,
    copied,
    activeTenantObj,
    carregarCasas,
    selecionarCasa,
    criarNovaCasa,
    entrarPorCodigo,
    copyInviteCode,
    handleLogoutClick
  }
}
