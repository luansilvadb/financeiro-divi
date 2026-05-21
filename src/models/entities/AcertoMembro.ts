import { Dinheiro } from './Dinheiro'

export type TipoAcerto = 'MEMBRO_PAGA' | 'RESPONSAVEL_PAGA'

export interface AcertoMembroProps {
  id: string
  faturaId: string
  membroId: string
  totalConsumido: Dinheiro
  totalAntecipado: Dinheiro
  valorPago?: Dinheiro
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
  public valorPago: Dinheiro
  public pago: boolean
  public dataPagamento?: Date

  constructor(props: AcertoMembroProps) {
    this.id = props.id
    this.faturaId = props.faturaId
    this.membroId = props.membroId
    this.totalConsumido = props.totalConsumido
    this.totalAntecipado = props.totalAntecipado
    this.valorPago = props.valorPago ?? Dinheiro.deCentavos(0)
    this.dataPagamento = props.dataPagamento
    
    const diff = props.totalConsumido.centavos - props.totalAntecipado.centavos
    this.valorAcerto = Dinheiro.deCentavos(Math.abs(diff))
    this.tipo = diff >= 0 ? 'MEMBRO_PAGA' : 'RESPONSAVEL_PAGA'
    this.pago = props.pago ?? (this.valorPago.centavos >= this.valorAcerto.centavos)
  }

  public registrarReembolso(valor: Dinheiro, data: Date = new Date()): void {
    if (valor.centavos <= 0) {
      throw new Error('Valor do reembolso deve ser maior que zero')
    }
    const novoTotalPago = this.valorPago.somar(valor)
    if (novoTotalPago.centavos > this.valorAcerto.centavos) {
      throw new Error('Valor do reembolso excede a dívida total do acerto')
    }
    this.valorPago = novoTotalPago
    if (this.valorPago.centavos >= this.valorAcerto.centavos) {
      this.pago = true
      this.dataPagamento = data
    }
  }

  public marcarComoPago(data: Date = new Date()): void {
    const faltaPagar = Dinheiro.deCentavos(this.valorAcerto.centavos - this.valorPago.centavos)
    if (faltaPagar.centavos > 0) {
      this.registrarReembolso(faltaPagar, data)
    } else {
      this.pago = true
      this.dataPagamento = data
    }
  }
}