import { ref, computed } from 'vue'
import type { IFaturaService } from '../models/services/IFaturaService'
import type { IAcertoService } from '../models/services/IAcertoService'
import type { IGastoService } from '../models/services/IGastoService'
import { Cartao } from '../models/entities/Cartao'
import { Fatura } from '../models/entities/Fatura'
import { AcertoMembro } from '../models/entities/AcertoMembro'
import { Gasto } from '../models/entities/Gasto'
import { DivisaoDeGasto } from '../models/entities/DivisaoDeGasto'
import { Dinheiro } from '../models/entities/Dinheiro'
import type { ICartaoRepository } from '../models/repositories/ICartaoRepository'
import type { IFaturaRepository } from '../models/repositories/IFaturaRepository'
import type { IGastoRepository } from '../models/repositories/IGastoRepository'
import type { IAcertoMembroRepository } from '../models/repositories/IAcertoMembroRepository'
import {
  cartaoRepository,
  faturaRepository,
  gastoRepository,
  acertoMembroRepository,
  faturaService,
  acertoService,
  gastoService
} from '../shared/container'

export interface CartoesEFaturasState {
  cartoes: Cartao[]
  faturas: Fatura[]
  acertos: AcertoMembro[]
  gastos: Gasto[]
  inicializado: boolean
  estaCarregando: boolean
  erroInicializacao: string | null
}

const state = ref<CartoesEFaturasState>({
  cartoes: [],
  faturas: [],
  acertos: [],
  gastos: [],
  inicializado: false,
  estaCarregando: false,
  erroInicializacao: null
})

let promiseInicializacao: Promise<void> | null = null

export interface CartoesEFaturasDependencies {
  cartaoRepository?: ICartaoRepository
  faturaRepository?: IFaturaRepository
  gastoRepository?: IGastoRepository
  acertoMembroRepository?: IAcertoMembroRepository
  faturaService?: IFaturaService
  acertoService?: IAcertoService
  gastoService?: IGastoService
}

export function useCartoesEFaturas(dependencies: CartoesEFaturasDependencies = {}) {
  const localCartaoRepo = dependencies.cartaoRepository || cartaoRepository
  const localFaturaRepo = dependencies.faturaRepository || faturaRepository
  const localGastoRepo = dependencies.gastoRepository || gastoRepository
  const localAcertoRepo = dependencies.acertoMembroRepository || acertoMembroRepository

  const localFaturaService = dependencies.faturaService || faturaService
  const localAcertoService = dependencies.acertoService || acertoService
  const localGastoService = dependencies.gastoService || gastoService

  const inicializar = async () => {
    if (promiseInicializacao) return promiseInicializacao
    
    state.value.estaCarregando = true
    state.value.erroInicializacao = null

    const carregar = async () => {
      try {
        if (typeof localFaturaRepo.executarMigracoesEDesduplicacao === 'function') {
          await localFaturaRepo.executarMigracoesEDesduplicacao()
        }

        const todosCartoes = await localCartaoRepo.listarTodos()
        state.value.cartoes = todosCartoes

        const hoje = new Date()
        const mesAtual = hoje.getMonth() + 1
        const anoAtual = hoje.getFullYear()

        const todasFaturas = await localFaturaService.assegurarFaturasAbertas(todosCartoes, mesAtual, anoAtual)
        state.value.faturas = todasFaturas

        const todosAcertos = await localAcertoRepo.listarTodos()
        const todosGastos = await localGastoRepo.listarTodos()
        state.value.acertos = todosAcertos
        state.value.gastos = todosGastos
        state.value.inicializado = true
      } catch (err: any) {
        state.value.erroInicializacao = err?.message || 'Falha de leitura'
        throw err
      } finally {
        state.value.estaCarregando = false
      }
    }

    promiseInicializacao = carregar()
    try {
      await promiseInicializacao
    } finally {
      promiseInicializacao = null
    }
  }

  const adicionarCartao = async (nome: string, diaFechamento: number, responsavelPadraoId: string) => {
    const novo = new Cartao({
      id: crypto.randomUUID(),
      nome,
      diaFechamento,
      responsavelPadraoId
    })
    await localCartaoRepo.salvar(novo)
    await inicializar()
  }

  const salvarCartaoManual = async (cartao: Cartao) => {
    await localCartaoRepo.salvar(cartao)
    await inicializar()
  }

  const excluirCartaoManual = async (id: string) => {
    await localCartaoRepo.excluir(id)
    await inicializar()
  }

  const fecharFaturaManual = async (faturaId: string, responsavelId?: string) => {
    await localFaturaService.fecharFatura(faturaId, responsavelId, new Date())
    await inicializar()
  }

  const reabrirFaturaManual = async (faturaId: string) => {
    await localFaturaService.reabrirFatura(faturaId)
    await inicializar()
  }

  const quitarAcertoMembro = async (acertoId: string) => {
    await localAcertoService.marcarPago(acertoId, new Date())
    await inicializar()
  }

  const registrarReembolsoParcialManual = async (acertoId: string, valor: Dinheiro) => {
    await localAcertoService.registrarReembolsoMembro(acertoId, valor, new Date())
    await inicializar()
  }

  const atualizarGastoCompletoManual = async (
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
  ) => {
    await localGastoService.atualizarGastoCompleto(gastoId, dados)
    await inicializar()
  }

  const cartoes = computed({
    get: () => state.value.cartoes,
    set: (val) => { state.value.cartoes = val }
  })
  const faturas = computed({
    get: () => state.value.faturas,
    set: (val) => { state.value.faturas = val }
  })
  const acertos = computed({
    get: () => state.value.acertos,
    set: (val) => { state.value.acertos = val }
  })
  const gastos = computed({
    get: () => state.value.gastos,
    set: (val) => { state.value.gastos = val }
  })
  const faturasAbertas = computed(() => state.value.faturas.filter(f => f.status === 'ABERTA'))
  const faturasFechadas = computed(() => state.value.faturas.filter(f => f.status === 'FECHADA' || f.status === 'ACERTADA'))

  const calcularConsumoMembro = (faturaId: string, membroId: string) => {
    const gastosDaFatura = state.value.gastos.filter(g => g.faturaId === faturaId)
    let total = 0
    gastosDaFatura.forEach(g => {
      const divisor = g.totalInstallments || g.installments || 1
      const index = Math.max(0, divisor - g.installments)
      g.divisoes.forEach(d => {
        if (d.membroId === membroId) {
          const parcelas = d.valor.distribuir(divisor)
          if (index < parcelas.length) {
            total += parcelas[index].centavos
          }
        }
      })
    })
    return total
  }

  const resetar = () => {
    state.value = {
      cartoes: [],
      faturas: [],
      acertos: [],
      gastos: [],
      inicializado: false,
      estaCarregando: false,
      erroInicializacao: null
    }
    promiseInicializacao = null
  }

  return {
    cartoes,
    faturas,
    acertos,
    gastos,
    estaCarregando: computed(() => state.value.estaCarregando),
    erroInicializacao: computed(() => state.value.erroInicializacao),
    inicializar,
    adicionarCartao,
    salvarCartaoManual,
    excluirCartaoManual,
    fecharFaturaManual,
    reabrirFaturaManual,
    quitarAcertoMembro,
    registrarReembolsoParcialManual,
    atualizarGastoCompletoManual,
    faturasAbertas,
    faturasFechadas,
    calcularConsumoMembro,
    resetar
  }
}
