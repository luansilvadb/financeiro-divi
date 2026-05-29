import type { IGastoRepository } from '../repositories/IGastoRepository'
import type { IFaturaRepository } from '../repositories/IFaturaRepository'
import type { IAcertoMembroRepository } from '../repositories/IAcertoMembroRepository'
import { Dinheiro } from '../entities/Dinheiro'

export interface IEstornoService {
  excluirGasto(id: string): Promise<void>
  limparNettingDoPeriodo(mes: number, ano: number): Promise<void>
}

export class EstornoService implements IEstornoService {
  constructor(
    private gastoRepo: IGastoRepository,
    private faturaRepo: IFaturaRepository,
    private acertoRepo?: IAcertoMembroRepository
  ) {}

  async excluirGasto(id: string): Promise<void> {
    const gasto = await this.gastoRepo.buscarPorId(id)
    if (!gasto) return

    if (!gasto.isSettlement) {
      let faturaIds: string[] = []
      if (gasto.grupoParcelasId) {
        const todos = await this.gastoRepo.listarTodos()
        const grupo = todos.filter(g => g.grupoParcelasId === gasto.grupoParcelasId)
        faturaIds = grupo.map(g => g.faturaId)
      } else {
        faturaIds = [gasto.faturaId]
      }

      const todosGastos = (await this.gastoRepo.listarTodos()) || []
      const temNettingNoPeriodo = todosGastos.some(
        g => faturaIds.includes(g.faturaId) && g.isSettlement
      )

      if (temNettingNoPeriodo) {
        throw new Error(
          'Não é possível excluir gastos comuns neste período pois já existem acertos de contas (Pix) confirmados. Estorne os acertos primeiro.'
        )
      }
    }

    // Se for um acerto netting, estornamos a baixa nos AcertoMembro correspondentes
    if (gasto.isSettlement && this.acertoRepo) {
      let mes: number | undefined
      let ano: number | undefined

      const fatura = await this.faturaRepo.buscarPorId(gasto.faturaId)
      if (fatura) {
        mes = fatura.periodo.mes
        ano = fatura.periodo.ano
      } else {
        // Se a fatura não existe no banco de dados (ex: virtual-pix-5-2026),
        // extraímos o mês e ano correspondentes diretamente de gasto.faturaId
        const match = gasto.faturaId.match(/(?:.*-)?(\d+)-(\d+)$/)
        if (match) {
          mes = parseInt(match[1], 10)
          ano = parseInt(match[2], 10)
        }
      }

      if (mes !== undefined && ano !== undefined) {
        let anteriorMes = mes - 1
        let anteriorAno = ano
        if (anteriorMes < 1) {
          anteriorMes = 12
          anteriorAno -= 1
        }

        const todasFaturas = await this.faturaRepo.listarTodas()
        // Busca faturas fechadas no período anterior E no período atual
        const faturasParaReverter = todasFaturas.filter(
          f => (
            (f.periodo.mes === anteriorMes && f.periodo.ano === anteriorAno) || 
            (f.periodo.mes === mes && f.periodo.ano === ano)
          ) && (f.status === 'FECHADA' || f.status === 'ACERTADA')
        )

        let estornoRestanteCentavos = gasto.valorTotal.centavos

        for (const fatTarget of faturasParaReverter) {
          if (estornoRestanteCentavos <= 0) break

          const acertosMembro = await this.acertoRepo.buscarPorFatura(fatTarget.id)
          // Procura acertos do comprador do Pix ou o membro comum envolvido se for do tipo RESPONSAVEL_PAGA
          const membroIdDoAcerto = gasto.settlementDetails
            ? (gasto.settlementDetails.fromMemberId === fatTarget.responsavelId
                ? gasto.settlementDetails.toMemberId
                : gasto.settlementDetails.fromMemberId)
            : gasto.compradorId

          const acertoComPagamento = acertosMembro.find(a => a.membroId === membroIdDoAcerto && a.valorPago.centavos > 0)

          if (acertoComPagamento) {
            const valorEstorno = Math.min(estornoRestanteCentavos, acertoComPagamento.valorPago.centavos)
            acertoComPagamento.valorPago = Dinheiro.deCentavos(acertoComPagamento.valorPago.centavos - valorEstorno)

            if (acertoComPagamento.valorPago.centavos < acertoComPagamento.valorAcerto.centavos) {
              acertoComPagamento.pago = false
              acertoComPagamento.dataPagamento = undefined
            }

            await this.acertoRepo.salvar(acertoComPagamento)
            estornoRestanteCentavos -= valorEstorno

            if (fatTarget.status === 'ACERTADA') {
              const revertida = fatTarget.desmarcarAcertada()
              await this.faturaRepo.salvar(revertida)
            }
          }
        }
      }
    }

    if (gasto.grupoParcelasId) {
      const todos = (await this.gastoRepo.listarTodos()) || []
      const grupo = todos.filter(g => g.grupoParcelasId === gasto.grupoParcelasId)

      const temSubsequente = grupo.some(g => g.id !== gasto.id && g.installments < gasto.installments)
      if (temSubsequente) {
        throw new Error(
          'Não é possível excluir esta parcela pois existem parcelas subsequentes ativas. Exclua as parcelas futuras deste gasto primeiro.'
        )
      }
    }

    const fatura = await this.faturaRepo.buscarPorId(gasto.faturaId)
    if (fatura && typeof fatura.validarOperacaoPermitida === 'function') {
      fatura.validarOperacaoPermitida()
    }
    await this.gastoRepo.excluir(id)
    if (fatura && !gasto.isSettlement) {
      await this.limparNettingDoPeriodo(fatura.periodo.mes, fatura.periodo.ano)
    }
  }

  async limparNettingDoPeriodo(mes: number, ano: number): Promise<void> {
    const faturas = await this.faturaRepo.listarTodas()
    const faturaPix = faturas.find(
      f => f.cartaoId === 'PIX_DEFAULT_ID' && f.periodo.mes === mes && f.periodo.ano === ano
    )
    if (!faturaPix) return

    const todosGastos = await this.gastoRepo.listarTodos()
    const nettingGastos = todosGastos.filter(
      g => g.faturaId === faturaPix.id && g.isSettlement === true
    )

    if (nettingGastos.length > 0) {
      await this.gastoRepo.excluirMuitos(nettingGastos.map(g => g.id))
    }
  }
}
