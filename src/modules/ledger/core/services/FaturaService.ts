import type { IFaturaRepository } from '../ports/IFaturaRepository'
import type { IGastoRepository } from '../ports/IGastoRepository'
import type { IAntecipacaoRepository } from '../ports/IAntecipacaoRepository'
import type { IAcertoMembroRepository } from '../ports/IAcertoMembroRepository'
import { AcertoMembro } from '../domain/AcertoMembro'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

export class FaturaService {
  constructor(
    private faturaRepo: IFaturaRepository,
    private gastoRepo: IGastoRepository,
    private antecipacaoRepo: IAntecipacaoRepository,
    private acertoRepo: IAcertoMembroRepository
  ) {}

  async fecharFatura(faturaId: string, responsavelId?: string, dataPagamentoBanco?: Date): Promise<void> {
    const fatura = await this.faturaRepo.buscarPorId(faturaId)
    if (!fatura) throw new Error('Fatura não encontrada')

    fatura.fechar(responsavelId, dataPagamentoBanco)
    await this.faturaRepo.salvar(fatura)
  }

  async confirmarAcertos(faturaId: string): Promise<void> {
    const fatura = await this.faturaRepo.buscarPorId(faturaId)
    if (!fatura) throw new Error('Fatura não encontrada')
    if (fatura.status !== 'FECHADA') {
      throw new Error('Apenas faturas FECHADAS podem ter acertos confirmados')
    }

    const gastos = await this.gastoRepo.buscarPorFatura(faturaId)
    const antecipacoes = await this.antecipacaoRepo.buscarPorFatura(faturaId)

    const consumoMap = new Map<string, number>()
    gastos.forEach(g => {
      g.divisoes.forEach(d => {
        consumoMap.set(d.membroId, (consumoMap.get(d.membroId) || 0) + (d.valor.centavos / g.installments))
      })
    })

    const antMap = new Map<string, number>()
    antecipacoes.forEach(a => {
      antMap.set(a.membroId, (antMap.get(a.membroId) || 0) + a.valor.centavos)
    })

    const membrosIds = new Set([...consumoMap.keys(), ...antMap.keys()])
    membrosIds.delete(fatura.responsavelId) // Dono não gera acertos para si

    await this.acertoRepo.excluirPorFatura(faturaId)

    for (const membroId of membrosIds) {
      const consumo = Dinheiro.deCentavos(consumoMap.get(membroId) || 0)
      const antecipado = Dinheiro.deCentavos(antMap.get(membroId) || 0)

      const acerto = new AcertoMembro({
        id: crypto.randomUUID(),
        faturaId: fatura.id,
        membroId,
        totalConsumido: consumo,
        totalAntecipado: antecipado
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
}
