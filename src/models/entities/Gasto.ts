import { Dinheiro } from './Dinheiro'
import { DivisaoDeGasto } from './DivisaoDeGasto'

export interface GastoProps {
  id: string
  faturaId: string
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
    method: 'pix' | 'cash' | 'mutual'
  } | null
  method?: 'pix' | 'card'
  cardOwner?: string | null
  grupoParcelasId?: string | null
}

export class Gasto {
  public readonly id: string
  public readonly faturaId: string
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
  } | null
  public readonly method: 'pix' | 'card'
  public readonly cardOwner: string | null
  public readonly grupoParcelasId: string | null

  constructor(props: GastoProps) {
    if (props.divisoes.length === 0) {
      throw new Error('Um gasto deve ter pelo menos uma divisão')
    }

    const soma = props.divisoes.reduce((acc, d) => acc.somar(d.valor), Dinheiro.deCentavos(0))
    if (!soma.equals(props.valorTotal)) {
      throw new Error('A soma das divisões deve ser igual ao valor total do gasto')
    }
    
    this.id = props.id
    this.faturaId = props.faturaId
    this.descricao = props.descricao
    this.valorTotal = props.valorTotal
    this.compradorId = props.compradorId
    this.divisoes = props.divisoes
    this.installments = props.installments || 1
    this.totalInstallments = props.totalInstallments || props.installments || 1
    this.isLoan = props.isLoan || false
    this.borrowerId = props.borrowerId || null
    this.recurringBillId = props.recurringBillId || null
    this.isSettlement = props.isSettlement || false
    this.settlementDetails = props.settlementDetails || null
    this.method = props.method || 'pix'
    this.cardOwner = props.cardOwner || null
    this.grupoParcelasId = props.grupoParcelasId || null
  }
}
