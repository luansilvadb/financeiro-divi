import type { IFaturaRepository } from '../repositories/IFaturaRepository'
import type { IGastoRepository } from '../repositories/IGastoRepository'
import type { IAcertoMembroRepository } from '../repositories/IAcertoMembroRepository'
import { AcertoMembro } from '../entities/AcertoMembro'
import { Dinheiro } from '../entities/Dinheiro'
import { Fatura } from '../entities/Fatura'
import type { IFaturaService } from './IFaturaService'

export class FaturaService implements IFaturaService {
  constructor(
    private faturaRepo: IFaturaRepository,
    private gastoRepo: IGastoRepository,
    private acertoRepo: IAcertoMembroRepository
  ) {}

  async fecharFatura(faturaId: string, responsavelId?: string, dataPagamentoBanco?: Date): Promise<void> {
    const fatura = await this.faturaRepo.buscarPorId(faturaId)
    if (!fatura) throw new Error('Fatura não encontrada')

    fatura.fechar({ responsavelId, dataPagamentoBanco })
    await this.faturaRepo.salvar(fatura)
  }

  async confirmarAcertos(faturaId: string): Promise<void> {
    const fatura = await this.faturaRepo.buscarPorId(faturaId)
    if (!fatura) throw new Error('Fatura não encontrada')
    if (fatura.status !== 'FECHADA') {
      throw new Error('Apenas faturas FECHADAS podem ter acertos confirmados')
    }

    const gastos = await this.gastoRepo.buscarPorFatura(faturaId)

    const consumoMap = new Map<string, number>()
    gastos.forEach(g => {
      g.divisoes.forEach(d => {
        consumoMap.set(d.membroId, (consumoMap.get(d.membroId) || 0) + (d.valor.centavos / g.installments))
      })
    })

    const membrosIds = new Set([...consumoMap.keys()])
    membrosIds.delete(fatura.responsavelId) // Dono não gera acertos para si

    await this.acertoRepo.excluirPorFatura(faturaId)

    for (const membroId of membrosIds) {
      const consumo = Dinheiro.deCentavos(consumoMap.get(membroId) || 0)

      const acerto = new AcertoMembro({
        id: crypto.randomUUID(),
        faturaId: fatura.id,
        membroId,
        totalConsumido: consumo
      })

      await this.acertoRepo.salvar(acerto)
    }
  }

  async reabrirFatura(faturaId: string): Promise<void> {
    const fatura = await this.faturaRepo.buscarPorId(faturaId)
    if (!fatura) throw new Error('Fatura não encontrada')

    fatura.reabrir()
    await this.faturaRepo.salvar(fatura)
    await this.acertoRepo.excluirPorFatura(faturaId)
  }

  async registrarPagamentoBanco(faturaId: string, data: Date): Promise<void> {
    const fatura = await this.faturaRepo.buscarPorId(faturaId)
    if (!fatura) throw new Error('Fatura não encontrada')
    fatura.marcarComoPagaAoBanco(data)
    await this.faturaRepo.salvar(fatura)

    // Se todos os acertos já estiverem pagos, transiciona para ACERTADA
    const acertos = await this.acertoRepo.buscarPorFatura(faturaId)
    const todosQuitados = acertos.length > 0 && acertos.every(a => a.pago)
    if (todosQuitados && fatura.status === 'FECHADA') {
      fatura.marcarAcertada()
      await this.faturaRepo.salvar(fatura)
    }
  }

  async removerPagamentoBanco(faturaId: string): Promise<void> {
    const fatura = await this.faturaRepo.buscarPorId(faturaId)
    if (!fatura) throw new Error('Fatura não encontrada')
    fatura.desmarcarComoPagaAoBanco()
    await this.faturaRepo.salvar(fatura)
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
