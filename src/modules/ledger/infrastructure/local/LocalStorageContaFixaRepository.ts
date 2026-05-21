import type { IContaFixaRepository } from '../core/ports/IContaFixaRepository'
import type { ContaFixa } from '../core/domain/ContaFixa'
import { StorageLock } from '../../../shared/utils/StorageLock'

export class LocalStorageContaFixaRepository implements IContaFixaRepository {
  private readonly STORAGE_KEY = 'divi_contas_fixas_templates_v18'

  async salvar(conta: ContaFixa): Promise<void> {
    await StorageLock.executarAtomico('lock_divi_contas_fixas', async () => {
      const contas = await this.listarTodas()
      const index = contas.findIndex(c => c.id === conta.id)
      
      if (index >= 0) {
        contas[index] = conta
      } else {
        contas.push(conta)
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(contas))
    })
  }

  async listarTodas(): Promise<ContaFixa[]> {
    const data = localStorage.getItem(this.STORAGE_KEY)
    if (!data) return []
    try {
      return JSON.parse(data) as ContaFixa[]
    } catch {
      return []
    }
  }

  async excluir(id: string): Promise<void> {
    await StorageLock.executarAtomico('lock_divi_contas_fixas', async () => {
      const contas = await this.listarTodas()
      const filtradas = contas.filter(c => c.id !== id)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtradas))
    })
  }
}
