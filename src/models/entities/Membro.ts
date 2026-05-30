
export class Membro {
  readonly id: string
  readonly nome: string
  readonly ativo: boolean
  readonly dataCriacao: Date

  constructor(props: { id: string; nome: string; ativo?: boolean; dataCriacao?: Date }) {
    this.id = props.id
    this.nome = props.nome
    this.ativo = props.ativo ?? true
    this.dataCriacao = props.dataCriacao ?? new Date()
  }
}
