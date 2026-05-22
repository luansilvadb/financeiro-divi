import type { IFaturaRepository } from '../repositories/IFaturaRepository'
import type { IAcertoMembroRepository } from '../repositories/IAcertoMembroRepository'
import { Fatura } from '../entities/Fatura'
import type { IFaturaService } from './IFaturaService'

export class FaturaService implements IFaturaService {
  constructor(
    private faturaRepo: IFaturaRepository,
    private acertoRepo: IAcertoMembroRepository
  ) {}

  async fecharFatura(faturaId: string, responsavelId?: string, dataPagamentoBanco?: Date): Promise<void> {
    const fatura = await this.faturaRepo.buscarPorId(faturaId)
    if (!fatura) throw new Error('Fatura não encontrada')

    fatura.fechar({ responsavelId, dataPagamentoBanco })
    await this.faturaRepo.salvar(fatura)
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

    for (const card of cartoes) {
      const temFatura = todasFaturas.some(f => f.cartaoId === card.id && f.status === 'ABERTA')
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
