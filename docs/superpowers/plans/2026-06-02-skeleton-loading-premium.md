# Skeleton Loading Premium Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evoluir o skeleton do dashboard para uma composição modular e fiel, exibida somente durante espera real de dados, com shimmer CSS performático, acessibilidade e tokens dark prontos para futura ativação.

**Architecture:** Criar `SkeletonBlock.vue` como primitiva visual configurável e manter `SkeletonMimic.vue` como composição explícita das abas `hoje` e `faturas`. Remover o estado cenográfico de troca de aba em `DashboardSaldos.vue` e os timeouts mínimos de inicialização em `App.vue`, preservando o splash apenas enquanto a carga real estiver pendente.

**Tech Stack:** Vue 3 Composition API, TypeScript, Tailwind CSS v4, CSS custom properties, Vitest, Vue Test Utils.

---

## File Map

- Create: `src/views/components/ui/SkeletonBlock.vue`
  - Primitiva visual inerte com formas, tons e dimensões configuráveis.
- Create: `src/views/components/ui/SkeletonBlock.test.ts`
  - Testes da API visual e da ocultação para leitores de tela.
- Modify: `src/views/components/ui/SkeletonMimic.vue`
  - Composições fiéis e responsivas das abas `hoje` e `faturas`.
- Create: `src/views/components/ui/SkeletonMimic.test.ts`
  - Testes de semântica, variantes e contagens configuráveis.
- Modify: `src/views/screens/DashboardSaldos.vue`
  - Renderização do skeleton somente por `props.isLoading`.
- Create: `src/views/screens/DashboardSaldos.test.ts`
  - Regressão para impedir skeleton cenográfico em trocas de aba.
- Modify: `src/App.vue`
  - Remoção de timeouts artificiais após carga inicial.
- Modify: `src/App.test.ts`
  - Regressão para impedir temporizadores mínimos e alinhar o teste do FAB ao markup atual.
- Modify: `src/main.css`
  - Remoção da implementação global antiga `.animate-shimmer`, substituída pela primitiva encapsulada.

## Working Tree Rule

O worktree contém alterações locais anteriores ao plano. Em cada commit, adicionar somente os caminhos listados na tarefa correspondente. Não usar `git add .`, não reformatar arquivos não relacionados e não descartar mudanças existentes.

### Task 1: Criar a primitiva `SkeletonBlock`

**Files:**
- Create: `src/views/components/ui/SkeletonBlock.test.ts`
- Create: `src/views/components/ui/SkeletonBlock.vue`

- [ ] **Step 1: Escrever o teste inicialmente falho**

Criar `src/views/components/ui/SkeletonBlock.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SkeletonBlock from './SkeletonBlock.vue'

describe('SkeletonBlock', () => {
  it('aplica forma, tom e custom properties configuraveis', () => {
    const wrapper = mount(SkeletonBlock, {
      props: {
        shape: 'circle',
        tone: 'strong',
        width: '3rem',
        height: '3rem',
        radius: '9999px',
        delay: '160ms'
      }
    })

    const block = wrapper.get('[data-testid="skeleton-block"]')

    expect(block.classes()).toContain('skeleton-block--circle')
    expect(block.classes()).toContain('skeleton-block--strong')
    expect(block.attributes('style')).toContain('--skeleton-width: 3rem')
    expect(block.attributes('style')).toContain('--skeleton-height: 3rem')
    expect(block.attributes('style')).toContain('--skeleton-radius: 9999px')
    expect(block.attributes('style')).toContain('--skeleton-delay: 160ms')
  })

  it('mantem o bloco decorativo oculto para leitores de tela', () => {
    const wrapper = mount(SkeletonBlock)

    expect(wrapper.get('[data-testid="skeleton-block"]').attributes('aria-hidden')).toBe('true')
  })
})
```

- [ ] **Step 2: Rodar o teste para confirmar a falha**

Run:

```bash
npx vitest run src/views/components/ui/SkeletonBlock.test.ts
```

Expected: FAIL porque `SkeletonBlock.vue` ainda não existe.

- [ ] **Step 3: Implementar a primitiva**

