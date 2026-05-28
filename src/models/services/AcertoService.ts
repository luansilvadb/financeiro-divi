import type { IAcertoMembroRepository } from '../repositories/IAcertoMembroRepository'
import type { IFaturaRepository } from '../repositories/IFaturaRepository'
import type { IGastoRepository } from '../repositories/IGastoRepository'
import { Gasto } from '../entities/Gasto'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'
import { Dinheiro } from '../entities/Dinheiro'
import type { IAcertoService } from './IAcertoService'

export class AcertoService implements IAcertoService {
  constructor(
    private acertoRepo: IAcertoMembroRepository,
    private faturaRepo: IFaturaRepository,
    private gastoRepo?: IGastoRepository
  ) {}

  async registrarReembolsoMembro(acertoId: string, valor: Dinheiro, data: Date = new Date()): Promise<void> {
    const acerto = await this.acertoRepo.buscarPorId(acertoId)
    if (!acerto) throw new Error('Acerto não encontrado')

    acerto.registrarReembolso(valor, data)
    await this.acertoRepo.salvar(acerto)

    // Sincronizar com carryover no período seguinte
    const fatura = await this.faturaRepo.buscarPorId(acerto.faturaId)
    if (fatura) {
      let proxMes = fatura.periodo.mes + 1
      let proxAno = fatura.periodo.ano
      if (proxMes > 12) {
        proxMes = 1
        proxAno += 1
      }

      if (typeof this.faturaRepo.listarTodas === 'function' && this.gastoRepo) {
        const todasFaturas = await this.faturaRepo.listarTodas()
        const faturaPixProx = todasFaturas.find(
          f => f.cartaoId === 'PIX_DEFAULT_ID' && f.periodo.mes === proxMes && f.periodo.ano === proxAno
        )

        if (faturaPixProx) {
          const gastosProx = await this.gastoRepo.buscarPorFatura(faturaPixProx.id)
          const carryovers = gastosProx.filter(g => 
            g.isSettlement && 
            g.descricao.includes('Saldo Inicial Pendente') &&
            g.divisoes.some(d => d.membroId === acerto.membroId)
          )

          for (const carry of carryovers) {
            const divMembro = carry.divisoes.find(d => d.membroId === acerto.membroId)
            if (divMembro) {
              const totalAcerto = acerto.valorAcerto
              const totalPagoAcerto = acerto.valorPago
              const restanteAcerto = Dinheiro.deCentavos(totalAcerto.centavos - totalPagoAcerto.centavos)

              if (restanteAcerto.centavos <= 0) {
                await this.gastoRepo.excluir(carry.id)
              } else {
                const novoGastoCarry = new Gasto({
                  id: carry.id,
                  faturaId: carry.faturaId,
                  descricao: carry.descricao,
                  valorTotal: restanteAcerto,
                  compradorId: carry.compradorId,
                  divisoes: [new DivisaoDeGasto(acerto.membroId, restanteAcerto)],
                  installments: carry.installments,
                  isSettlement: carry.isSettlement,
                  settlementDetails: carry.settlementDetails,
                  method: carry.method,
                  cardOwner: carry.cardOwner,
                  grupoParcelasId: carry.grupoParcelasId
                })
                await this.gastoRepo.salvar(novoGastoCarry)
              }
            }
          }
        }
      }
    }

    const acertos = await this.acertoRepo.buscarPorFatura(acerto.faturaId)
    const todosQuitados = acertos.every(a => a.pago)

    if (todosQuitados) {
      const faturaObj = await this.faturaRepo.buscarPorId(acerto.faturaId)
      if (faturaObj && faturaObj.status === 'FECHADA' && faturaObj.dataPagamentoBanco) {
        const acertada = faturaObj.marcarAcertada()
        await this.faturaRepo.salvar(acertada)
      }
    }
  }

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
