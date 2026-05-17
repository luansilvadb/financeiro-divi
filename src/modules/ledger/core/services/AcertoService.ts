import { IAcertoMembroRepository } from '../ports/IAcertoMembroRepository'
import { IFaturaRepository } from '../ports/IFaturaRepository'

export class AcertoService {
  constructor(
    private acertoRepo: IAcertoMembroRepository,
    private faturaRepo: IFaturaRepository
  ) {}

  async marcarPago(acertoId: string, dataPagamento: Date = new Date()): Promise<void> {
    const acerto = await this.acertoRepo.buscarPorId(acertoId)
    if (!acerto) throw new Error('Acerto não encontrado')

    acerto.marcarComoPago(dataPagamento)
    await this.acertoRepo.salvar(acerto)

    const acertos = await this.acertoRepo.buscarPorFatura(acerto.faturaId)
    const todosQuitados = acertos.every(a => a.pago)

    if (todosQuitados) {
      const fatura = await this.faturaRepo.buscarPorId(acerto.faturaId)
      if (fatura) {
        fatura.marcarAcertada()
        await this.faturaRepo.salvar(fatura)
      }
    }
  }
}
