import { ref, computed } from 'vue'

const openBottomSheetsCount = ref(0)

export function useBottomSheetState() {
  const isAnyBottomSheetOpen = computed(() => openBottomSheetsCount.value > 0)

  const registerOpen = () => {
    openBottomSheetsCount.value++
  }

  const registerClose = () => {
    if (openBottomSheetsCount.value > 0) {
      openBottomSheetsCount.value--
    }
  }

  return {
    isAnyBottomSheetOpen,
    registerOpen,
    registerClose
  }
}
