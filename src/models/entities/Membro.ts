import { Cargo } from './Cargo'

export type MembroRole = 'ADMIN' | 'MORADOR' | 'VISUALIZADOR'

export class Membro {
  readonly id: string
  readonly nome: string
  readonly ativo: boolean
  readonly role: MembroRole
  readonly cargoId?: string
  readonly cargo?: Cargo
  readonly dataCriacao: Date
  readonly userId?: string

  constructor(props: {
    id: string
    nome: string
    ativo?: boolean
    role?: MembroRole
    cargoId?: string
    cargo?: Cargo
    dataCriacao?: Date
    userId?: string
  }) {
    this.id = props.id
    this.nome = props.nome
    this.ativo = props.ativo ?? true
    this.role = props.role ?? 'MORADOR'
    this.cargoId = props.cargoId
    this.cargo = props.cargo
    this.dataCriacao = props.dataCriacao ?? new Date()
    this.userId = props.userId
  }
}
