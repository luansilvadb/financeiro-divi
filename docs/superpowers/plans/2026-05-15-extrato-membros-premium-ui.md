# Extrato Premium de Membros Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar o detalhamento do morador para um formato de "Ledger Narrativo" (cards) em vez de tabela, otimizando para mobile e aumentando a clareza da UX.

**Architecture:** Substituição da estrutura de `<table>` por `<div>` com cards flexíveis, mantendo a lógica de cálculo de saldo acumulado existente.

**Tech Stack:** Vue 3, Tailwind CSS, TypeScript.

---

### Task 1: Refatorar Template para Cards Premium

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue:135-220`

- [ ] **Step 1: Substituir <table> por estrutura de Cards**

Remover a tabela e implementar o loop de cards narrativos.

```html
<!-- No lugar da <table> -->
<div v-if="getMemberDetails(item.id).length > 0" class="space-y-4">
  <div v-for="m in getMemberDetails(item.id)" :key="m.id" class="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
    <!-- Cabeçalho do Card -->
    <div class="flex justify-between items-start mb-4">
      <div class="flex-1">
        <h3 class="text-sm font-bold text-slate-800">{{ m.descricao }}</h3>
        <p class="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{{ formatDate(m.data) }}</p>
        
        <!-- Barra de Proporção Visual -->
        <div class="flex w-24 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
          <div 
            :class="['h-full', m.net.isPositivo() ? 'bg-emerald-500' : 'bg-red-500']" 
            :style="{ width: (m.consumed.centavos / m.total.centavos * 100) + '%' }"
          ></div>
          <div class="flex-1 h-full bg-slate-200"></div>
        </div>
      </div>
      <div class="text-right">
        <div :class="['text-lg font-mono font-black', m.net.isZero() ? 'text-slate-400' : (m.net.isPositivo() ? 'text-emerald-600' : 'text-red-500')]">
          {{ m.net.isPositivo() ? '+' : '' }}{{ formatarDinheiro(m.net) }}
        </div>
        <div :class="['text-[8px] font-black uppercase tracking-tighter', m.net.isPositivo() ? 'text-emerald-500' : 'text-red-400']">
          Impacto no Saldo
        </div>
      </div>
    </div>

    <!-- Seção de Fluxo (Sua Parte / Desembolso) -->
    <div class="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
      <div :class="{ 'opacity-40': m.paid.isZero() }">
        <span class="text-[8px] font-black text-slate-400 uppercase block mb-1">Você desembolsou</span>
        <span class="text-xs font-mono font-bold text-slate-700">{{ formatarDinheiro(m.paid) }}</span>
      </div>
      <div>
        <span class="text-[8px] font-black text-slate-400 uppercase block mb-1">Sua parte</span>
        <span class="text-xs font-mono font-bold text-slate-700">{{ formatarDinheiro(m.consumed) }}</span>
      </div>
    </div>
    
    <!-- Saldo Acumulado Sutil -->
    <div class="mt-4 pt-3 border-t border-slate-50 flex justify-end items-center gap-2">
      <span class="text-[8px] font-black uppercase text-slate-300 tracking-widest">Saldo Acumulado</span>
      <span class="text-xs font-mono font-bold text-slate-400 opacity-80">{{ formatarDinheiro(m.acumulado) }}</span>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Verificar Build e Tipagens**

Rodar `npm run build` ou `vue-tsc` para garantir que as referências a `m.net`, `m.paid`, etc., continuam corretas.

- [ ] **Step 3: Commit**

```bash
git add src/components/ledger/DashboardSaldos.vue
git commit -m "style: transformar extrato de membros em layout de cards narrativos premium"
```
