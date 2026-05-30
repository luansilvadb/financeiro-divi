# Migração Estética Fluent 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar toda a interface do DIVI para o padrão Fluent 2 (Windows 11 Light Mode), utilizando superfícies acrílicas, tokens de sistema e uma moldura de "Companion App".

**Architecture:** Abordagem Top-Down. Refatoração da base de CSS (Tailwind/index.css), seguida pelo App Shell (App.vue) e posterior adaptação dos componentes internos preservando toda a lógica de negócio e testes.

**Tech Stack:** Vue 3, Tailwind CSS v3, Lucide Vue, Vitest.

---

### Task 1: Infraestrutura de Design Tokens (Fluent 2)

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/index.css`

- [ ] **Step 1: Atualizar `tailwind.config.js`**
Configurar as cores de sistema e raios de arredondamento oficiais do Fluent 2.

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'fluent-bg': 'var(--fluent-bg)',
        'fluent-card-bg': 'var(--fluent-card-bg)',
        'fluent-card-hover': 'var(--fluent-card-hover)',
        'fluent-border': 'var(--fluent-border)',
        'fluent-border-hi': 'var(--fluent-border-hi)',
        'fluent-accent': 'var(--fluent-accent)',
        'fluent-accent-hover': 'var(--fluent-accent-hover)',
        'fluent-accent-active': 'var(--fluent-accent-active)',
        'fluent-emerald': 'var(--fluent-emerald)',
        'fluent-emerald-dim': 'var(--fluent-emerald-dim)',
        'fluent-rose': 'var(--fluent-rose)',
        'fluent-rose-dim': 'var(--fluent-rose-dim)',
        'fluent-text-p1': 'var(--fluent-text-p1)',
        'fluent-text-p2': 'var(--fluent-text-p2)',
        'fluent-text-p3': 'var(--fluent-text-p3)',
        'fluent-tint-blue': 'var(--fluent-tint-blue)',
      },
      borderRadius: {
        'f-sm': '4px',    // Inputs e badges
        'f-md': '8px',    // Cards e botões
        'f-lg': '12px',   // Janela principal
      },
      transitionTimingFunction: {
        'fluent-ease': 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}
```

- [ ] **Step 2: Atualizar `src/index.css`**
Injetar variáveis CSS para Materiais (Mica, Acrylic) e cores semânticas.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --fluent-bg: linear-gradient(135deg, #F3F6FA 0%, #E8F0F8 100%);
    --fluent-card-bg: rgba(255, 255, 255, 0.65);
    --fluent-card-hover: rgba(255, 255, 255, 0.80);
    --fluent-border: rgba(0, 0, 0, 0.08);
    --fluent-border-hi: rgba(255, 255, 255, 0.55);
    --fluent-accent: #0078D4;
    --fluent-accent-hover: #106EBE;
    --fluent-accent-active: #005A9E;
    --fluent-tint-blue: rgba(0, 120, 212, 0.06);
    --fluent-emerald: #107C41;
    --fluent-emerald-dim: rgba(16, 124, 65, 0.08);
    --fluent-rose: #A80000;
    --fluent-rose-dim: rgba(168, 0, 0, 0.06);
    --fluent-text-p1: #201F1E;
    --fluent-text-p2: #605E5C;
    --fluent-text-p3: #A19F9D;
  }

  body {
    background: var(--fluent-bg);
    color: var(--fluent-text-p1);
    font-family: 'Segoe UI', 'Inter', -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
  }
}

@layer utilities {
  .acrylic-card {
    background: var(--fluent-card-bg);
    border: 1px solid var(--fluent-border);
    backdrop-filter: blur(30px) saturate(135%);
    -webkit-backdrop-filter: blur(30px) saturate(135%);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04), inset 0 1px 0 var(--fluent-border-hi);
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .acrylic-card:hover {
    background: var(--fluent-card-hover);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 var(--fluent-border-hi);
  }
  .fluent-input {
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid var(--fluent-border);
    border-bottom: 2px solid var(--fluent-border);
    border-radius: 4px;
    transition: all 0.15s ease-out;
  }
  .fluent-input:focus {
    background: rgba(255, 255, 255, 0.95);
    border-bottom-color: var(--fluent-accent);
    outline: none;
  }
}
```

- [ ] **Step 3: Validar e Commit**
Run: `npm run build`
Commit: `style: implementar design tokens e utilitários Fluent 2`

---

### Task 2: App Shell (Companion App Window)

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Redesenhar a Moldura Global**
Substituir o container atual pela estrutura de janela do Windows 11.

```vue
<template>
  <div class="min-h-screen bg-transparent flex items-center justify-center p-4">
    <!-- Moldura de Janela -->
    <div class="w-full max-w-[430px] h-[860px] bg-[#E8F0F8]/55 border border-black/10 rounded-f-lg shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-3xl">
      
      <!-- Title Bar -->
      <div class="h-10 bg-white/40 border-b border-black/5 flex justify-between items-center px-4 select-none shrink-0">
        <div class="flex items-center gap-2">
          <span class="text-xs">⚡</span>
          <span class="text-[11px] font-semibold text-fluent-text-p2 uppercase tracking-wider">DIVI • Companion App</span>
        </div>
        <div class="flex items-center gap-4 text-fluent-text-p3">
          <span class="w-3 h-3 hover:text-fluent-text-p1 cursor-pointer flex items-center justify-center text-[10px]">─</span>
          <span class="w-3 h-3 hover:text-fluent-text-p1 cursor-pointer flex items-center justify-center text-[9px]">🗖</span>
          <span class="w-3 h-3 hover:text-red-600 cursor-pointer flex items-center justify-center text-[11px]">✕</span>
        </div>
      </div>

      <!-- Área Útil -->
      <div class="flex-1 overflow-y-auto px-5 py-6 pb-28 relative">
        <header class="text-center mb-6 pt-2">
          <div class="inline-flex items-center gap-1.5 bg-fluent-tint-blue border border-fluent-accent/15 text-fluent-accent text-[10px] font-semibold tracking-wider uppercase py-1 px-2.5 rounded-f-sm mb-3">
            <span class="w-1.5 h-1.5 rounded-full bg-fluent-accent animate-pulse"></span>
            Fluent 2 Ecosystem
          </div>
          <h1 class="text-3xl font-bold tracking-tight text-fluent-text-p1 mb-0.5">DIVI</h1>
          <p class="text-[11px] text-fluent-text-p2 max-w-[280px] mx-auto leading-relaxed">Finanças residenciais com a simplicidade nativa do seu sistema.</p>
        </header>

        <!-- Views -->
        <DashboardSaldos v-if="currentView === 'dashboard'" ... />
        <NovoLancamentoWizard v-if="currentView === 'wizard'" ... />
      </div>

      <!-- FAB Fluent Style -->
      <button 
        v-if="currentView === 'dashboard'"
        @click="currentView = 'wizard'"
        class="fixed bottom-6 right-6 w-12 h-12 bg-fluent-accent text-white rounded-full flex items-center justify-center shadow-lg hover:bg-fluent-accent-hover transition-all duration-200"
      >
        <Plus class="w-6 h-6 stroke-[3px]" />
      </button>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**
