import type { IAcertoMembroRepository } from '../ports/IAcertoMembroRepository'
import type { IFaturaRepository } from '../ports/IFaturaRepository'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

export class AcertoService {
  constructor(
    private acertoRepo: IAcertoMembroRepository,
    private faturaRepo: IFaturaRepository
  ) {}

  async registrarReembolsoMembro(acertoId: string, valor: Dinheiro, data: Date = new Date()): Promise<void> {
    const acerto = await this.acertoRepo.buscarPorId(acertoId)
    if (!acerto) throw new Error('Acerto não encontrado')

    acerto.registrarReembolso(valor, data)
    await this.acertoRepo.salvar(acerto)

    const acertos = await this.acertoRepo.buscarPorFatura(acerto.faturaId)
    const todosQuitados = acertos.every(a => a.pago)

    if (todosQuitados) {
      const fatura = await this.faturaRepo.buscarPorId(acerto.faturaId)
      if (fatura && fatura.status === 'FECHADA' && fatura.dataPagamentoBanco) {
        fatura.marcarAcertada()
        await this.faturaRepo.salvar(fatura)
      }
    }
  }

  // Retrocompatibilidade
  async marcarPago(acertoId: string, dataPagamento: Date = new Date()): Promise<void> {
    const acerto = await this.acertoRepo.buscarPorId(acertoId)
    if (!acerto) throw new Error('Acerto não encontrado')

    const faltaPagar = Dinheiro.deCentavos(acerto.valorAcerto.centavos - acerto.valorPago.centavos)
    if (faltaPagar.centavos > 0) {
      await this.registrarReembolsoMembro(acertoId, faltaPagar, dataPagamento)
    } else {
      acerto.pago = true
      acerto.dataPagamento = dataPagamento
      await this.acertoRepo.salvar(acerto)
    }
  }
}
