import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

export interface AntecipacaoProps {
  id: string
  faturaId: string
  membroId: string
  valor: Dinheiro
  data: Date
}

export class Antecipacao {
  public readonly id: string
  public readonly faturaId: string
  public readonly membroId: string
  public readonly valor: Dinheiro
  public readonly data: Date

  constructor(props: AntecipacaoProps) {
    this.id = props.id
    this.faturaId = props.faturaId
    this.membroId = props.membroId
    this.valor = props.valor
    this.data = props.data
  }
}