Criar `src/views/components/ui/SkeletonBlock.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  shape?: 'text' | 'rect' | 'circle'
  tone?: 'soft' | 'base' | 'strong'
  width?: string
  height?: string
  radius?: string
  delay?: string
}

const props = withDefaults(defineProps<Props>(), {
  shape: 'rect',
  tone: 'base',
  width: '100%',
  height: '1rem',
  radius: undefined,
  delay: '0ms'
})

const blockStyle = computed(() => ({
  '--skeleton-width': props.width,
  '--skeleton-height': props.height,
  '--skeleton-radius': props.radius,
  '--skeleton-delay': props.delay
}))
</script>

<template>
  <span
    :class="[
      'skeleton-block',
      `skeleton-block--${props.shape}`,
      `skeleton-block--${props.tone}`
    ]"
    :style="blockStyle"
    aria-hidden="true"
    data-testid="skeleton-block"
  />
</template>

<style scoped>
.skeleton-block {
  position: relative;
  display: block;
  width: var(--skeleton-width);
  height: var(--skeleton-height);
  overflow: hidden;
  border-radius: var(--skeleton-radius, 0.75rem);
  background: var(--skeleton-base, rgba(242, 240, 237, 0.88));
}

.skeleton-block::after {
  position: absolute;
  inset: 0;
  content: "";
  background: linear-gradient(
    100deg,
    transparent 18%,
    var(--skeleton-highlight, rgba(255, 255, 255, 0.72)) 48%,
    transparent 78%
  );
  transform: translate3d(-110%, 0, 0);
  animation: skeleton-shimmer var(--skeleton-duration, 1.8s)
    var(--skeleton-ease, cubic-bezier(0.4, 0, 0.2, 1))
    var(--skeleton-delay)
    infinite;
  will-change: transform;
}

.skeleton-block--text {
  border-radius: var(--skeleton-radius, 0.375rem);
}

.skeleton-block--circle {
  border-radius: var(--skeleton-radius, 9999px);
}

.skeleton-block--soft {
  background: var(--skeleton-soft, rgba(242, 240, 237, 0.56));
}

.skeleton-block--strong {
  background: var(--skeleton-strong, rgba(226, 223, 219, 0.96));
}

@keyframes skeleton-shimmer {
  to {
    transform: translate3d(110%, 0, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-block::after {
    animation: none;
    transform: none;
    opacity: 0.35;
  }
}
</style>
```

- [ ] **Step 4: Rodar o teste para confirmar sucesso**

Run:

```bash
npx vitest run src/views/components/ui/SkeletonBlock.test.ts
```

Expected: PASS com `2 tests`.

- [ ] **Step 5: Criar commit limitado à primitiva**

```bash
git add src/views/components/ui/SkeletonBlock.vue src/views/components/ui/SkeletonBlock.test.ts
git commit -m "feat: add configurable skeleton block"
```

### Task 2: Refatorar `SkeletonMimic` como composição fiel

**Files:**
- Create: `src/views/components/ui/SkeletonMimic.test.ts`
- Modify: `src/views/components/ui/SkeletonMimic.vue`
- Modify: `src/main.css`

- [ ] **Step 1: Escrever os testes inicialmente falhos**

Criar `src/views/components/ui/SkeletonMimic.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SkeletonMimic from './SkeletonMimic.vue'

describe('SkeletonMimic', () => {
  it('anuncia a carga uma vez e esconde a arvore visual', () => {
    const wrapper = mount(SkeletonMimic)

    expect(wrapper.get('[data-testid="skeleton-mimic"]').attributes('aria-busy')).toBe('true')
    expect(wrapper.get('[role="status"]').text()).toBe('Carregando dados do dashboard')
    expect(wrapper.get('[data-testid="skeleton-visual"]').attributes('aria-hidden')).toBe('true')
  })

  it('espelha as secoes principais da aba hoje', () => {
    const wrapper = mount(SkeletonMimic, {
      props: {
        variant: 'hoje',
        memberRows: 2,
        fixedBillRows: 4,
        activityRows: 3
      }
    })

    expect(wrapper.find('[data-testid="skeleton-balance-panel"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="skeleton-balance-row"]')).toHaveLength(2)
    expect(wrapper.find('[data-testid="skeleton-fixed-bills-panel"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="skeleton-fixed-bill-row"]')).toHaveLength(4)
    expect(wrapper.find('[data-testid="skeleton-add-fixed-bill"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="skeleton-activity-panel"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="skeleton-activity-row"]')).toHaveLength(3)
  })

  it('renderiza acertos somente quando existem linhas solicitadas', async () => {
    const wrapper = mount(SkeletonMimic, {
      props: { variant: 'hoje', nettingRows: 0 }
    })

    expect(wrapper.find('[data-testid="skeleton-netting-panel"]').exists()).toBe(false)

    await wrapper.setProps({ nettingRows: 2 })

    expect(wrapper.find('[data-testid="skeleton-netting-panel"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="skeleton-netting-row"]')).toHaveLength(2)
  })

  it('espelha status e analise detalhada da aba faturas', () => {
    const wrapper = mount(SkeletonMimic, {
      props: { variant: 'faturas', memberRows: 2 }
    })

    expect(wrapper.find('[data-testid="skeleton-period-status"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="skeleton-breakdown-panel"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="skeleton-member-breakdown"]')).toHaveLength(2)
    expect(wrapper.findAll('[data-testid="skeleton-financial-summary"]')).toHaveLength(6)
  })
})
```

