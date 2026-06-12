export type MembroRole = 'ADMIN' | 'MORADOR' | 'VISUALIZADOR'

export class Membro {
  readonly id: string
  readonly nome: string
  readonly ativo: boolean
  readonly role: MembroRole
  readonly dataCriacao: Date
  readonly userId?: string
  readonly username?: string
  readonly rendaCentavos?: number

  constructor(props: {
    id: string
    nome: string
    ativo?: boolean
    role?: MembroRole
    dataCriacao?: Date
    userId?: string
    username?: string
    rendaCentavos?: number
  }) {
    this.id = props.id
    this.nome = props.nome
    this.ativo = props.ativo ?? true
    this.role = props.role ?? 'MORADOR'
    this.dataCriacao = props.dataCriacao ?? new Date()
    this.userId = props.userId
    this.username = props.username
    this.rendaCentavos = props.rendaCentavos
  }
}
