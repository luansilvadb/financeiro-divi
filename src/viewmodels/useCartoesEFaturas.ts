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

const cartoes = ref<Cartao[]>([])
const faturas = ref<Fatura[]>([])
const acertos = ref<AcertoMembro[]>([])
const gastos = ref<Gasto[]>([])
const inicializado = ref(false)
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
    
    const carregar = async () => {
      if (typeof localFaturaRepo.executarMigracoesEDesduplicacao === 'function') {
        await localFaturaRepo.executarMigracoesEDesduplicacao()
      }

      const todosCartoes = await localCartaoRepo.listarTodos()
      cartoes.value = todosCartoes

      const hoje = new Date()
      const mesAtual = hoje.getMonth() + 1
      const anoAtual = hoje.getFullYear()

      const todasFaturas = await localFaturaService.assegurarFaturasAbertas(todosCartoes, mesAtual, anoAtual)
      faturas.value = todasFaturas

      const todosAcertos = await localAcertoRepo.listarTodos()
      const todosGastos = await localGastoRepo.listarTodos()
      acertos.value = todosAcertos
      gastos.value = todosGastos
      inicializado.value = true
    }

    promiseInicializacao = carregar()
    try {
      await promiseInicializacao
    } finally {
      promiseInicializacao = null
    }
  }

  if (!inicializado.value) {
    inicializar()
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

  const faturasAbertas = computed(() => faturas.value.filter(f => f.status === 'ABERTA'))
  const faturasFechadas = computed(() => faturas.value.filter(f => f.status === 'FECHADA'))

  const calcularConsumoMembro = (faturaId: string, membroId: string) => {
    const gastosDaFatura = gastos.value.filter(g => g.faturaId === faturaId)
    let total = 0
    gastosDaFatura.forEach(g => {
      g.divisoes.forEach(d => {
        if (d.membroId === membroId) {
          total += d.valor.centavos / g.totalInstallments
        }
      })
    })
    return total
  }

  const resetar = () => {
    cartoes.value = []
    faturas.value = []
    acertos.value = []
    gastos.value = []
    inicializado.value = false
  }

  return {
    cartoes,
    faturas,
    acertos,
    gastos,
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
