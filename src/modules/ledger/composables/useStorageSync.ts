import { onMounted, onUnmounted } from 'vue'
import { useMembros } from './useMembros'
import { useTransacoes } from './useTransacoes'

export function useStorageSync() {
  const { carregar: reloadMembros } = useMembros()
  const { carregar: reloadTransacoes } = useTransacoes()

  const handleStorage = (e: StorageEvent) => {
    // O evento de storage só é disparado para outras abas, não para a aba que fez a alteração
    if (e.key === 'divi_transactions') {
      reloadTransacoes()
    }
    if (e.key === 'divi_membros') {
      reloadMembros()
    }
  }

  onMounted(() => {
    window.addEventListener('storage', handleStorage)
  })

  onUnmounted(() => {
    window.removeEventListener('storage', handleStorage)
  })
}
