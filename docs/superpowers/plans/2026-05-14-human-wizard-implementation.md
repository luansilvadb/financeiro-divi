# Wizard Conversacional e Humano Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the "Novo Lancamento" Wizard into a conversational and human-friendly interview experience, following the approved design in `2026-05-14-human-wizard-design.md`.

**Architecture:** Refactor `NovoLancamentoWizard.vue` to use a step-by-step conversational template. Update the state to handle "Gasto" vs "Ganho" and map the new natural options to the domain entities.

**Tech Stack:** Vue 3, TypeScript, Lucide Icons, Tailwind CSS.

---

### Task 1: Update State and Step 1 (O Início)

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Update state and storage logic**
Add `tipo` ('gasto' | 'ganho') to the ref state and update the `watch` and `onMounted` logic to persist it.

```typescript
const tipo = ref<'gasto' | 'ganho'>('gasto')
// ... update watch and onMounted ...
```

- [ ] **Step 2: Refactor Template for Step 1**
Replace the Step 1 UI with the "Você quer anotar um gasto ou um ganho?" question and large emoji buttons.

```vue
<div v-if="step === 1">
  <h2 class="text-xl font-bold mb-6 text-gray-800 text-center">Você quer anotar um gasto ou um ganho?</h2>
  <div class="grid grid-cols-1 gap-4">
    <button 
      @click="tipo = 'gasto'; nextStep()"
      class="flex items-center justify-between p-4 border-2 border-red-100 rounded-2xl hover:border-red-500 hover:bg-red-50 transition-all group"
    >
      <div class="flex items-center gap-4">
        <span class="text-3xl">💸</span>
        <div class="text-left">
          <span class="block font-bold text-gray-800">Um gasto</span>
          <span class="text-xs text-gray-500">Ex: Pizza, Aluguel, Uber</span>
        </div>
      </div>
      <ArrowRight class="w-5 h-5 text-gray-300 group-hover:text-red-500" />
    </button>
    <button 
      @click="tipo = 'ganho'; nextStep()"
      class="flex items-center justify-between p-4 border-2 border-green-100 rounded-2xl hover:border-green-500 hover:bg-green-50 transition-all group"
    >
      <div class="flex items-center gap-4">
        <span class="text-3xl">💰</span>
        <div class="text-left">
          <span class="block font-bold text-gray-800">Um ganho</span>
          <span class="text-xs text-gray-500">Ex: Salário, Reembolso</span>
        </div>
      </div>
      <ArrowRight class="w-5 h-5 text-gray-300 group-hover:text-green-500" />
    </button>
  </div>
</div>
```

- [ ] **Step 3: Commit**
`git add src/components/ledger/NovoLancamentoWizard.vue && git commit -m "feat(wizard): implement conversational step 1"`

---

### Task 2: Step 2 and 3 (Valor e Motivo)

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Refactor Step 2 (Valor)**
Update the question to be contextual: "Qual é o valor desse gasto?" or "Qual o valor que você recebeu?".

- [ ] **Step 2: Refactor Step 3 (Motivo)**
Update the question to be contextual and more human: "Me conta, o que você pagou?".

```vue
<div v-else-if="step === 3">
  <h2 class="text-xl font-bold mb-4 text-gray-800">
    {{ tipo === 'gasto' ? 'Me conta, o que você pagou?' : 'Me conta, de onde veio esse dinheiro?' }}
  </h2>
  <!-- ... input with friendly placeholder ... -->
</div>
```

- [ ] **Step 3: Commit**
`git add src/components/ledger/NovoLancamentoWizard.vue && git commit -m "feat(wizard): implement conversational steps 2 and 3"`

---

### Task 3: Step 4 (Quem vai pagar?)

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Refactor Step 4 UI**
Implement the 3 natural options: "Eu mesmo!", "Eu paguei para um amigo", "Um amigo pagou para mim".

- [ ] **Step 2: Add sub-step for Member Selection**
If option 2 or 3 is chosen, show a member selection list before proceeding.

- [ ] **Step 3: Commit**
`git add src/components/ledger/NovoLancamentoWizard.vue && git commit -m "feat(wizard): implement human-friendly step 4 logic"`

---

### Task 4: Step 5 and Finalization

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Refactor Step 5 (Aproveitamento)**
Update the question: "Além de você, quem mais aproveitou isso?" and add the explanatory subtext.

- [ ] **Step 2: Update `finalizar` logic**
Map the conversational choices to `origem_id` and `divisoes` correctly based on the spec mapping table in `2026-05-14-human-wizard-design.md`.

- [ ] **Step 3: Commit**
`git add src/components/ledger/NovoLancamentoWizard.vue && git commit -m "feat(wizard): complete human-friendly wizard implementation"`

---

### Task 5: Verification

- [ ] **Step 1: Run build**
`npm run build` or `vue-tsc` to ensure no regressions.

- [ ] **Step 2: Manual Verification**
Verify the flow in the browser and ensure `localStorage` drafts are correctly restored for the new `tipo` state.
