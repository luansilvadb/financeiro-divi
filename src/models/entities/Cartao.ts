export interface CartaoProps {
  id: string
  nome: string
  diaFechamento: number
  responsavelPadraoId: string
}

export class Cartao {
  public readonly id: string
  public readonly nome: string
  public readonly diaFechamento: number
  public readonly responsavelPadraoId: string

  constructor(props: CartaoProps) {
    if (props.diaFechamento < 1 || props.diaFechamento > 31) {
      throw new Error('Dia de fechamento deve ser entre 1 e 31')
    }
    this.id = props.id
    this.nome = props.nome
    this.diaFechamento = props.diaFechamento
    this.responsavelPadraoId = props.responsavelPadraoId
  }
}
