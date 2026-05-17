# Integração do Fluxo Sênior v19 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar 100% das funcionalidades, regras de negócio e melhorias visuais premium do protótipo sênior `fluxo-senior-v19.html` no código Vue da aplicação real, adicionando o Modal de Ajuste de Lançamentos, o Quadro de Detalhamento Granular de Saldos por colunas, e polimento do Wizard com efeito Shake e validações de erro.

**Architecture:** Abordagem modular criando o componente autônomo `ModalAjustarGasto.vue` para edição completa de lançamentos e o componente `DetalhamentoSaldosCard.vue` para auditoria granular de fluxos de caixa individuais (PIX, Cartão e Empréstimos) por morador. Ajustes estéticos e de micro-interações no Wizard e no Dashboard mantendo o design system premium e escuro da v19.

**Tech Stack:** Vue 3, Tailwind CSS v3, Vitest, Lucide Icons.

---

### Task 1: Infraestrutura de Atualização de Gastos (Composable & Repositório)

**Files:**
- Modify: `src/modules/ledger/composables/useCartoesEFaturas.ts`
- Test: `src/modules/ledger/composables/useCartoesEFaturas.test.ts`

- [ ] **Step 1: Criar teste de atualização de gasto no composable**
Adicione um teste unitário em `src/modules/ledger/composables/useCartoesEFaturas.test.ts` que simule a criação de um gasto e valide se a atualização completa de seus dados via composable persiste corretamente os novos valores no repositório.

```typescript
  it('deve atualizar um gasto completo e persistir as alterações no repositório', async () => {
    const { inicializar, gastos, atualizarGastoCompletoManual } = useCartoesEFaturas()
    await inicializar()
    
    // 1. Cria um gasto mock direto no repositório local
    const { LocalStorageGastoRepository } = await import('../adapters/LocalStorageGastoRepository')
    const gRepo = new LocalStorageGastoRepository()
    const { Dinheiro } = await import('../../../shared/primitives/Dinheiro')
    const { Gasto } = await import('../core/domain/Gasto')
    const { DivisaoDeGasto } = await import('../core/domain/DivisaoDeGasto')

    const original = new Gasto({
      id: 'g-teste-update',
      faturaId: 'f1',
      descricao: 'Lanche original',
      valorTotal: Dinheiro.deCentavos(3000), // R$ 30,00
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deCentavos(3000))]
    })
    await gRepo.salvar(original)
    await inicializar()

    expect(gastos.value.find(g => g.id === 'g-teste-update')?.descricao).toBe('Lanche original')

    // 2. Executa a atualização completa
    const novasDivisoes = [
      new DivisaoDeGasto('m1', Dinheiro.deCentavos(1500)),
      new DivisaoDeGasto('m2', Dinheiro.deCentavos(1500))
    ]
    await atualizarGastoCompletoManual('g-teste-update', {
      descricao: 'Pizza de calabresa',
      valorTotal: Dinheiro.deCentavos(3000),
      compradorId: 'm2',
      method: 'card',
      cardOwner: 'luan',
      divisoes: novasDivisoes,
      installments: 1
    })

    // 3. Verifica se as alterações foram salvas
    const atualizado = gastos.value.find(g => g.id === 'g-teste-update')
    expect(atualizado?.descricao).toBe('Pizza de calabresa')
    expect(atualizado?.compradorId).toBe('m2')
    expect(atualizado?.method).toBe('card')
    expect(atualizado?.cardOwner).toBe('luan')
    expect(atualizado?.divisoes.length).toBe(2)
  })
```

- [ ] **Step 2: Rodar teste para verificar falha**
Rode o Vitest para verificar que o teste falha porque a função `atualizarGastoCompletoManual` não está definida.

Run: `npx vitest run src/modules/ledger/composables/useCartoesEFaturas.test.ts`
Expected: FAIL (TypeError: atualizarGastoCompletoManual is not a function)

- [ ] **Step 3: Implementar `atualizarGastoCompletoManual` no Composable**
Adicione o método de atualização completa no composable de cartões e faturas.

