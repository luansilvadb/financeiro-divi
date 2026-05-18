# Remover Próximas Faturas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover a seção visual "Próximas Faturas" (Gastos Ativos) e seus respectivos estados locais no DashboardSaldos para focar a interface no Feed de Lançamentos.

**Architecture:** A alteração é puramente de UI (View). O estado global (`faturasAbertas`) continua sendo passado como `prop` e usado para cálculos, mas a listagem `<section>` correspondente a essas faturas e as variáveis reativas para expandir/recolher seus itens serão removidas do template e script.

**Tech Stack:** Vue 3 (Composition API), TypeScript, Vitest.

---

### Task 1: Remover o estado reativo da interface

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Step 1: Remover o estado e a função relacionados a faturasExpandidas**
Abra o arquivo `src/components/ledger/DashboardSaldos.vue` e encontre o seguinte bloco (próximo à linha 286):

```typescript
// --- INTEGRAÇÃO SENIOR V19: ACCORDIONS DE FATURAS E PARCELAS FUTURAS ---
const faturasExpandidas = ref<Record<string, boolean>>({})
const toggleFaturaExpandida = (faturaId: string) => {
  faturasExpandidas.value[faturaId] = !faturasExpandidas.value[faturaId]
}
```

Remova as duas definições (`faturasExpandidas` e `toggleFaturaExpandida`). Deixe apenas o comentário ou o que estiver a seguir (que é sobre `totalFuturasVencer`).

- [ ] **Step 2: Commit**

```bash
git add src/components/ledger/DashboardSaldos.vue
git commit -m "refactor(ui): remove estado faturasExpandidas do dashboard"
```

### Task 2: Remover a seção visual "Gastos Ativos"

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Step 1: Remover a `<section>` das Próximas Faturas**
Ainda no `src/components/ledger/DashboardSaldos.vue`, navegue até o bloco `<template>`. Encontre a seguinte seção (próxima à linha 657) e remova-a completamente, do `<section>` de abertura ao correspondente `</section>` de fechamento:

```html
    <!-- Seção 2: Faturas Abertas (Design System Family) -->
    <section class="space-y-6">
      <div class="space-y-2">
        <SectionLabel>Gastos Ativos</SectionLabel>
        <h2 class="text-3xl font-display text-charcoal">Próximas <span class="text-ember">Faturas</span></h2>
      </div>
      
      <div class="grid gap-4">
        <div
          v-for="fatura in faturasAbertas"
          :key="fatura.id"
          class="proximas-faturas-card overflow-hidden relative bg-white shadow-subtle p-0 rounded-card text-graphite"
          :data-testid="`proximas-faturas-card-${fatura.id}`"
        >
<!-- ... todo o conteúdo até o final do card e da seção ... -->
        </div>
      </div>
    </section>
```

**Nota para o agente executor:** Certifique-se de não remover a `<section>` de **Faturas Fechadas** nem o **Painel de Parcelas Futuras**.

- [ ] **Step 2: Verificar a build da interface localmente (sem erros de compilação)**

Execute: `npx vue-tsc --noEmit`
Expected: Sucesso (sem erros relacionados a faturasExpandidas).

- [ ] **Step 3: Commit**

```bash
git add src/components/ledger/DashboardSaldos.vue
git commit -m "refactor(ui): remove exibicao da secao proximas faturas"
```

### Task 3: Atualizar os Testes Unitários

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.test.ts`

- [ ] **Step 1: Alterar o teste do card de proximas faturas**
Abra `src/components/ledger/DashboardSaldos.test.ts`. Localize o teste: `it('renderiza o card de proximas faturas no padrao Family', () => { ... })`.

Substitua este teste inteiro por um que verifica que o card de próximas faturas NÃO é renderizado:

```typescript
  it('nao renderiza mais a listagem de proximas faturas', () => {
    const wrapper = mount(DashboardSaldos, {
      props: {
        membros: [{ id: 'm1', nome: 'Joao' }, { id: 'm2', nome: 'Maria' }],
        faturasFechadas: [] as any,
        acertosPendentes: [] as any,
        faturasAbertas: [{ id: 'f1', cartaoId: 'c1', responsavelId: 'm1', status: 'ABERTA', periodo: { mes: 6, ano: 2026 } }] as any,
        cartoes: [{ id: 'c1', nome: 'Nubank' }] as any,
        calcularConsumo: () => 15000,
        calcularAdiantamento: () => 0
      }
    })

    const card = wrapper.find('[data-testid="proximas-faturas-card-f1"]')
    expect(card.exists()).toBe(false)
  })
```

- [ ] **Step 2: Executar testes para confirmar que passam**

Run: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`
Expected: Testes passando com sucesso.

- [ ] **Step 3: Commit**

```bash
git add src/components/ledger/DashboardSaldos.test.ts
git commit -m "test: atualiza teste validando a remocao de proximas faturas"
```