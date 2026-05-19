import { onMounted, onUnmounted } from 'vue'
import { useMembros } from './useMembros'

// Estado global para garantir listener único (Singleton pattern para o listener)
let listenerRegistered = false
let referenceCount = 0

const handleStorage = (e: StorageEvent) => {
  const { carregar: reloadMembros } = useMembros()

  // O evento de storage só é disparado para outras abas, não para a aba que fez a alteração
  if (e.key === 'divi_membros') {
    reloadMembros()
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
