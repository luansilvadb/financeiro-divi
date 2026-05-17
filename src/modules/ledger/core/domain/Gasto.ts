import { Dinheiro } from '../../../../shared/primitives/Dinheiro'
import { DivisaoDeGasto } from './DivisaoDeGasto'

export interface GastoProps {
  id: string
  faturaId: string
  descricao: string
  valorTotal: Dinheiro
  compradorId: string // <- NOVO
  divisoes: ReadonlyArray<DivisaoDeGasto>
}

export class Gasto {
  public readonly id: string
  public readonly faturaId: string
  public readonly descricao: string
  public readonly valorTotal: Dinheiro
  public readonly compradorId: string // <- NOVO
  public readonly divisoes: ReadonlyArray<DivisaoDeGasto>

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
    this.compradorId = props.compradorId // <- NOVO
    this.divisoes = props.divisoes
  }
}
