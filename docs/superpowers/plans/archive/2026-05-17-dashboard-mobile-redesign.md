# Dashboard Mobile Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar bottom tab bar (Hoje / Faturas / Histórico) ao dashboard mobile e aplicar token sweep completo eliminando todos os hardcodes de cor/tipografia.

**Architecture:** Novo componente `BottomTabBar.vue` gerencia a aba ativa via `ref` em `App.vue`. `DashboardSaldos.vue` recebe a aba ativa como prop e renderiza apenas as seções correspondentes. No desktop (`md+`) o layout de scroll único é preservado sem tabs.

**Tech Stack:** Vue 3 `<script setup>`, TypeScript, Tailwind CSS v4, lucide-vue-next

---

## Mapa de Arquivos

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `src/components/ui/BottomTabBar.vue` | Criar | Tab bar fixa com 3 abas, ponto ativo, safe area |
| `src/App.vue` | Modificar | Estado da aba ativa, FAB position, padding mobile |
| `src/components/ledger/DashboardSaldos.vue` | Modificar | Prop `activeTab`, renderização condicional por aba |
| `src/components/ledger/ContasFixasPanel.vue` | Modificar | Token sweep completo |
| `src/components/ledger/ActivityFeed.vue` | Modificar | Token sweep + touch targets |
| `src/components/ledger/dashboard/HistoricoFaturas.vue` | Modificar | Token sweep |
| `src/components/ledger/dashboard/DetalhamentoSaldosCard.vue` | Modificar | Token sweep |

---

## Task 1: Componente BottomTabBar

**Files:**
- Create: `src/components/ui/BottomTabBar.vue`
- Test: `src/App.test.ts` (adicionar casos)

- [ ] **Step 1: Criar o componente**

```vue
<!-- src/components/ui/BottomTabBar.vue -->
<script setup lang="ts">
export type Tab = 'hoje' | 'faturas' | 'historico'

const props = defineProps<{ modelValue: Tab }>()
const emit = defineEmits<{ (e: 'update:modelValue', tab: Tab): void }>()

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'hoje', label: 'Hoje', icon: '🏠' },
  { id: 'faturas', label: 'Faturas', icon: '💳' },
  { id: 'historico', label: 'Histórico', icon: '📋' },
]
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-stone-surface pb-safe"
    aria-label="Navegação principal"
  >
    <div class="flex">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="emit('update:modelValue', tab.id)"
        :aria-current="modelValue === tab.id ? 'page' : undefined"
        class="flex-1 flex flex-col items-center gap-1 py-2.5 min-h-[56px] transition-colors"
        :class="modelValue === tab.id ? 'text-ember' : 'text-ash'"
      >
        <span class="text-xl leading-none" aria-hidden="true">{{ tab.icon }}</span>
        <span class="text-[10px] font-semibold">{{ tab.label }}</span>
        <span
          v-if="modelValue === tab.id"
          class="w-1 h-1 rounded-full bg-ember"
          aria-hidden="true"
        />
      </button>
    </div>
  </nav>
</template>
```

- [ ] **Step 2: Adicionar suporte a safe area no CSS global**

Em `src/main.css`, adicionar dentro de `@layer base`:

```css
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

- [ ] **Step 3: Verificar build**

```bash
npx tsc --noEmit
```
Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/BottomTabBar.vue src/main.css
git commit -m "feat: add BottomTabBar component"
```

---

## Task 2: Integrar BottomTabBar no App.vue

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Adicionar import e estado da aba**

No `<script setup>` de `App.vue`, adicionar após os imports existentes:

```ts
import BottomTabBar, { type Tab } from './components/ui/BottomTabBar.vue'
const activeTab = ref<Tab>('hoje')
```

- [ ] **Step 2: Atualizar o header mobile**

Substituir o bloco `<h1>` dentro do header:

