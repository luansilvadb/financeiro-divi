import type { IGastoRepository } from '../repositories/IGastoRepository'
import type { IFaturaRepository } from '../repositories/IFaturaRepository'
import type { ICartaoRepository } from '../repositories/ICartaoRepository'
import type { IAcertoMembroRepository } from '../repositories/IAcertoMembroRepository'
import { Gasto } from '../entities/Gasto'
import { Dinheiro } from '../entities/Dinheiro'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'
import { Fatura } from '../entities/Fatura'
import type { IGastoService } from './IGastoService'

export class GastoService implements IGastoService {
  constructor(
    private gastoRepo: IGastoRepository,
    private faturaRepo: IFaturaRepository,
    private cartaoRepo: ICartaoRepository,
    private acertoRepo?: IAcertoMembroRepository
  ) {}

  async lancarGastoOuEmprestimo(dados: {
    flow: 'expense' | 'loan'
    paymentMethod: 'pix' | 'card'
    compradorId: string
    valor: number
    descricao: string
    divisoes: any[]
    installments: number
    cardOwnerId: string | null
    borrowerId: string | null
    periodo: { mes: number; ano: number }
  }): Promise<void> {
    const { flow, paymentMethod, compradorId, valor, descricao, divisoes, installments, cardOwnerId, borrowerId, periodo } = dados
    const total = Dinheiro.deReais(valor)

    const todosCartoes = await this.cartaoRepo.listarTodos()
    let cartaoReal: any = null
    if (paymentMethod === 'card' && cardOwnerId) {
      cartaoReal = todosCartoes.find(c => c.id === cardOwnerId || c.responsavelPadraoId === cardOwnerId)
    }

    const cartaoId = (paymentMethod === 'card')
      ? (cartaoReal ? cartaoReal.id : (todosCartoes.length > 0 ? todosCartoes[0].id : 'PIX_DEFAULT_ID'))
      : 'PIX_DEFAULT_ID'
    const resolvedCardOwner = cartaoReal ? cartaoReal.responsavelPadraoId : null

    const responsavelFaturaId = cartaoReal ? cartaoReal.responsavelPadraoId : compradorId
    const faturaAtiva = await this.obterOuCriarFatura(cartaoId, periodo.mes, periodo.ano, responsavelFaturaId)
    if (faturaAtiva && typeof faturaAtiva.validarOperacaoPermitida === 'function') {
      faturaAtiva.validarOperacaoPermitida()
    }

    if (paymentMethod === 'card' && installments > 1) {
      await this.projetarGastosParcelados({
        total,
        divisoes,
        faturaAtiva,
        descricao,
        compradorId,
        installments,
        cardOwner: resolvedCardOwner,
        responsavelFaturaId
      })
    } else {
      const novoGasto = new Gasto({
        id: crypto.randomUUID(),
        faturaId: faturaAtiva.id,
        descricao: flow === 'loan' ? (descricao.trim() || 'Empréstimo Pessoal') : descricao,
        valorTotal: total,
        compradorId,
        divisoes,
        installments,
        totalInstallments: installments,
        isLoan: flow === 'loan',
        borrowerId,
        method: paymentMethod,
        cardOwner: resolvedCardOwner,
        grupoParcelasId: null
      })
      await this.gastoRepo.salvar(novoGasto)
    }
  }


  private async obterOuCriarFatura(cartaoId: string, mes: number, ano: number, responsavelId: string): Promise<any> {
    const todasFaturas = await this.faturaRepo.listarTodas()
    let fatura = todasFaturas.find(f => f.cartaoId === cartaoId && f.periodo.mes === mes && f.periodo.ano === ano)
    if (!fatura) {
      fatura = new Fatura({
        id: crypto.randomUUID(),
        cartaoId,
        periodo: { mes, ano },
        responsavelId,
        status: 'ABERTA'
      })
      await this.faturaRepo.salvar(fatura)
    }
    return fatura
  }

  private construirGasto(dados: {
    faturaId: string
    descricao: string
    valorTotal: Dinheiro
    compradorId: string
    divisoes: any[]
    installments: number
    totalInstallments: number
    isLoan: boolean
    borrowerId?: string | null
    method: 'pix' | 'card'
    cardOwner?: string | null
    grupoParcelasId?: string | null
  }): Gasto {
    return new Gasto({
      id: crypto.randomUUID(),
      ...dados
    })
  }

