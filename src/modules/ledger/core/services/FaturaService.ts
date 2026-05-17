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

  async fecharFatura(faturaId: string, dataPagamentoBanco: Date): Promise<void> {
    const fatura = await this.faturaRepo.buscarPorId(faturaId)
    if (!fatura) throw new Error('Fatura não encontrada')

    const gastos = await this.gastoRepo.buscarPorFatura(faturaId)
    const antecipacoes = await this.antecipacaoRepo.buscarPorFatura(faturaId)

    const consumoMap = new Map<string, number>()
    gastos.forEach(g => {
      g.divisoes.forEach(d => {
        consumoMap.set(d.membroId, (consumoMap.get(d.membroId) || 0) + d.valor.centavos)
      })
    })

    const antMap = new Map<string, number>()
    antecipacoes.forEach(a => {
      antMap.set(a.membroId, (antMap.get(a.membroId) || 0) + a.valor.centavos)
    })

    const membrosIds = new Set([...consumoMap.keys(), ...antMap.keys()])
    membrosIds.delete(fatura.responsavelId) // Regra 1: Excluir responsavel

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

    fatura.fechar(dataPagamentoBanco)
    await this.faturaRepo.salvar(fatura)
  }
}