- [ ] **Step 2: Rodar os testes para confirmar a falha**

Run:

```bash
npx vitest run src/views/components/ui/SkeletonMimic.test.ts
```

Expected: FAIL porque o componente existente não expõe a semântica, os test ids nem todas as seções.

- [ ] **Step 3: Substituir `SkeletonMimic.vue`**

Substituir `src/views/components/ui/SkeletonMimic.vue` pelo conteúdo abaixo:

```vue
<script setup lang="ts">
import SkeletonBlock from './SkeletonBlock.vue'

interface Props {
  variant?: 'hoje' | 'faturas'
  memberRows?: number
  fixedBillRows?: number
  activityRows?: number
  nettingRows?: number
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'hoje',
  memberRows: 3,
  fixedBillRows: 3,
  activityRows: 3,
  nettingRows: 0
})

const delay = (index: number, offset = 0) => `${(index + offset) * 70}ms`
</script>

<template>
  <section
    class="skeleton-theme"
    aria-busy="true"
    aria-live="polite"
    data-testid="skeleton-mimic"
  >
    <span class="sr-only" role="status">Carregando dados do dashboard</span>

    <div
      class="pointer-events-none select-none space-y-12"
      aria-hidden="true"
      data-testid="skeleton-visual"
    >
      <header class="flex items-center justify-between pb-6 pt-3 mb-8 border-b border-stone/50">
        <div class="flex-1 space-y-2">
          <SkeletonBlock shape="text" tone="soft" width="3rem" height="0.625rem" />
          <SkeletonBlock shape="text" tone="strong" width="7rem" height="1.5rem" delay="70ms" />
        </div>
        <div class="flex-1 flex flex-col items-center gap-2">
          <SkeletonBlock shape="text" tone="soft" width="5.5rem" height="0.625rem" delay="140ms" />
          <SkeletonBlock shape="text" tone="strong" width="4rem" height="1.75rem" delay="210ms" />
        </div>
        <div class="flex-1 flex justify-end">
          <SkeletonBlock width="2.75rem" height="2.75rem" radius="0.75rem" delay="280ms" />
        </div>
      </header>

      <template v-if="props.variant === 'hoje'">
        <section class="space-y-6">
          <div class="flex items-center gap-3 px-1">
            <SkeletonBlock shape="circle" tone="soft" width="0.375rem" height="0.375rem" />
            <SkeletonBlock shape="text" tone="soft" width="6.5rem" height="0.625rem" />
          </div>
          <div class="skeleton-shell" data-testid="skeleton-balance-panel">
            <div class="skeleton-panel-header">
              <SkeletonBlock width="2.75rem" height="2.75rem" radius="0.75rem" />
              <div class="space-y-2">
                <SkeletonBlock shape="text" tone="strong" width="9rem" height="1.125rem" delay="70ms" />
                <SkeletonBlock shape="text" tone="soft" width="11rem" height="0.6875rem" delay="140ms" />
              </div>
            </div>
            <div class="p-3 sm:p-6 space-y-3 sm:space-y-4">
              <div
                v-for="row in props.memberRows"
                :key="`balance-${row}`"
                class="flex justify-between items-center p-3 sm:p-4 rounded-2xl border border-stone bg-canvas"
                data-testid="skeleton-balance-row"
              >
                <div class="flex items-center gap-3 sm:gap-4">
                  <SkeletonBlock shape="circle" width="3rem" height="3rem" :delay="delay(row)" />
                  <div class="space-y-2">
                    <SkeletonBlock shape="text" tone="strong" width="6.5rem" height="0.875rem" :delay="delay(row, 1)" />
                    <SkeletonBlock shape="text" tone="soft" width="5rem" height="0.625rem" :delay="delay(row, 2)" />
                  </div>
                </div>
                <SkeletonBlock shape="text" tone="strong" width="5.5rem" height="1.5rem" :delay="delay(row, 3)" />
              </div>
            </div>
          </div>
        </section>

        <section v-if="props.nettingRows > 0" class="space-y-6">
          <div class="flex items-center gap-3 px-1">
            <SkeletonBlock shape="circle" tone="soft" width="0.375rem" height="0.375rem" />
            <SkeletonBlock shape="text" tone="soft" width="7.5rem" height="0.625rem" />
          </div>
          <div class="skeleton-shell" data-testid="skeleton-netting-panel">
            <div class="skeleton-panel-header">
              <SkeletonBlock width="2.75rem" height="2.75rem" radius="0.75rem" />
              <div class="space-y-2">
                <SkeletonBlock shape="text" tone="strong" width="10rem" height="1.125rem" />
                <SkeletonBlock shape="text" tone="soft" width="12rem" height="0.6875rem" />
              </div>
            </div>
            <div class="p-4 sm:p-6 grid gap-4">
              <div
                v-for="row in props.nettingRows"
                :key="`netting-${row}`"
                class="p-5 border border-stone bg-canvas rounded-2xl space-y-5"
                data-testid="skeleton-netting-row"
              >
                <div class="flex gap-4">
                  <SkeletonBlock shape="circle" width="3rem" height="3rem" :delay="delay(row)" />
                  <div class="flex-1 space-y-3">
                    <SkeletonBlock shape="text" width="70%" height="0.875rem" :delay="delay(row, 1)" />
                    <SkeletonBlock shape="text" tone="strong" width="7rem" height="1.875rem" :delay="delay(row, 2)" />
                  </div>
                </div>
                <SkeletonBlock width="100%" height="3rem" radius="0.75rem" :delay="delay(row, 3)" />
              </div>
            </div>
          </div>
        </section>

        <section class="space-y-6">
          <div class="flex items-center gap-3 px-1">
            <SkeletonBlock shape="circle" tone="soft" width="0.375rem" height="0.375rem" />
            <SkeletonBlock shape="text" tone="soft" width="6rem" height="0.625rem" />
          </div>
          <div class="skeleton-shell" data-testid="skeleton-fixed-bills-panel">
            <div class="skeleton-panel-header">
              <SkeletonBlock width="2.75rem" height="2.75rem" radius="0.75rem" />
              <div class="space-y-2">
                <SkeletonBlock shape="text" tone="strong" width="7rem" height="1.125rem" />
                <SkeletonBlock shape="text" tone="soft" width="8rem" height="0.6875rem" />
              </div>
            </div>
            <div class="p-4 sm:p-6 grid gap-3">
              <div
                v-for="row in props.fixedBillRows"
                :key="`fixed-${row}`"
                class="flex items-center justify-between p-4 rounded-xl border border-stone bg-canvas"
                data-testid="skeleton-fixed-bill-row"
              >
                <div class="flex items-center gap-4">
                  <SkeletonBlock width="2.5rem" height="2.5rem" radius="0.5rem" :delay="delay(row)" />
                  <div class="space-y-2">
                    <SkeletonBlock shape="text" tone="strong" width="6rem" height="0.875rem" :delay="delay(row, 1)" />
                    <SkeletonBlock shape="text" tone="soft" width="8.5rem" height="0.625rem" :delay="delay(row, 2)" />
                  </div>
                </div>
                <SkeletonBlock shape="circle" tone="soft" width="1.5rem" height="1.5rem" :delay="delay(row, 3)" />
              </div>
              <div
                class="mt-3 flex justify-center rounded-xl border border-dashed border-stone bg-canvas/50 p-4"
                data-testid="skeleton-add-fixed-bill"
              >
                <SkeletonBlock shape="text" tone="soft" width="9rem" height="0.625rem" />
              </div>
            </div>
          </div>
        </section>

        <section class="space-y-6">
          <div class="flex items-center gap-3 px-1">
            <SkeletonBlock shape="circle" tone="soft" width="0.375rem" height="0.375rem" />
            <SkeletonBlock shape="text" tone="soft" width="6rem" height="0.625rem" />
          </div>
          <div class="skeleton-shell" data-testid="skeleton-activity-panel">
            <div class="skeleton-panel-header">
              <SkeletonBlock width="2.75rem" height="2.75rem" radius="0.75rem" />
              <div class="space-y-2">
                <SkeletonBlock shape="text" tone="strong" width="6rem" height="1.125rem" />
                <SkeletonBlock shape="text" tone="soft" width="10rem" height="0.6875rem" />
              </div>
            </div>
            <div class="p-4 sm:p-6 space-y-4">
              <div
                v-for="row in props.activityRows"
                :key="`activity-${row}`"
                class="p-4 rounded-xl border border-stone bg-canvas space-y-4"
                data-testid="skeleton-activity-row"
              >
                <div class="flex justify-between gap-4">
                  <div class="flex-1 space-y-2">
                    <SkeletonBlock shape="text" tone="strong" width="65%" height="0.875rem" :delay="delay(row)" />
                    <SkeletonBlock shape="text" tone="soft" width="45%" height="0.625rem" :delay="delay(row, 1)" />
                  </div>
                  <SkeletonBlock shape="text" tone="strong" width="4.5rem" height="1.125rem" :delay="delay(row, 2)" />
                </div>
                <div class="flex justify-end gap-2 pt-3 border-t border-stone">
                  <SkeletonBlock width="4.5rem" height="2.25rem" radius="0.5rem" :delay="delay(row, 3)" />
                  <SkeletonBlock width="4.5rem" height="2.25rem" radius="0.5rem" :delay="delay(row, 4)" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>

      <template v-else>
        <div
          class="mt-6 p-8 flex flex-col md:flex-row justify-between items-center gap-6 bg-canvas border-2 border-stone shadow-subtle rounded-2xl"
          data-testid="skeleton-period-status"
        >
          <div class="flex items-center gap-5 w-full">
            <SkeletonBlock width="3rem" height="3rem" radius="0.75rem" />
            <div class="space-y-3 flex-1 max-w-[25rem]">
              <SkeletonBlock shape="text" tone="strong" width="9rem" height="1.25rem" />
              <SkeletonBlock shape="text" tone="soft" width="100%" height="0.8125rem" />
            </div>
          </div>
          <SkeletonBlock width="100%" height="3rem" radius="0.75rem" class="md:max-w-40" />
        </div>

        <section class="space-y-6">
          <div class="flex items-center gap-3 px-1">
            <SkeletonBlock shape="circle" tone="soft" width="0.375rem" height="0.375rem" />
            <SkeletonBlock shape="text" tone="soft" width="7rem" height="0.625rem" />
          </div>
          <div class="skeleton-shell" data-testid="skeleton-breakdown-panel">
            <div class="skeleton-panel-header">
              <SkeletonBlock width="2.75rem" height="2.75rem" radius="0.75rem" />
              <div class="space-y-2">
                <SkeletonBlock shape="text" tone="strong" width="8.5rem" height="1.125rem" />
                <SkeletonBlock shape="text" tone="soft" width="12rem" height="0.6875rem" />
              </div>
            </div>
            <div class="p-4 sm:p-8 space-y-12">
              <div
                v-for="member in props.memberRows"
                :key="`breakdown-${member}`"
                class="space-y-6"
                data-testid="skeleton-member-breakdown"
              >
                <div class="flex justify-between items-center px-1 gap-4">
                  <div class="flex items-center gap-4">
                    <SkeletonBlock shape="circle" width="3.5rem" height="3.5rem" :delay="delay(member)" />
                    <SkeletonBlock shape="text" tone="strong" width="7rem" height="1.5rem" :delay="delay(member, 1)" />
                  </div>
                  <SkeletonBlock width="6.5rem" height="2rem" radius="9999px" :delay="delay(member, 2)" />
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    v-for="summary in 3"
                    :key="summary"
                    class="rounded-2xl bg-parchment p-5 space-y-6 shadow-subtle"
                    data-testid="skeleton-financial-summary"
                  >
                    <div class="flex items-center gap-3">
                      <SkeletonBlock shape="circle" width="2.25rem" height="2.25rem" :delay="delay(member, summary)" />
                      <SkeletonBlock shape="text" tone="soft" width="5rem" height="0.625rem" :delay="delay(member, summary + 1)" />
                    </div>
                    <div class="space-y-3">
                      <SkeletonBlock shape="text" width="100%" height="0.75rem" />
                      <div class="h-px bg-stone" />
                      <SkeletonBlock shape="text" width="100%" height="0.75rem" />
                    </div>
                  </div>
                </div>
                <div class="flex justify-center pt-2">
                  <SkeletonBlock width="10rem" height="2.25rem" radius="9999px" :delay="delay(member, 4)" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </section>
</template>

<style scoped>
.skeleton-theme {
  --skeleton-base: rgba(242, 240, 237, 0.88);
  --skeleton-soft: rgba(242, 240, 237, 0.56);
  --skeleton-strong: rgba(226, 223, 219, 0.96);
  --skeleton-highlight: rgba(255, 255, 255, 0.72);
  --skeleton-duration: 1.8s;
  --skeleton-ease: cubic-bezier(0.4, 0, 0.2, 1);
}

:global(.dark) .skeleton-theme {
  --skeleton-base: rgba(71, 70, 69, 0.88);
  --skeleton-soft: rgba(71, 70, 69, 0.56);
  --skeleton-strong: rgba(92, 90, 88, 0.96);
  --skeleton-highlight: rgba(255, 255, 255, 0.1);
}

.skeleton-shell {
  overflow: hidden;
  border: 1px solid rgba(242, 240, 237, 0.3);
  border-radius: 1.25rem;
  background: var(--color-card);
  box-shadow: var(--shadow-subtle);
}

.skeleton-panel-header {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.25rem;
  border-bottom: 1px solid var(--color-stone);
  background: var(--color-parchment);
}

@media (min-width: 640px) {
  .skeleton-panel-header {
    padding: 1.75rem 1.5rem;
  }
}
</style>
```

