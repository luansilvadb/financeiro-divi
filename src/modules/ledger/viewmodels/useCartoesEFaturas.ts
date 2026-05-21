import { ref, computed } from 'vue'
import { LocalStorageCartaoRepository } from '../infrastructure/local/LocalStorageCartaoRepository'
import { LocalStorageFaturaRepository } from '../infrastructure/local/LocalStorageFaturaRepository'
import { LocalStorageGastoRepository } from '../infrastructure/local/LocalStorageGastoRepository'
import { LocalStorageAntecipacaoRepository } from '../infrastructure/local/LocalStorageAntecipacaoRepository'
import { LocalStorageAcertoMembroRepository } from '../infrastructure/local/LocalStorageAcertoMembroRepository'
import { FaturaService } from '../model/services/FaturaService'
import { AcertoService } from '../model/services/AcertoService'
import { GastoService } from '../model/services/GastoService'
import { Cartao } from '../model/domain/Cartao'
import { Fatura } from '../model/domain/Fatura'
import { AcertoMembro } from '../model/domain/AcertoMembro'
import { Gasto } from '../model/domain/Gasto'
import { Antecipacao } from '../model/domain/Antecipacao'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'
import { DivisaoDeGasto } from '../model/domain/DivisaoDeGasto'
import type { ICartaoRepository } from '../model/repositories/ICartaoRepository'
import type { IFaturaRepository } from '../model/repositories/IFaturaRepository'
import type { IGastoRepository } from '../model/repositories/IGastoRepository'
import type { IAntecipacaoRepository } from '../model/repositories/IAntecipacaoRepository'
import type { IAcertoMembroRepository } from '../model/repositories/IAcertoMembroRepository'

const cartaoRepo = new LocalStorageCartaoRepository()
const faturaRepo = new LocalStorageFaturaRepository()
const gastoRepo = new LocalStorageGastoRepository()
const antRepo = new LocalStorageAntecipacaoRepository()
const acertoRepo = new LocalStorageAcertoMembroRepository()



const cartoes = ref<Cartao[]>([])
const faturas = ref<Fatura[]>([])
const acertos = ref<AcertoMembro[]>([])
const gastos = ref<Gasto[]>([])
const antecipacoes = ref<Antecipacao[]>([])
const inicializado = ref(false)
let promiseInicializacao: Promise<void> | null = null

export interface CartoesEFaturasDependencies {
  cartaoRepository?: ICartaoRepository
  faturaRepository?: IFaturaRepository
  gastoRepository?: IGastoRepository
  antecipacaoRepository?: IAntecipacaoRepository
  acertoMembroRepository?: IAcertoMembroRepository
  faturaService?: FaturaService
  acertoService?: AcertoService
  gastoService?: GastoService
}

export function useCartoesEFaturas(dependencies: CartoesEFaturasDependencies = {}) {
  const localCartaoRepo = dependencies.cartaoRepository || cartaoRepo
  const localFaturaRepo = dependencies.faturaRepository || faturaRepo
  const localGastoRepo = dependencies.gastoRepository || gastoRepo
  const localAntRepo = dependencies.antecipacaoRepository || antRepo
  const localAcertoRepo = dependencies.acertoMembroRepository || acertoRepo

  const localFaturaService = dependencies.faturaService || new FaturaService(localFaturaRepo, localGastoRepo, localAntRepo, localAcertoRepo)
  const localAcertoService = dependencies.acertoService || new AcertoService(localAcertoRepo, localFaturaRepo)
  const localGastoService = dependencies.gastoService || new GastoService(localGastoRepo, localFaturaRepo, localCartaoRepo)

  const inicializar = async () => {
    if (promiseInicializacao) return promiseInicializacao
    
    const carregar = async () => {
      const todosCartoes = await localCartaoRepo.listarTodos()
      cartoes.value = todosCartoes

      const hoje = new Date()
      const mesAtual = hoje.getMonth() + 1
      const anoAtual = hoje.getFullYear()

      const todasFaturas = await localFaturaService.assegurarFaturasAbertas(todosCartoes, mesAtual, anoAtual)
      faturas.value = todasFaturas

      const todosAcertos: AcertoMembro[] = []
      const todosGastos: Gasto[] = []
      const todasAnt: Antecipacao[] = []
      for (const f of todasFaturas) {
        const porFaturaAcertos = await localAcertoRepo.buscarPorFatura(f.id)
        todosAcertos.push(...porFaturaAcertos)

        const porFaturaGastos = await localGastoRepo.buscarPorFatura(f.id)
        todosGastos.push(...porFaturaGastos)

        const porFaturaAnt = await localAntRepo.buscarPorFatura(f.id)
        todasAnt.push(...porFaturaAnt)
      }
      acertos.value = todosAcertos
      gastos.value = todosGastos
      antecipacoes.value = todasAnt
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
          total += d.valor.centavos / g.installments
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
    antecipacoes.value = []
    inicializado.value = false
  }

  return {
    cartoes,
    faturas,
    acertos,
    gastos,
    antecipacoes,
    inicializar,
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
