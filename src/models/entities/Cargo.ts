export class Cargo {
  readonly id: string
  readonly nome: string
  readonly cor?: string
  readonly permissoes: string[]
  readonly totalMembros?: number

  constructor(props: { id: string; nome: string; cor?: string; permissoes: string[]; totalMembros?: number }) {
    this.id = props.id
    this.nome = props.nome
    this.cor = props.cor
    this.permissoes = props.permissoes
    this.totalMembros = props.totalMembros
  }
}
