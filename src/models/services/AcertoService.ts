import type { IAcertoMembroRepository } from '../repositories/IAcertoMembroRepository'
import type { IFaturaRepository } from '../repositories/IFaturaRepository'
import type { IGastoRepository } from '../repositories/IGastoRepository'
import { Gasto } from '../entities/Gasto'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'
import { Dinheiro } from '../entities/Dinheiro'
import type { IAcertoService } from './IAcertoService'
import type { Fatura } from '../entities/Fatura'
import type { AcertoMembro } from '../entities/AcertoMembro'

export class AcertoService implements IAcertoService {
  constructor(
    private acertoRepo: IAcertoMembroRepository,
    private faturaRepo: IFaturaRepository,
    private gastoRepo: IGastoRepository
  ) {}

  async registrarReembolsoMembro(acertoId: string, valor: Dinheiro, data: Date = new Date()): Promise<void> {
    const acerto = await this.buscarEAtualizarAcerto(acertoId, valor, data)
    const fatura = await this.faturaRepo.buscarPorId(acerto.faturaId)
    if (!fatura) throw new Error('Fatura não encontrada')
    
    await this.gerarGastoPixDeAcerto(acerto, fatura, valor)
    await this.sincronizarCarryover(acerto, fatura)

    await this.verificarEQuitarFatura(acerto.faturaId)
  }

  private async buscarEAtualizarAcerto(acertoId: string, valor: Dinheiro, data: Date): Promise<AcertoMembro> {
    const acerto = await this.acertoRepo.buscarPorId(acertoId)
    if (!acerto) throw new Error('Acerto não encontrado')
    acerto.registrarReembolso(valor, data)
    await this.acertoRepo.salvar(acerto)
    return acerto
  }

  private async gerarGastoPixDeAcerto(acerto: AcertoMembro, fatura: Fatura, valor: Dinheiro): Promise<void> {
    let faturaPixId = `PIX_DEFAULT_ID-${fatura.periodo.mes}-${fatura.periodo.ano}`
    const todasFaturas = await this.faturaRepo.listarTodas()
    const faturaPix = todasFaturas.find(
      f => f.cartaoId === 'PIX_DEFAULT_ID' && f.periodo.mes === fatura.periodo.mes && f.periodo.ano === fatura.periodo.ano
    )
    if (faturaPix) {
      faturaPixId = faturaPix.id
    }

    const compradorId = acerto.tipo === 'MEMBRO_PAGA' ? acerto.membroId : fatura.responsavelId
    const divisaoMembroId = acerto.tipo === 'MEMBRO_PAGA' ? fatura.responsavelId : acerto.membroId

    const novoGastoPix = new Gasto({
      id: `pix-acerto-${acerto.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      faturaId: faturaPixId,
      descricao: acerto.tipo === 'MEMBRO_PAGA' 
        ? `Pix de acerto: ${acerto.membroId}` 
        : `Devolução de acerto: ${acerto.membroId}`,
      valorTotal: valor,
      compradorId,
      divisoes: [new DivisaoDeGasto(divisaoMembroId, valor)],
      isSettlement: true,
      settlementDetails: {
        fromMemberId: compradorId,
        toMemberId: divisaoMembroId,
        method: 'pix'
      },
      method: 'pix'
    })
    
    await this.gastoRepo.salvar(novoGastoPix)
  }

  private async sincronizarCarryover(acerto: AcertoMembro, fatura: Fatura): Promise<void> {

    let proxMes = fatura.periodo.mes + 1
    let proxAno = fatura.periodo.ano
    if (proxMes > 12) {
      proxMes = 1
      proxAno += 1
    }

    const todasFaturas = await this.faturaRepo.listarTodas()
    const faturaPixProx = todasFaturas.find(
      f => f.cartaoId === 'PIX_DEFAULT_ID' && f.periodo.mes === proxMes && f.periodo.ano === proxAno
    )
    if (!faturaPixProx) return

    const gastosProx = await this.gastoRepo.buscarPorFatura(faturaPixProx.id)
    const carryovers = gastosProx.filter(g => 
      g.isSettlement && 
      g.descricao.includes('Saldo Inicial Pendente') &&
      g.divisoes.some(d => d.membroId === acerto.membroId)
    )

    for (const carry of carryovers) {
      const divMembro = carry.divisoes.find(d => d.membroId === acerto.membroId)
      if (!divMembro) continue

      const restanteAcerto = Dinheiro.deCentavos(acerto.valorAcerto.centavos - acerto.valorPago.centavos)

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

  private async verificarEQuitarFatura(faturaId: string): Promise<void> {
    const acertos = await this.acertoRepo.buscarPorFatura(faturaId)
    const todosQuitados = acertos.every(a => a.pago)
    if (!todosQuitados) return

    const faturaObj = await this.faturaRepo.buscarPorId(faturaId)
    if (faturaObj && faturaObj.status === 'FECHADA' && faturaObj.dataPagamentoBanco) {
      const acertada = faturaObj.marcarAcertada()
      await this.faturaRepo.salvar(acertada)
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
      await this.verificarEQuitarFatura(acerto.faturaId)
    }
  }
}
