import type { IFaturaRepository } from '../repositories/IFaturaRepository'
import type { IAcertoMembroRepository } from '../repositories/IAcertoMembroRepository'
import { Fatura } from '../entities/Fatura'
import type { IFaturaService } from './IFaturaService'

import type { IGastoRepository } from '../repositories/IGastoRepository'
import type { IAntecipacaoFaturaRepository } from '../repositories/IAntecipacaoFaturaRepository'
import { Dinheiro } from '../entities/Dinheiro'
import { AcertoMembro, type TipoAcerto } from '../entities/AcertoMembro'
import { valorParcelaAtual } from '../entities/ParcelaCalculator'

import { Gasto } from '../entities/Gasto'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'

export class FaturaService implements IFaturaService {
  constructor(
    private faturaRepo: IFaturaRepository,
    private acertoRepo: IAcertoMembroRepository,
    private gastoRepo: IGastoRepository,
    private antecipacaoRepo: IAntecipacaoFaturaRepository
  ) {}

  async fecharFatura(faturaId: string, responsavelId?: string, dataPagamentoBanco: Date = new Date()): Promise<void> {
    const fatura = await this.faturaRepo.buscarPorId(faturaId)
    if (!fatura) throw new Error('Fatura não encontrada')

    if (fatura.status !== 'ABERTA') {
      return
    }

    const fechada = fatura.fechar({ responsavelId, dataPagamentoBanco })
    await this.faturaRepo.salvar(fechada)

    const responsavelFinalId = responsavelId || fatura.responsavelId
    const acertosAntigos = await this.limparRegistrosAntigos(faturaId)
    const consumosEAntecipacoes = await this.calcularConsumosEAntecipacoes(faturaId)

    await this.processarAcertosEAuditoria(
      faturaId,
      responsavelFinalId,
      consumosEAntecipacoes,
      acertosAntigos
    )
  }

  private async limparRegistrosAntigos(faturaId: string): Promise<AcertoMembro[]> {
    const acertosAntigos = await this.acertoRepo.buscarPorFatura(faturaId)
    await this.acertoRepo.excluirPorFatura(faturaId)
    
    const todosGastos = await this.gastoRepo.buscarPorFatura(faturaId)
    const gastosAuditoriaAntigos = todosGastos.filter(g => g.id.startsWith('audit-settlement-'))
    for (const g of gastosAuditoriaAntigos) {
      await this.gastoRepo.excluir(g.id)
    }
    
    return acertosAntigos
  }

  private async calcularConsumosEAntecipacoes(faturaId: string): Promise<{ 
    consumoMembros: Record<string, number>, 
    antecipacoesPorMembro: Record<string, number> 
  }> {
    const antecipacoes = await this.antecipacaoRepo.buscarPorFatura(faturaId)
    const antecipacoesPorMembro: Record<string, number> = {}
    for (const ant of antecipacoes) {
      antecipacoesPorMembro[ant.membroId] = (antecipacoesPorMembro[ant.membroId] || 0) + ant.valor.centavos
    }

    const gastos = await this.gastoRepo.buscarPorFatura(faturaId)
    const consumoMembros: Record<string, number> = {}

    for (const g of gastos) {
      if (g.isSettlement) continue

      for (const div of g.divisoes) {
        const valorParcela = valorParcelaAtual(div.valor, g.installments, g.totalInstallments)
        if (valorParcela.centavos > 0) {
          consumoMembros[div.membroId] = (consumoMembros[div.membroId] || 0) + valorParcela.centavos
        }
      }
    }

    return { consumoMembros, antecipacoesPorMembro }
  }

  private async processarAcertosEAuditoria(
    faturaId: string,
    responsavelFinalId: string,
    dados: { consumoMembros: Record<string, number>, antecipacoesPorMembro: Record<string, number> },
    acertosAntigos: AcertoMembro[]
  ): Promise<void> {
    const { consumoMembros, antecipacoesPorMembro } = dados
    const membrosComAcerto = new Set([
      ...Object.keys(consumoMembros),
      ...Object.keys(antecipacoesPorMembro)
    ])

    for (const membroId of membrosComAcerto) {
      if (membroId === responsavelFinalId) continue

      const centavos = consumoMembros[membroId] || 0
      const totalAntecipado = antecipacoesPorMembro[membroId] || 0
      const liquido = centavos - totalAntecipado
      
      if (liquido !== 0) {
        const antigo = acertosAntigos.find(a => a.membroId === membroId)

        const acerto = this.criarAcertoRecalculado({
          antigo,
          faturaId,
          membroId,
          totalConsumidoCentavos: centavos,
          totalAntecipadoCentavos: totalAntecipado,
          liquido
        })
        await this.acertoRepo.salvar(acerto)

        const valorAcerto = Dinheiro.deCentavos(Math.abs(liquido))
        const auditGasto = new Gasto({
          id: `audit-settlement-${acerto.id}`,
          faturaId: faturaId,
          descricao: `Acerto pendente: ${membroId}`,
          valorTotal: valorAcerto,
          compradorId: acerto.tipo === 'MEMBRO_PAGA' ? responsavelFinalId : membroId,
          divisoes: [new DivisaoDeGasto(acerto.tipo === 'MEMBRO_PAGA' ? membroId : responsavelFinalId, valorAcerto)],
          isSettlement: true
        })
        await this.gastoRepo.salvar(auditGasto)
      }
    }
  }

  private criarAcertoRecalculado(params: {
    antigo?: AcertoMembro
    faturaId: string
    membroId: string
    totalConsumidoCentavos: number
    totalAntecipadoCentavos: number
    liquido: number
  }): AcertoMembro {
    const tipoCalculado: TipoAcerto = params.liquido >= 0 ? 'MEMBRO_PAGA' : 'RESPONSAVEL_PAGA'
    const valorAcertoCentavos = Math.abs(params.liquido)

    let valorPago = Dinheiro.deCentavos(0)
    if (params.antigo?.tipo === tipoCalculado) {
      valorPago = Dinheiro.deCentavos(Math.min(params.antigo.valorPago.centavos, valorAcertoCentavos))
    }

    const pago = valorAcertoCentavos > 0 && valorPago.centavos >= valorAcertoCentavos

    return new AcertoMembro({
      id: params.antigo?.id || crypto.randomUUID(),
      faturaId: params.faturaId,
      membroId: params.membroId,
      totalConsumido: Dinheiro.deCentavos(params.totalConsumidoCentavos),
      totalAntecipado: Dinheiro.deCentavos(params.totalAntecipadoCentavos),
      tipo: tipoCalculado,
      valorPago,
      pago,
      dataPagamento: pago ? params.antigo?.dataPagamento : undefined
    })
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

      const faturasProximo = await this.faturaRepo.listarTodas()
      const faturaPixProximo = faturasProximo.find(
        f => f.cartaoId === 'PIX_DEFAULT_ID' && f.periodo.mes === proximoMes && f.periodo.ano === proximoAno
      )

      if (faturaPixProximo) {
        const todosGastos = await this.gastoRepo.listarTodos()
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

    const temFaturaPix = todasFaturas.some(f => f.cartaoId === 'PIX_DEFAULT_ID' && f.periodo.mes === mes && f.periodo.ano === ano)
    if (!temFaturaPix) {
      const novaFaturaPix = new Fatura({
        id: `PIX_DEFAULT_ID-${mes}-${ano}`,
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
          id: `${card.id}-${mes}-${ano}`,
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
