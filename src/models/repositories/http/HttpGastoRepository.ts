import { HttpBaseRepository } from './HttpBaseRepository'
import { Gasto } from '../../entities/Gasto'
import { DivisaoDeGasto } from '../../entities/DivisaoDeGasto'
import { Dinheiro } from '../../entities/Dinheiro'
import type { IGastoRepository } from '../IGastoRepository'

export class HttpGastoRepository extends HttpBaseRepository implements IGastoRepository {
  private mapToEntity(item: any): Gasto {
    const divisoes = (item.divisoes || []).map((d: any) => new DivisaoDeGasto(
      d.membroId,
      Dinheiro.deCentavos(d.valorCentavos)
    ))

    return new Gasto({
      id: item.id,
      faturaId: item.faturaId,
      descricao: item.descricao,
      valorTotal: Dinheiro.deCentavos(item.valorTotalCentavos),
      compradorId: item.compradorId,
      divisoes,
      installments: item.installments,
      totalInstallments: item.totalInstallments,
      isLoan: item.isLoan,
      borrowerId: item.borrowerId,
      recurringBillId: item.recurringBillId,
      isSettlement: item.isSettlement,
      settlementDetails: item.settlementDetails,
      method: item.method as 'pix' | 'card',
      cardOwner: item.cardOwnerId,
      grupoParcelasId: item.grupoParcelasId
    })
  }

  async buscarPorFatura(faturaId: string): Promise<Gasto[]> {
    const list = await this.listarTodos()
    return list.filter(g => g.faturaId === faturaId)
  }

  async buscarPorId(id: string): Promise<Gasto | null> {
    const list = await this.listarTodos()
    return list.find(g => g.id === id) || null
  }

  async salvar(gasto: Gasto): Promise<void> {
    const body = {
      id: gasto.id,
      faturaId: gasto.faturaId,
      descricao: gasto.descricao,
      valorTotalCentavos: gasto.valorTotal.centavos,
      compradorId: gasto.compradorId,
      installments: gasto.installments,
      totalInstallments: gasto.totalInstallments,
      isLoan: gasto.isLoan,
      borrowerId: gasto.borrowerId,
      recurringBillId: gasto.recurringBillId,
      isSettlement: gasto.isSettlement,
      settlementDetails: gasto.settlementDetails,
      method: gasto.method,
      cardOwnerId: gasto.cardOwner,
      grupoParcelasId: gasto.grupoParcelasId,
      divisoes: gasto.divisoes.map(d => ({
        membroId: d.membroId,
        valorCentavos: d.valor.centavos
      }))
    }

    await this.request('/financeiro/gastos', {
      method: 'POST',
      body: JSON.stringify(body)
    })
  }

  async salvarMuitos(gastos: Gasto[]): Promise<void> {
    const mapped = gastos.map(gasto => ({
      id: gasto.id,
      faturaId: gasto.faturaId,
      descricao: gasto.descricao,
      valorTotalCentavos: gasto.valorTotal.centavos,
      compradorId: gasto.compradorId,
      installments: gasto.installments,
      totalInstallments: gasto.totalInstallments,
      isLoan: gasto.isLoan,
      borrowerId: gasto.borrowerId,
      recurringBillId: gasto.recurringBillId,
      isSettlement: gasto.isSettlement,
      settlementDetails: gasto.settlementDetails,
      method: gasto.method,
      cardOwnerId: gasto.cardOwner,
      grupoParcelasId: gasto.grupoParcelasId,
      divisoes: gasto.divisoes.map(d => ({
        membroId: d.membroId,
        valorCentavos: d.valor.centavos
      }))
    }))

    await this.request('/financeiro/gastos/batch', {
      method: 'POST',
      body: JSON.stringify(mapped)
    })
  }

  async excluir(id: string): Promise<void> {
    await this.request(`/financeiro/gastos/${id}`, {
      method: 'DELETE'
    })
  }

  async excluirMuitos(ids: string[]): Promise<void> {
    await this.request('/financeiro/gastos/delete-batch', {
      method: 'POST',
      body: JSON.stringify({ ids })
    })
  }

  async listarTodos(): Promise<Gasto[]> {
    const list = await this.request<any[]>('/financeiro/gastos')
    return list.map(item => this.mapToEntity(item))
  }
}
