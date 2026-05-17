import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'
import { Gasto } from '../core/domain/Gasto'
import { Antecipacao } from '../core/domain/Antecipacao'
import { DivisaoDeGasto } from '../core/domain/DivisaoDeGasto'
import { LocalStorageGastoRepository } from '../adapters/LocalStorageGastoRepository'
import { LocalStorageFaturaRepository } from '../adapters/LocalStorageFaturaRepository'
import { LocalStorageAntecipacaoRepository } from '../adapters/LocalStorageAntecipacaoRepository'
import { LocalStorageCartaoRepository } from '../adapters/LocalStorageCartaoRepository'

const STORAGE_KEY = 'divi_rascunho_novo_lancamento'
const gastoRepo = new LocalStorageGastoRepository()
const faturaRepo = new LocalStorageFaturaRepository()
const antRepo = new LocalStorageAntecipacaoRepository()
const cartaoRepo = new LocalStorageCartaoRepository()

export function useNovoLancamentoWizard(_membros: { id: string; nome: string }[] = []) {
  const step = ref(1)
  const totalSteps = computed(() => 4)
  const tipo = ref<'GASTO' | 'ADIANTAMENTO'>('GASTO')

  // Campos do Gasto
  const cartaoSelecionadoId = ref('')
  const valor = ref(0)
  const descricao = ref('')
  const compradorSelecionadoId = ref('') // <- NOVO

  // Retrocompatibilidade para templates / testes
  const beneficiarios_selecionados = computed(() => 
    compradorSelecionadoId.value ? [compradorSelecionadoId.value] : []
  )

  // Campos do Adiantamento
  const adiantamentoRemetenteId = ref('')
  const adiantamentoCartaoId = ref('')

  const next = () => step.value++
  const prev = () => step.value--

  const canAdvance = computed(() => {
    if (step.value === 1) return true // Escolha de ação
    if (tipo.value === 'GASTO') {
      if (step.value === 2) return !!cartaoSelecionadoId.value
      if (step.value === 3) return !!compradorSelecionadoId.value
      if (step.value === 4) return valor.value > 0 && descricao.value.length > 0
    } else {
      if (step.value === 2) return !!adiantamentoRemetenteId.value
      if (step.value === 3) return !!adiantamentoCartaoId.value
      if (step.value === 4) return valor.value > 0
    }
    return false
  })

  // Retrocompatibilidade para testes
  const toggleBeneficiario = (id: string) => {
    if (compradorSelecionadoId.value === id) {
      compradorSelecionadoId.value = ''
    } else {
      compradorSelecionadoId.value = id
    }
  }

  const reset = () => {
    step.value = 1
    valor.value = 0
    descricao.value = ''
    compradorSelecionadoId.value = ''
    adiantamentoRemetenteId.value = ''
    localStorage.removeItem(STORAGE_KEY)
  }

  // Carregar do localStorage
  onMounted(async () => {
    const todosCartoes = await cartaoRepo.listarTodos()
    if (todosCartoes.length > 0) {
      cartaoSelecionadoId.value = todosCartoes[0].id
      adiantamentoCartaoId.value = todosCartoes[0].id
    }

    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.step !== undefined) step.value = data.step
        if (data.tipo !== undefined) tipo.value = data.tipo
        if (data.valor !== undefined) valor.value = data.valor
        if (data.descricao !== undefined) descricao.value = data.descricao
        if (data.compradorSelecionadoId !== undefined) compradorSelecionadoId.value = data.compradorSelecionadoId
        if (data.cartaoSelecionadoId !== undefined) cartaoSelecionadoId.value = data.cartaoSelecionadoId
        if (data.adiantamentoRemetenteId !== undefined) adiantamentoRemetenteId.value = data.adiantamentoRemetenteId
        if (data.adiantamentoCartaoId !== undefined) adiantamentoCartaoId.value = data.adiantamentoCartaoId
      } catch (e) {
        console.error('Erro ao carregar rascunho:', e)
      }
    }
  })

  // Watcher para salvar
  let saveTimeout: ReturnType<typeof setTimeout>
  watch(
    () => ({
      step: step.value,
      tipo: tipo.value,
      valor: valor.value,
      descricao: descricao.value,
      compradorSelecionadoId: compradorSelecionadoId.value,
      cartaoSelecionadoId: cartaoSelecionadoId.value,
      adiantamentoRemetenteId: adiantamentoRemetenteId.value,
      adiantamentoCartaoId: adiantamentoCartaoId.value
    }),
    (state) => {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      }, 500)
    },
    { deep: true }
  )

  onUnmounted(() => {
    clearTimeout(saveTimeout)
  })

  const finalizarComoGastoCartao = async () => {
    if (!cartaoSelecionadoId.value) throw new Error('Selecione um cartão')
    if (!compradorSelecionadoId.value) throw new Error('Selecione quem usou')
    if (!valor.value || isNaN(Number(valor.value))) throw new Error('Valor inválido')

    const total = Dinheiro.deReais(Number(valor.value))
    const divisoes = [new DivisaoDeGasto(compradorSelecionadoId.value, total)] // 100% comprador temporariamente

    const todasFaturas = await faturaRepo.listarTodas()
    const fatura = todasFaturas.find(f => f.cartaoId === cartaoSelecionadoId.value && f.status === 'ABERTA') 
      || todasFaturas[0]

    if (!fatura) throw new Error('Nenhuma fatura aberta encontrada para este cartão')

    const novoGasto = new Gasto({
      id: crypto.randomUUID(),
      faturaId: fatura.id,
      descricao: descricao.value,
      valorTotal: total,
      compradorId: compradorSelecionadoId.value,
      divisoes
    })

    await gastoRepo.salvar(novoGasto)
    reset()
  }

  const finalizarComoAdiantamento = async () => {
    const total = Dinheiro.deReais(valor.value)
    const todasFaturas = await faturaRepo.listarTodas()
    const fatura = todasFaturas.find(f => f.cartaoId === adiantamentoCartaoId.value && f.status === 'ABERTA')
      || todasFaturas[0]

    const novoAdiantamento = new Antecipacao({
      id: crypto.randomUUID(),
      faturaId: fatura.id,
      membroId: adiantamentoRemetenteId.value,
      valor: total,
      data: new Date()
    })

    await antRepo.salvar(novoAdiantamento)
    reset()
  }

  return {
    step,
    totalSteps,
    tipo,
    valor,
    descricao,
    compradorSelecionadoId,
    beneficiarios_selecionados,
    cartaoSelecionadoId,
    adiantamentoRemetenteId,
    adiantamentoCartaoId,
    canAdvance,
    next,
    prev,
    toggleBeneficiario,
    reset,
    finalizarComoGastoCartao,
    finalizarComoAdiantamento
  }
}
