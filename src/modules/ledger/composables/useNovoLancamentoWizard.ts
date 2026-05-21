import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { DivisaoDeGasto } from '../core/domain/DivisaoDeGasto'
import { LocalStorageGastoRepository } from '../adapters/LocalStorageGastoRepository'
import { LocalStorageFaturaRepository } from '../adapters/LocalStorageFaturaRepository'
import { LocalStorageCartaoRepository } from '../adapters/LocalStorageCartaoRepository'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'
import { GastoService } from '../core/services/GastoService'
import type { IGastoRepository } from '../core/ports/IGastoRepository'
import type { IFaturaRepository } from '../core/ports/IFaturaRepository'
import type { ICartaoRepository } from '../core/ports/ICartaoRepository'

const STORAGE_KEY = 'divi_rascunho_novo_lancamento_v18'

// Helper: Validate loan flow advancement
function canAdvanceLoan(step: number, compradorId: string, borrowerId: string | null, valor: number, descricao: string): boolean {
  const rules: Record<number, () => boolean> = {
    2: () => !!compradorId,
    3: () => !!borrowerId,
    4: () => valor > 0,
    5: () => descricao.trim().length > 0
  }
  return rules[step]?.() ?? false
}

// Helper: Validate expense flow advancement
function canAdvanceExpense(
  step: number,
  compradorId: string,
  valor: number,
  descricao: string,
  modoDivisao: 'IGUAL' | 'MANUAL',
  participantes: string[],
  valoresDivisao: Record<string, number>
): boolean {
  const rules: Record<number, () => boolean> = {
    2: () => !!compradorId,
    3: () => valor > 0,
    4: () => descricao.trim().length > 0,
    5: () => {
      if (modoDivisao === 'IGUAL') {
        return participantes.length > 0
      }
      const soma = participantes.reduce((acc, id) => acc + (valoresDivisao[id] || 0), 0)
      return Math.abs(soma - valor) < 0.01
    }
  }
  return rules[step]?.() ?? false
}

// Helper: Build divisoes based on flow type
function buildDivisoes(
  flow: 'expense' | 'loan',
  total: any,
  borrowerId: string | null,
  participantes: string[],
  modoDivisao: 'IGUAL' | 'MANUAL',
  valoresDivisao: Record<string, number>
): any[] {
  if (flow === 'loan') {
    if (!borrowerId) throw new Error('Selecione quem pegou emprestado')
    return [new DivisaoDeGasto(borrowerId, total)]
  }

  if (participantes.length === 0) throw new Error('Selecione pelo menos uma pessoa para dividir')

  if (modoDivisao === 'IGUAL') {
    const partes = total.distribuir(participantes.length)
    return participantes.map((id, idx) => new DivisaoDeGasto(id, partes[idx]))
  } else {
    return participantes.map(id => new DivisaoDeGasto(id, Dinheiro.deReais(valoresDivisao[id] || 0)))
  }
}

export interface WizardDependencies {
  gastoRepository?: IGastoRepository
  faturaRepository?: IFaturaRepository
  cartaoRepository?: ICartaoRepository
  gastoService?: GastoService
}

export function useNovoLancamentoWizard(
  membros: { id: string; nome: string }[] = [],
  dependencies: WizardDependencies = {}
) {
  const step = ref(1)

  // Dependências injetadas
  const gastoRepo = dependencies.gastoRepository || new LocalStorageGastoRepository()
  const faturaRepo = dependencies.faturaRepository || new LocalStorageFaturaRepository()
  const cartaoRepo = dependencies.cartaoRepository || new LocalStorageCartaoRepository()
  const gastoService = dependencies.gastoService || new GastoService(gastoRepo, faturaRepo, cartaoRepo)

  const obterPeriodoCorrente = (): { mes: number; ano: number } => {
    const raw = localStorage.getItem('divi_periodo_selecionado')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (parsed.mes && parsed.ano) return { mes: Number(parsed.mes), ano: Number(parsed.ano) }
      } catch (_) {}
    }
    return { mes: new Date().getMonth() + 1, ano: new Date().getFullYear() }
  }

  // Controle de Fluxo v18
  const wizFlow = ref<'expense' | 'loan' | null>(null)
  const wizPayment = ref<'pix' | 'card' | null>(null)
  const wizCardOwner = ref<string | null>(null)

  // Dados do Lançamento
  const valor = ref(0)
  const descricao = ref('')
  const compradorSelecionadoId = ref('')
  const borrowerId = ref<string | null>(null)
  const installments = ref(1)

  // Divisão Imediata
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
    if (step.value === 1) return wizFlow.value !== null
    
    if (wizFlow.value === 'loan') {
      return canAdvanceLoan(step.value, compradorSelecionadoId.value, borrowerId.value, valor.value, descricao.value)
    } else {
      return canAdvanceExpense(
        step.value,
        compradorSelecionadoId.value,
        valor.value,
        descricao.value,
        modoDivisaoWizard.value,
        participantesDivisao.value,
        valoresDivisaoWizard.value
      )
    }
  })

  const finalizarGastoOuEmprestimo = async () => {
    if (!wizFlow.value || !wizPayment.value) throw new Error('Fluxo de pagamento não selecionado')
    if (!compradorSelecionadoId.value) throw new Error('Selecione quem pagou/emprestou')
    if (!valor.value || isNaN(Number(valor.value))) throw new Error('Valor inválido')

    const flow = wizFlow.value as 'expense' | 'loan'
    const payment = wizPayment.value as 'pix' | 'card'

    const total = Dinheiro.deReais(Number(valor.value))
    const divisoes = buildDivisoes(
      flow,
      total,
      borrowerId.value,
      participantesDivisao.value,
      modoDivisaoWizard.value,
      valoresDivisaoWizard.value
    )

    await gastoService.lancarGastoOuEmprestimo({
      flow,
      paymentMethod: payment,
      compradorId: compradorSelecionadoId.value,
      valor: Number(valor.value),
      descricao: descricao.value,
      divisoes,
      installments: installments.value,
      cardOwnerId: wizCardOwner.value,
      borrowerId: borrowerId.value,
      periodo: obterPeriodoCorrente()
    })

    reset()
  }

  const reset = () => {
    step.value = 1
    wizFlow.value = null
    wizPayment.value = null
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
