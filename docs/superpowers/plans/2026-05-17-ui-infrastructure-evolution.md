# UI Infrastructure Evolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the UI foundation with a robust token system in Tailwind v4 and refactor base components to match `DESIGN.md`.

**Architecture:** Hybrid Tailwind v4 with semantic tokens in `@theme` and bundled typography classes in `@layer components`. Components will be refactored to use these tokens exclusively.

**Tech Stack:** Vue 3, Tailwind CSS v4, Lucide Vue Next.

---

### Task 1: Comprehensive Token Infrastructure in `main.css`

**Files:**
- Modify: `src/main.css`

- [ ] **Step 1: Update `@theme` block with all semantic colors and radii**

```css
@theme {
  /* Colors - Semantic from DESIGN.md */
  --color-canvas: #fbfaf9;
  --color-stone: #f2f0ed;
  --color-card: #ffffff;
  --color-graphite: #474645;
  --color-charcoal: #343433;
  --color-midnight: #121212;
  --color-obsidian: #000000;
  --color-ash: #848281;
  --color-ember: #ff3e00;
  --color-meadow: #00ca48;
  --color-sky: #0090ff;
  --color-parchment: #f8f7f4;
  --color-flamingo: #ff58ae;
  --color-sunburst: #ffbb26;
  --color-coral: #ff2b3a;

  /* Fonts */
  --font-display: "Fraunces", "Georgia", serif;
  --font-sans: "Inter", system-ui, sans-serif;

  /* Radii */
  --radius-pill: 32px;
  --radius-card: 10px;
  --radius-card-lg: 24px;
  --radius-icon: 40px;

  /* Shadows */
  --shadow-subtle: var(--color-stone) 0px 0px 0px 1px inset;
  --shadow-lg: rgba(0, 0, 0, 0.15) 0px 0px 24px 0px;
  --shadow-sm: rgba(0, 0, 0, 0.04) 0px 1px 6px 0px, rgba(0, 0, 0, 0.05) 0px 0px 24px 0px;
}
```

- [ ] **Step 2: Implement Typography Bundles in `@layer components`**

```css
@layer components {
  .text-display {
    font-family: var(--font-display);
    font-size: 68px;
    font-weight: 500;
    line-height: 1.09;
    letter-spacing: -2.11px;
  }
  .text-heading-lg {
    font-size: 44px;
    font-weight: 600;
    line-height: 1.09;
    letter-spacing: -1.14px;
  }
  .text-heading {
    font-size: 23px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.44px;
  }
  .text-heading-sm {
    font-size: 19px;
    font-weight: 600;
    line-height: 1.38;
    letter-spacing: -0.25px;
  }
  .text-body {
    font-size: 15px;
    font-weight: 400;
    line-height: 1.47;
    letter-spacing: -0.2px;
  }
  .text-caption {
    font-size: 12px;
    font-weight: 400;
    line-height: 1.58;
    letter-spacing: -0.14px;
  }
}
```

- [ ] **Step 3: Commit Infrastructure**

```bash
git add src/main.css
git commit -m "style: implement comprehensive design tokens and typography bundles"
```

---

### Task 2: Refactor `Button.vue`

**Files:**
- Modify: `src/components/ui/Button.vue`

- [ ] **Step 1: Update implementation to use new semantic tokens**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../shared/utils/cn'

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'inverted'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'default'
})

const classes = computed(() => {
  return cn(
    'inline-flex items-center justify-center whitespace-nowrap transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
    // Sizes
    props.size === 'default' && 'h-11 px-6 py-2 text-sm font-medium',
    props.size === 'sm' && 'h-9 px-4 text-xs font-medium',
    props.size === 'lg' && 'h-14 px-8 text-base font-medium',
    props.size === 'icon' && 'h-10 w-10 text-sm font-medium',
    // Variants per DESIGN.md
    props.variant === 'primary' && 'bg-midnight text-white hover:bg-charcoal rounded-pill font-semibold',
    props.variant === 'secondary' && 'bg-stone text-midnight hover:opacity-90 rounded-pill font-medium',
    props.variant === 'outline' && 'bg-transparent text-graphite border border-graphite hover:bg-stone rounded-xl font-medium px-8 py-3',
    props.variant === 'ghost' && 'text-ember hover:opacity-80 font-medium p-0 border-none bg-transparent',
    props.variant === 'inverted' && 'bg-white text-midnight hover:bg-parchment rounded-pill font-medium shadow-subtle',
    props.class
  )
})
</script>

<template>
  <button :class="classes">
    <slot />
  </button>
</template>
```

- [ ] **Step 2: Commit changes**

```bash
git add src/components/ui/Button.vue
git commit -m "refactor: update Button component to use design tokens"
```

---

### Task 3: Refactor `Card.vue`

**Files:**
- Modify: `src/components/ui/Card.vue`

- [ ] **Step 1: Update implementation to use new semantic tokens and variants**

```vue
<script setup lang="ts">
import { cn } from '../../shared/utils/cn'

interface Props {
  variant?: 'default' | 'recessed' | 'dark' | 'featured'
  class?: any
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})
</script>

<template>
  <!-- Card Padrão (White) -->
  <div 
    v-if="props.variant === 'default' || props.variant === 'featured'"
    :class="cn(
      'rounded-card bg-card shadow-subtle transition-all duration-300 p-8',
      props.class
    )"
  >
    <slot />
  </div>

  <!-- Card Recessed (Parchment) -->
  <div 
    v-else-if="props.variant === 'recessed'"
    :class="cn(
      'rounded-card-lg bg-parchment p-[22.8px] transition-all duration-300',
      props.class
    )"
  >
    <slot />
  </div>

  <!-- Card Escuro / Phone Mockup (Obsidian) -->
  <div 
    v-else-if="props.variant === 'dark'"
    :class="cn(
      'rounded-card-lg bg-obsidian shadow-lg text-white p-6',
      props.class
    )"
  >
    <slot />
  </div>
</template>
```

- [ ] **Step 2: Commit changes**

```bash
git add src/components/ui/Card.vue
git commit -m "refactor: update Card component to use design tokens"
```

---

### Task 4: Refactor `BottomSheet.vue`

**Files:**
- Modify: `src/components/ui/BottomSheet.vue`

- [ ] **Step 1: Update typography and border radius**

```vue
<!-- Modify header title in template -->
<slot name="header">
  <h2 class="text-heading text-charcoal">{{ title }}</h2>
</slot>

<!-- Update container classes -->
<div
  class="pointer-events-auto relative flex flex-col bg-card border-t border-x border-stone shadow-lg transition-all duration-300 text-graphite
         rounded-t-card-lg md:rounded-t-card rounded-b-none max-h-[90dvh] w-full"
  :class="widthClass"
  ...
>
```

- [ ] **Step 2: Commit changes**

```bash
git add src/components/ui/BottomSheet.vue
git commit -m "refactor: update BottomSheet component to use design tokens"
```
