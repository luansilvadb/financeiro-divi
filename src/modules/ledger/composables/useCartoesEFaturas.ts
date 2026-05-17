import { ref, computed } from 'vue'
import { LocalStorageCartaoRepository } from '../adapters/LocalStorageCartaoRepository'
import { LocalStorageFaturaRepository } from '../adapters/LocalStorageFaturaRepository'
import { LocalStorageGastoRepository } from '../adapters/LocalStorageGastoRepository'
import { LocalStorageAntecipacaoRepository } from '../adapters/LocalStorageAntecipacaoRepository'
import { LocalStorageAcertoMembroRepository } from '../adapters/LocalStorageAcertoMembroRepository'
import { FaturaService } from '../core/services/FaturaService'
import { AcertoService } from '../core/services/AcertoService'
import { Cartao } from '../core/domain/Cartao'
import { Fatura } from '../core/domain/Fatura'
import { AcertoMembro } from '../core/domain/AcertoMembro'
import { Gasto } from '../core/domain/Gasto'

const cartaoRepo = new LocalStorageCartaoRepository()
const faturaRepo = new LocalStorageFaturaRepository()
const gastoRepo = new LocalStorageGastoRepository()
const antRepo = new LocalStorageAntecipacaoRepository()
const acertoRepo = new LocalStorageAcertoMembroRepository()

const faturaService = new FaturaService(faturaRepo, gastoRepo, antRepo, acertoRepo)
const acertoService = new AcertoService(acertoRepo, faturaRepo)

export function useCartoesEFaturas() {
  const cartoes = ref<Cartao[]>([])
  const faturas = ref<Fatura[]>([])
  const acertos = ref<AcertoMembro[]>([])
  const gastos = ref<Gasto[]>([])

  const inicializar = async () => {
    // Migração inicial de cartões padrão se vazio
    let todosCartoes = await cartaoRepo.listarTodos()
    if (todosCartoes.length === 0) {
      const nubank = new Cartao({ id: 'c1', nome: 'Nubank', diaFechamento: 10, responsavelPadraoId: 'm1' })
      const xp = new Cartao({ id: 'c2', nome: 'XP Visa', diaFechamento: 25, responsavelPadraoId: 'm2' })
      await cartaoRepo.salvar(nubank)
      await cartaoRepo.salvar(xp)
      todosCartoes = [nubank, xp]
    }
    cartoes.value = todosCartoes

    // Inicializar faturas abertas padrão caso não existam
    let todasFaturas = await faturaRepo.listarTodas()
    if (todasFaturas.length === 0) {
      const fatura1 = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 6, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
      const fatura2 = new Fatura({ id: 'f2', cartaoId: 'c2', periodo: { mes: 6, ano: 2026 }, responsavelId: 'm2', status: 'ABERTA' })
      await faturaRepo.salvar(fatura1)
      await faturaRepo.salvar(fatura2)
      todasFaturas = [fatura1, fatura2]
    }
    faturas.value = todasFaturas

    // Carregar acertos e gastos
    const todosAcertos: AcertoMembro[] = []
    const todosGastos: Gasto[] = []
    for (const f of todasFaturas) {
      const porFaturaAcertos = await acertoRepo.buscarPorFatura(f.id)
      todosAcertos.push(...porFaturaAcertos)

      const porFaturaGastos = await gastoRepo.buscarPorFatura(f.id)
      todosGastos.push(...porFaturaGastos)
    }
    acertos.value = todosAcertos
    gastos.value = todosGastos
  }

  const fecharFaturaManual = async (faturaId: string) => {
    await faturaService.fecharFatura(faturaId, new Date())
    await inicializar()
  }

  const reabrirFaturaManual = async (faturaId: string) => {
    await faturaService.reabrirFatura(faturaId)
    await inicializar()
  }

  const quitarAcertoMembro = async (acertoId: string) => {
    await acertoService.marcarPago(acertoId, new Date())
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
          total += d.valor.centavos
        }
      })
    })
    return total
  }

  return {
    cartoes,
    faturas,
    acertos,
    gastos,
    inicializar,
    fecharFaturaManual,
    reabrirFaturaManual,
    quitarAcertoMembro,
    faturasAbertas,
    faturasFechadas,
    calcularConsumoMembro
  }
}
