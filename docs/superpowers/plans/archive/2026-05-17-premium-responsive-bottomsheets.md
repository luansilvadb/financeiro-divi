# Premium Responsive Bottomsheets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform all 5 modals into premium responsive bottom-sheets that animate fluidly, using grabber handles on mobile devices, while keeping beautiful center modals on desktop, aligned with DESIGN.md.

**Architecture:** Modify the viewport wrapping structure to support centering on desktop (`sm:items-center sm:p-6`) and bottom-docking on mobile (`items-end p-0`), adding native-feeling sliding transitions (`animate-in slide-in-from-bottom duration-250`) and a drag/pull bar grabber at the top.

**Tech Stack:** Vue 3, TailwindCSS, Lucide-Vue-Next

---

### Task 1: Responsive Bottom-sheet for `ModalAjustarGasto.vue`

**Files:**
- Modify: `src/components/ledger/ModalAjustarGasto.vue`
- Test: `src/components/ledger/DashboardSaldos.test.ts`

- [ ] **Step 1: Update the modal container and styling in `ModalAjustarGasto.vue`**

Implement standard CSS variables and responsive classes:
```vue
<template>
  <div 
    v-if="props.visible" 
    class="fixed inset-0 bg-midnight/80 backdrop-blur-sm flex justify-center sm:items-center items-end z-[9999] sm:p-6 p-0 animate-in fade-in duration-200"
  >
    <!-- Modal Card Container: Bottom-sheet no Mobile, Modal Centralizado no Desktop -->
    <div 
      class="w-full sm:max-w-md overflow-hidden bg-card border-t sm:border border-stone-surface rounded-t-cardsLarge sm:rounded-cards shadow-lg flex flex-col max-h-[92vh] text-graphite animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-250"
    >
      <!-- Pull-to-dismiss handle (mobile-only grabber bar) -->
      <div class="sm:hidden w-12 h-1 bg-stone-surface rounded-full mx-auto my-3 shrink-0"></div>

      <div class="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
        <div class="space-y-2 text-center">
          <SectionLabel class="mx-auto">Ajuste</SectionLabel>
          <h3 class="text-3xl font-display text-charcoal">Corrigir <span class="text-ember">Lançamento</span></h3>
        </div>

        <div class="space-y-6">
          <!-- Descrição -->
          <div class="space-y-2">
            <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Descrição</label>
            <input 
              type="text" 
              v-model="descInput" 
              class="w-full px-4 py-3 rounded-xl border border-stone bg-[#fbfaf9] outline-none font-bold text-sm text-charcoal focus:border-ember transition-all" 
              placeholder="Ex: Supermercado"
            />
          </div>

          <!-- Valor Real -->
          <div class="space-y-2">
            <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Valor Total</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-ash text-sm font-bold">R$</span>
              <input 
                v-model.number="valorInput"
                type="number"
                step="0.01"
                class="w-full pl-10 pr-4 py-3 rounded-xl border border-stone bg-[#fbfaf9] outline-none font-bold text-lg text-charcoal focus:border-ember transition-all"
                placeholder="0,00"
              />
            </div>
          </div>

          <!-- Canal de Pagamento -->
          <div v-if="!props.gasto?.isLoan" class="space-y-2">
            <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Método / Cartão</label>
            <div class="grid grid-cols-3 gap-2">
              <button 
                @click="selectMethod('pix', null)"
                class="flex flex-col items-center gap-2 py-3 rounded-xl border transition-all duration-200"
                :class="activeMethod === 'pix' ? 'bg-midnight text-white font-bold border-stone-surface shadow-sm' : 'bg-[#f6f4ef] hover:bg-stone-surface text-charcoal border border-stone-surface'"
              >
                <Wallet class="w-4 h-4" />
                <span class="text-[9px] font-bold uppercase tracking-wider">Pix</span>
              </button>
              <button 
                @click="selectMethod('card', 'luan')"
                class="flex flex-col items-center gap-2 py-3 rounded-xl border transition-all duration-200"
                :class="activeMethod === 'card' && activeCardOwner === 'luan' ? 'bg-midnight text-white font-bold border-stone-surface shadow-sm' : 'bg-[#f6f4ef] hover:bg-stone-surface text-charcoal border border-stone-surface'"
              >
                <CreditCard class="w-4 h-4" />
                <span class="text-[9px] font-bold uppercase tracking-wider">Nubank</span>
              </button>
              <button 
                @click="selectMethod('card', 'joao')"
                class="flex flex-col items-center gap-2 py-3 rounded-xl border transition-all duration-200"
                :class="activeMethod === 'card' && activeCardOwner === 'joao' ? 'bg-midnight text-white font-bold border-stone-surface shadow-sm' : 'bg-[#f6f4ef] hover:bg-stone-surface text-charcoal border border-stone-surface'"
              >
                <CreditCard class="w-4 h-4" />
                <span class="text-[9px] font-bold uppercase tracking-wider">C6</span>
              </button>
            </div>
          </div>

          <!-- Quem pagou -->
          <div class="space-y-2">
            <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">
              {{ props.gasto?.isLoan ? 'Quem emprestou?' : activeMethod === 'pix' ? 'Quem fez o Pix?' : `Quem passou no cartão?` }}
            </label>
            <div class="grid grid-cols-3 gap-2">
              <button 
                v-for="m in props.membros"
                :key="m.id"
                @click="quemPaga = m.id"
                class="py-3 rounded-xl border font-bold text-xs transition-all duration-200"
                :class="quemPaga === m.id ? 'bg-midnight text-white font-bold border-stone-surface shadow-sm' : 'bg-[#f6f4ef] hover:bg-stone-surface text-charcoal border border-stone-surface'"
              >
                {{ m.nome }}
              </button>
            </div>
          </div>

          <!-- Participantes (Split) -->
          <div v-if="!props.gasto?.isLoan" class="space-y-2">
            <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Dividir com</label>
            <div class="grid grid-cols-3 gap-2">
              <button 
                v-for="m in props.membros"
                :key="m.id"
                @click="toggleSplit(m.id)"
                class="relative py-4 rounded-xl border font-bold text-xs transition-all duration-200 flex flex-col items-center gap-2"
                :class="selectedSplit.includes(m.id) ? 'bg-[#ff3e00]/5 border-[#ff3e00] text-[#ff3e00] font-bold' : 'bg-[#f6f4ef] border-stone-surface text-ash hover:bg-stone-surface'"
              >
                <Users class="w-4 h-4" />
                <span>{{ m.nome }}</span>
                <div v-if="selectedSplit.includes(m.id)" class="absolute top-1.5 right-1.5">
                  <Check class="w-3 h-3 text-[#ff3e00]" />
                </div>
              </button>
            </div>
          </div>

          <!-- Quadro Final / Prévia do Rateio -->
          <div v-if="!props.gasto?.isLoan" class="flex gap-4 p-4 rounded-xl bg-meadow-green/5 border border-meadow-green/20 text-meadow-green">
            <Info class="w-5 h-5 shrink-0 mt-0.5" />
            <div class="space-y-1">
              <p class="text-[10px] font-bold uppercase tracking-widest">Resumo do Rateio</p>
              <p class="text-xs font-semibold leading-relaxed">{{ calculatedSharesDesc }}</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 pt-4 border-t border-stone-surface">
          <Button variant="secondary" @click="emit('cancel')">Voltar</Button>
          <Button variant="primary" @click="handleConfirm" :disabled="!descInput.trim() || valorInput <= 0">Salvar</Button>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Run tests to verify `ModalAjustarGasto.vue` compiles and functions properly**

Run: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`
Expected: FAIL

