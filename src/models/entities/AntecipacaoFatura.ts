import { Dinheiro } from './Dinheiro'

export interface AntecipacaoFaturaProps {
  id: string
  faturaId: string
  membroId: string
  responsavelId: string
  valor: Dinheiro
  data: Date
  observacao?: string | null
}

export class AntecipacaoFatura {
  public readonly id: string
  public readonly faturaId: string
  public readonly membroId: string
  public readonly responsavelId: string
  public readonly valor: Dinheiro
  public readonly data: Date
  public readonly observacao: string | null

  constructor(props: AntecipacaoFaturaProps) {
    if (!props.valor.isPositivo()) {
      throw new Error('Valor da antecipacao deve ser maior que zero')
    }

    this.id = props.id
    this.faturaId = props.faturaId
    this.membroId = props.membroId
    this.responsavelId = props.responsavelId
    this.valor = props.valor
    this.data = props.data
    this.observacao = props.observacao ?? null
  }
}
