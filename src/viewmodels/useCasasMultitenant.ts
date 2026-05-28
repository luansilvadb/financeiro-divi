import { ref, computed } from 'vue'
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

  return {
    isAuthed,
    activeTenantId,
    casas,
    showBottomSheetCasas,
    nomeNovaCasa,
    codigoConvite,
    errorCasa,
    copied,
    activeTenantObj
  }
}
