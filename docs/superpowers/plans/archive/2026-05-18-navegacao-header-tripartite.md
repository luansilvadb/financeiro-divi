# Nova Navegação e Header Tripartite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reestruturar a navegação inferior (Bottom Nav) com o FAB centralizado e implementar o novo cabeçalho tripartite (Mês | Brand | Config) no Dashboard.

**Architecture:** 
1.  **Navegação:** Ajustar o `BottomTabBar.vue` para remover o Histórico e criar um layout simétrico. O `App.vue` cuidará do posicionamento do FAB para que ele pareça "ancorado" ao centro da barra.
2.  **Header:** Refatorar a seção de cabeçalho no `DashboardSaldos.vue` para a estrutura de 3 colunas (Tripartite).
3.  **Estado:** O seletor de mês no cabeçalho será o novo gatilho para filtrar os dados da Home.

**Tech Stack:** Vue 3, TailwindCSS (for alignment/layout), Lucide Icons, Vitest.

---

### Task 1: Reestruturar a Bottom Nav e Centralizar o FAB

**Files:**
- Modify: `src/components/ui/BottomTabBar.vue`
- Modify: `src/App.vue`

- [ ] **Step 1: Remover Histórico da BottomTabBar**
No arquivo `src/components/ui/BottomTabBar.vue`, remova o item 'historico' do array `tabs` e atualize o tipo `Tab`. Ajuste o layout `flex` para deixar um espaço central vazio para o FAB.

```vue
<!-- src/components/ui/BottomTabBar.vue -->
<script setup lang="ts">
export type Tab = 'hoje' | 'faturas' // Removido 'historico'

const props = defineProps<{ modelValue: Tab }>()
const emit = defineEmits<{ (e: 'update:modelValue', tab: Tab): void }>()

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'hoje', label: 'Hoje', icon: '🏠' },
  // Espaço central será ocupado pelo FAB no App.vue
  { id: 'faturas', label: 'Faturas', icon: '💳' },
]
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-stone pb-safe">
    <div class="flex items-center justify-around h-16">
      <template v-for="(tab, index) in tabs" :key="tab.id">
        <!-- Divisor/Espaço para o FAB no centro -->
        <div v-if="index === 1" class="w-20" aria-hidden="true" />
        
        <button
          @click="emit('update:modelValue', tab.id)"
          class="flex-1 flex flex-col items-center gap-1 py-1 transition-colors"
          :class="modelValue === tab.id ? 'text-ember' : 'text-ash'"
        >
          <span class="text-xl">{{ tab.icon }}</span>
          <span class="text-[10px] font-bold uppercase tracking-wider">{{ tab.label }}</span>
        </button>
      </template>
    </div>
  </nav>
</template>
```

- [ ] **Step 2: Reposicionar o FAB no App.vue**
No `src/App.vue`, altere as classes do FAB para que ele fique centralizado horizontalmente e "ancorado" na barra inferior.

```vue
<!-- src/App.vue -->
<!-- Procure o componente <Button v-if="currentView === 'dashboard'..." data-testid="novo-lancamento-fab"> -->
<Button
  v-if="currentView === 'dashboard' && !isAnyBottomSheetOpen"
  variant="primary"
  class="fixed bottom-6 left-1/2 -translate-x-1/2 w-14 h-14 p-0 rounded-full shadow-lg z-[100] active:scale-95 border-4 border-card"
  @click="currentView = 'wizard'"
  data-testid="novo-lancamento-fab"
>
  <Plus class="w-7 h-7 stroke-[3px]" />
</Button>
```

- [ ] **Step 3: Commit**
```bash
git add src/components/ui/BottomTabBar.vue src/App.vue
git commit -m "feat(nav): remove aba historico e centraliza o FAB na bottom nav"
```

### Task 2: Implementar o Header Tripartite no Dashboard

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Step 1: Substituir o Header atual pela nova estrutura de 3 colunas**
Abra `src/components/ledger/DashboardSaldos.vue`. No `<template>`, localize o bloco `<!-- BARRA DE TRANCAMENTO -->` e o header de "Saldo Unificado". Vamos consolidar tudo em um novo Header Tripartite no topo da aba "Hoje" (dentro do `v-show="isHoje"`).

```html
    <!-- NOVO HEADER TRIPARTITE (Aesthetic v2026) -->
    <header class="flex items-center justify-between py-6 mb-8 border-b border-stone/50">
      <!-- Coluna Esquerda: Mês Selector -->
      <div class="flex-1">
        <div class="flex flex-col cursor-pointer group active:opacity-70 transition-opacity">
          <span class="text-[8px] font-black text-ash uppercase tracking-[0.2em] mb-1">Período</span>
          <div class="flex items-center gap-2">
            <span class="text-2xl font-black text-charcoal tracking-tighter">{{ currentMonthName }}</span>
            <ChevronDown class="w-4 h-4 text-ember mt-1 group-hover:translate-y-0.5 transition-transform" />
          </div>
        </div>
      </div>

      <!-- Coluna Central: Brand -->
      <div class="flex-1 flex flex-col items-center">
        <span class="text-[7px] font-bold text-ash/60 uppercase tracking-[0.3em] mb-1">Finanças Residenciais</span>
        <h1 class="text-3xl font-black text-charcoal tracking-[-0.05em] leading-none">
          DIVI<span class="text-ember">.</span>
        </h1>
      </div>

      <!-- Coluna Direita: Ações (Settings) -->
      <div class="flex-1 flex justify-end">
        <button 
          @click="$emit('openSettings')" 
          class="w-11 h-11 bg-stone/30 hover:bg-stone/50 rounded-2xl flex items-center justify-center transition-colors border border-stone/20"
        >
          <Settings class="w-5 h-5 text-graphite" />
        </button>
      </div>
    </header>
```

- [ ] **Step 2: Limpar o Header original do App.vue**
Como o Dashboard agora tem seu próprio header completo, precisamos remover o header redundante do `src/App.vue`.

- [ ] **Step 3: Commit**
```bash
git add src/components/ledger/DashboardSaldos.vue src/App.vue
git commit -m "feat(ui): implementa novo header tripartite no dashboard"
```

### Task 3: Ajustes de Lógica e Testes

- [ ] **Step 1: Atualizar DashboardSaldos.test.ts**
Remover testes que dependiam da estrutura antiga do Header e adicionar um teste básico para a presença do novo Brand centralizado.

- [ ] **Step 2: Executar testes de regressão**
Execute: `npx vitest run`
Expected: Todos os testes passando.

- [ ] **Step 3: Commit final**
```bash
git add src/components/ledger/DashboardSaldos.test.ts
git commit -m "test: atualiza testes para nova estrutura de navegacao e header"
```