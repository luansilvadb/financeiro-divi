import { Dinheiro } from './Dinheiro'
import { DivisaoDeGasto } from './DivisaoDeGasto'

export type PaymentMethod = 'pix' | 'card' | 'cash'
export type SplitMode = 'equal' | 'income' | 'custom'

export interface GastoProps {
  id: string
  faturaId: string | null
  descricao: string
  valorTotal: Dinheiro
  compradorId: string
  divisoes: ReadonlyArray<DivisaoDeGasto>
  installments?: number
  totalInstallments?: number
  isLoan?: boolean
  borrowerId?: string | null
  recurringBillId?: string | null
  isSettlement?: boolean
  settlementDetails?: {
    fromMemberId: string
    toMemberId: string
    color?: string
    method: 'pix' | 'cash' | 'mutual'
  } | null
  method?: PaymentMethod
  cardOwner?: string | null
  grupoParcelasId?: string | null
  createdAt?: Date | string
  isPrivate?: boolean
  splitMode?: SplitMode
}

export class Gasto {
  public readonly id: string
  public readonly faturaId: string | null
  public readonly descricao: string
  public readonly valorTotal: Dinheiro
  public readonly compradorId: string
  public readonly divisoes: ReadonlyArray<DivisaoDeGasto>
  public readonly installments: number
  public readonly totalInstallments: number
  public readonly isLoan: boolean
  public readonly borrowerId: string | null
  public readonly recurringBillId: string | null
  public readonly isSettlement: boolean
  public readonly settlementDetails: {
    fromMemberId: string
    toMemberId: string
    method: 'pix' | 'cash' | 'mutual'
    color?: string
  } | null
  public readonly method: PaymentMethod
  public readonly cardOwner: string | null
  public readonly grupoParcelasId: string | null
  public readonly createdAt: Date
  public readonly isPrivate: boolean
  public readonly splitMode: SplitMode

  constructor(props: GastoProps) {
    this.id = props.id
    this.faturaId = props.faturaId ?? null
    this.descricao = props.descricao
    this.valorTotal = props.valorTotal
    this.compradorId = props.compradorId
    this.divisoes = props.divisoes
    this.installments = props.installments ?? 1
    this.totalInstallments = props.totalInstallments ?? props.installments ?? 1
    this.isLoan = props.isLoan ?? false
    this.borrowerId = props.borrowerId ?? null
    this.recurringBillId = props.recurringBillId ?? null
    this.isSettlement = props.isSettlement ?? false
    this.settlementDetails = props.settlementDetails ?? null
    this.method = props.method ?? 'pix'
    this.cardOwner = props.cardOwner ?? null
    this.grupoParcelasId = props.grupoParcelasId ?? null
    this.createdAt = props.createdAt ? new Date(props.createdAt) : new Date()
    this.isPrivate = props.isPrivate ?? false
    this.splitMode = props.splitMode ?? 'custom'
  }
}
