import { onMounted, onUnmounted } from 'vue'
import { useMembros } from './useMembros'
import { useCartoesEFaturas } from './useCartoesEFaturas'
import { useContasFixas } from './useContasFixas'

// Estado global para garantir listener único (Singleton pattern para o listener)
let listenerRegistered = false
let referenceCount = 0

const handleStorage = (e: StorageEvent) => {
  const { carregar: reloadMembros } = useMembros()
  const { inicializar: reloadCartoes } = useCartoesEFaturas()
  const { carregarTemplates: reloadContasFixas } = useContasFixas()

  // O evento de storage só é disparado para outras abas, não para a aba que fez a alteração
  if (e.key === 'divi_membros') {
    reloadMembros()
  } else if (
    e.key === 'divi_gastos_cartao' ||
    e.key === 'divi_faturas' ||
    e.key === 'divi_cartoes' ||
    e.key === 'divi_antecipacoes' ||
    e.key === 'divi_acertos_membro'
  ) {
    reloadCartoes()
  } else if (e.key === 'divi_contas_fixas_templates_v18') {
    reloadContasFixas()
  } else if (e.key === 'divi_periodo_selecionado') {
    window.location.reload()
  }
}

export function useStorageSync() {
  onMounted(() => {
    referenceCount++
    if (!listenerRegistered) {
      window.addEventListener('storage', handleStorage)
      listenerRegistered = true
    }
  })

  onUnmounted(() => {
    referenceCount--
    if (referenceCount === 0 && listenerRegistered) {
      window.removeEventListener('storage', handleStorage)
      listenerRegistered = false
    }
  })
}