  private async projetarGastosParcelados(dados: {
    total: Dinheiro
    divisoes: any[]
    faturaAtiva: any
    descricao: string
    compradorId: string
    installments: number
    cardOwner: string | null
    responsavelFaturaId: string
  }): Promise<void> {
    const { total, divisoes, faturaAtiva, descricao, compradorId, installments, cardOwner, responsavelFaturaId } = dados
    const grupoParcelasId = crypto.randomUUID()
    const faturasParaSalvar: Fatura[] = []
    const gastosParaSalvar: Gasto[] = []

    const primeiroGasto = this.construirGasto({
      faturaId: faturaAtiva.id,
      descricao,
      valorTotal: total,
      compradorId,
      divisoes,
      installments,
      totalInstallments: installments,
      isLoan: false,
      borrowerId: null,
      method: 'card',
      cardOwner,
      grupoParcelasId
    })
    gastosParaSalvar.push(primeiroGasto)

    let currentMes = faturaAtiva.periodo.mes
    let currentAno = faturaAtiva.periodo.ano

    for (let i = 2; i <= installments; i++) {
      currentMes++
      if (currentMes > 12) {
        currentMes = 1
        currentAno++
      }

      const faturaFutura = await this.obterOuCriarFaturaMemoria(
        faturaAtiva.cartaoId,
        currentMes,
        currentAno,
        responsavelFaturaId,
        faturasParaSalvar
      )

      const gastoFuturo = this.construirGasto({
        faturaId: faturaFutura.id,
        descricao,
        valorTotal: total,
        compradorId,
        divisoes: [...divisoes],
        installments: installments - i + 1,
        totalInstallments: installments,
        isLoan: false,
        borrowerId: null,
        method: 'card',
        cardOwner,
        grupoParcelasId
      })
      gastosParaSalvar.push(gastoFuturo)
    }

    if (faturasParaSalvar.length > 0) {
      await this.faturaRepo.salvarMuitas(faturasParaSalvar)
    }
    await this.gastoRepo.salvarMuitos(gastosParaSalvar)
  }

  private async obterOuCriarFaturaMemoria(
    cartaoId: string,
    mes: number,
    ano: number,
    responsavelId: string,
    acumuladorMemoria: Fatura[]
  ): Promise<Fatura> {
    const todasFaturas = await this.faturaRepo.listarTodas()
    
    // Primeiro procura nas faturas persistidas
    let fatura = todasFaturas.find(f => f.cartaoId === cartaoId && f.periodo.mes === mes && f.periodo.ano === ano)
    if (fatura) return fatura

    // Depois procura no acumulador temporário
    fatura = acumuladorMemoria.find(f => f.cartaoId === cartaoId && f.periodo.mes === mes && f.periodo.ano === ano)
    if (fatura) return fatura

    // Cria nova se não existir em nenhum lugar
    const novaFatura = new Fatura({
      id: crypto.randomUUID(),
      cartaoId,
      periodo: { mes, ano },
      responsavelId,
      status: 'ABERTA'
    })
    acumuladorMemoria.push(novaFatura)
    return novaFatura
  }

  async excluirGasto(id: string): Promise<void> {
    const gasto = await this.gastoRepo.buscarPorId(id)
    if (!gasto) return

    if (gasto.grupoParcelasId) {
      const todos = await this.gastoRepo.listarTodos()
      const grupo = todos.filter(g => g.grupoParcelasId === gasto.grupoParcelasId)
      const idsParaDeletar: string[] = []
      for (const g of grupo) {
        const fatura = await this.faturaRepo.buscarPorId(g.faturaId)
        if (!fatura || fatura.status === 'ABERTA') {
          idsParaDeletar.push(g.id)
        }
      }
      if (idsParaDeletar.length > 0) {
        await this.gastoRepo.excluirMuitos(idsParaDeletar)
      }
    } else {
      const fatura = await this.faturaRepo.buscarPorId(gasto.faturaId)
      if (fatura && typeof fatura.validarOperacaoPermitida === 'function') {
        fatura.validarOperacaoPermitida()
      }
      await this.gastoRepo.excluir(id)
    }
  }