- [ ] **Step 4: Remover a implementação global antiga do shimmer**

Em `src/main.css`, remover:

```css
  @keyframes shimmer-premium {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
```

E remover:

```css
  .animate-shimmer {
    position: relative;
    overflow: hidden;
  }
  
  .animate-shimmer::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.4) 50%,
      transparent 100%
    );
    animation: shimmer-premium 2s infinite;
    /* GPU acceleration for smooth performance */
    transform: translateZ(0); 
    will-change: transform;
  }
```

- [ ] **Step 5: Rodar os testes da composição**

Run:

```bash
npx vitest run src/views/components/ui/SkeletonBlock.test.ts src/views/components/ui/SkeletonMimic.test.ts
```

Expected: PASS com `6 tests`.

- [ ] **Step 6: Criar commit limitado à composição**

```bash
git add src/views/components/ui/SkeletonMimic.vue src/views/components/ui/SkeletonMimic.test.ts src/main.css
git commit -m "feat: mirror dashboard layout in skeleton loading"
```

### Task 3: Exibir skeleton somente durante espera real

**Files:**
- Create: `src/views/screens/DashboardSaldos.test.ts`
- Modify: `src/views/screens/DashboardSaldos.vue`
- Modify: `src/App.test.ts`
- Modify: `src/App.vue`