Commit: `style: refatorar App.vue para moldura de Companion App do Windows 11`

---

### Task 3: Redesenho do Dashboard (Acrylic Widgets)

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Step 1: Converter Cards para Acrylic Style**
Substituir as classes `.glass-card` (v19) por `.acrylic-card` e ajustar cores de texto/status.

```vue
<!-- Modificar nos cartões -->
<div class="acrylic-card rounded-f-md p-5 space-y-4">
  <!-- Status com cores Fluent -->
  <span class="text-xs font-black text-fluent-emerald bg-fluent-emerald-dim px-2 py-0.5 rounded-f-sm">QUITADA</span>
  
  <!-- Barra de Progresso Fluent Blue -->
  <div class="w-full bg-black/5 rounded-f-sm h-1 overflow-hidden">
    <div class="bg-fluent-accent h-full rounded-f-sm" :style="{ width: '...' }"></div>
  </div>
</div>
```

- [ ] **Step 2: Ajustar Barra de Trancamento**
Estilizar como um aviso de sistema discreto.

```vue
<div class="border rounded-f-md p-4 flex justify-between items-center bg-white/40 border-black/5 text-fluent-text-p2">
  <!-- Conteúdo -->
  <button class="bg-white/70 hover:bg-white text-fluent-text-p1 border border-black/10 px-3 py-1.5 rounded-f-sm text-[11px] font-semibold shadow-sm">
    {{ isMonthLocked ? 'Destrancar' : 'Trancar Mês' }}
  </button>
</div>
```

- [ ] **Step 3: Validar e Commit**
Run: `npx vitest run DashboardSaldos.test.ts`
Commit: `style: adaptar Dashboard para cards acrílicos Fluent 2`

---

### Task 4: Refatoração do Wizard (Assistente Nativo)

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Step Dots e Layout Geral**
Adotar os dots horizontais e o layout de modal acrílico.

```vue
<template>
  <div class="acrylic-card rounded-f-md p-6 text-fluent-text-p1 flex flex-col min-h-[500px] relative">
    <!-- Step Dots -->
    <div class="flex items-center gap-1 mb-6">
      <div v-for="s in totalSteps" :class="['h-1 rounded-full transition-all', s <= step ? 'w-5 bg-fluent-accent' : 'w-1 bg-black/10']"></div>
    </div>
    
    <!-- Inputs Fluent -->
    <input class="fluent-input w-full p-3 font-bold text-lg" ... />
    
    <!-- Footer Buttons (Primário à Direita) -->
    <div class="border-t border-black/5 pt-4 mt-6 flex justify-end gap-2.5">
      <button class="px-4 py-2 bg-white/60 text-fluent-text-p1 border border-black/10 rounded-f-sm ...">Voltar</button>
      <button class="px-4 py-2 bg-fluent-accent text-white rounded-f-sm ...">Avançar</button>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Validar e Commit**
Run: `npx vitest run NovoLancamentoWizard.test.ts`
Commit: `style: redesenhar NovoLancamentoWizard com estética Fluent 2`

---

### Task 5: Componentes Secundários (Checklist e Feed)

**Files:**
- Modify: `src/components/ledger/ContasFixasPanel.vue`
- Modify: `src/components/ledger/ActivityFeed.vue`

- [ ] **Step 1: Estilizar ContasFixasPanel como Widgets**
```vue
<div class="acrylic-card p-5 rounded-f-md mt-5">
  <div class="grid grid-cols-1 gap-2.5">
    <div class="flex items-center justify-between p-3 rounded-f-sm bg-white/20 border-black/5">
      <!-- Item -->
    </div>
  </div>
</div>
```

- [ ] **Step 2: Estilizar ActivityFeed**
Simplificar para uma lista limpa com divisores sutis.

- [ ] **Step 3: Commit**
Commit: `style: finalizar migração estética dos componentes secundários`

---

### Task 6: Auditoria Final e Polimento

- [ ] **Step 1: Revisar Cores Semânticas**
Garantir que todos os Verdes/Vermelhos usam a paleta Fluent.
- [ ] **Step 2: Executar todos os testes**
Run: `npx vitest run`
- [ ] **Step 3: Commit Final**
Commit: `style: auditoria final e polimento da migração Fluent 2`
