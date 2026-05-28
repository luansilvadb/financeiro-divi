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

    // Se for um acerto netting, estornamos a baixa nos AcertoMembro correspondentes das faturas do período anterior
    if (gasto.isSettlement && this.acertoRepo) {
      const fatura = await this.faturaRepo.buscarPorId(gasto.faturaId)
      if (fatura) {
        let anteriorMes = fatura.periodo.mes - 1
        let anteriorAno = fatura.periodo.ano
        if (anteriorMes < 1) {
          anteriorMes = 12
          anteriorAno -= 1
        }

        const todasFaturas = await this.faturaRepo.listarTodas()
        const faturasAnteriores = todasFaturas.filter(
          f => f.periodo.mes === anteriorMes && f.periodo.ano === anteriorAno && (f.status === 'FECHADA' || f.status === 'ACERTADA')
        )

        let estornoRestanteCentavos = gasto.valorTotal.centavos

        for (const fatAnterior of faturasAnteriores) {
          if (estornoRestanteCentavos <= 0) break

          const acertosMembro = await this.acertoRepo.buscarPorFatura(fatAnterior.id)
          const acertoComPagamento = acertosMembro.find(a => a.membroId === gasto.compradorId && a.valorPago.centavos > 0)

          if (acertoComPagamento) {
            const valorEstorno = Math.min(estornoRestanteCentavos, acertoComPagamento.valorPago.centavos)
            acertoComPagamento.valorPago = Dinheiro.deCentavos(acertoComPagamento.valorPago.centavos - valorEstorno)

            if (acertoComPagamento.valorPago.centavos < acertoComPagamento.valorAcerto.centavos) {
              acertoComPagamento.pago = false
              acertoComPagamento.dataPagamento = undefined
            }

            await this.acertoRepo.salvar(acertoComPagamento)
            estornoRestanteCentavos -= valorEstorno

            if (fatAnterior.status === 'ACERTADA') {
              const revertida = fatAnterior.desmarcarAcertada()
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

      const fatura = await this.faturaRepo.buscarPorId(gasto.faturaId)
      if (fatura && typeof fatura.validarOperacaoPermitida === 'function') {
        fatura.validarOperacaoPermitida()
      }
      await this.gastoRepo.excluir(id)
      if (fatura && !gasto.isSettlement) {
        await this.limparNettingDoPeriodo(fatura.periodo.mes, fatura.periodo.ano)
      }
    } else {
      const fatura = await this.faturaRepo.buscarPorId(gasto.faturaId)
      if (fatura && typeof fatura.validarOperacaoPermitida === 'function') {
        fatura.validarOperacaoPermitida()
      }
      await this.gastoRepo.excluir(id)
      if (fatura && !gasto.isSettlement) {
        await this.limparNettingDoPeriodo(fatura.periodo.mes, fatura.periodo.ano)
      }
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