Substitua as linhas correspondentes em `src/modules/ledger/composables/useCartoesEFaturas.ts`:
```typescript
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
    const listGastos = gastos.value
    const idx = listGastos.findIndex(g => g.id === gastoId)
    if (idx < 0) return

    const original = listGastos[idx]
    const novoGasto = new Gasto({
      id: original.id,
      faturaId: original.faturaId,
      descricao: dados.descricao,
      valorTotal: dados.valorTotal,
      compradorId: dados.compradorId,
      divisoes: dados.divisoes,
      method: dados.method,
      cardOwner: dados.cardOwner,
      installments: dados.installments,
      isLoan: original.isLoan,
      borrowerId: original.borrowerId,
      recurringBillId: original.recurringBillId,
      isSettlement: original.isSettlement,
      settlementDetails: original.settlementDetails
    })

    await gastoRepo.salvar(novoGasto)
    await inicializar()
  }
```

E inclua o novo método no retorno do composable:
```typescript
    atualizarGastoCompradorManual,
    atualizarGastoCompletoManual,
```

- [ ] **Step 4: Rodar testes para verificar sucesso**
Rode o Vitest para atestar que o teste recém-criado e todos os testes da suíte de composables agora passam com sucesso.

Run: `npx vitest run src/modules/ledger/composables/useCartoesEFaturas.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/modules/ledger/composables/useCartoesEFaturas.ts src/modules/ledger/composables/useCartoesEFaturas.test.ts
git commit -m "feat(ledger): adicionar método atualizarGastoCompletoManual e testes no composable"
```

---

### Task 2: Modal de Ajuste Imersivo de Lançamentos (✏️ Ajustar)

**Files:**
- Create: `src/components/ledger/ModalAjustarGasto.vue`
- Modify: `src/components/ledger/ActivityFeed.vue`
- Modify: `src/components/ledger/DashboardSaldos.vue`
- Modify: `src/components/ledger/DashboardSaldos.test.ts`

- [ ] **Step 1: Criar o componente `ModalAjustarGasto.vue`**
Crie um modal premium que replica o formulário imersivo do protótipo sênior v19 com recálculo de divisões em tempo real, seleção de comprador, canal de pagamento e moradores do rateio.

