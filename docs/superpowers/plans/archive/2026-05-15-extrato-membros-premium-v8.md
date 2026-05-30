# Extrato Premium de Membros (Alta Fidelidade V8) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o design consolidado V8 para o detalhamento de moradores, focado em simetria, hierarquia visual clara e revelação progressiva.

**Architecture:** Refatoração do template e estilos de `DashboardSaldos.vue`, utilizando o sistema de grid de 8pt do Tailwind e estado reativo para controle de expansão.

**Tech Stack:** Vue 3 (Composition API), Tailwind CSS, TypeScript.

---

### Task 1: Preparar Estado e Utilitários de Design

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue:20-50`

- [ ] **Step 1: Adicionar estado de expansão**

Adicionar a referência reativa para controlar qual transação está expandida.

```typescript
const expandedTransactionId = ref<string | null>(null)

const toggleTransaction = (id: string) => {
  expandedTransactionId.value = expandedTransactionId.value === id ? null : id
}
```

- [ ] **Step 2: Adicionar função de formatação de data curta**

Garantir que existe uma função para retornar "14 MAI".

```typescript
const formatDataCurta = (date: Date) => {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase()
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ledger/DashboardSaldos.vue
git commit -m "feat: preparar estado de expansão e utilitários para extrato V8"
```

---

### Task 2: Implementar Estrutura de Card e Nível 1 (Âncora)

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue:140-200`

- [ ] **Step 1: Criar o container do card com grid de 8pt**

Implementar a estrutura externa com a borda lateral semântica.

```html
<div v-for="m in details" :key="m.id" 
     class="bg-[#FAFAFA] rounded-[24px] shadow-sm border border-slate-100 relative overflow-hidden flex flex-col transition-all active:scale-[0.98]">
  
  <!-- Borda Semântica Lateral -->
  <div :class="['absolute top-0 left-0 w-1.5 h-full', 
                 m.net.isPositivo() ? 'bg-emerald-500' : (m.net.isZero() ? 'bg-slate-300' : 'bg-red-500')]"></div>

  <!-- Nível 1: Cabeçalho (Simetria Óptica) -->
  <div class="p-6 pb-4 flex justify-between items-center">
    <div class="flex-1">
      <h2 class="text-[17px] font-bold text-slate-800 leading-tight">{{ m.descricao }}</h2>
      <span :class="['inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black mt-2 uppercase tracking-tighter border',
                      m.net.isPositivo() ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      (m.net.isZero() ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-red-50 text-red-600 border-red-100')]">
        {{ m.net.isPositivo() ? 'CRÉDITO' : (m.net.isZero() ? 'NEUTRO' : 'DÉBITO') }}
      </span>
    </div>
    <div class="text-right">
      <div :class="['text-2xl font-mono font-black tracking-tighter', 
                    m.net.isPositivo() ? 'text-emerald-600' : (m.net.isZero() ? 'text-slate-400' : 'text-red-600')]">
        {{ m.net.isPositivo() ? '+' : '' }}{{ formatarDinheiro(m.net).replace('R$', '').trim() }}
      </div>
      <p class="text-[10px] font-bold text-slate-300 mt-1 uppercase tracking-widest">{{ formatDataCurta(m.data) }}</p>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ledger/DashboardSaldos.vue
git commit -m "style: implementar estrutura básica e cabeçalho do card V8"
```

---

### Task 3: Implementar Nível 2 (Fluxo) e Avatares

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Step 1: Adicionar Grid de Fluxo Simétrica**

Inserir a seção "Você Pagou" vs "Sua Parte" com o divisor vertical.

```html
<div class="mx-6 py-5 flex border-t border-slate-50">
  <div class="flex-1 space-y-1 pr-4 border-r border-slate-50">
    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Você Pagou</span>
    <p class="text-sm font-mono font-bold text-slate-800">{{ formatarDinheiro(m.paid) }}</p>
  </div>
  <div class="flex-1 space-y-1 pl-6">
    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sua Parte</span>
    <p class="text-sm font-mono font-bold text-slate-800">{{ formatarDinheiro(m.consumed) }}</p>
  </div>
</div>
```

- [ ] **Step 2: Adicionar Seção de Avatares e Botão Detalhes**

```html
<div class="px-6 pb-6 flex items-center justify-between">
  <div class="flex items-center gap-2">
    <div class="flex -space-x-2">
      <div v-for="pagador in m.pagamentos_detalhados.slice(0, 3)" :key="pagador.nome"
           class="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase">
        {{ pagador.nome.substring(0, 1) }}
      </div>
    </div>
    <span v-if="m.pagamentos_detalhados.length > 3" class="text-[10px] font-bold text-slate-400">
      +{{ m.pagamentos_detalhados.length - 3 }} outros
    </span>
  </div>
  <button @click="toggleTransaction(m.id)" 
          class="flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-slate-50 text-[10px] font-bold text-slate-600 border border-slate-100 active:scale-95 transition-all">
    {{ expandedTransactionId === m.id ? 'OCULTAR' : 'DETALHES' }}
    <svg :class="['w-3 h-3 transition-transform duration-300', expandedTransactionId === m.id ? 'rotate-180' : '']" 
         fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M19 9l-7 7-7-7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ledger/DashboardSaldos.vue
git commit -m "style: adicionar grid de fluxo e avatares ao card V8"
```

---

### Task 4: Implementar Nível 3 (Auditoria) e Saldo Acumulado

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Step 1: Implementar Gaveta de Auditoria (Progressive Disclosure)**

```html
<div v-if="expandedTransactionId === m.id" class="bg-slate-50/80 border-y border-slate-100 p-6 space-y-5 animate-fade-in">
  <div class="flex justify-between items-center">
    <span class="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Total Bruto da Nota</span>
    <span class="text-sm font-mono font-bold text-slate-900">{{ formatarDinheiro(m.total) }}</span>
  </div>

  <div class="space-y-4">
    <div v-for="p in m.pagamentos_detalhados" :key="p.nome" class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-white shadow-sm">
        {{ p.nome.substring(0, 1) }}
      </div>
      <div class="flex-1">
        <div class="flex justify-between text-[11px] font-bold text-slate-700">
          <span>{{ p.nome }}</span>
          <span class="text-slate-500">Parte: {{ formatarDinheiro(p.valor) }}</span>
        </div>
        <div class="text-[9px] text-slate-400 mt-0.5 italic">
          {{ p.valor.centavos > 0 ? 'Contribuiu no pagamento' : 'Não contribuiu no pagamento' }}
        </div>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Implementar Rodapé de Saldo Acumulado (Âncora)**

```html
<div :class="['px-6 py-3 flex justify-between items-center border-t', 
               m.net.isPositivo() ? 'bg-emerald-500/[0.04] border-emerald-50' : 
               (m.net.isZero() ? 'bg-slate-500/[0.04] border-slate-50' : 'bg-red-500/[0.04] border-red-50')]">
  <span :class="['text-[11px] font-bold uppercase tracking-widest', 
                  m.net.isPositivo() ? 'text-emerald-900/40' : (m.net.isZero() ? 'text-slate-900/30' : 'text-red-900/40')]">
    Saldo após lançamento
  </span>
  <div :class="['text-sm font-mono font-bold', 
                 m.net.isPositivo() ? 'text-emerald-600/70' : (m.net.isZero() ? 'text-slate-400/70' : 'text-red-600/70')]">
    {{ m.acumulado.isPositivo() ? '+' : '' }}{{ formatarDinheiro(m.acumulado) }}
  </div>
</div>
```

- [ ] **Step 3: Verificar visualmente e Finalizar**

Verificar se o espaçamento de 8pt está correto e se as cores semânticas estão consistentes.

- [ ] **Step 4: Commit**

```bash
git add src/components/ledger/DashboardSaldos.vue
git commit -m "style: finalizar card V8 com gaveta de auditoria e saldo acumulado"
```
