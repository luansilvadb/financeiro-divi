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
import { Antecipacao } from '../core/domain/Antecipacao'

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
  const antecipacoes = ref<Antecipacao[]>([])

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

    // Inicializar faturas abertas padrão caso não existam para todos os cartões cadastrados
    const hoje = new Date()
    const mesAtual = hoje.getMonth() + 1
    const anoAtual = hoje.getFullYear()
    let todasFaturas = await faturaRepo.listarTodas()

    for (const card of todosCartoes) {
      const temFatura = todasFaturas.some(f => f.cartaoId === card.id && f.status === 'ABERTA')
      if (!temFatura) {
        const novaFatura = new Fatura({
          id: crypto.randomUUID(),
          cartaoId: card.id,
          periodo: { mes: mesAtual, ano: anoAtual },
          responsavelId: card.responsavelPadraoId,
          status: 'ABERTA'
        })
        await faturaRepo.salvar(novaFatura)
        todasFaturas.push(novaFatura)
      }
    }
    faturas.value = todasFaturas

    // Carregar acertos, gastos e antecipações
    const todosAcertos: AcertoMembro[] = []
    const todosGastos: Gasto[] = []
    const todasAnt: Antecipacao[] = []
    for (const f of todasFaturas) {
      const porFaturaAcertos = await acertoRepo.buscarPorFatura(f.id)
      todosAcertos.push(...porFaturaAcertos)

      const porFaturaGastos = await gastoRepo.buscarPorFatura(f.id)
      todosGastos.push(...porFaturaGastos)

      const porFaturaAnt = await antRepo.buscarPorFatura(f.id)
      todasAnt.push(...porFaturaAnt)
    }
    acertos.value = todosAcertos
    gastos.value = todosGastos
    antecipacoes.value = todasAnt
  }

  const salvarCartaoManual = async (cartao: Cartao) => {
    await cartaoRepo.salvar(cartao)
    await inicializar()
  }

  const excluirCartaoManual = async (id: string) => {
    await cartaoRepo.excluir(id)
    await inicializar()
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

  const registrarAdiantamentoManual = async (antecipacao: Antecipacao) => {
    await antRepo.salvar(antecipacao)
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

  const calcularAdiantamentoMembro = (faturaId: string, membroId: string) => {
    return antecipacoes.value
      .filter(a => a.faturaId === faturaId && a.membroId === membroId)
      .reduce((sum, a) => sum + a.valor.centavos, 0)
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
    registrarAdiantamentoManual,
    faturasAbertas,
    faturasFechadas,
    calcularConsumoMembro,
    calcularAdiantamentoMembro
  }
}