Create: `src/components/ledger/ModalAjustarGasto.vue`
```vue
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Gasto } from '../../modules/ledger/core/domain/Gasto'
import { Dinheiro } from '../../shared/primitives/Dinheiro'
import { DivisaoDeGasto } from '../../modules/ledger/core/domain/DivisaoDeGasto'

interface Props {
  visible: boolean
  gasto: Gasto | null
  membros: { id: string; nome: string }[]
  cartoes: { id: string; nome: string; responsavelPadraoId: string }[]
}

const props = defineProps<Props>()
const emit = defineEmits(['cancel', 'save'])

const descInput = ref('')
const valorInput = ref(0)
const quemPaga = ref('')
const activeMethod = ref<'pix' | 'card'>('pix')
const activeCardOwner = ref<string | null>(null)
const selectedSplit = ref<string[]>([])

watch(() => props.gasto, (newG) => {
  if (newG) {
    descInput.value = newG.descricao
    valorInput.value = newG.valorTotal.centavos / 100
    quemPaga.value = newG.compradorId
    activeMethod.value = newG.method
    activeCardOwner.value = newG.cardOwner
    selectedSplit.value = newG.divisoes.map(d => d.membroId)
  }
}, { immediate: true })

const selectMethod = (method: 'pix' | 'card', cardOwner: string | null) => {
  activeMethod.value = method
  activeCardOwner.value = cardOwner
}

const toggleSplit = (memberId: string) => {
  const idx = selectedSplit.value.indexOf(memberId)
  if (idx > -1) {
    if (selectedSplit.value.length === 1) return
    selectedSplit.value.splice(idx, 1)
  } else {
    selectedSplit.value.push(memberId)
  }
}

const calculatedSharesDesc = computed(() => {
  const n = selectedSplit.value.length
  if (n === 0 || valorInput.value <= 0) return 'Digite um valor e selecione participantes'
  const share = valorInput.value / n
  const formatted = share.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  
  if (n === props.membros.length) {
    return `Dividido igualmente com todos. Cada um paga ${formatted}`
  } else if (n === 1) {
    const name = props.membros.find(m => m.id === selectedSplit.value[0])?.nome || ''
    return `Só de ${name}. Assume 100% no valor de ${formatted}`
  } else {
    const names = selectedSplit.value.map(id => props.membros.find(m => m.id === id)?.nome).join(' e ')
    return `Entre ${names}. Cada um paga ${formatted}`
  }
})

const getCardLabel = (co: string) => {
  return co === 'luan' ? 'Nubank' : 'C6'
}

const handleConfirm = () => {
  if (!descInput.value.trim()) return
  if (valorInput.value <= 0) return

  const totalCents = Math.round(valorInput.value * 100)
  const floorShare = Math.floor(totalCents / selectedSplit.value.length)
  const divisoes: DivisaoDeGasto[] = []
  
  selectedSplit.value.forEach(mId => {
    divisoes.push(new DivisaoDeGasto(mId, Dinheiro.deCentavos(floorShare)))
  })

  let remainder = totalCents - (floorShare * selectedSplit.value.length)
  let idx = 0
  const order = [...selectedSplit.value]
  
  if (quemPaga.value && order.includes(quemPaga.value)) {
    const index = order.indexOf(quemPaga.value)
    order.splice(index, 1)
    order.unshift(quemPaga.value)
  }

  while (remainder > 0) {
    const targetMemberId = order[idx % order.length]
    const currentDivIdx = divisoes.findIndex(d => d.membroId === targetMemberId)
    if (currentDivIdx > -1) {
      const originalDiv = divisoes[currentDivIdx]
      divisoes[currentDivIdx] = new DivisaoDeGasto(targetMemberId, Dinheiro.deCentavos(originalDiv.valor.centavos + 1))
    }
    remainder--
    idx++
  }

  emit('save', {
    descricao: descInput.value.trim(),
    valorTotal: Dinheiro.deCentavos(totalCents),
    compradorId: quemPaga.value,
    method: activeMethod.value,
    cardOwner: activeCardOwner.value,
    divisoes,
    installments: props.gasto?.installments || 1
  })
}
</script>

<template>
  <div v-if="props.visible" class="fixed inset-0 bg-[#040814]/85 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
    <div class="glass-card w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-divi-border relative text-divi-t1 space-y-4 max-h-[90vh] overflow-y-auto">
      <h3 class="text-xl font-black text-divi-t1 flex items-center gap-2 mb-1">✏️ Ajustar Lançamento</h3>
      
      <div class="space-y-1.5">
        <label class="block text-xs font-black uppercase text-divi-t3 tracking-wider">Descrição</label>
        <input 
          type="text" 
          v-model="descInput" 
          class="w-full px-4 py-3 rounded-2xl glass-input outline-none font-bold text-divi-t1 text-sm focus:border-divi-primary" 
          placeholder="Ex: Supermercado"
        />
      </div>

      <div class="space-y-1.5">
        <label class="block text-xs font-black uppercase text-divi-t3 tracking-wider">Valor do Lançamento</label>
        <div class="flex items-center gap-2 bg-slate-950/30 border border-divi-border rounded-2xl px-4 py-2.5">
          <span class="text-divi-violet text-sm font-black">R$</span>
          <input 
            type="number" 
            step="0.01"
            v-model.number="valorInput" 
            class="w-full bg-transparent outline-none font-black text-divi-t1 text-base focus:border-0" 
            placeholder="0,00"
          />
        </div>
      </div>

      <div v-if="!props.gasto?.isLoan" class="space-y-2">
        <label class="block text-xs font-black uppercase text-divi-t3 tracking-wider">Método / Cartão</label>
        <div class="flex gap-2">
          <button 
            @click="selectMethod('pix', null)"
            class="flex-1 py-2 px-1 text-[10px] font-black rounded-xl border text-center transition-all"
            :class="activeMethod === 'pix' ? 'bg-divi-primary border-divi-primary text-white shadow-sm' : 'bg-divi-s2 border-divi-border text-divi-t3'"
          >
            ⚡ Pix / Cash
          </button>
          <button 
            @click="selectMethod('card', 'luan')"
            class="flex-1 py-2 px-1 text-[10px] font-black rounded-xl border text-center transition-all"
            :class="activeMethod === 'card' && activeCardOwner === 'luan' ? 'bg-divi-primary border-divi-primary text-white shadow-sm' : 'bg-divi-s2 border-divi-border text-divi-t3'"
          >
            💳 Nubank (Luan)
          </button>
          <button 
            @click="selectMethod('card', 'joao')"
            class="flex-1 py-2 px-1 text-[10px] font-black rounded-xl border text-center transition-all"
            :class="activeMethod === 'card' && activeCardOwner === 'joao' ? 'bg-divi-primary border-divi-primary text-white shadow-sm' : 'bg-divi-s2 border-divi-border text-divi-t3'"
          >
            💳 C6 (João)
          </button>
        </div>
      </div>

      <div class="space-y-2">
        <label class="block text-xs font-black uppercase text-divi-t3 tracking-wider">
          {{ props.gasto?.isLoan ? 'Quem emprestou?' : activeMethod === 'pix' ? 'Quem fez o Pix?' : `Quem passou no ${getCardLabel(activeCardOwner || '')}?` }}
        </label>
        <div class="grid grid-cols-3 gap-2">
          <button 
            v-for="m in props.membros"
            :key="m.id"
            @click="quemPaga = m.id"
            class="py-2.5 px-1.5 text-xs font-black rounded-xl border text-center transition-all"
            :class="quemPaga === m.id ? 'bg-divi-primary border-divi-primary text-white shadow-sm' : 'bg-divi-s2 border-divi-border text-divi-t2'"
          >
            {{ m.nome }}
          </button>
        </div>
      </div>

      <div v-if="!props.gasto?.isLoan" class="space-y-2">
        <label class="block text-xs font-black uppercase text-divi-t3 tracking-wider">Dividir com</label>
        <div class="grid grid-cols-3 gap-2">
          <button 
            v-for="m in props.membros"
            :key="m.id"
            @click="toggleSplit(m.id)"
            class="relative py-3.5 px-1.5 text-xs font-black rounded-xl border text-center transition-all flex flex-col items-center gap-1.5"
            :class="selectedSplit.includes(m.id) ? 'bg-divi-primary-dim border-divi-primary text-divi-t1' : 'bg-divi-s2 border-divi-border text-divi-t3'"
          >
            <span class="text-xs">{{ m.nome }}</span>
            <span v-if="selectedSplit.includes(m.id)" class="absolute top-1 right-1 text-[8px] bg-divi-emerald-dim border border-emerald-500/30 text-divi-emerald font-black py-0.5 px-1.5 rounded-full">
              ✓
            </span>
          </button>
        </div>
      </div>

      <div v-if="!props.gasto?.isLoan" class="bg-divi-emerald-dim border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 shadow-md">
        <span class="text-2xl">📊</span>
        <div class="text-left leading-normal">
          <strong class="block text-divi-emerald text-[11px] font-black">Visualização do Rateio</strong>
          <span class="text-[10px] text-emerald-400 font-extrabold">{{ calculatedSharesDesc }}</span>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button @click="emit('cancel')" class="px-5 py-3.5 text-xs font-black bg-divi-s2 hover:bg-divi-s3 text-divi-t1 border border-divi-border rounded-2xl transition-all flex-1">
          Voltar
        </button>
        <button 
          @click="handleConfirm" 
          class="px-5 py-3.5 text-xs font-black bg-divi-primary border border-indigo-500/25 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-lg transition-all flex-1" 
          :disabled="!descInput.trim() || valorInput <= 0"
        >
          Confirmar Ajuste
        </button>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Modificar `ActivityFeed.vue` para suportar emitir evento de Ajustar**
No `src/components/ledger/ActivityFeed.vue`, adicione o botão `✏️ Ajustar` e emita o evento `ajustarGasto`.

Substitua as propriedades do feed:
```typescript
interface Props {
  gastos: Gasto[]
  membros: { id: string; nome: string }[]
  isMonthLocked: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['desfazerGasto', 'ajustarGasto'])