- [ ] **Step 1: Escrever a regressão do dashboard**

Criar `src/views/screens/DashboardSaldos.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import DashboardSaldos from './DashboardSaldos.vue'

vi.mock('../../viewmodels/useDashboardViewModel', () => ({
  useDashboardViewModel: () => ({
    faturaSelecionadaFechada: ref(false),
    saldosUnificadosAtivos: ref({}),
    nettingTransferencias: ref([]),
    membrosVisiveis: ref([]),
    contasFixas: ref([]),
    gastosFaturaSelecionada: ref([]),
    getMembroNome: vi.fn(),
    currentMonthName: ref('Junho'),
    currentYear: ref(2026),
    abrirLancarBill: vi.fn(),
    abrirConfigurarBill: vi.fn(),
    abrirNovoBill: vi.fn(),
    abrirAjustarGasto: vi.fn(),
    abrirConfirmacaoEstornoGasto: vi.fn(),
    abrirBottomSheetNetting: vi.fn(),
    abrirNovoPeriodoBottomSheet: vi.fn(),
    estornarContaFixa: vi.fn(),
    totalLancamentosPeriodoSelecionado: ref(1),
    reabrirPeriodoSelecionado: vi.fn(),
    isDropdownAbertosOpen: ref(false),
    periodoSelecionado: ref(null),
    abrirModal: vi.fn()
  })
}))

vi.mock('../../viewmodels/useCasasMultitenant', () => ({
  useCasasMultitenant: () => ({
    isAuthed: ref(true),
    activeTenantId: ref('tenant-1'),
    casas: ref([]),
    showBottomSheetCasas: ref(false),
    form: ref({}),
    copiedCode: ref(false),
    activeTenantObj: ref({ name: 'Casa' }),
    selecionarCasa: vi.fn(),
    criarNovaCasa: vi.fn(),
    entrarPorCodigo: vi.fn(),
    copyInviteCode: vi.fn(),
    handleLogoutClick: vi.fn()
  })
}))

const props = {
  membros: [],
  faturasAbertas: [],
  faturasFechadas: [],
  cartoes: [],
  activeTab: 'hoje' as const,
  isLoading: false
}

describe('DashboardSaldos loading', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('renderiza skeleton somente quando recebe espera real', async () => {
    const wrapper = mount(DashboardSaldos, {
      props,
      global: {
        stubs: {
          DashboardHeader: true,
          UnifiedBalancePanel: true,
          NettingPanel: true,
          ContasFixasPanel: true,
          ActivityFeed: true,
          DetalhamentoSaldosCard: true,
          DashboardModalsManager: true,
          IllustrationMascot: true,
          Card: { template: '<div><slot /></div>' },
          Button: { template: '<button><slot /></button>' }
        }
      }
    })

    expect(wrapper.find('[data-testid="skeleton-mimic"]').exists()).toBe(false)

    await wrapper.setProps({ activeTab: 'faturas' })
    await vi.advanceTimersByTimeAsync(700)

    expect(wrapper.find('[data-testid="skeleton-mimic"]').exists()).toBe(false)

    await wrapper.setProps({ isLoading: true })

    expect(wrapper.find('[data-testid="skeleton-mimic"]').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: Rodar a regressão do dashboard para confirmar a falha**

Run:

```bash
npx vitest run src/views/screens/DashboardSaldos.test.ts
```

Expected: FAIL porque a troca de aba atual ativa `isSwitching` por `600ms`.

- [ ] **Step 3: Remover o estado cenográfico em `DashboardSaldos.vue`**

Alterar o import:

```ts
import { computed } from 'vue'
```

Remover integralmente:

```ts
const isSwitching = ref(false)

