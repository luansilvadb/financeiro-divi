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

  // Obter partes da data no fuso de São Paulo / Brasília
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  })
  const partes = formatter.formatToParts(dataGasto)
  const diaGasto = parseInt(partes.find(p => p.type === 'day')!.value)
  let mes = parseInt(partes.find(p => p.type === 'month')!.value)
  let ano = parseInt(partes.find(p => p.type === 'year')!.value)

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
  public readonly status: FaturaStatus
  public readonly dataPagamentoBanco?: Date

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

  fechar(opts?: { responsavelId?: string; dataPagamentoBanco?: Date }): Fatura {
    if (this.status !== 'ABERTA') throw new Error('Apenas faturas ABERTAS podem ser fechadas')
    return new Fatura({
      id: this.id,
      cartaoId: this.cartaoId,
      periodo: this.periodo,
      responsavelId: opts?.responsavelId || this.responsavelId,
      status: 'FECHADA',
      dataPagamentoBanco: opts?.dataPagamentoBanco || this.dataPagamentoBanco
    })
  }

  marcarComoPagaAoBanco(data: Date = new Date()): Fatura {
    if (this.status === 'ABERTA') throw new Error('Faturas ABERTAS não podem ser pagas ao banco')
    return new Fatura({
      id: this.id,
      cartaoId: this.cartaoId,
      periodo: this.periodo,
      responsavelId: this.responsavelId,
      status: this.status,
      dataPagamentoBanco: data
    })
  }

  desmarcarComoPagaAoBanco(): Fatura {
    return new Fatura({
      id: this.id,
      cartaoId: this.cartaoId,
      periodo: this.periodo,
      responsavelId: this.responsavelId,
      status: this.status,
      dataPagamentoBanco: undefined
    })
  }

  marcarAcertada(): Fatura {
    if (this.status !== 'FECHADA') throw new Error('Apenas faturas FECHADAS podem ser acertadas')
    return new Fatura({
      id: this.id,
      cartaoId: this.cartaoId,
      periodo: this.periodo,
      responsavelId: this.responsavelId,
      status: 'ACERTADA',
      dataPagamentoBanco: this.dataPagamentoBanco
    })
  }

  desmarcarAcertada(): Fatura {
    if (this.status === 'ACERTADA') {
      return new Fatura({
        id: this.id,
        cartaoId: this.cartaoId,
        periodo: this.periodo,
        responsavelId: this.responsavelId,
        status: 'FECHADA',
        dataPagamentoBanco: this.dataPagamentoBanco
      })
    }
    return this
  }

  reabrir(): Fatura {
    if (this.status !== 'FECHADA' && this.status !== 'ACERTADA') {
      throw new Error('Apenas faturas FECHADAS ou ACERTADAS podem ser reabertas')
    }
    return new Fatura({
      id: this.id,
      cartaoId: this.cartaoId,
      periodo: this.periodo,
      responsavelId: this.responsavelId,
      status: 'ABERTA',
      dataPagamentoBanco: undefined
    })
  }
}
