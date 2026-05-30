# Upgrade de Infraestrutura (Tailwind v4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Atualizar o Tailwind CSS da v3 para a v4 em um projeto Vue 3 + Vite, adotando a configuração baseada em CSS e os tokens do design "Family".

**Architecture:** Substituiremos a configuração tradicional do Tailwind (via arquivos JS) pela nova configuração baseada em CSS da v4. Utilizaremos o plugin `@tailwindcss/vite` para integração nativa com o Vite, eliminando a necessidade de arquivos de configuração externos como `tailwind.config.js` e `postcss.config.js`.

**Tech Stack:** Tailwind CSS v4 (@next), @tailwindcss/vite, Vite, Vue 3.

---

### Task 1: Atualizar Dependências

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Instalar Tailwind v4 e o plugin para Vite**

Execute:
```bash
npm install tailwindcss@next @tailwindcss/vite@next
```
Expected: O `package.json` deve refletir as novas versões e o `package-lock.json` deve ser atualizado.

- [ ] **Step 2: Verificar package.json**
Certificar-se de que `tailwindcss` e `@tailwindcss/vite` estão listados corretamente nas `devDependencies`.

### Task 2: Configurar Plugin no Vite

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Adicionar o plugin `@tailwindcss/vite`**

Modifique `vite.config.ts`:
```typescript
import { defineConfig } from 'vite' // ou 'vitest/config' se mantiver a versão atual
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  // ... manter configurações de teste se existirem
})
```

### Task 3: Configurar Novo `@theme` no CSS

**Files:**
- Modify: `src/main.css`

- [ ] **Step 1: Substituir conteúdo pelo novo tema v4**

Substitua o conteúdo de `src/main.css`:
```css
@import "tailwindcss";

@theme {
  --color-canvas: #fbfaf9;
  --color-stone: #f2f0ed;
  --color-card: #ffffff;
  --color-graphite: #474645;
  --color-charcoal: #343433;
  --color-midnight: #121212;
  --color-ember: #ff3e00;
  --color-meadow: #00ca48;
  --color-sky: #0090ff;
  --color-sunburst: #ffbb26;

  --font-display: "Fraunces", "Georgia", serif;
  --font-sans: "Inter", system-ui, sans-serif;

  --radius-pill: 32px;
  --radius-card: 10px;

  --shadow-subtle: var(--color-stone) 0px 0px 0px 1px inset;
}

@layer base {
  body {
    @apply bg-canvas text-graphite font-sans antialiased;
  }
}
```

### Task 4: Remover Arquivos de Configuração Antigos

**Files:**
- Delete: `tailwind.config.js`
- Delete: `postcss.config.js`

- [ ] **Step 1: Remover arquivos**

Execute:
```bash
rm tailwind.config.js postcss.config.js
```

### Task 5: Verificar Build

- [ ] **Step 1: Executar build de produção**

Execute:
```bash
npm run build
```
Expected: Build concluído com sucesso sem erros de CSS ou de plugins.
