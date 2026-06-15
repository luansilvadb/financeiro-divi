import type { IFaturaRepository } from '../repositories/IFaturaRepository'
import { Fatura } from '../entities/Fatura'
export class FaturaService {
  constructor(
    private faturaRepo: IFaturaRepository
  ) {}

  async fecharFatura(faturaId: string, responsavelId?: string, dataPagamentoBanco: Date = new Date()): Promise<void> {
    let fatura = await this.faturaRepo.buscarPorId(faturaId)
    if (!fatura) {
      const partes = faturaId.split('-')
      if (partes.length >= 3) {
        const ano = parseInt(partes.pop()!, 10)
        const mes = parseInt(partes.pop()!, 10)
        const cartaoId = partes.join('-')
        fatura = new Fatura({
          id: faturaId,
          cartaoId,
          periodo: { mes, ano },
          responsavelId: responsavelId || 'virtual-member',
          status: 'ABERTA'
        })
      } else {
        fatura = new Fatura({
          id: faturaId,
          cartaoId: 'UNKNOWN',
          periodo: { mes: new Date().getMonth() + 1, ano: new Date().getFullYear() },
          responsavelId: responsavelId || 'virtual-member',
          status: 'ABERTA'
        })
      }
    }
    await this.faturaRepo.salvar(fatura.fechar({ responsavelId, dataPagamentoBanco }))
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
    const novasFaturas: Fatura[] = []


    for (const card of cartoes) {
      const temFatura = todasFaturas.some(f => f.cartaoId === card.id && f.periodo.mes === mes && f.periodo.ano === ano)
      if (!temFatura) {
        novasFaturas.push(new Fatura({
          id: `${card.id}-${mes}-${ano}`,
          cartaoId: card.id,
          periodo: { mes, ano },
          responsavelId: card.responsavelPadraoId,
          status: 'ABERTA'
        }))
      }
    }

    if (novasFaturas.length > 0) {
      await this.faturaRepo.salvarMuitas(novasFaturas)
    }

    return [...todasFaturas, ...novasFaturas]
  }
}