- [ ] **Step 3: Commit changes**

```bash
git add src/components/ledger/ModalAjustarGasto.vue
git commit -m "design: make ModalAjustarGasto responsive bottomsheet on mobile"
```

---

### Task 2: Responsive Bottom-sheet for `ModalConfigurarContaFixa.vue`

**Files:**
- Modify: `src/components/ledger/ModalConfigurarContaFixa.vue`
- Test: `src/modules/ledger/composables/useContasFixas.test.ts`

- [ ] **Step 1: Make `ModalConfigurarContaFixa.vue` responsive bottom-sheet**

Modify the template block to wrap the modal card with responsive bottom-sheet styles:
```vue
<template>
  <div 
    v-if="visible" 
    class="fixed inset-0 bg-midnight/80 backdrop-blur-sm flex justify-center sm:items-center items-end z-[9999] sm:p-6 p-0 animate-in fade-in duration-200"
  >
    <!-- Modal Card Container: Bottom-sheet no Mobile, Modal Centralizado no Desktop -->
    <div 
      class="w-full sm:max-w-[420px] overflow-hidden bg-card border-t sm:border border-stone-surface rounded-t-cardsLarge sm:rounded-cards shadow-lg flex flex-col max-h-[92vh] text-graphite animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-250"
    >
      <!-- Pull-to-dismiss handle (mobile-only grabber bar) -->
      <div class="sm:hidden w-12 h-1 bg-stone-surface rounded-full mx-auto my-3 shrink-0"></div>

      <div class="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
        <h3 class="text-xl font-display text-charcoal flex items-center gap-2 mb-2">
          ⚙️ Configurar Conta Fixa
        </h3>

        <!-- Nome -->
        <div class="space-y-2">
          <label class="block text-[10px] font-bold uppercase tracking-widest text-ash">Nome do Talão</label>
          <input 
            v-model="name" 
            type="text" 
            class="w-full px-4 py-3 rounded-xl border border-stone bg-[#fbfaf9] outline-none font-bold text-charcoal focus:border-ember transition-all text-sm" 
          />
        </div>

        <!-- Emoji Selector -->
        <div class="space-y-2">
          <label class="block text-[10px] font-bold uppercase tracking-widest text-ash">Emoji / Ícone</label>
          <div class="flex gap-2 flex-wrap justify-start">
            <button 
              v-for="e in ['🔑','💡','💧','🌐','🐶','🔥','🛒','🍔','🚗','💊']" 
              :key="e"
              @click="icon = e"
              class="text-2xl p-2.5 rounded-xl border transition-all duration-150"
              :class="icon === e ? 'bg-midnight text-white scale-105 shadow-sm border border-stone-surface' : 'bg-[#f6f4ef] hover:bg-stone-surface border border-stone-surface text-charcoal'"
            >
              {{ e }}
            </button>
          </div>
        </div>

        <!-- Valor Fixo Sugerido -->
        <div class="space-y-2">
          <label class="block text-[10px] font-bold uppercase tracking-widest text-ash">Valor Sugerido Padrão (Opcional)</label>
          <input 
            v-model.number="fixedValue" 
            type="number" 
            step="0.01" 
            class="w-full px-4 py-3 rounded-xl border border-stone bg-[#fbfaf9] outline-none font-bold text-charcoal focus:border-ember transition-all text-sm" 
            placeholder="Ex: 150,00" 
          />
        </div>

        <!-- Divisão Padrão -->
        <div class="space-y-2">
          <label class="block text-[10px] font-bold uppercase tracking-widest text-ash">Quem divide por padrão?</label>
          <div class="flex gap-2 flex-wrap">
            <button 
              v-for="m in membros" 
              :key="m.id"
              @click="toggleSplit(m.id)"
              class="px-4 py-2.5 rounded-xl border font-bold text-xs transition-all duration-200"
              :class="defaultSplit.includes(m.id) ? 'bg-midnight text-white font-bold border border-stone-surface shadow-sm' : 'bg-[#f6f4ef] hover:bg-stone-surface border border-stone-surface text-charcoal'"
            >
              {{ m.nome }}
            </button>
          </div>
        </div>

        <div class="flex justify-between items-center flex-wrap gap-3 pt-2 border-t border-stone-surface">
          <button 
            v-if="bill?.id" 
            @click="$emit('delete', bill.id)" 
            class="px-4 py-3 text-xs font-bold bg-[#fff0f0] hover:bg-[#ffe5e5] text-coral-red border border-transparent rounded-xl transition-all"
          >
            🗑️ Excluir
          </button>
          <div class="flex gap-2 ml-auto">
            <button @click="$emit('cancel')" class="px-5 py-3 text-xs font-bold bg-[#f2f0ed] hover:bg-[#eae7e2] text-graphite border border-stone-surface rounded-xl transition-all">
              Cancelar
            </button>
            <button 
              @click="salvar" 
              class="px-5 py-3 text-xs font-bold bg-midnight border border-stone-surface hover:bg-charcoal-primary text-white rounded-xl shadow-sm transition-all" 
              :disabled="!name"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Run tests to verify the component works**

Run: `npx vitest run src/modules/ledger/composables/useContasFixas.test.ts`
Expected: PASS

- [ ] **Step 3: Commit changes**

```bash
git add src/components/ledger/ModalConfigurarContaFixa.vue
git commit -m "design: make ModalConfigurarContaFixa responsive bottomsheet on mobile"
```

---

### Task 3: Responsive Bottom-sheet for `ModalAcertoCompensacao.vue`

**Files:**
- Modify: `src/components/ledger/dashboard/ModalAcertoCompensacao.vue`
- Test: `src/modules/ledger/core/services/AcertoService.test.ts`

- [ ] **Step 1: Make `ModalAcertoCompensacao.vue` responsive bottom-sheet**

Modify the template:
```vue
<template>
  <div 
    v-if="visible" 
    class="fixed inset-0 bg-midnight/80 backdrop-blur-sm flex justify-center sm:items-center items-end z-[9999] sm:p-6 p-0 animate-in fade-in duration-200"
  >
    <!-- Modal Card Container: Bottom-sheet no Mobile, Modal Centralizado no Desktop -->
    <div 
      class="w-full sm:max-w-md overflow-hidden bg-card border-t sm:border border-stone-surface rounded-t-cardsLarge sm:rounded-cards shadow-lg flex flex-col max-h-[92vh] text-graphite animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-250"
    >
      <!-- Pull-to-dismiss handle (mobile-only grabber bar) -->
      <div class="sm:hidden w-12 h-1 bg-stone-surface rounded-full mx-auto my-3 shrink-0"></div>

      <div class="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
        <div class="space-y-2 text-center">
          <SectionLabel class="mx-auto">Liquidação</SectionLabel>
          <h3 class="text-3xl font-display text-charcoal">Registrar <span class="text-ember">Acerto</span></h3>
          <p class="text-xs text-ash leading-relaxed">
            Confirmar a transferência entre moradores para equilibrar os saldos da casa.
          </p>
        </div>

        <div class="space-y-5">
          <!-- Valor Input -->
          <div class="space-y-2">
            <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Valor do Repasse</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-ash text-sm font-bold">R$</span>
              <input 
                v-model.number="valorReal"
                type="number"
                step="0.01"
                class="w-full pl-10 pr-4 py-3 rounded-xl border border-stone bg-[#fbfaf9] outline-none font-bold text-lg text-charcoal focus:border-ember transition-all"
                placeholder="0,00"
              />
            </div>
          </div>

          <!-- Descrição -->
          <div class="space-y-2">
            <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Descrição</label>
            <input 
              v-model="descricao"
              type="text"
              class="w-full px-4 py-3 rounded-xl border border-stone bg-[#fbfaf9] outline-none font-bold text-sm text-charcoal focus:border-ember transition-all"
            />
          </div>

          <!-- Método de Acerto -->
          <div class="space-y-2">
            <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Método de Baixa</label>
            <div class="grid grid-cols-3 gap-2">
              <button 
                v-for="m in [{id:'pix', n:'Pix', icon: Wallet}, {id:'cash', n:'Dinheiro', icon: Banknote}, {id:'mutual', n:'Ajuste', icon: RefreshCcw}]"
                :key="m.id"
                type="button"
                @click="method = m.id as any"
                class="flex flex-col items-center gap-2 py-3 rounded-xl border transition-all duration-200"
                :class="[
                  method === m.id 
                    ? 'bg-midnight text-white font-bold border-stone-surface shadow-sm' 
                    : 'bg-[#f6f4ef] border border-stone-surface text-charcoal hover:bg-stone-surface'
                ]"
              >
                <component :is="m.icon" class="w-4 h-4" />
                <span class="text-[10px] font-bold uppercase tracking-wider">{{ m.n }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Rodapé Ações -->
        <div class="grid grid-cols-2 gap-3 pt-4 border-t border-stone-surface">
          <Button variant="secondary" @click="emit('cancel')">Cancelar</Button>
          <Button variant="primary" @click="handleConfirmar" :disabled="valorReal <= 0">Confirmar</Button>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Run tests to verify**

Run: `npx vitest run src/modules/ledger/core/services/AcertoService.test.ts`
Expected: PASS

- [ ] **Step 3: Commit changes**

```bash
git add src/components/ledger/dashboard/ModalAcertoCompensacao.vue
git commit -m "design: make ModalAcertoCompensacao responsive bottomsheet on mobile"
```

---

### Task 4: Responsive Bottom-sheet for `ModalFecharFatura.vue`

**Files:**
- Modify: `src/components/ledger/dashboard/ModalFecharFatura.vue`
- Test: `src/components/ledger/DashboardSaldos.test.ts`

- [ ] **Step 1: Make `ModalFecharFatura.vue` responsive bottom-sheet**

Modify the template:
```vue
<template>
  <div 
    v-if="show && props.fatura" 
    class="fixed inset-0 bg-midnight/80 backdrop-blur-sm flex justify-center sm:items-center items-end z-[9999] sm:p-6 p-0 animate-in fade-in duration-200"
  >
    <!-- Modal Card Container: Bottom-sheet no Mobile, Modal Centralizado no Desktop -->
    <div 
      class="w-full sm:max-w-md overflow-hidden bg-card border-t sm:border border-stone-surface rounded-t-cardsLarge sm:rounded-cards shadow-lg flex flex-col max-h-[92vh] text-graphite animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-250"
    >
      <!-- Pull-to-dismiss handle (mobile-only grabber bar) -->
      <div class="sm:hidden w-12 h-1 bg-stone-surface rounded-full mx-auto my-3 shrink-0"></div>

      <div class="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
        <!-- Header -->
        <div class="flex justify-between items-start">
          <div class="space-y-2">
            <SectionLabel>Processamento</SectionLabel>
            <h3 class="text-3xl font-display text-charcoal">Fechar <span class="text-ember">Fatura</span></h3>
          </div>
          <Button variant="secondary" size="icon" @click="emit('close')" class="rounded-full border border-stone-surface">
            <X class="w-4 h-4 text-graphite" />
          </Button>
        </div>

        <!-- Info Box (Meadow Green) -->
        <div class="flex gap-4 p-4 rounded-xl bg-meadow-green/5 border border-meadow-green/20 text-meadow-green text-xs font-semibold leading-relaxed">
          <Info class="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            O membro escolhido será o responsável por quitar a fatura junto ao banco e receberá os repasses dos outros membros.
          </p>
        </div>

        <!-- Seleção de Membros -->
        <div class="space-y-4">
          <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Quem pagou ao banco?</label>
          <SeletorMembros 
            :membros="props.membros"
            v-model="responsavelId"
          />
        </div>

        <!-- Footer Buttons -->
        <div class="grid grid-cols-2 gap-3 pt-4 border-t border-stone-surface">
          <Button variant="secondary" @click="emit('close')">Cancelar</Button>
          <Button variant="primary" @click="confirmar" :disabled="!responsavelId">Confirmar</Button>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Run tests to verify**

Run: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`
Expected: PASS

- [ ] **Step 3: Commit changes**

```bash
git add src/components/ledger/dashboard/ModalFecharFatura.vue
git commit -m "design: make ModalFecharFatura responsive bottomsheet on mobile"
```

---

### Task 5: Responsive Bottom-sheet for `ModalDivisaoGasto.vue`

**Files:**
- Modify: `src/components/ledger/dashboard/ModalDivisaoGasto.vue`
- Test: `src/components/ledger/DashboardSaldos.test.ts`

- [ ] **Step 1: Make `ModalDivisaoGasto.vue` responsive bottom-sheet**

Modify the wrapper markup:
```vue
<template>
  <div 
    v-if="show && props.gasto" 
    class="fixed inset-0 bg-midnight/80 backdrop-blur-sm flex justify-center sm:items-center items-end z-[9999] sm:p-6 p-0 animate-in fade-in duration-200"
  >
    <!-- Modal Card Container: Bottom-sheet no Mobile, Modal Centralizado no Desktop -->
    <div 
      class="w-full sm:max-w-md overflow-hidden bg-card border-t sm:border border-stone-surface rounded-t-cardsLarge sm:rounded-cards shadow-lg flex flex-col max-h-[92vh] text-graphite animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-250"
    >
      <!-- Pull-to-dismiss handle (mobile-only grabber bar) -->
      <div class="sm:hidden w-12 h-1 bg-stone-surface rounded-full mx-auto my-3 shrink-0"></div>

      <div class="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
        <!-- Header -->
        <div class="flex justify-between items-center border-b border-stone-surface pb-4">
          <div>
            <h3 class="text-lg font-bold text-charcoal">Rateio & Comprador</h3>
            <span class="text-xs text-ash font-bold block mt-1">Ajuste de rateio de forma simples</span>
          </div>
          <button 
            @click="emit('close')"
            class="w-8 h-8 rounded-full bg-stone-surface hover:bg-stone text-ash hover:text-charcoal font-bold flex items-center justify-center transition-all"
          >
            ✕
          </button>
        </div>

        <!-- Info Gasto -->
        <div class="bg-stone-surface border border-stone-surface rounded-cards p-4 mb-5 flex justify-between items-center">
          <div>
            <span class="text-[10px] uppercase font-bold tracking-widest text-ember">Gasto sob Revisão</span>
            <strong class="block text-charcoal text-sm mt-0.5">{{ props.gasto.descricao }}</strong>
          </div>
          <div class="text-right">
            <span class="text-xs font-bold text-ash">Valor</span>
            <strong class="block text-ember text-lg font-bold">R$ {{ (props.gasto.valorTotal.centavos / 100).toFixed(2).replace('.', ',') }}</strong>
          </div>
        </div>

        <div class="space-y-5">
          <!-- 1. Comprador -->
          <div class="space-y-2">
            <label class="text-xs font-bold uppercase text-ash tracking-wider block">Quem Comprou (Dono do gasto)</label>
            <SeletorMembros 
              :membros="props.membros"
              v-model="compradorId"
            />
          </div>

          <!-- 2. Rateio e Divisão -->
          <div class="bg-stone-surface/30 border border-stone-surface rounded-cards p-4 space-y-4">
            <div class="flex justify-between items-center pb-2 border-b border-stone-surface">
              <span class="text-xs font-bold uppercase text-ash tracking-wider">Configurar Rateio</span>
              <div class="flex bg-stone-surface p-0.5 rounded-lg border border-stone-surface">
                <button 
                  type="button"
                  @click="setModo('IGUAL')"
                  :class="[
                    'text-[10px] font-bold px-2.5 py-1 rounded-md transition-all',
                    modo === 'IGUAL' ? 'bg-midnight text-white shadow-sm' : 'text-ash hover:text-charcoal'
                  ]"
                >
                  ⚖️ Igual
                </button>
                <button 
                  type="button"
                  @click="setModo('MANUAL')"
                  :class="[
                    'text-[10px] font-bold px-2.5 py-1 rounded-md transition-all',
                    modo === 'MANUAL' ? 'bg-midnight text-white shadow-sm' : 'text-ash hover:text-charcoal'
                  ]"
                >
                  ✏️ Manual
                </button>
              </div>
            </div>

            <!-- Participantes -->
            <div class="space-y-2">
              <span class="text-xs font-bold text-ash">Quem divide essa conta:</span>
              <SeletorMembros 
                :membros="props.membros"
                v-model="participantes"
                :multiple="true"
                @update:model-value="modo === 'MANUAL' ? recalcularSugestaoManual() : null"
              />
            </div>

            <!-- Valores Detalhados -->
            <div v-if="participantes.length > 0" class="pt-3 border-t border-stone-surface">
              <!-- Modo IGUAL -->
              <div v-if="modo === 'IGUAL'" class="bg-[#fbfaf9] border border-stone-surface p-4 rounded-cards text-center">
                <span class="text-[10px] text-ash font-bold block mb-1">Cada pessoa paga</span>
                <strong class="text-xl font-bold text-charcoal">R$ {{ valorSugeridoIgual.toFixed(2).replace('.', ',') }}</strong>
              </div>

              <!-- Modo MANUAL -->
              <div v-else class="space-y-3">
                <div v-for="id in participantes" :key="id" class="flex justify-between items-center text-xs">
                  <span class="font-bold text-charcoal">{{ props.membros.find(m => m.id === id)?.nome }}</span>
                  <div class="flex items-center gap-1.5">
                    <span class="text-ash font-bold">R$</span>
                    <input 
                      type="number"
                      step="0.01"
                      v-model.number="valores[id]"
                      class="w-24 px-2 py-1.5 text-center font-bold text-charcoal rounded-lg border border-stone-surface bg-[#fbfaf9] focus:border-ember outline-none"
                    />
                  </div>
                </div>

                <!-- Erro de Soma Manual -->
                <div v-if="erroSoma" class="text-[10px] font-bold text-coral-red leading-normal bg-coral-red/5 border border-coral-red/25 p-2 rounded-cards text-center animate-pulse">
                  ⚠️ A soma dos valores (R$ {{ somaManual.toFixed(2).replace('.', ',') }}) deve fechar exatamente R$ {{ (props.gasto.valorTotal.centavos / 100).toFixed(2).replace('.', ',') }}.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Buttons -->
        <div class="border-t border-stone-surface pt-4 mt-6 flex gap-3">
          <button 
            @click="emit('close')"
            class="flex-1 py-3 border border-stone-surface bg-[#f6f4ef] hover:bg-stone-surface rounded-buttonspill text-xs font-semibold text-charcoal transition-all active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button 
            @click="salvar"
            :disabled="!podeSalvar"
            :class="[
              'flex-1 py-3 rounded-buttonspill text-xs font-semibold text-white transition-all',
              podeSalvar ? 'bg-midnight hover:bg-charcoal-primary shadow-sm' : 'bg-[#e2dfd9] text-smoke cursor-not-allowed shadow-none'
            ]"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Run tests to verify**

Run: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`
Expected: PASS

- [ ] **Step 3: Commit changes**

```bash
git add src/components/ledger/dashboard/ModalDivisaoGasto.vue
git commit -m "design: make ModalDivisaoGasto responsive bottomsheet on mobile"
```

---

### Task 6: Verify and Validate Entire Solution

**Files:**
- None

- [ ] **Step 1: Run complete unit tests suite**

Run: `npx vitest run`
Expected: PASS (All 120/120 tests green)

- [ ] **Step 2: Run type check compilation verification**

Run: `npx vue-tsc --noEmit`
Expected: PASS (Zero warnings or type errors)

- [ ] **Step 3: Push master branch and finalize work**

```bash
git status
```