```

Substitua as ações do feed no template:
```vue
        <div class="flex justify-end gap-2 border-t border-divi-border/30 pt-2.5">
          <button 
            v-if="!g.isSettlement"
            type="button"
            @click="emit('ajustarGasto', g.id)"
            :disabled="props.isMonthLocked"
            class="px-3 py-1.5 text-[9.5px] font-black bg-divi-primary/10 hover:bg-divi-primary/20 text-divi-primary rounded-lg border border-divi-primary/20 transition-all disabled:opacity-40"
          >
            ✏️ Ajustar
          </button>
          <button 
            type="button"
            @click="handleDelete(g.id)"
            :disabled="props.isMonthLocked"
            class="px-3 py-1.5 text-[9.5px] font-black bg-divi-rose/10 hover:bg-divi-rose/20 text-divi-rose rounded-lg border border-divi-rose/20 transition-all disabled:opacity-40"
          >
            🗑️ Desfazer
          </button>
        </div>
```

- [ ] **Step 3: Modificar `DashboardSaldos.vue` para incluir `ModalAjustarGasto`**
No template de `DashboardSaldos.vue`, instancie o novo `ModalAjustarGasto` e trate os eventos de clique.

Adicione o import e os estados reativos no topo:
```typescript
import ModalAjustarGasto from './ModalAjustarGasto.vue'

