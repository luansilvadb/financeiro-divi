import { HttpBaseRepository } from './HttpBaseRepository'
import { Fatura } from '../../entities/Fatura'
import type { FaturaPeriodo } from '../../entities/Fatura'
import type { IFaturaRepository } from '../IFaturaRepository'

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
    await this.request('/financeiro/faturas', {
      method: 'POST',
      body: JSON.stringify({
        id: fatura.id,
        cartaoId: fatura.cartaoId,
        mes: fatura.periodo.mes,
        ano: fatura.periodo.ano,
        responsavelId: fatura.responsavelId,
        status: fatura.status,
        dataPagamentoBanco: fatura.dataPagamentoBanco
      })
    })
  }

  async salvarMuitas(faturas: Fatura[]): Promise<void> {
    const mapped = faturas.map(f => ({
      id: f.id,
      cartaoId: f.cartaoId,
      mes: f.periodo.mes,
      ano: f.periodo.ano,
      responsavelId: f.responsavelId,
      status: f.status,
      dataPagamentoBanco: f.dataPagamentoBanco
    }))
    await this.request('/financeiro/faturas/batch', {
      method: 'POST',
      body: JSON.stringify(mapped)
    })
  }

  async listarTodas(): Promise<Fatura[]> {
    const list = await this.request<any[]>('/financeiro/faturas')
    return list.map(item => new Fatura({
      id: item.id,
      cartaoId: item.cartaoId,
      periodo: { mes: item.mes, ano: item.ano },
      responsavelId: item.responsavelId,
      status: item.status,
      dataPagamentoBanco: item.dataPagamentoBanco ? new Date(item.dataPagamentoBanco) : undefined
    }))
  }

  async executarMigracoesEDesduplicacao(): Promise<void> {}

  async assegurarObterOuCriarFatura(cartaoId: string, mes: number, ano: number, responsavelId: string): Promise<Fatura> {
    const periodo = { mes, ano }
    const existente = await this.buscarPorCartaoEPeriodo(cartaoId, periodo)
    if (existente) return existente

    const nova = new Fatura({
      id: `${cartaoId}-${mes}-${ano}`,
      cartaoId,
      periodo,
      responsavelId,
      status: 'ABERTA'
    })
    await this.salvar(nova)
    return nova
  }

  async excluirFaturasAbertasSemGastosPorCartao(_cartaoId: string): Promise<void> {}
}
