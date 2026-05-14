import { Dinheiro } from '../../../../shared/primitives/Dinheiro'
import { Divisao } from './Divisao'

export type TransacaoStatus = 'pendente' | 'auditado' | 'em_disputa'

export interface Pagamento {
  membro_id: string
  valor: Dinheiro
}

export interface TransacaoProps {
  id: string
  descricao: string
  total: Dinheiro
  pagamentos: Pagamento[]
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

function validarSomaPagamentos(pagamentos: Pagamento[], total: Dinheiro) {
  const soma = pagamentos.reduce(
    (acc, pagamento) => acc.somar(pagamento.valor),
    Dinheiro.deCentavos(0)
  )

  if (!soma.equals(total)) {
    throw new Error('A soma dos pagamentos deve ser igual ao total da transação')
  }
}

export class Transacao {
  public readonly id: string
  public readonly descricao: string
  public readonly total: Dinheiro
  public readonly pagamentos: Pagamento[]
  public readonly divisoes: Divisao[]
  public readonly status: TransacaoStatus
  public readonly data: Date

  constructor(props: TransacaoProps) {
    validarSomaDivisoes(props.divisoes, props.total)
    validarSomaPagamentos(props.pagamentos, props.total)
    
    this.id = props.id
    this.descricao = props.descricao
    this.total = props.total
    this.pagamentos = props.pagamentos
    this.divisoes = props.divisoes
    this.status = props.status
    this.data = props.data
  }
}
