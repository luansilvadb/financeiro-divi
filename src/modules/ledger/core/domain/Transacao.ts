import { Dinheiro } from '../../../../shared/primitives/Dinheiro'
import { Divisao } from './Divisao'

export type TransacaoStatus = 'pendente' | 'auditado' | 'em_disputa'

export interface TransacaoProps {
  id: string
  descricao: string
  total: Dinheiro
  origem_id: string
  pagador_id: string
  divisoes: Divisao[]
  status: TransacaoStatus
  data: Date
}

function validarSomaDivisoes(divisoes: Divisao[], total: Dinheiro) {
  const soma = divisoes.reduce(
    (acc, divisao) => acc.somar(divisao.valor),
    Dinheiro.deCentavos(0)
  )

  if (!soma.equals(total)) {
    throw new Error('A soma das divisões deve ser igual ao total da transação')
  }
}

export class Transacao {
  public readonly id: string
  public readonly descricao: string
  public readonly total: Dinheiro
  public readonly origem_id: string
  public readonly pagador_id: string
  public readonly divisoes: Divisao[]
  public readonly status: TransacaoStatus
  public readonly data: Date

  constructor(props: TransacaoProps) {
    validarSomaDivisoes(props.divisoes, props.total)
    
    this.id = props.id
    this.descricao = props.descricao
    this.total = props.total
    this.origem_id = props.origem_id
    this.pagador_id = props.pagador_id
    this.divisoes = props.divisoes
    this.status = props.status
    this.data = props.data
  }
}