  async registrarAcertoNetting(dados: {
    faturaId: string
    descricao: string
    valor: number
    fromMemberId: string
    toMemberId: string
    method: string
  }): Promise<void> {
    const total = Dinheiro.deReais(dados.valor)
    const acertoGasto = new Gasto({
      id: crypto.randomUUID(),
      faturaId: dados.faturaId,
      descricao: dados.descricao,
      valorTotal: total,
      compradorId: dados.fromMemberId,
      divisoes: [new DivisaoDeGasto(dados.toMemberId, total)],
      isSettlement: true,
      settlementDetails: {
        fromMemberId: dados.fromMemberId,
        toMemberId: dados.toMemberId,
        method: dados.method as 'pix' | 'cash' | 'mutual'
      },
      installments: 1,
      isLoan: false
    })
    await this.gastoRepo.salvar(acertoGasto)

    // Reconciliar acertos devedores pendentes do período anterior
    const faturaAtual = await this.faturaRepo.buscarPorId(dados.faturaId)
    if (faturaAtual && this.acertoRepo) {
      let anteriorMes = faturaAtual.periodo.mes - 1
      let anteriorAno = faturaAtual.periodo.ano
      if (anteriorMes < 1) {
        anteriorMes = 12
        anteriorAno -= 1
      }

      const todasFaturas = await this.faturaRepo.listarTodas()
      const faturasAnterioresFechadas = todasFaturas.filter(
        f => f.periodo.mes === anteriorMes && f.periodo.ano === anteriorAno && f.status === 'FECHADA'
      )

      let nettingRestanteCentavos = total.centavos

      for (const fatAnterior of faturasAnterioresFechadas) {
        if (nettingRestanteCentavos <= 0) break

        const acertosMembro = await this.acertoRepo.buscarPorFatura(fatAnterior.id)
        const acertoPendente = acertosMembro.find(a => a.membroId === dados.fromMemberId && !a.pago)

        if (acertoPendente) {
          const faltaPagarCentavos = acertoPendente.valorAcerto.centavos - acertoPendente.valorPago.centavos
          if (faltaPagarCentavos > 0) {
            const valorAbateCentavos = Math.min(nettingRestanteCentavos, faltaPagarCentavos)
            acertoPendente.registrarReembolso(Dinheiro.deCentavos(valorAbateCentavos), new Date())
            await this.acertoRepo.salvar(acertoPendente)
            nettingRestanteCentavos -= valorAbateCentavos

            // Se todos os acertos da fatura anterior forem pagos, marca ela como ACERTADA
            const acertosAtualizados = await this.acertoRepo.buscarPorFatura(fatAnterior.id)
            const todosQuitados = acertosAtualizados.every(a => a.pago)
            if (todosQuitados && fatAnterior.dataPagamentoBanco) {
              fatAnterior.marcarAcertada()
              await this.faturaRepo.salvar(fatAnterior)
            }
          }
        }
      }
    }
  }

  async lancarGastoContaFixa(dados: {
    faturaId: string
    conta: { id: string; name: string }
    valorTotal: number
    compradorId: string
    participantes: string[]
  }): Promise<void> {
    const total = Dinheiro.deReais(dados.valorTotal)
    const partes = total.distribuir(dados.participantes.length)
    const divisoes = dados.participantes.map((id, idx) => new DivisaoDeGasto(id, partes[idx]))

    const novoGasto = new Gasto({
      id: crypto.randomUUID(),
      faturaId: dados.faturaId,
      descricao: `Talão: ${dados.conta.name}`,
      valorTotal: total,
      compradorId: dados.compradorId,
      divisoes,
      recurringBillId: dados.conta.id,
      installments: 1,
      isLoan: false
    })

    await this.gastoRepo.salvar(novoGasto)
  }

