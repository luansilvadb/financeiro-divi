import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'
import { Gasto } from '../core/domain/Gasto'
import { DivisaoDeGasto } from '../core/domain/DivisaoDeGasto'
import { LocalStorageGastoRepository } from '../adapters/LocalStorageGastoRepository'
import { LocalStorageFaturaRepository } from '../adapters/LocalStorageFaturaRepository'

const STORAGE_KEY = 'divi_rascunho_novo_lancamento'
const gastoRepo = new LocalStorageGastoRepository()
const faturaRepo = new LocalStorageFaturaRepository()

export function useNovoLancamentoWizard(_membros: { id: string; nome: string }[]) {
  const step = ref(1)
  const totalSteps = 3
  const tipo = ref<'gasto' | null>('gasto') // Focado exclusivamente em gasto/despesa
  const valor = ref(0)
  const descricao = ref('')
  const beneficiarios_selecionados = ref<string[]>([])
  const cartaoSelecionadoId = ref<string>('c1')

  const next = () => step.value++
  const prev = () => step.value--

  const canAdvance = computed(() => {
    if (step.value === 1) return true // Escolha do cartão
    if (step.value === 2) return valor.value > 0 && descricao.value.length > 0
    if (step.value === 3) return beneficiarios_selecionados.value.length > 0
    return false
  })

  const toggleBeneficiario = (id: string) => {
    if (beneficiarios_selecionados.value.includes(id)) {
      beneficiarios_selecionados.value = beneficiarios_selecionados.value.filter(b => b !== id)
    } else {
      beneficiarios_selecionados.value.push(id)
    }
  }

  const reset = () => {
    step.value = 1
    valor.value = 0
    descricao.value = ''
    beneficiarios_selecionados.value = []
    localStorage.removeItem(STORAGE_KEY)
  }

  // Carregar do localStorage
  onMounted(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.step !== undefined) step.value = data.step
        if (data.valor !== undefined) valor.value = data.valor
        if (data.descricao !== undefined) descricao.value = data.descricao
        if (data.beneficiarios_selecionados !== undefined) beneficiarios_selecionados.value = data.beneficiarios_selecionados
        if (data.cartaoSelecionadoId !== undefined) cartaoSelecionadoId.value = data.cartaoSelecionadoId
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
      valor: valor.value,
      descricao: descricao.value,
      beneficiarios_selecionados: [...beneficiarios_selecionados.value],
      cartaoSelecionadoId: cartaoSelecionadoId.value
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
    const total = Dinheiro.deReais(valor.value)
    const partes = total.distribuir(beneficiarios_selecionados.value.length)
    const divisoes = beneficiarios_selecionados.value.map((membroId, index) => new DivisaoDeGasto(membroId, partes[index]))

    const todasFaturas = await faturaRepo.listarTodas()
    const fatura = todasFaturas.find(f => f.cartaoId === cartaoSelecionadoId.value && f.status === 'ABERTA') 
      || todasFaturas[0]

    const novoGasto = new Gasto({
      id: crypto.randomUUID(),
      faturaId: fatura.id,
      descricao: descricao.value,
      valorTotal: total,
      divisoes
    })

    await gastoRepo.salvar(novoGasto)
    reset()
  }

  return {
    step,
    totalSteps,
    tipo,
    valor,
    descricao,
    beneficiarios_selecionados,
    cartaoSelecionadoId,
    canAdvance,
    next,
    prev,
    toggleBeneficiario,
    reset,
    finalizarComoGastoCartao
  }
}
