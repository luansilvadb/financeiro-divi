import type { IContaFixaRepository } from '../IContaFixaRepository'
import type { ContaFixa } from '../../entities/ContaFixa'
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
      const parsed = JSON.parse(data) as any[]
      return parsed.map(c => {
        const centavos = c.fixedValueCentavos !== undefined
          ? c.fixedValueCentavos
          : (c.fixedValue !== undefined && c.fixedValue !== null ? Math.round(c.fixedValue * 100) : null)
        
        return {
          id: c.id,
          name: c.name,
          icon: c.icon,
          fixedValueCentavos: centavos,
          defaultSplit: Array.isArray(c.defaultSplit) ? c.defaultSplit : []
        }
      })
    } catch (e) {
      console.error('Erro grave de integridade no banco de dados local de contas fixas:', e)
      throw new Error('Banco de dados local de contas fixas corrompido. Operação abortada para evitar perda de dados.')
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
