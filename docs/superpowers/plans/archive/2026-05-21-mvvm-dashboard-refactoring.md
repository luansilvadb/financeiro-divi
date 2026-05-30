# MVVM Dashboard Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the ledger dashboard code to strictly adopt the MVVM pattern by extracting all UI state, navigation, and data access logic from the view `DashboardSaldos.vue` into a new, fully testable ViewModel `useDashboardViewModel.ts`.

**Architecture:** The view `DashboardSaldos.vue` will become passive, delegate all actions to and read its state from the `useDashboardViewModel` composable. The ViewModel will orchestrate calls to underlying services and domain repositories, isolating data access and reducing cyclomatic complexity.

**Tech Stack:** Vue 3 Composition API, TypeScript, Vitest, Vue Test Utils.

---

### Task 1: Initialize ViewModel and Basic Period Selection State

**Files:**
- Create: `src/modules/ledger/composables/useDashboardViewModel.ts`
- Create: `src/modules/ledger/composables/useDashboardViewModel.test.ts`

- [ ] **Step 1: Write initial tests for period selection**
Create the test file to verify that the ViewModel initializes the period correctly from `localStorage` or defaults to the current month/year.

Write `src/modules/ledger/composables/useDashboardViewModel.test.ts`:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDashboardViewModel } from './useDashboardViewModel'
import { ref } from 'vue'

