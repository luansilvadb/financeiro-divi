export type FaturaStatus = 'ABERTA' | 'FECHADA' | 'ACERTADA'

export interface FaturaPeriodo {
  mes: number // 1 a 12
  ano: number
}

export interface FaturaProps {
  id: string
  cartaoId: string
  periodo: FaturaPeriodo
  responsavelId: string
  status: FaturaStatus
  dataPagamentoBanco?: Date
}

export function determinarPeriodoFatura(dataGasto: Date, diaFechamento: number): FaturaPeriodo {
  const diaGasto = dataGasto.getUTCDate()
  let mes = dataGasto.getUTCMonth() + 1
  let ano = dataGasto.getUTCFullYear()

  // Se o dia do gasto for maior ou igual ao dia de fechamento, cai na fatura do mês seguinte
  if (diaGasto >= diaFechamento) {
    mes += 1
    if (mes > 12) {
      mes = 1
      ano += 1
    }
  }
  return { mes, ano }
}

export class Fatura {
  public readonly id: string
  public readonly cartaoId: string
  public readonly periodo: FaturaPeriodo
  public readonly responsavelId: string
  public status: FaturaStatus
  public dataPagamentoBanco?: Date

  constructor(props: FaturaProps) {
    this.id = props.id
    this.cartaoId = props.cartaoId
    this.periodo = props.periodo
    this.responsavelId = props.responsavelId
    this.status = props.status
    this.dataPagamentoBanco = props.dataPagamentoBanco
  }

  validarOperacaoPermitida() {
    if (this.status !== 'ABERTA') {
      throw new Error('Fatura não está ABERTA')
    }
  }

  fechar(dataPagamentoBanco: Date = new Date()) {
    if (this.status !== 'ABERTA') throw new Error('Apenas faturas ABERTAS podem ser fechadas')
    this.status = 'FECHADA'
    this.dataPagamentoBanco = dataPagamentoBanco
  }

  marcarAcertada() {
    if (this.status !== 'FECHADA') throw new Error('Apenas faturas FECHADAS podem ser acertadas')
    this.status = 'ACERTADA'
  }
}
