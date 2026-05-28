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
    selecionarCasa
  }
}