describe('useDashboardViewModel', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should initialize selected period from localStorage if available', () => {
    localStorage.setItem('divi_periodo_selecionado', JSON.stringify({ mes: 5, ano: 2026 }))
    const dummyProps = {
      membros: [],
      faturasAbertas: [],
      faturasFechadas: [],
      acertosPendentes: [],
      cartoes: [],
      calcularConsumo: () => 0
    }
    const vm = useDashboardViewModel(dummyProps, vi.fn())
    expect(vm.periodoSelecionado.value).toEqual({ mes: 5, ano: 2026 })
  })

  it('should fallback to current date if localStorage is empty', () => {
    const dummyProps = {
      membros: [],
      faturasAbertas: [],
      faturasFechadas: [],
      acertosPendentes: [],
      cartoes: [],
      calcularConsumo: () => 0
    }
    const vm = useDashboardViewModel(dummyProps, vi.fn())
    const hoje = new Date()
    expect(vm.periodoSelecionado.value.mes).toBe(hoje.getMonth() + 1)
    expect(vm.periodoSelecionado.value.ano).toBe(hoje.getFullYear())
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run src/modules/ledger/composables/useDashboardViewModel.test.ts`
Expected: FAIL due to missing `useDashboardViewModel` file or function.

- [ ] **Step 3: Implement basic ViewModel code**
Create `src/modules/ledger/composables/useDashboardViewModel.ts` with minimal implementation to satisfy the initial tests.

Write `src/modules/ledger/composables/useDashboardViewModel.ts`:
```typescript
import { ref, watch } from 'vue'

export interface DashboardProps {
  membros: { id: string; nome: string; ativo?: boolean }[]
  faturasAbertas: any[]
  faturasFechadas: any[]
  acertosPendentes: any[]
  cartoes: any[]
  calcularConsumo: (faturaId: string, membroId: string) => number
  gastos?: any[]
  activeTab?: any
}

export function useDashboardViewModel(props: DashboardProps, emit: any) {
  const obterPeriodoInicial = () => {
    const salvo = localStorage.getItem('divi_periodo_selecionado')
    if (salvo) {
      try {
        const parsed = JSON.parse(salvo)
        if (parsed.mes && parsed.ano) return parsed
      } catch (e) {}
    }
    const faturaReferencia = props.faturasAbertas?.[0] || props.faturasFechadas?.[0]
    if (faturaReferencia?.periodo) {
      return { mes: faturaReferencia.periodo.mes, ano: faturaReferencia.periodo.ano }
    }
    return { mes: new Date().getMonth() + 1, ano: new Date().getFullYear() }
  }

  const periodoSelecionado = ref<{ mes: number, ano: number }>(obterPeriodoInicial())

  watch(periodoSelecionado, (novos) => {
    localStorage.setItem('divi_periodo_selecionado', JSON.stringify(novos))
  }, { deep: true, immediate: true })

  return {
    periodoSelecionado
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**
Run: `npx vitest run src/modules/ledger/composables/useDashboardViewModel.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit initial ViewModel implementation**
Run:
```bash
git add src/modules/ledger/composables/useDashboardViewModel.ts src/modules/ledger/composables/useDashboardViewModel.test.ts
git commit -m "feat: initialize useDashboardViewModel and tests"
```

---

### Task 2: Implement Month Selector List and Invoice Locking Computeds

**Files:**
- Modify: `src/modules/ledger/composables/useDashboardViewModel.ts`
- Modify: `src/modules/ledger/composables/useDashboardViewModel.test.ts`

- [ ] **Step 1: Write test for invoice locking and month selector list**
Add tests to verify that the ViewModel properly calculates the month selector options and locked/active invoice status.

Add to `src/modules/ledger/composables/useDashboardViewModel.test.ts`:
```typescript
  it('should identify lock status of selected period', () => {
    const dummyProps = {
      membros: [],
      faturasAbertas: [],
      faturasFechadas: [{ periodo: { mes: 5, ano: 2026 } }],
      acertosPendentes: [],
      cartoes: [],
      calcularConsumo: () => 0
    }
    localStorage.setItem('divi_periodo_selecionado', JSON.stringify({ mes: 5, ano: 2026 }))
    const emit = vi.fn()
    const vm = useDashboardViewModel(dummyProps, emit)
    expect(vm.faturaSelecionadaTrancada.value).toBe(true)
    expect(emit).toHaveBeenCalledWith('periodoStatusChanged', true)
  })

  it('should compute month selector list correctly', () => {
    const dummyProps = {
      membros: [],
      faturasAbertas: [],
      faturasFechadas: [{ periodo: { mes: 5, ano: 2026 } }],
      acertosPendentes: [],
      cartoes: [],
      calcularConsumo: () => 0
    }
    const vm = useDashboardViewModel(dummyProps, vi.fn())
    expect(vm.listaMesesSeletor.value.length).toBe(25) // from -12 to +12 months
    const matchingOption = vm.listaMesesSeletor.value.find(
      (m: any) => m.mes === 5 && m.ano === 2026
    )
    expect(matchingOption?.status).toBe('FECHADA')
  })
```

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run src/modules/ledger/composables/useDashboardViewModel.test.ts`
Expected: FAIL due to missing computed properties (`faturaSelecionadaTrancada`, `listaMesesSeletor`).

- [ ] **Step 3: Implement locked and selector computed properties**
Add the computing logic and watch logic in `useDashboardViewModel.ts`.

Add to `src/modules/ledger/composables/useDashboardViewModel.ts`:
```typescript
import { ref, watch, computed } from 'vue'
import { Fatura } from '../core/domain/Fatura'

// Inside useDashboardViewModel:
  const faturaSelecionadaTrancada = computed(() => {
    const p = periodoSelecionado.value
    return props.faturasFechadas.some(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano)
  })

  watch(faturaSelecionadaTrancada, (isLocked) => {
    emit('periodoStatusChanged', isLocked)
  }, { immediate: true })

  const faturaAtivaVisualizada = computed(() => {
    const p = periodoSelecionado.value
    const faturaEncontrada = props.faturasAbertas.find(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano) ||
                             props.faturasFechadas.find(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano)
    if (faturaEncontrada) return faturaEncontrada

    return new Fatura({
      id: `virtual-${p.mes}-${p.ano}`,
      cartaoId: props.cartoes[0]?.id || 'virtual-card',
      periodo: { mes: p.mes, ano: p.ano },
      responsavelId: props.membros[0]?.id || 'virtual-member',
      status: 'ABERTA'
    })
  })

  const listaMesesSeletor = computed(() => {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    const hoje = new Date()
    const list = []

    for (let i = -12; i <= 12; i++) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
      const mesIdx = d.getMonth() + 1
      const anoIdx = d.getFullYear()
      
      const estaFechada = props.faturasFechadas.some(
        f => f.periodo.mes === mesIdx && f.periodo.ano === anoIdx
      )

      list.push({
        mes: mesIdx,
        ano: anoIdx,
        nome: `${meses[mesIdx - 1]} ${anoIdx}`,
        status: estaFechada ? 'FECHADA' : 'ABERTA'
      })
    }

    return list
  })

  const mesesAbertosOpcoes = computed(() => {
    return listaMesesSeletor.value.filter(item => item.status === 'ABERTA')
  })

  const mesesTrancadosOpcoes = computed(() => {
    return listaMesesSeletor.value.filter(item => item.status === 'FECHADA')
  })
```
Make sure to export all of them from the return statement.

- [ ] **Step 4: Run tests to verify they pass**
Run: `npx vitest run src/modules/ledger/composables/useDashboardViewModel.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit selector and locking logic**
Run:
```bash
git add src/modules/ledger/composables/useDashboardViewModel.ts src/modules/ledger/composables/useDashboardViewModel.test.ts
git commit -m "feat: add invoice locking and selector computed properties to ViewModel"
```

---

### Task 3: Migrate UI Modals Control State

**Files:**
- Modify: `src/modules/ledger/composables/useDashboardViewModel.ts`
- Modify: `src/modules/ledger/composables/useDashboardViewModel.test.ts`

- [ ] **Step 1: Write test for modal state management**
Add tests to verify state change methods of BottomSheets / Modals in the ViewModel.

Add to `src/modules/ledger/composables/useDashboardViewModel.test.ts`:
```typescript
  it('should toggle historical bottom sheet correctly', () => {
    const dummyProps = {
      membros: [], faturasAbertas: [], faturasFechadas: [], acertosPendentes: [], cartoes: [], calcularConsumo: () => 0
    }
    const vm = useDashboardViewModel(dummyProps, vi.fn())
    expect(vm.showBottomSheetHistorico.value).toBe(false)
    vm.abrirHistorico()
    expect(vm.showBottomSheetHistorico.value).toBe(true)
    vm.fecharHistorico()
    expect(vm.showBottomSheetHistorico.value).toBe(false)
  })

  it('should configure bill launch popup states', () => {
    const dummyProps = {
      membros: [], faturasAbertas: [], faturasFechadas: [], acertosPendentes: [], cartoes: [], calcularConsumo: () => 0
    }
    const vm = useDashboardViewModel(dummyProps, vi.fn())
    const bill = { id: 'luz', name: 'Energia' }
    vm.abrirLancarBill(bill)
    expect(vm.billSelecionada.value).toEqual(bill)
    expect(vm.showPopupLancar.value).toBe(true)
  })
```

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run src/modules/ledger/composables/useDashboardViewModel.test.ts`
Expected: FAIL due to missing methods/states.

- [ ] **Step 3: Implement modal states and toggle functions**
Add the refs and handlers to control modal open/close states in `useDashboardViewModel.ts`.

Add to `src/modules/ledger/composables/useDashboardViewModel.ts`:
```typescript
  // UI States
  const showBottomSheetHistorico = ref(false)
  const showBottomSheetFechar = ref(false)
  const faturaParaFechar = ref<any | null>(null)
  const showBottomSheetAjustar = ref(false)
  const gastoParaAjustar = ref<any | null>(null)
  const showPopupLancar = ref(false)
  const showBottomSheetConfigCF = ref(false)
  const billSelecionada = ref<any | null>(null)
  const showBottomSheetNovoPeriodo = ref(false)
  const nomeNovoPeriodo = ref('')
  const showBottomSheetNetting = ref(false)
  const nettingTarget = ref<any | null>(null)
  const showParcelasFuturas = ref(false)
  const isDropdownAbertosOpen = ref(false)
  const acertoPixId = ref<string | null>(null)
  const valorPixInput = ref(0)
  const isSubmittingPix = ref(false)

  // Toggle Methods
  const abrirHistorico = () => { showBottomSheetHistorico.value = true }
  const fecharHistorico = () => { showBottomSheetHistorico.value = false }
  
  const abrirLancarBill = (bill: any) => {
    billSelecionada.value = bill
    showPopupLancar.value = true
  }
  const fecharLancarBill = () => { showPopupLancar.value = false }

  const abrirConfigurarBill = (bill: any) => {
    billSelecionada.value = bill
    showBottomSheetConfigCF.value = true
  }
  const abrirNovoBill = () => {
    billSelecionada.value = null
    showBottomSheetConfigCF.value = true
  }
  const fecharConfigurarBill = () => { showBottomSheetConfigCF.value = false }

  const abrirAjustarGasto = (gasto: any) => {
    gastoParaAjustar.value = gasto
    showBottomSheetAjustar.value = true
  }
  const fecharAjustarGasto = () => { showBottomSheetAjustar.value = false }

  const abrirBottomSheetNetting = (transferencia: any) => {
    nettingTarget.value = transferencia
    showBottomSheetNetting.value = true
  }
  const fecharBottomSheetNetting = () => { showBottomSheetNetting.value = false }
```
Expose all the new variables and functions.

- [ ] **Step 4: Run tests to verify they pass**
Run: `npx vitest run src/modules/ledger/composables/useDashboardViewModel.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit modal state management**
Run:
```bash
git add src/modules/ledger/composables/useDashboardViewModel.ts src/modules/ledger/composables/useDashboardViewModel.test.ts
git commit -m "feat: migrate UI modals state control to ViewModel"
```

---

### Task 4: Integrate Calculations and Business Actions

**Files:**
- Modify: `src/modules/ledger/composables/useDashboardViewModel.ts`
- Modify: `src/modules/ledger/composables/useDashboardViewModel.test.ts`

- [ ] **Step 1: Write integration tests for business actions**
Create tests verifying netting confirmation, bill launching, and expense deleting. Mock the repositories or dependencies to prevent side effects in unit tests.

Add to `src/modules/ledger/composables/useDashboardViewModel.test.ts`:
```typescript
// Test mock setups will be included to isolate the VM from LocalStorage
```

- [ ] **Step 2: Run tests to verify they fail**
Verify the test compilation and failures if appropriate.

- [ ] **Step 3: Implement calculations, rollover and business actions**
Integrate `useDashboardCalculations`, `useCartoesEFaturas`, `useContasFixas`, `useFaturaRollover` and `useSaldosUnificados` into `useDashboardViewModel.ts`. Ensure `LocalStorageGastoRepository` instantiation is encapsulated here and not leaked.

Add to `src/modules/ledger/composables/useDashboardViewModel.ts`:
```typescript
import { useCartoesEFaturas } from './useCartoesEFaturas'
import { useContasFixas } from './useContasFixas'
import { useFaturaRollover } from './useFaturaRollover'
import { useSaldosUnificados } from './useSaldosUnificados'
import { useDashboardCalculations } from './useDashboardCalculations'
import { LocalStorageGastoRepository } from '../adapters/LocalStorageGastoRepository'
import { Gasto } from '../core/domain/Gasto'
import { DivisaoDeGasto } from '../core/domain/DivisaoDeGasto'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'
import { toRef } from 'vue'

// In useDashboardViewModel:
  const cartoesEFaturas = useCartoesEFaturas()
  const { contasFixas, salvarContaFixa, excluirContaFixa, lancarGastoContaFixa } = useContasFixas()
  const { executarRolloverPeriodo } = useFaturaRollover()
  const { calcularSaldosUnificados, calcularTransacoesNetting } = useSaldosUnificados()

  const {
    registrarReembolsoParcialManual,
    fecharFaturaManual,
    quitarAcertoMembro,
    atualizarGastoCompletoManual,
    gastos: globalGastos,
    acertos: globalAcertos
  } = cartoesEFaturas

  const faturasFiltradasCalculations = computed(() => {
    const ativa = faturaAtivaVisualizada.value
    if (!ativa) return []
    return [ativa]
  })

  const calculations = useDashboardCalculations(
    toRef(props, 'membros'),
    faturasFiltradasCalculations,
    props.faturasFechadas,
    props.acertosPendentes,
    globalGastos.value,
    globalAcertos.value,
    props.calcularConsumo
  )

  const {
    getMembroNome,
    formatarDinheiro,
    calcularTotalFatura,
    acertosDaFatura,
    gastosDaFatura,
    todosOsAcertosQuitados,
    currentMonthName,
    currentYear,
    parcelasFuturasDetalhadas
  } = calculations

  const gastosFaturaSelecionada = computed(() => {
    const fatId = faturaAtivaVisualizada.value?.id
    if (!fatId) return []
    return globalGastos.value.filter(g => g.faturaId === fatId)
  })

  const saldosUnificadosAtivos = computed(() => {
    const activeFaturaId = faturaAtivaVisualizada.value?.id
    if (!activeFaturaId) return {}
    const gastosPeriodo = globalGastos.value.filter(g => g.faturaId === activeFaturaId)
    return calcularSaldosUnificados(props.membros, gastosPeriodo)
  })

  const nettingTransferencias = computed(() => {
    return calcularTransacoesNetting(saldosUnificadosAtivos.value)
  })

  const membrosVisiveis = computed(() => {
    return props.membros.filter(m => {
      if (m.ativo !== false) return true
      const saldo = saldosUnificadosAtivos.value[m.id] || 0
      return Math.abs(saldo) > 0.005
    })
  })

  const totalFuturasVencer = computed(() => {
    return parcelasFuturasDetalhadas.value.reduce((acc, p) => acc + p.totalFuturo, 0)
  })

  // Business Actions
  const confirmarFechamentoFatura = async (faturaId: string, responsavelId: string) => {
    await fecharFaturaManual(faturaId, responsavelId)
    showBottomSheetFechar.value = false
    faturaParaFechar.value = null
    await cartoesEFaturas.inicializar()
  }

  const confirmarAjusteGasto = async (dados: any) => {
    if (!gastoParaAjustar.value) return
    await atualizarGastoCompletoManual(gastoParaAjustar.value.id, dados)
    showBottomSheetAjustar.value = false
    gastoParaAjustar.value = null
    await cartoesEFaturas.inicializar()
  }

  const iniciarPix = (acerto: any) => {
    acertoPixId.value = acerto.id
    valorPixInput.value = formatarDinheiro(acerto.valorAcerto.centavos - (acerto.valorPago?.centavos || 0))
  }

  const enviarReembolsoPix = async (acertoId: string) => {
    if (valorPixInput.value <= 0) return
    isSubmittingPix.value = true
    try {
      await registrarReembolsoParcialManual(acertoId, Dinheiro.deReais(valorPixInput.value))
      acertoPixId.value = null
      await cartoesEFaturas.inicializar()
    } finally {
      isSubmittingPix.value = false
    }
  }

  const quitarComAjuste = async (acertoId: string) => {
    isSubmittingPix.value = true
    try {
      await quitarAcertoMembro(acertoId)
      acertoPixId.value = null
      await cartoesEFaturas.inicializar()
    } finally {
      isSubmittingPix.value = false
    }
  }

  const confirmarLancarBill = async (dados: { valorReal: number, compradorId: string, splitIds: string[] }) => {
    const activeFaturaId = faturaAtivaVisualizada.value?.id
    if (!activeFaturaId) return
    await lancarGastoContaFixa(activeFaturaId, billSelecionada.value, dados.valorReal, dados.compradorId, dados.splitIds)
    showPopupLancar.value = false
    await cartoesEFaturas.inicializar()
  }

  const confirmarSalvarTemplate = (template: any) => {
    salvarContaFixa(template)
    showBottomSheetConfigCF.value = false
  }

  const confirmarDeletarTemplate = (id: string) => {
    excluirContaFixa(id)
    showBottomSheetConfigCF.value = false
  }

  const sugerirProximoPeriodoLocal = (fat: any) => {
    if (!fat) return ''
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    const mIdx = fat.periodo.mes - 1
    const proximoMIdx = (mIdx + 1) % 12
    const proximoAno = proximoMIdx === 0 ? fat.periodo.ano + 1 : fat.periodo.ano
    return `${meses[proximoMIdx]} ${proximoAno}`
  }

  const abrirNovoPeriodoBottomSheet = () => {
    nomeNovoPeriodo.value = sugerirProximoPeriodoLocal(faturaAtivaVisualizada.value)
    showBottomSheetNovoPeriodo.value = true
  }

  const executarNovoPeriodo = async (nomeNovoPeriodoVal: string) => {
    const faturasAbertasVisualizadas = props.faturasAbertas.filter(f => 
      f.periodo.mes === faturaAtivaVisualizada.value.periodo.mes && 
      f.periodo.ano === faturaAtivaVisualizada.value.periodo.ano
    )

    await executarRolloverPeriodo(
      nomeNovoPeriodoVal,
      faturasAbertasVisualizadas,
      props.cartoes,
      saldosUnificadosAtivos.value,
      currentMonthName.value
    )

    await cartoesEFaturas.inicializar()
  }

  const confirmarNovoPeriodo = async () => {
    if (!nomeNovoPeriodo.value.trim()) return
    await executarNovoPeriodo(nomeNovoPeriodo.value)
    showBottomSheetNovoPeriodo.value = false
  }

  const confirmarBaixaNetting = async (dados: { from: string; to: string; valor: number; method: string; descricao: string }) => {
    const activeFaturaId = faturaAtivaVisualizada.value?.id
    if (!activeFaturaId) return

    const gRepo = new LocalStorageGastoRepository()
    const acertoGasto = new Gasto({
      id: crypto.randomUUID(),
      faturaId: activeFaturaId,
      descricao: dados.descricao,
      valorTotal: Dinheiro.deReais(dados.valor),
      compradorId: dados.from,
      divisoes: [new DivisaoDeGasto(dados.to, Dinheiro.deReais(dados.valor))],
      isSettlement: true,
      settlementDetails: {
        fromMemberId: dados.from,
        toMemberId: dados.to,
        method: dados.method as any
      },
      installments: 1,
      isLoan: false
    })

    await gRepo.salvar(acertoGasto)
    showBottomSheetNetting.value = false
    nettingTarget.value = null
    await cartoesEFaturas.inicializar()
  }

  const excluirGasto = async (id: string) => {
    const gRepo = new LocalStorageGastoRepository()
    await gRepo.excluir(id)
    await cartoesEFaturas.inicializar()
  }

  const estornarContaFixa = async (bill: any) => {
    const gasto = gastosFaturaSelecionada.value.find(g => g.recurringBillId === bill.id)
    if (gasto) {
      if (confirm(`Deseja realmente estornar o pagamento de ${bill.name}?`)) {
        await excluirGasto(gasto.id)
      }
    }
  }

  const formatarMesAno = (mes: number, ano: number) => {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    return `${meses[mes - 1]} ${ano}`
  }
```
Ensure all state variables, helper methods, and actions are exposed from `useDashboardViewModel`.

- [ ] **Step 4: Run tests to verify they pass**
Run: `npx vitest run`
Expected: PASS (all tests including ViewModel unit tests).

- [ ] **Step 5: Commit business actions and calculations**
Run:
```bash
git add src/modules/ledger/composables/useDashboardViewModel.ts src/modules/ledger/composables/useDashboardViewModel.test.ts
git commit -m "feat: integrate calculations, netting, and business actions into ViewModel"
```

---

### Task 5: Refactor DashboardSaldos.vue View Component

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Step 1: Replace `<script setup>` block with passive ViewModel consumption**
Remove the imports of adapters, domain entities, and other composables from [DashboardSaldos.vue](file:///d:/projetos/divi/src/components/ledger/DashboardSaldos.vue). Inject `useDashboardViewModel` and de-structure the parameters.

Edit `src/components/ledger/DashboardSaldos.vue` (Lines 1-445):
```typescript
<script setup lang="ts">
import { toRef } from 'vue'
import type { Tab } from '../ui/BottomTabBar.vue'
import { useDashboardViewModel } from '../../modules/ledger/composables/useDashboardViewModel'
import ContasFixasPanel from './ContasFixasPanel.vue'
import PopupLancarContaFixa from './PopupLancarContaFixa.vue'
import BottomSheetConfigurarContaFixa from './BottomSheetConfigurarContaFixa.vue'
import BottomSheetFecharFatura from './dashboard/BottomSheetFecharFatura.vue'
import BottomSheetAcertoCompensacao from './dashboard/BottomSheetAcertoCompensacao.vue'
import ActivityFeed from './ActivityFeed.vue'
import BottomSheetAjustarGasto from './BottomSheetAjustarGasto.vue'
import DetalhamentoSaldosCard from './dashboard/DetalhamentoSaldosCard.vue'
import Card from '../ui/Card.vue'
import Button from '../ui/Button.vue'
import BottomSheet from '../ui/BottomSheet.vue'
import { 
  ArrowUpRight, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  History,
  Settings,
  Sparkles,
  AlertTriangle,
  Lock
} from 'lucide-vue-next'

interface Props {
  membros: { id: string; nome: string; ativo?: boolean }[]
  faturasAbertas: any[]
  faturasFechadas: any[]
  acertosPendentes: any[]
  cartoes: any[]
  calcularConsumo: (faturaId: string, membroId: string) => number
  gastos?: any[]
  activeTab?: Tab
}

const props = defineProps<Props>()
const emit = defineEmits(['quitarAcerto', 'fecharFatura', 'novoGasto', 'reabrirFatura', 'openSettings', 'periodoStatusChanged'])

const viewModel = useDashboardViewModel(props, emit)

const {
  periodoSelecionado,
  faturaAtivaVisualizada,
  faturaSelecionadaTrancada,
  gastosFaturaSelecionada,
  listaMesesSeletor,
  mesesAbertosOpcoes,
  mesesTrancadosOpcoes,
  showBottomSheetHistorico,
  showBottomSheetFechar,
  faturaParaFechar,
  showBottomSheetAjustar,
  gastoParaAjustar,
  showPopupLancar,
  showBottomSheetConfigCF,
  billSelecionada,
  showBottomSheetNovoPeriodo,
  nomeNovoPeriodo,
  showBottomSheetNetting,
  nettingTarget,
  showParcelasFuturas,
  isDropdownAbertosOpen,
  acertoPixId,
  valorPixInput,
  isSubmittingPix,
  saldosUnificadosAtivos,
  nettingTransferencias,
  membrosVisiveis,
  totalFuturasVencer,
  parcelasFuturasDetalhadas,
  getMembroNome,
  formatarDinheiro,
  calcularTotalFatura,
  acertosDaFatura,
  gastosDaFatura,
  todosOsAcertosQuitados,
  currentMonthName,
  currentYear,
  abrirHistorico,
  fecharHistorico,
  abrirLancarBill,
  abrirConfigurarBill,
  abrirNovoBill,
  abrirAjustarGasto,
  abrirBottomSheetNetting,
  confirmarFechamentoFatura,
  confirmarAjusteGasto,
  iniciarPix,
  enviarReembolsoPix,
  quitarComAjuste,
  confirmarLancarBill,
  confirmarSalvarTemplate,
  confirmarDeletarTemplate,
  confirmarNovoPeriodo,
  confirmarBaixaNetting,
  excluirGasto,
  estornarContaFixa,
  formatarMesAno
} = viewModel
</script>
```

- [ ] **Step 2: Update template element references if needed**
Verify that all elements references inside the `<template>` match the destructuring bindings. For instance:
- Replace `@click="showBottomSheetHistorico = true"` with `@click="abrirHistorico()"` (or keep binding to the direct ref since it is destructured, which works perfectly because Vue maintains ref reactivity when destructured).

- [ ] **Step 3: Run the component integration tests**
Run: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`
Expected: PASS (8 tests passed).

- [ ] **Step 4: Commit View component refactoring**
Run:
```bash
git add src/components/ledger/DashboardSaldos.vue
git commit -m "refactor: clean DashboardSaldos view component and delegate to useDashboardViewModel"
```

---

### Task 6: Final Verification and Codebase Densification

**Files:**
- Modify: `d:\projetos\divi` (overall codebase check)

- [ ] **Step 1: Check for dead imports or unused variables**
Run: `npx vue-tsc -b` to compile and verify TypeScript type safety.
Fix any compiler errors or dead code warnings.

- [ ] **Step 2: Run all tests globally**
Run: `npx vitest run`
Expected: 110 passed.

- [ ] **Step 3: Clean up and commit final checks**
Run:
```bash
git commit -am "refactor: final MVVM dashboard refactoring verification and cleanup"
```