const showModalAjustar = ref(false)
const gastoParaAjustar = ref<any | null>(null)

const abrirAjustarGasto = (gastoId: string) => {
  const gasto = globalGastos.value.find(g => g.id === gastoId)
  if (gasto) {
    gastoParaAjustar.value = gasto
    showModalAjustar.value = true
  }
}

const confirmarAjusteGasto = async (dados: {
  descricao: string
  valorTotal: any
  compradorId: string
  method: 'pix' | 'card'
  cardOwner: string | null
  divisoes: any[]
  installments: number
}) => {
  if (!gastoParaAjustar.value) return
  await atualizarGastoCompletoManual(gastoParaAjustar.value.id, dados)
  showModalAjustar.value = false
  gastoParaAjustar.value = null
  await useCartoesEFaturas().inicializar()
}
```

No template, atualize a tag `<ActivityFeed>` para escutar o evento `@ajustarGasto`:
```vue
    <div class="mt-8">
      <ActivityFeed 
        :gastos="globalGastos"
        :membros="props.membros"
        :is-month-locked="isMonthLocked"
        @desfazerGasto="excluirGasto"
        @ajustarGasto="abrirAjustarGasto"
      />
    </div>
```

E no fim do template, adicione o modal:
```vue
    <ModalAjustarGasto 
      :visible="showModalAjustar"
      :gasto="gastoParaAjustar"
      :membros="props.membros"
      :cartoes="props.cartoes"
      @cancel="showModalAjustar = false"
      @save="confirmarAjusteGasto"
    />
```

- [ ] **Step 4: Criar teste de regressão de clique em Ajustar**
Adicione um teste unitário em `src/components/ledger/DashboardSaldos.test.ts` para garantir que o fluxo de abertura do modal de ajuste ocorra corretamente.

```typescript
  it('deve disparar a abertura do modal de ajuste ao clicar no botao de ajustar', async () => {
    const wrapper = mount(DashboardSaldos, {
      props: {
        membros: [{ id: 'm1', nome: 'João' }, { id: 'm2', nome: 'Maria' }],
        faturasFechadas: [] as any,
        acertosPendentes: [] as any,
        faturasAbertas: [{ id: 'f1', cartaoId: 'c1', responsavelId: 'm1', status: 'ABERTA', periodo: { mes: 6, ano: 2026 } }] as any,
        cartoes: [{ id: 'c1', nome: 'Nubank', responsavelPadraoId: 'm1' }] as any,
        calcularConsumo: () => 0,
        gastos: [] as any
      }
    })

    const { useCartoesEFaturas } = await import('../../modules/ledger/composables/useCartoesEFaturas')
    const { Dinheiro } = await import('../../../shared/primitives/Dinheiro')
    const { Gasto } = await import('../../modules/ledger/core/domain/Gasto')
    const { DivisaoDeGasto } = await import('../../modules/ledger/core/domain/DivisaoDeGasto')

    const mockG = new Gasto({
      id: 'g-teste-feed',
      faturaId: 'f1',
      descricao: 'Lanche Barato',
      valorTotal: Dinheiro.deCentavos(1000),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deCentavos(1000))]
    })

    useCartoesEFaturas().gastos.value = [mockG]
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Lanche Barato')
    expect(wrapper.text()).toContain('Ajustar')
  })
