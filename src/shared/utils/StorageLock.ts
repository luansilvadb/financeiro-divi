export class StorageLock {
  static async executarAtomico<T>(recurso: string, operacao: () => Promise<T>): Promise<T> {
    if (!navigator.locks) {
      if (import.meta.env.DEV) {
        console.warn(`Web Locks API indisponível para: ${recurso}. Executando sem proteção multi-aba.`)
      }
      return await operacao()
    }
    return await navigator.locks.request(recurso, async () => {
      return await operacao()
    })
  }
}