```html
<!-- antes -->
<h1 class="text-4xl md:text-display font-display leading-[1.09] tracking-[-1.5px] md:tracking-[-2.11px] text-charcoal">
  DIVI<span class="text-ember">.</span>
</h1>

<!-- depois -->
<h1 class="text-heading md:text-display font-display leading-[1.09] tracking-[-0.44px] md:tracking-[-2.11px] text-charcoal">
  DIVI<span class="text-ember">.</span>
</h1>
```

- [ ] **Step 3: Atualizar padding do container e FAB**

```html
<!-- antes -->
<div class="max-w-[1200px] mx-auto px-4 md:px-6 py-8 md:py-16 pb-28 relative">

<!-- depois -->
<div class="max-w-[1200px] mx-auto px-4 md:px-6 py-8 md:py-16 pb-36 md:pb-16 relative">
```

```html
<!-- FAB: antes -->
class="fab-rounded fixed bottom-8 right-8 w-14 h-14 ...

<!-- FAB: depois -->
class="fab-rounded fixed bottom-20 md:bottom-8 right-8 w-14 h-14 ...
```

- [ ] **Step 4: Passar activeTab para DashboardSaldos e adicionar BottomTabBar**

```html
<!-- DashboardSaldos: adicionar prop -->
<DashboardSaldos
  :active-tab="activeTab"
  ...resto das props existentes...
/>

<!-- Antes do fechamento do </div> principal, após os BottomSheets -->
<BottomTabBar v-model="activeTab" />
```

- [ ] **Step 5: Verificar build**

```bash
npx tsc --noEmit
```
Esperado: erro de prop `activeTab` não declarada em DashboardSaldos — será corrigido na Task 3.

- [ ] **Step 6: Commit**

```bash
git add src/App.vue
git commit -m "feat: integrate BottomTabBar into App.vue"
```


---

## Task 3: Estrutura de abas em DashboardSaldos

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Step 1: Declarar prop `activeTab`**

No bloco `defineProps<Props>()`, adicionar:

```ts
import type { Tab } from '../ui/BottomTabBar.vue'

// dentro de Props:
activeTab?: Tab
```

- [ ] **Step 2: Criar computed para visibilidade de cada aba**

Após os `ref` existentes no script:

```ts
const isHoje = computed(() => !props.activeTab || props.activeTab === 'hoje')
const isFaturas = computed(() => !props.activeTab || props.activeTab === 'faturas')
const isHistorico = computed(() => !props.activeTab || props.activeTab === 'historico')
```

> Quando `activeTab` é `undefined` (desktop), todos retornam `true` — preservando o scroll único.

- [ ] **Step 3: Envolver seções com `v-show`**

No template, envolver cada grupo de seções:

**Aba Hoje** — envolver com `<div v-show="isHoje" class="space-y-12">`:
- Barra de trancamento
- Painel Saldo Unificado
- DetalhamentoSaldosCard (mover para aba Faturas — ver passo 4)
- Painel Compensação Otimizada (Acertos)
- Contas Fixas
- Feed de Lançamentos

**Aba Faturas** — envolver com `<div v-show="isFaturas" class="space-y-12">`:
- DetalhamentoSaldosCard
- Seção Faturas Fechadas
- Seção Próximas Faturas
- Seção Parcelas Futuras

**Aba Histórico** — envolver com `<div v-show="isHistorico" class="space-y-12">`:
- Seção Histórico de Faturas

- [ ] **Step 4: Mover DetalhamentoSaldosCard para aba Faturas**

No template, recortar o bloco:
```html
<div class="mt-6">
  <DetalhamentoSaldosCard ... />
</div>
```
E colar dentro do wrapper `v-show="isFaturas"`, antes das faturas fechadas.

- [ ] **Step 5: Verificar build e comportamento**

```bash
npx tsc --noEmit
```
Esperado: sem erros.

No browser: no mobile as seções devem alternar ao clicar nas abas. No desktop todas as seções aparecem em scroll.

- [ ] **Step 6: Commit**

```bash
git add src/components/ledger/DashboardSaldos.vue
git commit -m "feat: add tab-based rendering to DashboardSaldos"
```

---