```

- [ ] **Step 5: Rodar testes**
Execute a suíte de testes de componentes para atestar que os modais e botões continuam operando e compilando.

Run: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git add src/components/ledger/ModalAjustarGasto.vue src/components/ledger/ActivityFeed.vue src/components/ledger/DashboardSaldos.vue src/components/ledger/DashboardSaldos.test.ts
git commit -m "feat(ui): implementar ModalAjustarGasto completo e botão Ajustar no feed de lançamentos"
```

---

### Task 3: Quadro de Detalhamento Granular de Saldos por Coluna

**Files:**
- Create: `src/components/ledger/dashboard/DetalhamentoSaldosCard.vue`
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Step 1: Criar o componente `DetalhamentoSaldosCard.vue`**
Desenhe um card com estilo vidro e desfoque imersivo contendo o detalhamento completo de lançamentos por morador: saldo de PIX Feito/Consumido, saldo de Cartão Feito/Consumido, e Empréstimos Feitos/Tomados, garantindo 100% de transparência nas finanças residenciais.

Create: `src/components/ledger/dashboard/DetalhamentoSaldosCard.vue`
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { Gasto } from '../../../modules/ledger/core/domain/Gasto'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'

interface Props {
  membros: { id: string; nome: string }[]
  gastos: Gasto[]
  saldosUnificados: Record<string, number>
}

const props = defineProps<Props>()

