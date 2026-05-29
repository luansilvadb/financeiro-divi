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

  private gastoPertenceAoMesmoPeriodo(gasto: any, acerto: any, faturas: any[]): boolean {
    const faturaGasto = faturas.find(f => f.id === gasto.faturaId)
    const faturaAcerto = faturas.find(f => f.id === acerto.faturaId)
    if (faturaGasto && faturaAcerto) {
      return faturaGasto.mes === faturaAcerto.mes && faturaGasto.ano === faturaAcerto.ano
    }
    const match = gasto.faturaId.match(/(?:.*-)?(\d+)-(\d+)$/)
    if (match && faturaAcerto) {
      const mes = parseInt(match[1], 10)
      const ano = parseInt(match[2], 10)
      return mes === faturaAcerto.mes && ano === faturaAcerto.ano
    }
    return false
  }

  async executarMigracoesEDesduplicacao(): Promise<void> {
    try {
      const acertos = await this.request<any[]>('/financeiro/acertos')
      const gastos = await this.request<any[]>('/financeiro/gastos')
      const faturas = await this.request<any[]>('/financeiro/faturas')

      const acertosComPagamento = acertos.filter(a => a.valorPagoCentavos > 0)
      const novosGastosParaSalvar: any[] = []

      for (const acerto of acertosComPagamento) {
        const temGastoSalvo = gastos.some(g => 
          g.isSettlement && 
          (g.id.includes(`pix-acerto-${acerto.id}`) || 
           (g.settlementDetails && 
            (g.settlementDetails.fromMemberId === acerto.membroId || g.settlementDetails.toMemberId === acerto.membroId) &&
            this.gastoPertenceAoMesmoPeriodo(g, acerto, faturas)))
        )

        if (!temGastoSalvo) {
          const faturaAcerto = faturas.find(f => f.id === acerto.faturaId)
          if (faturaAcerto) {
            const faturaPix = faturas.find(
              f => f.cartaoId === 'PIX_DEFAULT_ID' && f.mes === faturaAcerto.mes && f.ano === faturaAcerto.ano
            )
            const faturaPixId = faturaPix ? faturaPix.id : `PIX_DEFAULT_ID-${faturaAcerto.mes}-${faturaAcerto.ano}`

            const compradorId = acerto.tipo === 'MEMBRO_PAGA' ? acerto.membroId : faturaAcerto.responsavelId
            const divisaoMembroId = acerto.tipo === 'MEMBRO_PAGA' ? faturaAcerto.responsavelId : acerto.membroId

            const valorTotalCentavos = acerto.valorPagoCentavos

            const novoGastoDto = {
              id: `pix-acerto-${acerto.id}-migrado`,
              faturaId: faturaPixId,
              descricao: acerto.tipo === 'MEMBRO_PAGA' 
                ? `Pix de acerto: ${acerto.membroId}` 
                : `Devolução de acerto: ${acerto.membroId}`,
              valorTotalCentavos,
              compradorId,
              installments: 1,
              totalInstallments: 1,
              isLoan: false,
              borrowerId: null,
              recurringBillId: null,
              isSettlement: true,
              settlementDetails: {
                fromMemberId: compradorId,
                toMemberId: divisaoMembroId,
                method: 'pix'
              },
              method: 'pix',
              cardOwnerId: null,
              grupoParcelasId: null,
              divisoes: [{
                membroId: divisaoMembroId,
                valorCentavos: valorTotalCentavos
              }]
            }

            novosGastosParaSalvar.push(novoGastoDto)
          }
        }
      }

      if (novosGastosParaSalvar.length > 0) {
        await this.request('/financeiro/gastos/batch', {
          method: 'POST',
          body: JSON.stringify(novosGastosParaSalvar)
        })
        console.log(`[MIGRAÇÃO] Criados ${novosGastosParaSalvar.length} gastos de acertos antigos para manter consistência.`);
      }
    } catch (error) {
      console.error('[MIGRAÇÃO] Erro ao migrar acertos antigos:', error)
    }
  }

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
