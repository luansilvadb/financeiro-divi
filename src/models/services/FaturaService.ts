import type { IFaturaRepository } from '../repositories/IFaturaRepository'
import type { IAcertoMembroRepository } from '../repositories/IAcertoMembroRepository'
import { Fatura } from '../entities/Fatura'
import type { IFaturaService } from './IFaturaService'

import type { IGastoRepository } from '../repositories/IGastoRepository'
import type { IAntecipacaoFaturaRepository } from '../repositories/IAntecipacaoFaturaRepository'
import { Dinheiro } from '../entities/Dinheiro'
import { AcertoMembro } from '../entities/AcertoMembro'
import { valorParcelaAtual } from '../entities/ParcelaCalculator'

export class FaturaService implements IFaturaService {
  constructor(
    private faturaRepo: IFaturaRepository,
    private acertoRepo: IAcertoMembroRepository,
    private gastoRepo: IGastoRepository,
    private antecipacaoRepo?: IAntecipacaoFaturaRepository
  ) {}

  async fecharFatura(faturaId: string, responsavelId?: string, dataPagamentoBanco?: Date): Promise<void> {
    const fatura = await this.faturaRepo.buscarPorId(faturaId)
    if (!fatura) throw new Error('Fatura não encontrada')

    if (fatura.status !== 'ABERTA') {
      return
    }

    const fechada = fatura.fechar({ responsavelId, dataPagamentoBanco })
    await this.faturaRepo.salvar(fechada)

    // Buscar acertos antigos antes de excluir para preservar dados de pagamento
    const acertosAntigos = await this.acertoRepo.buscarPorFatura(faturaId)
    await this.acertoRepo.excluirPorFatura(faturaId)

    const gastos = await this.gastoRepo.buscarPorFatura(faturaId)
    const responsavelFinalId = responsavelId || fatura.responsavelId
    const antecipacoes = this.antecipacaoRepo ? await this.antecipacaoRepo.buscarPorFatura(faturaId) : []
    const antecipacoesPorMembro: Record<string, number> = {}
    for (const ant of antecipacoes) {
      antecipacoesPorMembro[ant.membroId] = (antecipacoesPorMembro[ant.membroId] || 0) + ant.valor.centavos
    }

    const consumoMembros: Record<string, number> = {}

    for (const g of gastos) {
      if (g.isSettlement) {
        consumoMembros[g.compradorId] = (consumoMembros[g.compradorId] || 0) - g.valorTotal.centavos
        for (const div of g.divisoes) {
          consumoMembros[div.membroId] = (consumoMembros[div.membroId] || 0) + div.valor.centavos
        }
      } else {
        for (const div of g.divisoes) {
          const valorParcela = valorParcelaAtual(div.valor, g.installments, g.totalInstallments)
          if (valorParcela.centavos > 0) {
            consumoMembros[div.membroId] = (consumoMembros[div.membroId] || 0) + valorParcela.centavos
          }
        }
      }
    }

    const membrosComAcerto = new Set([
      ...Object.keys(consumoMembros),
      ...Object.keys(antecipacoesPorMembro)
    ])

    for (const membroId of membrosComAcerto) {
      if (membroId === responsavelFinalId) {
        continue
      }

      const centavos = consumoMembros[membroId] || 0
      const totalAntecipado = antecipacoesPorMembro[membroId] || 0
      const liquido = centavos - totalAntecipado
      if (liquido !== 0) {
        // Localizar se já existia um acerto pago/reembolsado para esse membro
        const antigo = acertosAntigos.find(a => a.membroId === membroId)

        const acerto = new AcertoMembro({
          id: antigo?.id || crypto.randomUUID(),
          faturaId,
          membroId,
          totalConsumido: Dinheiro.deCentavos(centavos),
          totalAntecipado: Dinheiro.deCentavos(totalAntecipado),
          valorPago: antigo?.valorPago,
          pago: antigo?.pago,
          dataPagamento: antigo?.dataPagamento
        })
        await this.acertoRepo.salvar(acerto)
      }
    }
  }

  async reabrirFatura(faturaId: string): Promise<void> {
    const fatura = await this.faturaRepo.buscarPorId(faturaId)
    if (!fatura) throw new Error('Fatura não encontrada')

    if (fatura.status === 'ABERTA') {
      return
    }

    if (fatura.status === 'ACERTADA') {
      let proximoMes = fatura.periodo.mes + 1
      let proximoAno = fatura.periodo.ano
      if (proximoMes > 12) {
        proximoMes = 1
        proximoAno += 1
      }

      const faturasProximo = (await this.faturaRepo.listarTodas()) || []
      const faturaPixProximo = faturasProximo.find(
        f => f.cartaoId === 'PIX_DEFAULT_ID' && f.periodo.mes === proximoMes && f.periodo.ano === proximoAno
      )

      if (faturaPixProximo) {
        const todosGastos = (await this.gastoRepo.listarTodos()) || []
        const temNettingNoProximoPeriodo = todosGastos.some(
          g => g.faturaId === faturaPixProximo.id && g.isSettlement === true
        )

        if (temNettingNoProximoPeriodo) {
          throw new Error(
            'Não é possível reabrir esta fatura pois já existem acertos de contas (Pix) confirmados no período seguinte. Estorne os acertos primeiro.'
          )
        }
      }
    }

    const reaberta = fatura.reabrir()
    await this.faturaRepo.salvar(reaberta)
    await this.acertoRepo.excluirPorFatura(faturaId)
  }

  async assegurarFaturasAbertas(
    cartoes: { id: string; responsavelPadraoId: string }[],
    mes: number,
    ano: number
  ): Promise<Fatura[]> {
    const todasFaturas = await this.faturaRepo.listarTodas()
    const faturasAtualizadas = [...todasFaturas]

    // Garantir fatura de Pix default
    const temFaturaPix = todasFaturas.some(f => f.cartaoId === 'PIX_DEFAULT_ID' && f.periodo.mes === mes && f.periodo.ano === ano)
    if (!temFaturaPix) {
      const novaFaturaPix = new Fatura({
        id: crypto.randomUUID(),
        cartaoId: 'PIX_DEFAULT_ID',
        periodo: { mes, ano },
        responsavelId: 'PIX_SYSTEM_OWNER',
        status: 'ABERTA'
      })
      await this.faturaRepo.salvar(novaFaturaPix)
      faturasAtualizadas.push(novaFaturaPix)
    }

    for (const card of cartoes) {
      const temFatura = todasFaturas.some(f => f.cartaoId === card.id && f.periodo.mes === mes && f.periodo.ano === ano)
      if (!temFatura) {
        const novaFatura = new Fatura({
          id: crypto.randomUUID(),
          cartaoId: card.id,
          periodo: { mes, ano },
          responsavelId: card.responsavelPadraoId,
          status: 'ABERTA'
        })
        await this.faturaRepo.salvar(novaFatura)
        faturasAtualizadas.push(novaFatura)
      }
    }
    return faturasAtualizadas
  }
}