// Dispara um pulse de skeleton ao trocar de aba para manter a sensacao de "carregamento fisico"
watch(() => props.activeTab, (newTab, oldTab) => {
  if (newTab !== oldTab) {
    isSwitching.value = true
    setTimeout(() => {
      isSwitching.value = false
    }, 600)
  }
})
```

Alterar a condição do mimic para:

```vue
<SkeletonMimic 
  v-if="props.isLoading" 
  :variant="props.activeTab === 'faturas' ? 'faturas' : 'hoje'" 
  key="skeleton" 
/>
```

- [ ] **Step 4: Rodar a regressão do dashboard para confirmar sucesso**

Run:

```bash
npx vitest run src/views/screens/DashboardSaldos.test.ts
```

Expected: PASS com `1 test`.

- [ ] **Step 5: Atualizar a regressão de inicialização do app**

Em `src/App.test.ts`, manter os mocks existentes necessários e substituir o conteúdo por:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import App from './App.vue'

vi.mock('./shared/container', () => ({
  tenantSessionService: {
    isAuthenticated: () => true,
    getActiveTenantId: () => 'tenant-123',
    getCurrentUserId: () => 'user-123',
    inicializarSessao: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined)
  },
  socketService: {
    conectar: vi.fn(),
    desconectar: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  }
}))

vi.mock('./viewmodels/useMembros', () => ({
  useMembros: () => ({
    ativos: ref([]),
    membros: ref([]),
    inicializar: vi.fn().mockResolvedValue(undefined),
    carregar: vi.fn().mockResolvedValue(undefined)
  })
}))

vi.mock('./viewmodels/useCartoesEFaturas', () => ({
  useCartoesEFaturas: () => ({
    cartoes: ref([]),
    faturasAbertas: ref([]),
    faturasFechadas: ref([]),
    inicializar: vi.fn().mockResolvedValue(undefined)
  })
}))

vi.mock('./viewmodels/useContasFixas', () => ({
  useContasFixas: () => ({
    carregarTemplates: vi.fn().mockResolvedValue(undefined)
  })
}))

vi.mock('./viewmodels/useBottomSheetState', () => ({
  useBottomSheetState: () => ({
    isAnyBottomSheetOpen: ref(false)
  })
}))

const mountApp = () => mount(App, {
  global: {
    stubs: {
      DashboardSaldos: {
        props: ['isLoading'],
        template: '<div data-testid="dashboard" :data-loading="String(isLoading)" />'
      },
      NovoLancamentoWizard: true,
      ConfiguracoesMembros: true,
      BottomSheet: { template: '<div><slot /></div>' },
      BottomTabBar: true,
      ToastNotification: true,
      IllustrationMascot: true
    }
  }
})

describe('App loading', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('libera o dashboard assim que a carga inicial termina sem timeout minimo', async () => {
    vi.useFakeTimers()
    const wrapper = mountApp()

    await flushPromises()

    expect(wrapper.get('[data-testid="dashboard"]').attributes('data-loading')).toBe('false')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('renderiza o FAB atual como acao circular central', async () => {
    const wrapper = mountApp()

    await flushPromises()

    const fabButton = wrapper.get('[data-testid="novo-lancamento-fab"]')

    expect(fabButton.classes()).toContain('w-16')
    expect(fabButton.classes()).toContain('h-16')
    expect(fabButton.classes()).toContain('rounded-full')
    expect(fabButton.classes()).toContain('bg-ember')
  })
})
```

