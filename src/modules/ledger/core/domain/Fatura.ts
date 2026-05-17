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
  if (diaFechamento < 1 || diaFechamento > 31) {
    throw new Error('diaFechamento deve ser entre 1 e 31')
  }
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
  private _status: FaturaStatus
  private _dataPagamentoBanco?: Date

  constructor(props: FaturaProps) {
    this.id = props.id
    this.cartaoId = props.cartaoId
    this.periodo = props.periodo
    this.responsavelId = props.responsavelId
    this._status = props.status
    this._dataPagamentoBanco = props.dataPagamentoBanco
  }

  get status(): FaturaStatus {
    return this._status
  }

  get dataPagamentoBanco(): Date | undefined {
    return this._dataPagamentoBanco
  }

  validarOperacaoPermitida() {
    if (this._status !== 'ABERTA') {
      throw new Error('Fatura não está ABERTA')
    }
  }

  fechar(dataPagamentoBanco?: Date) {
    if (this._status !== 'ABERTA') throw new Error('Apenas faturas ABERTAS podem ser fechadas')
    this._status = 'FECHADA'
    this._dataPagamentoBanco = dataPagamentoBanco
  }

  marcarComoPagaAoBanco(data: Date = new Date()) {
    if (this._status === 'ABERTA') throw new Error('Faturas ABERTAS não podem ser pagas ao banco')
    this._dataPagamentoBanco = data
  }

  desmarcarComoPagaAoBanco() {
    this._dataPagamentoBanco = undefined
  }

  marcarAcertada() {
    if (this._status !== 'FECHADA') throw new Error('Apenas faturas FECHADAS podem ser acertadas')
    this._status = 'ACERTADA'
  }

  reabrir() {
    if (this._status !== 'FECHADA') throw new Error('Apenas faturas FECHADAS podem ser reabertas')
    this._status = 'ABERTA'
    this._dataPagamentoBanco = undefined
  }
}