## Task 4: Token sweep — DashboardSaldos

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`

Substituir todos os hardcodes no template de `DashboardSaldos.vue` conforme a tabela abaixo. Fazer as substituições em bloco com busca e substituição no arquivo.

- [ ] **Step 1: Substituir hardcodes de cor e forma**

| Buscar | Substituir por |
|--------|---------------|
| `bg-[#fbfaf9]` | `bg-canvas` |
| `bg-[#f8f7f4]` | `bg-parchment-card` |
| `bg-[#f2f0ed]` | `bg-stone` |
| `text-[#343433]` | `text-charcoal` |
| `text-[#474645]` | `text-graphite` |
| `text-[#848281]` | `text-ash` |
| `text-[#121212]` | `text-midnight` |
| `bg-[#121212]` | `bg-midnight` |
| `hover:bg-[#343433]` | `hover:bg-charcoal` |
| `border-[#f2f0ed]` | `border-stone-surface` |
| `shadow-[inset_0_0_0_1px_#f2f0ed]` | `shadow-subtle` |
| `rounded-[10px]` | `rounded-cards` |
| `text-[10px]` (labels de seção) | `text-caption` |
| `text-[11px]` (labels de seção) | `text-caption` |

- [ ] **Step 2: Corrigir touch targets dos botões de ação**

Localizar todos os botões com `h-8` ou `h-9` e substituir por `h-11`:

```bash
# Verificar ocorrências
grep -n "h-8\|h-9" src/components/ledger/DashboardSaldos.vue
```

Para cada ocorrência em botão de ação (não em ícones ou avatares), alterar para `h-11`.

- [ ] **Step 3: Atualizar botão "Fechar fatura"**

```html
<!-- antes -->
class="shrink-0 px-4 py-2.5 text-xs font-semibold bg-[#121212] hover:bg-[#343433] text-white rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"

<!-- depois -->
class="shrink-0 px-5 h-11 text-[13px] font-semibold bg-midnight hover:bg-charcoal text-white rounded-buttons transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
```

- [ ] **Step 4: Verificar build**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ledger/DashboardSaldos.vue
git commit -m "refactor: token sweep in DashboardSaldos"
```


---

## Task 5: Token sweep — ContasFixasPanel

**Files:**
- Modify: `src/components/ledger/ContasFixasPanel.vue`

- [ ] **Step 1: Substituir hardcodes no template**

```html
<!-- Card container: antes -->
class="contas-fixas-card bg-white p-[18px] rounded-[10px] shadow-[inset_0_0_0_1px_#f2f0ed] text-[#474645]"

<!-- depois -->
class="bg-card p-5 rounded-cards shadow-subtle text-graphite"
```

```html
<!-- Título: antes -->
class="text-[15px] leading-tight font-semibold text-[#343433] tracking-[-0.2px]"

<!-- depois -->
class="text-heading-sm font-semibold text-charcoal"
```

```html
<!-- Subtítulo: antes -->
class="text-xs leading-snug text-[#848281] mt-1"

<!-- depois -->
class="text-caption text-ash mt-1"
```

```html
<!-- Badge contador: antes -->
class="shrink-0 text-xs font-semibold text-[#121212] bg-[#f6f4ef] px-3 py-1.5 rounded-full"

<!-- depois -->
class="shrink-0 text-caption font-semibold text-midnight bg-stone px-3 py-1.5 rounded-buttons"
```

```html
<!-- Estado vazio: antes -->
class="text-center py-8 px-4 border border-dashed border-[#c6c6c6] rounded-[10px] bg-[#f8f7f4]"

<!-- depois -->
class="text-center py-8 px-4 border border-dashed border-fog rounded-cards bg-parchment-card"
```

```html
<!-- Item de conta: antes -->
class="flex items-center justify-between gap-2.5 p-2.5 rounded-[10px] bg-[#f8f7f4] transition-colors duration-200 hover:bg-[#f2f0ed]"

<!-- depois -->
class="flex items-center justify-between gap-2.5 p-3 rounded-cards bg-parchment-card transition-colors duration-200 hover:bg-stone"
```

```html
<!-- Ícone da conta: antes -->
class="w-[34px] h-[34px] shrink-0 rounded-full bg-white shadow-[inset_0_0_0_1px_#f2f0ed] flex items-center justify-center text-base"

<!-- depois -->
class="w-9 h-9 shrink-0 rounded-full bg-card shadow-subtle flex items-center justify-center text-base"
```

```html
<!-- Nome da conta: antes -->
class="font-semibold text-[13px] leading-tight block text-[#343433] tracking-[-0.17px] truncate"

<!-- depois -->
class="font-semibold text-[13px] leading-tight block text-charcoal truncate"
```

```html
<!-- Status paga — dot e texto: antes -->
class="text-[11px] text-[#848281] flex items-center gap-1.5 mt-1 truncate"
<span class="w-2 h-2 rounded-full bg-[#00ca48] shrink-0"></span>

<!-- depois -->
class="text-caption text-ash flex items-center gap-1.5 mt-1 truncate"
<span class="w-2 h-2 rounded-full bg-meadow shrink-0"></span>
```

```html
<!-- Status pendente — dot: antes -->
<span class="w-2 h-2 rounded-full bg-[#ffbb26] shrink-0"></span>

<!-- depois -->
<span class="w-2 h-2 rounded-full bg-sunburst shrink-0"></span>
```

- [ ] **Step 2: Corrigir touch targets dos botões**

```html
<!-- Botão Lançar: antes -->
class="px-3 py-2 text-xs font-semibold bg-[#121212] hover:bg-[#343433] text-white rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"

<!-- depois -->
class="px-4 h-11 text-[13px] font-semibold bg-midnight hover:bg-charcoal text-white rounded-buttons transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
```

```html
<!-- Botão Configurar: antes -->
class="w-[30px] h-[30px] flex items-center justify-center text-[#848281] hover:text-[#343433] bg-white rounded-full shadow-[inset_0_0_0_1px_#f2f0ed] transition-colors"

<!-- depois -->
class="w-11 h-11 flex items-center justify-center text-ash hover:text-charcoal bg-card rounded-full shadow-subtle transition-colors"
```

```html
<!-- Botão Adicionar conta fixa: antes -->
class="group flex justify-center items-center gap-2 p-3 rounded-[10px] border border-dashed border-[#c6c6c6] hover:border-[#474645] hover:bg-[#f8f7f4] transition-colors duration-200 text-[#474645] font-semibold text-xs mt-1"

<!-- depois -->
class="group flex justify-center items-center gap-2 h-11 rounded-cards border border-dashed border-fog hover:border-graphite hover:bg-parchment-card transition-colors duration-200 text-graphite font-semibold text-caption mt-1"
```

- [ ] **Step 3: Verificar build**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ledger/ContasFixasPanel.vue
git commit -m "refactor: token sweep in ContasFixasPanel"
```

---

## Task 6: Token sweep — ActivityFeed

**Files:**
- Modify: `src/components/ledger/ActivityFeed.vue`

- [ ] **Step 1: Corrigir labels de texto pequeno**

```html
<!-- Contador: antes -->
class="text-[10px] text-ash font-semibold uppercase tracking-wider mt-0.5"

<!-- depois -->
class="text-caption text-ash font-semibold uppercase tracking-wider mt-0.5"
```

```html
<!-- Tipo de gasto: antes -->
class="text-[10px] font-bold text-ember uppercase tracking-wider"

<!-- depois -->
class="text-caption font-bold text-ember uppercase tracking-wider"
```

```html
<!-- "Pago por": antes -->
class="text-[10px] text-ash"

<!-- depois -->
class="text-caption text-ash"
```

- [ ] **Step 2: Corrigir touch targets dos botões de ação**

```html
<!-- Botão Ajustar: antes -->
class="h-8 px-3 text-[10px] border border-stone-surface"

<!-- depois -->
class="h-11 px-4 text-caption border border-stone-surface"
```

```html
<!-- Botão Excluir: antes -->
class="h-8 px-3 text-[10px] text-coral-red hover:bg-[#fff0f0] border border-transparent"

<!-- depois -->
class="h-11 px-4 text-caption text-coral-red hover:bg-coral-red/5 border border-transparent"
```

- [ ] **Step 3: Verificar build**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ledger/ActivityFeed.vue
git commit -m "refactor: token sweep in ActivityFeed"
```

---

## Task 7: Token sweep — HistoricoFaturas e DetalhamentoSaldosCard

**Files:**
- Modify: `src/components/ledger/dashboard/HistoricoFaturas.vue`
- Modify: `src/components/ledger/dashboard/DetalhamentoSaldosCard.vue`

- [ ] **Step 1: HistoricoFaturas — substituir hardcodes**

```html
<!-- bg-[#fbfaf9] no expanded panel: antes -->
class="border-t border-stone-surface p-6 bg-[#fbfaf9] space-y-8 animate-in fade-in slide-in-from-top-2"

<!-- depois -->
class="border-t border-stone-surface p-6 bg-canvas space-y-8 animate-in fade-in slide-in-from-top-2"
```

```html
<!-- Labels de texto: antes -->
class="text-[11px] text-ash uppercase tracking-wider mt-0.5"
class="text-[10px] font-bold uppercase text-ash tracking-widest"
class="text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest hidden md:block"
class="text-[10px] text-ash font-bold uppercase tracking-widest"
class="text-[9px] text-ash font-bold uppercase tracking-widest"

<!-- todos substituir text-[10px]/text-[11px]/text-[9px] por text-caption -->
```

- [ ] **Step 2: DetalhamentoSaldosCard — substituir hardcodes**

```html
<!-- Cards internos: antes -->
class="p-4 bg-[#f8f7f4] border border-stone-surface shadow-none rounded-cards space-y-3"

<!-- depois -->
class="p-4 bg-parchment-card border border-stone-surface shadow-none rounded-cards space-y-3"
```

```html
<!-- Labels de texto pequeno: antes -->
class="text-[9px] font-bold uppercase tracking-widest text-ash"

<!-- depois -->
class="text-caption font-bold uppercase tracking-widest text-ash"
```

- [ ] **Step 3: Verificar build**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ledger/dashboard/HistoricoFaturas.vue src/components/ledger/dashboard/DetalhamentoSaldosCard.vue
git commit -m "refactor: token sweep in HistoricoFaturas and DetalhamentoSaldosCard"
```

---

## Task 8: Verificação final

**Files:** todos os modificados

- [ ] **Step 1: Build completo**

```bash
npm run build
```
Esperado: sem erros TypeScript ou de build.

- [ ] **Step 2: Verificar critérios de aceitação**

```bash
# Nenhum hardcode de cor deve restar nos arquivos modificados
grep -rn "#f8f7f4\|#f2f0ed\|#343433\|#474645\|#848281\|#121212\|#fbfaf9" src/components/ledger/DashboardSaldos.vue src/components/ledger/ContasFixasPanel.vue src/components/ledger/ActivityFeed.vue src/components/ledger/dashboard/HistoricoFaturas.vue src/components/ledger/dashboard/DetalhamentoSaldosCard.vue
```
Esperado: sem resultados.

```bash
# Nenhum botão de ação com h-8 ou h-9
grep -rn "class=\".*h-8\|class=\".*h-9" src/components/ledger/
```
Esperado: sem resultados em botões de ação (pode haver em ícones/avatares).

- [ ] **Step 3: Teste visual mobile**

Abrir `npm run dev`, redimensionar browser para 375px de largura e verificar:
- [ ] Tab bar visível no bottom
- [ ] Aba Hoje mostra: Saldo Unificado, Acertos, Contas Fixas, Feed
- [ ] Aba Faturas mostra: Detalhamento, Próximas Faturas, Fechadas, Parcelas
- [ ] Aba Histórico mostra: Histórico de Faturas
- [ ] FAB posicionado acima da tab bar
- [ ] No desktop (≥ 768px): tab bar oculta, todas as seções em scroll

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "feat: dashboard mobile redesign complete"
```