- [ ] **Step 6: Rodar o teste do app para confirmar a falha**

Run:

```bash
npx vitest run src/App.test.ts
```

Expected: FAIL porque `App.vue` ainda agenda os timeouts artificiais de `800ms` e `1200ms`.

- [ ] **Step 7: Remover os timeouts artificiais em `App.vue`**

No `finally` do `onMounted`, substituir:

```ts
      // O Splash termina primeiro
      setTimeout(() => {
        isInitializing.value = false
        
        // O Skeleton (isLoading) permanece por mais um tempo para criar a transicao fluida
        // "Mimic" funciona melhor se o usuario tiver tempo de reconhecer a estrutura
        setTimeout(() => {
          isLoading.value = false
        }, 1200)
      }, 800)
```

Por:

```ts
      isInitializing.value = false
      isLoading.value = false
```

- [ ] **Step 8: Rodar os testes de integração tocados**

Run:

```bash
npx vitest run src/App.test.ts src/views/screens/DashboardSaldos.test.ts
```

Expected: PASS com `3 tests`.

- [ ] **Step 9: Criar commit limitado à integração**

```bash
git add src/App.vue src/App.test.ts src/views/screens/DashboardSaldos.vue src/views/screens/DashboardSaldos.test.ts
git commit -m "fix: show dashboard skeleton only during data loading"
```

