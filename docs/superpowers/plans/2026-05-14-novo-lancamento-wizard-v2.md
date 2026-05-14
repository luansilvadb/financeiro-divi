# Wizard de Novo Lançamento V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the current wizard into a 3-step premium experience with a progress bar, merged fields, and a sticky footer.

**Architecture:** Refactor `NovoLancamentoWizard.vue` using Vue 3 Composition API. Implement a "Progress Fill" stepper and a "Sticky Footer" for navigation. The flow is: 1. Intent (Auto-advance), 2. Basic Data (Amount + Desc), 3. Split/Participants.

**Tech Stack:** Vue 3, TypeScript, Tailwind CSS, Lucide Icons.

---

### Task 1: Scaffolding and UI Components

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Setup new state and basic template structure**
Update the state to reflect 3 steps and the new UI requirements.

```typescript
// src/components/ledger/NovoLancamentoWizard.vue (script section)
const step = ref(1)
const totalSteps = 3
// ... other state remains similar or updated to v2
```

- [ ] **Step 2: Implement Progress Fill Component**
Add a reactive progress bar at the top of the wizard.

```vue
<!-- Inside src/components/ledger/NovoLancamentoWizard.vue template -->
<div class="w-full h-1 bg-gray-100 mb-6 overflow-hidden rounded-full">
  <div 
    class="h-full bg-blue-500 transition-all duration-500 ease-out"
    :style="{ width: `${(step / totalSteps) * 100}%` }"
  ></div>
</div>
<div class="text-[10px] uppercase font-bold text-gray-400 mb-4 text-center">
  Passo {{ step }} de {{ totalSteps }}
</div>
```

- [ ] **Step 3: Implement Sticky Footer Component**
Ensure navigation buttons stay at the bottom.

```vue
<!-- Inside src/components/ledger/NovoLancamentoWizard.vue template -->
<div class="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 flex gap-3 md:relative md:bg-transparent md:border-none md:p-0 md:mt-8">
  <button v-if="step > 1" @click="prevStep" class="flex-1 px-6 py-4 bg-gray-50 text-gray-500 font-bold rounded-2xl">
    Voltar
  </button>
  <button 
    v-if="step < totalSteps" 
    @click="nextStep" 
    :disabled="!canAdvance"
    class="flex-1 px-6 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 disabled:opacity-50"
  >
    Próximo
  </button>
  <button 
    v-else 
    @click="finalizar" 
    class="flex-1 px-6 py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg shadow-green-200"
  >
    Salvar
  </button>
</div>
```

- [ ] **Step 4: Commit**
`git add src/components/ledger/NovoLancamentoWizard.vue && git commit -m "feat: scaffold wizard v2 with progress bar and sticky footer"`

---

### Task 2: Step 1 - Intent with Auto-advance

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Update Step 1 Template**
Implement the "Gasto" and "Ganho" buttons with immediate `nextStep()` call.

```vue
<div v-if="step === 1" class="space-y-4">
  <h2 class="text-2xl font-black text-gray-800 mb-6">O que vamos registrar?</h2>
  <button @click="tipo = 'gasto'; nextStep()" class="w-full p-6 text-left border-2 border-gray-100 rounded-3xl hover:border-red-500 transition-all group flex items-center gap-4">
    <span class="text-4xl bg-red-50 p-3 rounded-2xl">💸</span>
    <div>
      <span class="block font-bold text-gray-800">Um Gasto</span>
      <span class="text-sm text-gray-400">Dinheiro saindo</span>
    </div>
  </button>
  <button @click="tipo = 'ganho'; nextStep()" class="w-full p-6 text-left border-2 border-gray-100 rounded-3xl hover:border-green-500 transition-all group flex items-center gap-4">
    <span class="text-4xl bg-green-50 p-3 rounded-2xl">💰</span>
    <div>
      <span class="block font-bold text-gray-800">Um Ganho</span>
      <span class="text-sm text-gray-400">Dinheiro entrando</span>
    </div>
  </button>
</div>
```

- [ ] **Step 2: Commit**
`git add src/components/ledger/NovoLancamentoWizard.vue && git commit -m "feat: implement wizard step 1 with auto-advance"`

---

### Task 3: Step 2 - Merged Value and Description

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Update Step 2 Template**
Combine amount and description inputs.

```vue
<div v-else-if="step === 2" class="space-y-8">
  <div class="text-center">
    <span class="text-sm font-bold text-gray-400 uppercase">Valor</span>
    <div class="flex items-center justify-center text-5xl font-black text-blue-600">
      <span class="text-2xl mr-1 text-blue-300 font-medium">R$</span>
      <input 
        v-model.number="valor" 
        type="number" 
        step="0.01"
        class="bg-transparent border-none focus:outline-none w-48 text-center"
        placeholder="0,00"
        autofocus
      />
    </div>
  </div>
  
  <div class="space-y-2">
    <label class="text-sm font-bold text-gray-400 uppercase">Descrição</label>
    <input 
      v-model="descricao" 
      type="text" 
      class="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-lg font-medium"
      placeholder="No que foi?"
    />
  </div>
</div>
```

- [ ] **Step 2: Implement `canAdvance` computed property**
Ensure validation for Step 2.

```typescript
const canAdvance = computed(() => {
  if (step.value === 2) return valor.value > 0 && descricao.value.length > 0
  return true
})
```

- [ ] **Step 3: Commit**
`git add src/components/ledger/NovoLancamentoWizard.vue && git commit -m "feat: implement merged step 2 for value and description"`

---

### Task 4: Step 3 - Unified Split and Participants

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Update Step 3 Template**
Show the participant grid directly. Remove the "Solo/Split" intermediate question.

```vue
<div v-else-if="step === 3" class="space-y-6">
  <h2 class="text-xl font-bold text-gray-800">Quem participa?</h2>
  <div class="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
    <div 
      v-for="membro in membros" 
      :key="membro.id"
      @click="toggleBeneficiario(membro.id)"
      class="flex flex-col items-center gap-2 cursor-pointer min-w-[72px]"
    >
      <div :class="['w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl border-4 transition-all', beneficiarios_selecionados.includes(membro.id) ? 'bg-blue-600 border-blue-100 text-white scale-110' : 'bg-gray-100 border-transparent text-gray-400']">
        {{ membro.nome.charAt(0) }}
      </div>
      <span class="text-xs font-bold text-gray-500">{{ membro.nome.split(' ')[0] }}</span>
    </div>
  </div>

  <div class="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex justify-between items-center">
    <div>
      <span class="block text-[10px] font-bold text-blue-400 uppercase">Cada um paga</span>
      <span class="text-2xl font-black text-blue-700">R$ {{ (valor / (beneficiarios_selecionados.length || 1)).toFixed(2) }}</span>
    </div>
    <div class="text-right">
       <span class="block text-[10px] font-bold text-blue-400 uppercase">Participantes</span>
       <span class="text-xl font-bold text-blue-700">{{ beneficiarios_selecionados.length }}</span>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Update Finalize Logic**
Since "Quem pagou" was removed from UI, default `fonte_id` to 'eu' and ensure all selected participants are in the division.

- [ ] **Step 3: Commit**
`git add src/components/ledger/NovoLancamentoWizard.vue && git commit -m "feat: implement unified participant selection in step 3"`
