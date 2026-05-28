import { HttpBaseRepository } from './HttpBaseRepository'
import type { ContaFixa } from '../../entities/ContaFixa'
import type { IContaFixaRepository } from '../IContaFixaRepository'

export class HttpContaFixaRepository extends HttpBaseRepository implements IContaFixaRepository {
  async listarTodas(): Promise<ContaFixa[]> {
    const list = await this.request<any[]>('/financeiro/contas-fixas')
    return list.map(item => ({
      id: item.id,
      name: item.name,
      icon: item.icon,
      fixedValueCentavos: item.fixedValueCentavos !== null ? Number(item.fixedValueCentavos) : null,
      defaultSplit: Array.isArray(item.defaultSplit) ? item.defaultSplit : JSON.parse(item.defaultSplit || '[]')
    }))
  }

  async salvar(conta: ContaFixa): Promise<void> {
    await this.request('/financeiro/contas-fixas', {
      method: 'POST',
      body: JSON.stringify({
        id: conta.id,
        name: conta.name,
        icon: conta.icon,
        fixedValueCentavos: conta.fixedValueCentavos,
        defaultSplit: conta.defaultSplit
      })
    })
  }

  async excluir(id: string): Promise<void> {
    await this.request(`/financeiro/contas-fixas/${id}`, {
      method: 'DELETE'
    })
  }
}
