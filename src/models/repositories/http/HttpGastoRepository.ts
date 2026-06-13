import { HttpBaseRepository } from './HttpBaseRepository'
import { Gasto, type PaymentMethod, type SplitMode } from '../../entities/Gasto'
import { DivisaoDeGasto } from '../../entities/DivisaoDeGasto'
import { Dinheiro } from '../../entities/Dinheiro'
import type { IGastoRepository } from '../IGastoRepository'

interface GastoDto {
  id: string
  faturaId: string
  descricao: string
  valorTotalCentavos: number
  compradorId: string
  divisoes?: { membroId: string; valorCentavos: number }[]
  installments?: number
  totalInstallments?: number
  isLoan?: boolean
  borrowerId?: string | null
  recurringBillId?: string | null
  isSettlement?: boolean
  settlementDetails?: Gasto['settlementDetails']
  method?: PaymentMethod
  cardOwnerId?: string | null
  grupoParcelasId?: string | null
  isPrivate?: boolean
  splitMode?: 'EQUAL' | 'INCOME' | 'CUSTOM'
  createdAt?: string
}

const toDomainSplitMode = (splitMode?: GastoDto['splitMode']): SplitMode => {
  if (splitMode === 'EQUAL') return 'equal'
  if (splitMode === 'INCOME') return 'income'
  return 'custom'
}

const toApiSplitMode = (splitMode: SplitMode): NonNullable<GastoDto['splitMode']> => {
  if (splitMode === 'equal') return 'EQUAL'
  if (splitMode === 'income') return 'INCOME'
  return 'CUSTOM'
}

export class HttpGastoRepository extends HttpBaseRepository implements IGastoRepository {
  private mapToEntity(item: GastoDto): Gasto {
    const divisoes = (item.divisoes || []).map(d => new DivisaoDeGasto(
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
      method: item.method,
      cardOwner: item.cardOwnerId,
      grupoParcelasId: item.grupoParcelasId,
      isPrivate: item.isPrivate,
      splitMode: toDomainSplitMode(item.splitMode),
      createdAt: item.createdAt
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

  private mapToDto(gasto: Gasto) {
    return {
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
      isPrivate: gasto.isPrivate,
      splitMode: toApiSplitMode(gasto.splitMode),
      createdAt: gasto.createdAt ? gasto.createdAt.toISOString() : undefined,
      divisoes: gasto.divisoes.map(d => ({
        membroId: d.membroId,
        valorCentavos: d.valor.centavos
      }))
    }
  }

  async salvar(gasto: Gasto): Promise<void> {
    await this.request('/financeiro/gastos', {
      method: 'POST',
      body: JSON.stringify(this.mapToDto(gasto))
    })
  }

  async salvarMuitos(gastos: Gasto[]): Promise<void> {
    await this.request('/financeiro/gastos/batch', {
      method: 'POST',
      body: JSON.stringify(gastos.map(g => this.mapToDto(g)))
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
    const list = await this.request<GastoDto[]>('/financeiro/gastos')
    return list.map(item => this.mapToEntity(item))
  }

}
