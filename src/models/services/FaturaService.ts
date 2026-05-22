import type { IFaturaRepository } from '../repositories/IFaturaRepository'
import type { IAcertoMembroRepository } from '../repositories/IAcertoMembroRepository'
import { Fatura } from '../entities/Fatura'
import type { IFaturaService } from './IFaturaService'

import type { IGastoRepository } from '../repositories/IGastoRepository'
import { Dinheiro } from '../entities/Dinheiro'
import { AcertoMembro } from '../entities/AcertoMembro'

export class FaturaService implements IFaturaService {
  constructor(
    private faturaRepo: IFaturaRepository,
    private acertoRepo: IAcertoMembroRepository,
    private gastoRepo: IGastoRepository
  ) {}

  async fecharFatura(faturaId: string, responsavelId?: string, dataPagamentoBanco?: Date): Promise<void> {
    const fatura = await this.faturaRepo.buscarPorId(faturaId)
    if (!fatura) throw new Error('Fatura não encontrada')

    fatura.fechar({ responsavelId, dataPagamentoBanco })
    await this.faturaRepo.salvar(fatura)

    await this.acertoRepo.excluirPorFatura(faturaId)

    const gastos = await this.gastoRepo.buscarPorFatura(faturaId)
    const consumoMembros: Record<string, number> = {}

    for (const g of gastos) {
      if (g.isSettlement) {
        consumoMembros[g.compradorId] = (consumoMembros[g.compradorId] || 0) - g.valorTotal.centavos
        for (const div of g.divisoes) {
          consumoMembros[div.membroId] = (consumoMembros[div.membroId] || 0) + div.valor.centavos
        }
      } else {
        const divisor = g.totalInstallments || g.installments || 1
        const index = divisor - g.installments
        for (const div of g.divisoes) {
          const parcelas = div.valor.distribuir(divisor)
          const valorParcelaCentavos = parcelas[index].centavos
          consumoMembros[div.membroId] = (consumoMembros[div.membroId] || 0) + valorParcelaCentavos
        }
      }
    }

    for (const [membroId, centavos] of Object.entries(consumoMembros)) {
      if (centavos !== 0) {
        const acerto = new AcertoMembro({
          id: crypto.randomUUID(),
          faturaId,
          membroId,
          totalConsumido: Dinheiro.deCentavos(centavos)
        })
        await this.acertoRepo.salvar(acerto)
      }
    }
  }

  async reabrirFatura(faturaId: string): Promise<void> {
    const fatura = await this.faturaRepo.buscarPorId(faturaId)
    if (!fatura) throw new Error('Fatura não encontrada')

    fatura.reabrir()
    await this.faturaRepo.salvar(fatura)
    await this.acertoRepo.excluirPorFatura(faturaId)
  }

  async assegurarFaturasAbertas(
    cartoes: { id: string; responsavelPadraoId: string }[],
    mes: number,
    ano: number
  ): Promise<any[]> {
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
