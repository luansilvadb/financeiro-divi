# Plano de Implementação: Melhoria de Responsividade nos Cards do Dashboard Divi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Melhorar a responsividade e consistência visual dos cards principais do dashboard do Divi (`Últimos Lançamentos`, `Contas Fixas` e `Saldos Unificados`) removendo os badges laterais que geravam colisões e quebras em resoluções mobile.

**Architecture:** O alinhamento dos cabeçalhos dos três painéis será alterado de `flex justify-between items-center` para `flex items-center`. Isso removerá a necessidade de empilhamentos complexos ou badges truncados no mobile, mantendo uma perfeita consistência horizontal minimalista de alto padrão.

**Tech Stack:** Vue 3, TailwindCSS, Vitest, TypeScript

---

### Task 1: ActivityFeed - Remover Badge de Movimentações

**Files:**
- Modify: `src/components/ledger/ActivityFeed.vue:39-55`

- [ ] **Step 1: Modificar o template para remover o badge de movimentações e simplificar o flexbox**

Substituir o cabeçalho original pelo cabeçalho sem o `span` de movimentações e com classe `flex items-center`.

No arquivo `src/components/ledger/ActivityFeed.vue`, alterar o trecho correspondente:

```html
<<<<
    <!-- Cabeçalho Padronizado -->
    <div class="py-7 px-6 border-b border-stone bg-parchment flex justify-between items-center">
      <div class="flex items-center gap-5">
        <div class="w-11 h-11 rounded-xl bg-midnight text-white flex items-center justify-center shadow-sm">
          <Clock class="w-5 h-5" />
        </div>
        <div>
          <h3 class="font-bold text-lg leading-tight text-charcoal tracking-tight">Últimos Lançamentos</h3>
          <p class="text-[11px] text-ash uppercase tracking-wider mt-0.5 font-medium">
            Atividade recente no período
          </p>
        </div>
      </div>
      <span class="shrink-0 text-[10px] font-black text-midnight bg-stone px-4 py-2 rounded-full uppercase tracking-widest border border-stone/50 shadow-none">
        {{ sortedGastos.length }} movimentações
      </span>
    </div>
====
    <!-- Cabeçalho Padronizado -->
    <div class="py-7 px-6 border-b border-stone bg-parchment flex items-center">
      <div class="flex items-center gap-5">
        <div class="w-11 h-11 rounded-xl bg-midnight text-white flex items-center justify-center shadow-sm">
          <Clock class="w-5 h-5" />
        </div>
        <div>
          <h3 class="font-bold text-lg leading-tight text-charcoal tracking-tight">Últimos Lançamentos</h3>
          <p class="text-[11px] text-ash uppercase tracking-wider mt-0.5 font-medium">
            Atividade recente no período
          </p>
        </div>
      </div>
    </div>
>>>>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ledger/ActivityFeed.vue
git commit -m "style: remove badge de movimentacoes do activity feed para melhorar responsividade"
```

---

### Task 2: ContasFixasPanel - Remover Badge de Contas Pagas

**Files:**
- Modify: `src/components/ledger/ContasFixasPanel.vue:46-62`
- Modify: `src/components/ledger/ContasFixasPanel.test.ts:62-62`

- [ ] **Step 1: Modificar o template do painel de contas fixas**

No arquivo `src/components/ledger/ContasFixasPanel.vue`, alterar o trecho correspondente:

```html
<<<<
    <!-- Cabeçalho Padronizado -->
    <div class="py-7 px-6 border-b border-stone bg-parchment flex justify-between items-center">
      <div class="flex items-center gap-5">
        <div class="w-11 h-11 rounded-xl bg-midnight text-white flex items-center justify-center shadow-sm">
          <Repeat class="w-5 h-5" />
        </div>
        <div>
          <h3 class="font-bold text-lg leading-tight text-charcoal tracking-tight">Contas Fixas</h3>
          <p class="text-[11px] text-ash uppercase tracking-wider mt-0.5 font-medium">
            Recorrentes do mês
          </p>
        </div>
      </div>
      <span class="shrink-0 text-[10px] font-black text-midnight bg-stone px-4 py-2 rounded-full uppercase tracking-widest border border-stone/50 shadow-none">
        {{ pagasCount }}/{{ contasFixas.length }} pagas
      </span>
    </div>
====
    <!-- Cabeçalho Padronizado -->
    <div class="py-7 px-6 border-b border-stone bg-parchment flex items-center">
      <div class="flex items-center gap-5">
        <div class="w-11 h-11 rounded-xl bg-midnight text-white flex items-center justify-center shadow-sm">
          <Repeat class="w-5 h-5" />
        </div>
        <div>
          <h3 class="font-bold text-lg leading-tight text-charcoal tracking-tight">Contas Fixas</h3>
          <p class="text-[11px] text-ash uppercase tracking-wider mt-0.5 font-medium">
            Recorrentes do mês
          </p>
        </div>
      </div>
    </div>
>>>>
```

