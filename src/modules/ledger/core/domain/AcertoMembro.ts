import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

export type TipoAcerto = 'MEMBRO_PAGA' | 'RESPONSAVEL_PAGA'

export interface AcertoMembroProps {
  id: string
  faturaId: string
  membroId: string
  totalConsumido: Dinheiro
  totalAntecipado: Dinheiro
  pago?: boolean
  dataPagamento?: Date
}

export class AcertoMembro {
  public readonly id: string
  public readonly faturaId: string
  public readonly membroId: string
  public readonly totalConsumido: Dinheiro
  public readonly totalAntecipado: Dinheiro
  public readonly valorAcerto: Dinheiro
  public readonly tipo: TipoAcerto
  public pago: boolean
  public dataPagamento?: Date

  constructor(props: AcertoMembroProps) {
    this.id = props.id
    this.faturaId = props.faturaId
    this.membroId = props.membroId
    this.totalConsumido = props.totalConsumido
    this.totalAntecipado = props.totalAntecipado
    this.pago = props.pago ?? false
    this.dataPagamento = props.dataPagamento
    
    const diff = props.totalConsumido.centavos - props.totalAntecipado.centavos
    this.valorAcerto = Dinheiro.deCentavos(Math.abs(diff))
    this.tipo = diff >= 0 ? 'MEMBRO_PAGA' : 'RESPONSAVEL_PAGA'
  }

  marcarComoPago(data: Date = new Date()) {
    this.pago = true
    this.dataPagamento = data
  }
}