# DIVI Scaffolding and Core Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the DIVI project and implement the core domain logic of the Ledger module using Hexagonal Architecture.

**Architecture:** Hexagonal Architecture (Ports & Adapters) with independent business modules.

**Tech Stack:** Vue 3, TypeScript, Vite, Tailwind CSS, Vitest, Sentry, Lucide Icons.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`
- Create: `src/main.ts`, `src/App.vue`, `src/index.css`

- [ ] **Step 1: Initialize Vite project with Vue and TypeScript**
Run: `npm create vite@latest . -- --template vue-ts`
Expected: Project files created in the root directory.

- [ ] **Step 2: Install dependencies**
Run: `npm install -D tailwindcss postcss autoprefixer vitest @vitejs/plugin-vue lucide-vue-next @sentry/vue`
Expected: `node_modules` populated.

- [ ] **Step 3: Initialize Tailwind CSS**
Run: `npx tailwindcss init -p`
Expected: `tailwind.config.js` and `postcss.config.js` created.

- [ ] **Step 4: Configure Tailwind content paths**
Modify `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 5: Setup Vitest in `vite.config.ts`**
```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 6: Basic App.vue and CSS**
Write `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```
Write `src/App.vue`:
```vue
<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <h1 class="text-3xl font-bold text-blue-600">DIVI - Orquestrador Financeiro</h1>
  </div>
</template>
```

- [ ] **Step 7: Verify project runs**
Run: `npm run dev` (manually verify) and `npm run build`.

- [ ] **Step 8: Commit**
Run: `git add . && git commit -m "chore: initial scaffold with vue, tailwind, vitest"`

---

### Task 2: Architecture Directory Structure

**Files:**
- Create: `src/modules/.gitkeep`, `src/shared/primitives/.gitkeep`, `src/shared/errors/.gitkeep`

- [ ] **Step 1: Create Hexagonal directories**
Run: `mkdir -p src/modules src/shared/primitives src/shared/errors src/assets`
Expected: Directory structure created.

- [ ] **Step 2: Commit**
Run: `git add src && git commit -m "chore: establish hexagonal directory structure"`

---

### Task 3: Shared Primitives - Dinheiro Value Object

**Files:**
- Create: `src/shared/primitives/Dinheiro.ts`
- Test: `src/shared/primitives/Dinheiro.test.ts`

- [ ] **Step 1: Write failing test for Dinheiro VO**
```typescript
import { describe, it, expect } from 'vitest'
import { Dinheiro } from './Dinheiro'

describe('Dinheiro Value Object', () => {
  it('deve criar uma instância com valor centesimal', () => {
    const d = Dinheiro.deReais(10.50)
    expect(d.centavos).toBe(1050)
  })

  it('deve formatar para PT-BR', () => {
    const d = Dinheiro.deReais(10.50)
    expect(d.formatar()).toBe('R$ 10,50')
  })
})
```

- [ ] **Step 2: Run test to verify failure**
Run: `npx vitest src/shared/primitives/Dinheiro.test.ts`

- [ ] **Step 3: Implement Dinheiro VO**
```typescript
export class Dinheiro {
  private constructor(public readonly centavos: number) {}

  static deReais(valor: number): Dinheiro {
    return new Dinheiro(Math.round(valor * 100))
  }

  static deCentavos(centavos: number): Dinheiro {
    return new Dinheiro(centavos)
  }

  formatar(): string {
    return (this.centavos / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }
}
```

- [ ] **Step 4: Verify test passes**
Run: `npx vitest src/shared/primitives/Dinheiro.test.ts`

- [ ] **Step 5: Commit**
Run: `git add src/shared/primitives && git commit -m "feat: add Dinheiro value object"`

---

### Task 4: Ledger Module - Domain Entities

**Files:**
- Create: `src/modules/ledger/core/domain/Transacao.ts`
- Create: `src/modules/ledger/core/domain/Divisao.ts`
- Create: `src/modules/ledger/index.ts`
- Test: `src/modules/ledger/core/domain/Transacao.test.ts`

- [ ] **Step 1: Write failing test for Transação logic**
```typescript
import { describe, it, expect } from 'vitest'
import { Transacao } from './Transacao'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

describe('Transação Entity', () => {
  it('deve garantir que a soma das divisões é igual ao total', () => {
    // Implementar lógica de validação de soma
  })
})
```

- [ ] **Step 2: Define Transação and Divisão entities**
Implement basic entities based on the Triple Entity ledger design (Fonte, Pagador, Beneficiários).

- [ ] **Step 3: Verify tests and Commit**
Run: `npx vitest`
Run: `git add src/modules/ledger && git commit -m "feat(ledger): add core domain entities"`
