import { HttpBaseRepository } from './HttpBaseRepository'
import { Fatura } from '../../entities/Fatura'
import type { FaturaPeriodo, FaturaStatus } from '../../entities/Fatura'
import type { IFaturaRepository } from '../IFaturaRepository'
import {
  FaturaFlexibleListResponseSchema,
  FaturaResponseSchema,
  CreateFaturaRequestSchema,
  normalizeFlexibleResponse,
} from '../../../shared/validation/apiSchemas'

interface FaturaDto {
  id: string
  cartaoId: string
  mes: number
  ano: number
  responsavelId: string
  status: FaturaStatus
  dataPagamentoBanco?: string | null
}

export class HttpFaturaRepository extends HttpBaseRepository implements IFaturaRepository {
  async buscarPorId(id: string): Promise<Fatura | null> {
    const list = await this.listarTodas()
    return list.find(f => f.id === id) || null
  }

  async buscarPorCartaoEPeriodo(cartaoId: string, periodo: FaturaPeriodo): Promise<Fatura | null> {
    const list = await this.listarTodas()
    return list.find(f => f.cartaoId === cartaoId && f.periodo.mes === periodo.mes && f.periodo.ano === periodo.ano) || null
  }

  async salvar(fatura: Fatura): Promise<void> {
    const body = {
      cartaoId: fatura.cartaoId,
      mes: fatura.periodo.mes,
      ano: fatura.periodo.ano,
      responsavelId: fatura.responsavelId,
      status: fatura.status,
      dataPagamentoBanco: fatura.dataPagamentoBanco instanceof Date
        ? fatura.dataPagamentoBanco.toISOString()
        : fatura.dataPagamentoBanco
    }
    CreateFaturaRequestSchema.parse(body)
    await this.validatedRequest(FaturaResponseSchema, '/faturas', {
      method: 'POST',
      body: JSON.stringify(body)
    })
  }

  async salvarMuitas(faturas: Fatura[]): Promise<void> {
    const mapped = faturas.map(f => {
      const body = {
        cartaoId: f.cartaoId,
        mes: f.periodo.mes,
        ano: f.periodo.ano,
        responsavelId: f.responsavelId,
        status: f.status,
        dataPagamentoBanco: f.dataPagamentoBanco instanceof Date
          ? f.dataPagamentoBanco.toISOString()
          : f.dataPagamentoBanco
      }
      CreateFaturaRequestSchema.parse(body)
      return body
    })
    await this.request('/faturas/batch', {
      method: 'POST',
      body: JSON.stringify(mapped)
    })
  }

  async listarTodas(): Promise<Fatura[]> {
    const raw = await this.validatedRequest(FaturaFlexibleListResponseSchema, '/faturas')
    const list = normalizeFlexibleResponse<FaturaDto>(raw)
    return list.map(item => new Fatura({
      id: item.id,
      cartaoId: item.cartaoId,
      periodo: { mes: item.mes, ano: item.ano },
      responsavelId: item.responsavelId,
      status: item.status,
      dataPagamentoBanco: item.dataPagamentoBanco ? new Date(item.dataPagamentoBanco) : undefined
    }))
  }

  async assegurarObterOuCriarFatura(cartaoId: string, mes: number, ano: number, responsavelId: string): Promise<Fatura> {
    const periodo = { mes, ano }
    const existente = await this.buscarPorCartaoEPeriodo(cartaoId, periodo)
    if (existente) return existente

    const body = {
      cartaoId,
      mes,
      ano,
      responsavelId,
      status: 'ABERTA' as const,
    }
    CreateFaturaRequestSchema.parse(body)
    const response = await this.validatedRequest<FaturaDto>(FaturaResponseSchema, '/faturas', {
      method: 'POST',
      body: JSON.stringify(body)
    })
    return new Fatura({
      id: response.id,
      cartaoId: response.cartaoId,
      periodo: { mes: response.mes, ano: response.ano },
      responsavelId: response.responsavelId,
      status: response.status,
      dataPagamentoBanco: response.dataPagamentoBanco ? new Date(response.dataPagamentoBanco) : undefined
    })
  }
}