### Task 4: Verificação completa

**Files:**
- Verify only.

- [ ] **Step 1: Rodar todos os testes**

Run:

```bash
npx vitest run
```

Expected: PASS. Se um teste anterior ao trabalho falhar, registrar o nome e confirmar se a falha também ocorre antes dos commits desta implementação. Não alterar módulos não relacionados para mascarar regressões preexistentes.

- [ ] **Step 2: Rodar o build de produção**

Run:

```bash
npm run build
```

Expected: PASS com bundle gerado em `dist/`.

- [ ] **Step 3: Confirmar ausência de shimmer global e esperas cenográficas**

Run:

```bash
rg -n "animate-shimmer|shimmer-premium|isSwitching|1200|setTimeout" src/App.vue src/main.css src/views/screens/DashboardSaldos.vue src/views/components/ui/SkeletonMimic.vue src/views/components/ui/SkeletonBlock.vue
```

Expected: nenhum resultado para `animate-shimmer`, `shimmer-premium`, `isSwitching` ou `1200`. `setTimeout` não deve aparecer nos arquivos de integração tocados.

- [ ] **Step 4: Verificar whitespace e arquivos staged**

Run:

```bash
git diff --check HEAD
git status --short
```

Expected: `git diff --check HEAD` sem erros. `git status --short` pode continuar exibindo alterações locais anteriores ao plano, mas nenhum arquivo da implementação deve permanecer sem commit.

- [ ] **Step 5: Revisar os três commits da implementação**

Run:

```bash
git log --oneline -4
```

Expected: os três commits da implementação aparecem acima do commit de design `777449f`.
