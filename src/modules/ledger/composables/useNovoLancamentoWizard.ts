import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Gasto } from '../core/domain/Gasto'
import { DivisaoDeGasto } from '../core/domain/DivisaoDeGasto'
import { LocalStorageGastoRepository } from '../adapters/LocalStorageGastoRepository'
import { LocalStorageFaturaRepository } from '../adapters/LocalStorageFaturaRepository'
import { LocalStorageCartaoRepository } from '../adapters/LocalStorageCartaoRepository'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'

const STORAGE_KEY = 'divi_rascunho_novo_lancamento_v18'
const gastoRepo = new LocalStorageGastoRepository()
const faturaRepo = new LocalStorageFaturaRepository()
const cartaoRepo = new LocalStorageCartaoRepository()

export function useNovoLancamentoWizard(membros: { id: string; nome: string }[] = []) {
  const step = ref(1)

  // Controle de Fluxo v18
  const wizFlow = ref<'expense' | 'loan'>('expense')
  const wizPayment = ref<'pix' | 'card'>('pix')
  const wizCardOwner = ref<string | null>(null)

  // Dados do Lançamento
  const valor = ref(0)
  const descricao = ref('')
  const compradorSelecionadoId = ref('')
  const borrowerId = ref<string | null>(null)
  const installments = ref(1)

  // Divisão Imediata
  const querDividirAgora = ref(true)
  const participantesDivisao = ref<string[]>(membros.map(m => m.id))
  const modoDivisaoWizard = ref<'IGUAL' | 'MANUAL'>('IGUAL')
  const valoresDivisaoWizard = ref<Record<string, number>>({})

  // Trilha uniforme de 5 passos para ambos os fluxos
  const totalSteps = computed(() => 5)

  const next = () => {
    if (step.value < totalSteps.value) {
      step.value++
    }
  }

  const prev = () => {
    if (step.value > 1) {
      step.value--
    }
  }

  const canAdvance = computed(() => {
    if (step.value === 1) return true
    
    if (wizFlow.value === 'loan') {
      if (step.value === 2) return !!compradorSelecionadoId.value
      if (step.value === 3) return !!borrowerId.value
      if (step.value === 4) return valor.value > 0
      if (step.value === 5) return descricao.value.trim().length > 0
    } else {
      if (step.value === 2) return !!compradorSelecionadoId.value
      if (step.value === 3) return valor.value > 0
      if (step.value === 4) return descricao.value.trim().length > 0
      if (step.value === 5) {
        if (modoDivisaoWizard.value === 'IGUAL') {
          return participantesDivisao.value.length > 0
        } else {
          const soma = participantesDivisao.value.reduce((acc, id) => acc + (valoresDivisaoWizard.value[id] || 0), 0)
          return Math.abs(soma - valor.value) < 0.01
        }
      }
    }
    return false
  })

  const finalizarGastoOuEmprestimo = async () => {
    if (!compradorSelecionadoId.value) throw new Error('Selecione quem pagou/emprestou')
    if (!valor.value || isNaN(Number(valor.value))) throw new Error('Valor inválido')

    const total = Dinheiro.deReais(Number(valor.value))
    let divisoes: DivisaoDeGasto[] = []

    if (wizFlow.value === 'loan') {
      if (!borrowerId.value) throw new Error('Selecione quem pegou emprestado')
      divisoes = [new DivisaoDeGasto(borrowerId.value, total)]
    } else {
      if (participantesDivisao.value.length === 0) throw new Error('Selecione pelo menos uma pessoa para dividir')
      
      if (modoDivisaoWizard.value === 'IGUAL') {
        const partes = total.distribuir(participantesDivisao.value.length)
        divisoes = participantesDivisao.value.map((id, idx) => new DivisaoDeGasto(id, partes[idx]))
      } else {
        divisoes = participantesDivisao.value.map(id => new DivisaoDeGasto(id, Dinheiro.deReais(valoresDivisaoWizard.value[id] || 0)))
      }
    }

    const todasFaturas = await faturaRepo.listarTodas()
    let faturaAtiva = todasFaturas.find(f => f.status === 'ABERTA')
    
    // Se o pagamento for em cartão, tenta achar a fatura do cartão
    if (wizPayment.value === 'card' && wizCardOwner.value) {
      const todosCartoes = await cartaoRepo.listarTodos()
      const cartao = todosCartoes.find(c => c.responsavelPadraoId === compradorSelecionadoId.value || c.id === wizCardOwner.value)
      if (cartao) {
        faturaAtiva = todasFaturas.find(f => f.cartaoId === cartao.id && f.status === 'ABERTA') || faturaAtiva
      }
    }

    // Fallback se não encontrar nenhuma aberta
    if (!faturaAtiva) {
      faturaAtiva = todasFaturas[0]
    }
    
    if (!faturaAtiva) throw new Error('Nenhuma fatura encontrada para registrar o lançamento')

    const novoGasto = new Gasto({
      id: crypto.randomUUID(),
      faturaId: faturaAtiva.id,
      descricao: wizFlow.value === 'loan' ? (descricao.value.trim() || 'Empréstimo Pessoal') : descricao.value,
      valorTotal: total,
      compradorId: compradorSelecionadoId.value,
      divisoes,
      installments: installments.value,
      isLoan: wizFlow.value === 'loan',
      borrowerId: borrowerId.value
    })

    await gastoRepo.salvar(novoGasto)
    reset()
  }

  const reset = () => {
    step.value = 1
    wizFlow.value = 'expense'
    wizPayment.value = 'pix'
    wizCardOwner.value = null
    valor.value = 0
    descricao.value = ''
    compradorSelecionadoId.value = ''
    borrowerId.value = null
    installments.value = 1
    participantesDivisao.value = membros.map(m => m.id)
    modoDivisaoWizard.value = 'IGUAL'
    valoresDivisaoWizard.value = {}
    localStorage.removeItem(STORAGE_KEY)
  }

  // Persistência de Rascunho no LocalStorage
  onMounted(async () => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.step !== undefined) step.value = data.step
        if (data.wizFlow !== undefined) wizFlow.value = data.wizFlow
        if (data.wizPayment !== undefined) wizPayment.value = data.wizPayment
        if (data.wizCardOwner !== undefined) wizCardOwner.value = data.wizCardOwner
        if (data.valor !== undefined) valor.value = data.valor
        if (data.descricao !== undefined) descricao.value = data.descricao
        if (data.compradorSelecionadoId !== undefined) compradorSelecionadoId.value = data.compradorSelecionadoId
        if (data.borrowerId !== undefined) borrowerId.value = data.borrowerId
        if (data.installments !== undefined) installments.value = data.installments
      } catch (e) {
        console.error('Erro ao carregar rascunho sênior:', e)
      }
    }
  })

  let saveTimeout: ReturnType<typeof setTimeout>
  watch(
    () => ({
      step: step.value,
      wizFlow: wizFlow.value,
      wizPayment: wizPayment.value,
      wizCardOwner: wizCardOwner.value,
      valor: valor.value,
      descricao: descricao.value,
      compradorSelecionadoId: compradorSelecionadoId.value,
      borrowerId: borrowerId.value,
      installments: installments.value
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

  return {
    step,
    totalSteps,
    wizFlow,
    wizPayment,
    wizCardOwner,
    valor,
    descricao,
    compradorSelecionadoId,
    borrowerId,
    installments,
    querDividirAgora,
    participantesDivisao,
    modoDivisaoWizard,
    valoresDivisaoWizard,
    canAdvance,
    next,
    prev,
    reset,
    finalizarGastoOuEmprestimo
  }
}