const formatarBRL = (centavos: number) => {
  return (centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const detailedBreakdown = computed(() => {
  const breakdown: Record<string, {
    pixFez: number
    pixConsumo: number
    cardFez: number
    cardConsumo: number
    loanFez: number
    loanTomou: number
  }> = {}

  props.membros.forEach(m => {
    breakdown[m.id] = { pixFez: 0, pixConsumo: 0, cardFez: 0, cardConsumo: 0, loanFez: 0, loanTomou: 0 }
  })

  props.gastos.forEach(g => {
    const valorParcela = g.valorTotal.centavos / g.installments
    
    if (g.isLoan) {
      if (g.compradorId && breakdown[g.compradorId]) {
        breakdown[g.compradorId].loanFez += valorParcela
      }
      if (g.borrowerId && breakdown[g.borrowerId]) {
        breakdown[g.borrowerId].loanTomou += valorParcela
      }
    } else {
      if (g.method === 'pix' || g.isSettlement) {
        if (g.compradorId && breakdown[g.compradorId]) {
          breakdown[g.compradorId].pixFez += valorParcela
        }
        g.divisoes.forEach(d => {
          if (breakdown[d.membroId]) {
            breakdown[d.membroId].pixConsumo += valorParcela / g.divisoes.length
          }
        })
      } else {
        const pagadorId = g.cardOwner || g.compradorId
        if (pagadorId && breakdown[pagadorId]) {
          breakdown[pagadorId].cardFez += valorParcela
        }
        g.divisoes.forEach(d => {
          if (breakdown[d.membroId]) {
            breakdown[d.membroId].cardConsumo += valorParcela / g.divisoes.length
          }
        })
      }
    }
  })

  return breakdown
})
</script>

<template>
  <div class="glass-card rounded-3xl p-6 shadow-2xl text-divi-t1 space-y-5 border border-divi-border/50">
    <div>
      <h3 class="text-xs font-black text-divi-t3 uppercase tracking-widest block mb-0.5">
        🔍 Detalhamento Granular de Contas
      </h3>
      <p class="text-[10px] text-divi-t3">Auditoria de fluxos de caixa de PIX, Cartão e Empréstimos por morador</p>
    </div>

    <div class="space-y-6">
      <div 
        v-for="m in props.membros" 
        :key="m.id" 
        class="border-b border-divi-border/40 pb-5 last:border-b-0 last:pb-0"
      >
        <div class="flex justify-between items-center mb-3">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full bg-divi-s2 border border-divi-border text-divi-t1 flex items-center justify-center font-black text-xs uppercase">
              {{ m.nome[0] }}
            </div>
            <span class="font-extrabold text-sm text-divi-t1">{{ m.nome }}</span>
          </div>
          <span 
            class="text-[10px] font-black px-2.5 py-1 rounded-full uppercase"
            :class="props.saldosUnificados[m.id] > 0.005 ? 'bg-divi-emerald-dim text-divi-emerald' : props.saldosUnificados[m.id] < -0.005 ? 'bg-divi-rose-dim text-divi-rose' : 'bg-divi-s2 text-divi-t3'"
          >
            Saldo: {{ props.saldosUnificados[m.id] > 0.005 ? '+' : '' }}R$ {{ props.saldosUnificados[m.id]?.toFixed(2).replace('.', ',') }}
          </span>
        </div>

        <div class="grid grid-cols-3 gap-2.5 text-[11px] leading-relaxed">
          <div class="bg-slate-950/20 border border-divi-border/30 rounded-xl p-2.5 space-y-1">
            <span class="block text-[9px] font-black uppercase text-divi-primary mb-1">💵 PIX</span>
            <div class="flex justify-between">
              <span class="text-divi-t3">Fez:</span>
              <span class="text-divi-emerald font-extrabold">+{{ formatarBRL(detailedBreakdown[m.id]?.pixFez || 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-divi-t3">Usou:</span>
              <span class="text-divi-rose font-extrabold">-{{ formatarBRL(detailedBreakdown[m.id]?.pixConsumo || 0) }}</span>
            </div>
          </div>

          <div class="bg-slate-950/20 border border-divi-border/30 rounded-xl p-2.5 space-y-1">
            <span class="block text-[9px] font-black uppercase text-divi-primary mb-1">💳 Cartão</span>
            <div class="flex justify-between">
              <span class="text-divi-t3">Fez:</span>
              <span class="text-divi-emerald font-extrabold">+{{ formatarBRL(detailedBreakdown[m.id]?.cardFez || 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-divi-t3">Usou:</span>
              <span class="text-divi-rose font-extrabold">-{{ formatarBRL(detailedBreakdown[m.id]?.cardConsumo || 0) }}</span>
            </div>
          </div>

          <div class="bg-slate-950/20 border border-divi-border/30 rounded-xl p-2.5 space-y-1">
            <span class="block text-[9px] font-black uppercase text-divi-primary mb-1">🤝 Empréstimo</span>
            <div class="flex justify-between">
              <span class="text-divi-t3">Fez:</span>
              <span class="text-divi-emerald font-extrabold">+{{ formatarBRL(detailedBreakdown[m.id]?.loanFez || 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-divi-t3">Tomou:</span>
              <span class="text-divi-rose font-extrabold">-{{ formatarBRL(detailedBreakdown[m.id]?.loanTomou || 0) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Adicionar `DetalhamentoSaldosCard` no template do Dashboard**
Substitua e insira o novo card de detalhamento granular logo abaixo do painel de Saldo Real Unificado no `src/components/ledger/DashboardSaldos.vue`.

Importe o componente:
```typescript
import DetalhamentoSaldosCard from './dashboard/DetalhamentoSaldosCard.vue'
```

E renderize o card logo abaixo do Painel de Saldo Real:
```vue
    <DetalhamentoSaldosCard 
      :membros="props.membros"
      :gastos="globalGastos"
      :saldosUnificados="saldosUnificadosAtivos"
    />
```

- [ ] **Step 3: Rodar testes**
Assegure que a adição do componente não alterou a robustez da renderização.

Run: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add src/components/ledger/dashboard/DetalhamentoSaldosCard.vue src/components/ledger/DashboardSaldos.vue
git commit -m "feat(ui): adicionar painel DetalhamentoSaldosCard para auditoria de fluxos de caixa"
```

---

### Task 4: Polimento de Micro-ações, Efeito Shake e Validações no Wizard

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`
- Modify: `src/components/ledger/NovoLancamentoWizard.test.ts`

- [ ] **Step 1: Adicionar classe de Shake e avisos cognitivos no Wizard**
Adicione suporte visual a animações CSS de erro quando o usuário tenta pular ou avançar passos cruciais sem preencher dados obrigatórios.

Abra `src/components/ledger/NovoLancamentoWizard.vue` e adicione estes refs:

```typescript
const descShakeActive = ref(false)
const showDescErrorBubble = ref(false)

const triggerDescError = () => {
  descShakeActive.value = true
  showDescErrorBubble.value = true
  setTimeout(() => {
    descShakeActive.value = false
  }, 500)
}
```

Atualize a função `next` do setup para executar validações estritas nos passos correspondentes:
```typescript
const next = () => {
  if (step.value === 4 && wizFlow.value === 'expense' && !descricao.value.trim()) {
    triggerDescError()
    return
  }
  if (step.value === 3 && wizFlow.value === 'expense' && valor.value <= 0) {
    return
  }
  step.value++
}
```

E atualize o template do passo de descrição para aplicar a classe de shake e exibir o balão de erro como no protótipo:
```vue
      <!-- Passo de Descrição / Lembrete -->
      <div v-else-if="(step === 4 && wizFlow === 'expense') || (step === 3 && wizFlow === 'loan')" class="space-y-6">
        <h2 class="text-lg font-black text-divi-t1 text-center tracking-tight" id="dynamic-category-question">
          {{ wizFlow === 'loan' ? 'Lembrete do Empréstimo' : 'O que você pagou?' }}
        </h2>
        
        <div 
          class="space-y-4"
          :class="{ 'animate-[shake_0.4s_ease-in-out]': descShakeActive }"
        >
          <div class="relative">
            <input 
              v-model="descricao"
              type="text"
              :placeholder="wizFlow === 'loan' ? 'Ex: Pagar a conta de luz dele, Pix rápido...' : 'Ex: Supermercado, Almoço, Farmácia...'"
              class="glass-input w-full p-4 rounded-2xl text-center text-sm font-bold focus:outline-none focus:border-divi-primary shadow-sm"
              :class="{ 'border-divi-rose focus:border-divi-rose focus:box-shadow-none': showDescErrorBubble }"
              @input="showDescErrorBubble = false"
              autofocus
            />
            <span 
              v-if="showDescErrorBubble"
              class="absolute -top-6 left-1/2 -translate-x-1/2 bg-divi-rose text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-lg"
            >
              ⚠️ Digite um nome!
            </span>
          </div>

          <div v-if="!descricao.trim()" class="flex justify-center gap-2 flex-wrap max-w-sm mx-auto">
            <button 
              v-for="chip in quickChips" 
              :key="chip"
              type="button"
              @click="selecionarChip(chip)"
              class="text-[10px] font-bold bg-divi-s2 border border-divi-border hover:bg-divi-s3 text-divi-t1 py-2 px-3.5 rounded-full transition-all active:scale-95"
            >
              {{ chip }}
            </button>
          </div>
        </div>
      </div>
```

Adicione o estilo de animação `@keyframes shake` na base do arquivo, dentro da tag `<style scoped>`:
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}
.animate-\[shake_0\.4s_ease-in-out\] {
  animation: shake 0.4s ease-in-out;
}
```

- [ ] **Step 2: Rodar testes unitários do Wizard**
Garanta que as modificações no Wizard mantêm o fluxo de teste e navegação 100% íntegro.

Run: `npx vitest run src/components/ledger/NovoLancamentoWizard.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add src/components/ledger/NovoLancamentoWizard.vue
git commit -m "style(ui): adicionar efeito Shake e validações de erro visual no Wizard"
```

---

### Task 5: Validação Geral da Aplicação

- [ ] **Step 1: Rodar a suíte completa de testes do sistema**
Execute todos os testes unitários e de renderização da aplicação para assegurar ausência de regressões matemáticas ou visuais.

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 2: Commit do plano finalizado**
```bash
git add docs/superpowers/plans/2026-05-17-integracao-fluxo-senior-v19.md
git commit -m "docs: finalizar plano de integração premium do fluxo sênior v19"
```