  async atualizarGastoCompleto(
    gastoId: string,
    dados: {
      descricao: string
      valorTotal: Dinheiro
      compradorId: string
      method: 'pix' | 'card'
      cardOwner: string | null
      divisoes: DivisaoDeGasto[]
      installments: number
    }
  ): Promise<void> {
    const original = await this.gastoRepo.buscarPorId(gastoId)
    if (!original) throw new Error('Gasto não encontrado')

    const todosCartoes = (await this.cartaoRepo.listarTodos()) || []
    let cartaoReal: any = null
    if (dados.method === 'card' && dados.cardOwner) {
      cartaoReal = todosCartoes.find(c => c.id === dados.cardOwner || c.responsavelPadraoId === dados.cardOwner)
    }
    const resolvedCardOwner = cartaoReal ? cartaoReal.responsavelPadraoId : null

    // Caso 1: O gasto original é parcelado (pertence a um grupo)
    if (original.grupoParcelasId) {
      const todosGastos = await this.gastoRepo.listarTodos()
      const gastosDoGrupo = todosGastos.filter(g => g.grupoParcelasId === original.grupoParcelasId)

      // Identificar faturas e classificá-las
      const statusFaturas = await Promise.all(
        gastosDoGrupo.map(async g => {
          const fat = await this.faturaRepo.buscarPorId(g.faturaId)
          return { gasto: g, fatura: fat }
        })
      )

      const possuiFechada = statusFaturas.some(sf => sf.fatura && sf.fatura.status !== 'ABERTA')

      if (possuiFechada) {
        const valorMudou = !original.valorTotal.equals(dados.valorTotal)
        const totalInstallmentsMudou = original.totalInstallments !== dados.installments
        const methodMudou = original.method !== dados.method
        const compradorMudou = original.compradorId !== dados.compradorId
        
        let divisoesMudaram = original.divisoes.length !== dados.divisoes.length
        if (!divisoesMudaram) {
          for (const dOriginal of original.divisoes) {
            const dNova = dados.divisoes.find(dn => dn.membroId === dOriginal.membroId)
            if (!dNova || !dNova.valor.equals(dOriginal.valor)) {
              divisoesMudaram = true
              break
            }
          }
        }

        if (valorMudou || totalInstallmentsMudou || methodMudou || compradorMudou || divisoesMudaram) {
          throw new Error('Não é possível alterar o valor, parcelamento, comprador ou divisões de um gasto que possui parcelas em faturas fechadas. Reabra as faturas anteriores para ajustar o rateio histórico.')
        }
      }

      // Se mudou o número total de parcelas ou o método de pagamento
      if (original.totalInstallments !== dados.installments || original.method !== dados.method) {
        if (possuiFechada) {
          throw new Error('Não é possível alterar o parcelamento ou método de pagamento de um gasto que possui parcelas em faturas fechadas')
        }

        // Encontrar a primeira parcela para saber o período inicial
        const primeiraParcela = gastosDoGrupo.reduce((prev, curr) => curr.installments > prev.installments ? curr : prev, gastosDoGrupo[0] || original)
        const faturaOriginal = await this.faturaRepo.buscarPorId(primeiraParcela.faturaId)
        if (faturaOriginal && typeof faturaOriginal.validarOperacaoPermitida === 'function') {
          faturaOriginal.validarOperacaoPermitida()
        }

        // Excluir todos do grupo
        await this.gastoRepo.excluirMuitos(gastosDoGrupo.map(g => g.id))

        // Relançar do período inicial
        const periodoInicial = faturaOriginal ? faturaOriginal.periodo : { mes: 1, ano: 2026 } // Fallback seguro
        await this.lancarGastoOuEmprestimo({
          flow: original.isLoan ? 'loan' : 'expense',
          paymentMethod: dados.method,
          compradorId: dados.compradorId,
          valor: dados.valorTotal.centavos / 100,
          descricao: dados.descricao,
          divisoes: dados.divisoes,
          installments: dados.installments,
          cardOwnerId: dados.cardOwner,
          borrowerId: original.borrowerId,
          periodo: periodoInicial
        })
      } else {
        // Atualizar apenas parcelas em faturas abertas
        const faturasParaSalvar: Fatura[] = []
        const gastosParaSalvar: Gasto[] = []

        for (const sf of statusFaturas) {
          if (sf.fatura && sf.fatura.status !== 'ABERTA') {
            continue // Ignora parcelas passadas fechadas
          }

          const g = sf.gasto
          let novaFaturaId = g.faturaId

          if (sf.fatura) {
            const cartaoId = (dados.method === 'card')
              ? (cartaoReal ? cartaoReal.id : (todosCartoes.length > 0 ? todosCartoes[0].id : 'PIX_DEFAULT_ID'))
              : 'PIX_DEFAULT_ID'
            const responsavelFaturaId = cartaoReal ? cartaoReal.responsavelPadraoId : dados.compradorId
            const novaFatura = await this.obterOuCriarFaturaMemoria(cartaoId, sf.fatura.periodo.mes, sf.fatura.periodo.ano, responsavelFaturaId, faturasParaSalvar)
            if (novaFatura && typeof novaFatura.validarOperacaoPermitida === 'function') {
              novaFatura.validarOperacaoPermitida()
            }
            novaFaturaId = novaFatura.id
          }

          const novoG = new Gasto({
            id: g.id,
            faturaId: novaFaturaId,
            descricao: dados.descricao,
            valorTotal: dados.valorTotal,
            compradorId: dados.compradorId,
            divisoes: dados.divisoes,
            method: dados.method,
            cardOwner: resolvedCardOwner,
            installments: g.installments,
            totalInstallments: g.totalInstallments,
            grupoParcelasId: g.grupoParcelasId,
            isLoan: g.isLoan,
            borrowerId: g.borrowerId,
            recurringBillId: g.recurringBillId,
            isSettlement: g.isSettlement,
            settlementDetails: g.settlementDetails
          })
          gastosParaSalvar.push(novoG)
        }

        if (faturasParaSalvar.length > 0) {
          await this.faturaRepo.salvarMuitas(faturasParaSalvar)
        }
        if (gastosParaSalvar.length > 0) {
          await this.gastoRepo.salvarMuitos(gastosParaSalvar)
        }
      }
    }
    // Caso 2: Gasto original era simples, mas editado para parcelado
    else if (dados.method === 'card' && dados.installments > 1) {
      const faturaOriginal = await this.faturaRepo.buscarPorId(original.faturaId)
      if (faturaOriginal && typeof faturaOriginal.validarOperacaoPermitida === 'function') {
        faturaOriginal.validarOperacaoPermitida()
      }

      // Deleta original
      await this.gastoRepo.excluir(original.id)

      // Relança parcelado
      const periodoInicial = faturaOriginal ? faturaOriginal.periodo : { mes: 1, ano: 2026 } // Fallback seguro
      await this.lancarGastoOuEmprestimo({
        flow: original.isLoan ? 'loan' : 'expense',
        paymentMethod: dados.method,
        compradorId: dados.compradorId,
        valor: dados.valorTotal.centavos / 100,
        descricao: dados.descricao,
        divisoes: dados.divisoes,
        installments: dados.installments,
        cardOwnerId: dados.cardOwner,
        borrowerId: original.borrowerId,
        periodo: periodoInicial
      })
    }
    // Caso 3: Gasto simples para gasto simples
    else {
      const faturaOriginal = await this.faturaRepo.buscarPorId(original.faturaId)
      if (faturaOriginal && typeof faturaOriginal.validarOperacaoPermitida === 'function') {
        faturaOriginal.validarOperacaoPermitida()
      }

      let novaFaturaId = original.faturaId
      if (faturaOriginal) {
        const cartaoId = (dados.method === 'card')
          ? (cartaoReal ? cartaoReal.id : (todosCartoes.length > 0 ? todosCartoes[0].id : 'PIX_DEFAULT_ID'))
          : 'PIX_DEFAULT_ID'
        const responsavelFaturaId = cartaoReal ? cartaoReal.responsavelPadraoId : dados.compradorId
        const novaFatura = await this.obterOuCriarFatura(cartaoId, faturaOriginal.periodo.mes, faturaOriginal.periodo.ano, responsavelFaturaId)
        if (novaFatura && typeof novaFatura.validarOperacaoPermitida === 'function') {
          novaFatura.validarOperacaoPermitida()
        }
        novaFaturaId = novaFatura.id
      }

      const novoGasto = new Gasto({
        id: original.id,
        faturaId: novaFaturaId,
        descricao: dados.descricao,
        valorTotal: dados.valorTotal,
        compradorId: dados.compradorId,
        divisoes: dados.divisoes,
        method: dados.method,
        cardOwner: resolvedCardOwner,
        installments: dados.installments,
        totalInstallments: dados.installments,
        isLoan: original.isLoan,
        borrowerId: original.borrowerId,
        recurringBillId: original.recurringBillId,
        isSettlement: original.isSettlement,
        settlementDetails: original.settlementDetails
      })

      await this.gastoRepo.salvar(novoGasto)
    }
  }

  async removerAssociacaoContaFixa(contaFixaId: string): Promise<void> {
    const todos = await this.gastoRepo.listarTodos()
    const gastosAssociados = todos.filter(g => g.recurringBillId === contaFixaId)
    for (const g of gastosAssociados) {
      const novoGasto = new Gasto({
        id: g.id,
        faturaId: g.faturaId,
        descricao: g.descricao,
        valorTotal: g.valorTotal,
        compradorId: g.compradorId,
        divisoes: g.divisoes,
        installments: g.installments,
        totalInstallments: g.totalInstallments,
        isLoan: g.isLoan,
        borrowerId: g.borrowerId,
        recurringBillId: null,
        isSettlement: g.isSettlement,
        settlementDetails: g.settlementDetails,
        method: g.method,
        cardOwner: g.cardOwner,
        grupoParcelasId: g.grupoParcelasId
      })
      await this.gastoRepo.salvar(novoGasto)
    }
  }
}
