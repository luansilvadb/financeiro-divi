import type { IFaturaRepository } from '../repositories/IFaturaRepository'
import { Fatura } from '../entities/Fatura'
import type { IFaturaService } from './IFaturaService'

export class FaturaService implements IFaturaService {
  constructor(
    private faturaRepo: IFaturaRepository
  ) {}

  async fecharFatura(faturaId: string, responsavelId?: string, dataPagamentoBanco: Date = new Date()): Promise<void> {
    const fatura = await this.faturaRepo.buscarPorId(faturaId)
    await this.faturaRepo.salvar(fatura!.fechar({ responsavelId, dataPagamentoBanco }))
  }

  async reabrirFatura(faturaId: string): Promise<void> {
    const fatura = await this.faturaRepo.buscarPorId(faturaId)
    await this.faturaRepo.salvar(fatura!.reabrir())
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