- [ ] **Step 2: Remover asserção do badge de contas pagas no teste unitário**

No arquivo `src/components/ledger/ContasFixasPanel.test.ts`, remover a linha 62:

```typescript
<<<<
    expect(wrapper.text()).toContain('Contas fixas')
    expect(wrapper.text()).toContain('Recorrentes do mes.')
    expect(wrapper.text()).not.toContain('Lancamentos recorrentes do mes.')
    expect(wrapper.text()).toContain('1/2 pagas')
    expect(wrapper.text()).toContain('Aluguel')
====
    expect(wrapper.text()).toContain('Contas fixas')
    expect(wrapper.text()).toContain('Recorrentes do mes.')
    expect(wrapper.text()).not.toContain('Lancamentos recorrentes do mes.')
    expect(wrapper.text()).toContain('Aluguel')
>>>>
```

- [ ] **Step 3: Executar testes de ContasFixasPanel para garantir que passam**

Executar: `npx vitest run src/components/ledger/ContasFixasPanel.test.ts`
Esperado: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ledger/ContasFixasPanel.vue src/components/ledger/ContasFixasPanel.test.ts
git commit -m "style: remove badge de contas pagas do ContasFixasPanel"
```

---

### Task 3: DashboardSaldos - Remover Badge LIVE

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue:349-365`

- [ ] **Step 1: Modificar o cabeçalho do painel de Saldos Unificados**

No arquivo `src/components/ledger/DashboardSaldos.vue`, alterar o trecho correspondente:

```html
<<<<
        <!-- Cabeçalho Padronizado -->
        <div class="py-7 px-6 border-b border-stone bg-parchment flex justify-between items-center">
          <div class="flex items-center gap-5">
            <div class="w-11 h-11 rounded-xl bg-midnight text-white flex items-center justify-center shadow-sm">
              <TrendingUp class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-bold text-lg leading-tight text-charcoal tracking-tight">Saldos Unificados</h3>
              <p class="text-[11px] text-ash uppercase tracking-wider mt-0.5 font-medium">
                Créditos e débitos da casa
              </p>
            </div>
          </div>
          <span class="shrink-0 text-[10px] font-black text-meadow bg-meadow/10 px-4 py-2 rounded-full border border-meadow/20 uppercase tracking-widest">
            LIVE
          </span>
        </div>
====
        <!-- Cabeçalho Padronizado -->
        <div class="py-7 px-6 border-b border-stone bg-parchment flex items-center">
          <div class="flex items-center gap-5">
            <div class="w-11 h-11 rounded-xl bg-midnight text-white flex items-center justify-center shadow-sm">
              <TrendingUp class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-bold text-lg leading-tight text-charcoal tracking-tight">Saldos Unificados</h3>
              <p class="text-[11px] text-ash uppercase tracking-wider mt-0.5 font-medium">
                Créditos e débitos da casa
              </p>
            </div>
          </div>
        </div>
>>>>
```

- [ ] **Step 2: Executar testes de DashboardSaldos para garantir integridade**

Executar: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`
Esperado: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/ledger/DashboardSaldos.vue
git commit -m "style: remove badge LIVE de saldos unificados"
```

---

### Task 4: Verificação Final e Build do Projeto

**Files:**
- None

- [ ] **Step 1: Rodar todos os testes do projeto**

Executar: `npm run test -- --run` ou `npx vitest run`
Esperado: Todos os testes passam com sucesso.

- [ ] **Step 2: Rodar build de produção**

Executar: `npm run build`
Esperado: Compilação concluída com sucesso e sem erros.
