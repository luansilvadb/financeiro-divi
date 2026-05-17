# Diretrizes de Integração e Adaptação do Fluent 2 no DIVI

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar e adaptar a identidade visual do Fluent 2 (Windows 11) no projeto DIVI, trazendo a estética de superfícies acrílicas translúcidas, gradientes suaves e micro-interações de elevação espacial, mantendo a fidelidade ao ecossistema Microsoft enquanto atende perfeitamente às demandas de usabilidade financeira do produto web.

**Architecture:** Mudança radical do tema atual para um design system leve e imersivo (ou híbrido premium) que replica os efeitos físicos de material do Windows 11, como o "Acrylic" e o "Mica". As variáveis de base no `:root` do CSS e no Tailwind serão convertidas para refletir tokens cromáticos de azul Windows, cinza-acrílico e bordas iluminadas. A interface do DIVI será envelopada como se fosse um painel utilitário nativo ("Companion Web App") com uma barra de controle de sistema no topo.

**Tech Stack:** Vue 3, Tailwind CSS v3, CSS Backdrop Filters, CSS Variables, Lucide Icons.

---

### Task 1: A Infraestrutura Cromática e Efeitos (Material Acrílico & Tokens Fluent 2)

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/index.css`

- [ ] **Step 1: Modificar `tailwind.config.js` com tokens cromáticos do Windows 11 / Fluent 2**

Substitua as definições cromáticas e cantos arredondados geométricos e precisos em `tailwind.config.js`:

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
        'f-sm': '4px',    // Para inputs, pequenos botões e badges
        'f-md': '8px',    // Para cartões e botões normais (Corner do Fluent 2)
        'f-lg': '12px',   // Para modais e envelopes maiores
      },
      transitionTimingFunction: {
        'fluent-ease': 'cubic-bezier(0.16, 1, 0.3, 1)', // Easing característico do Windows 11
      }
    },
  },
  plugins: [],
}
```

- [ ] **Step 2: Atualizar `src/index.css` para introduzir o Material Acrílico e o Fundo de Mica do Windows 11**

Modifique `src/index.css` para configurar a paleta leve com texturas sutilmente matizadas de azul, o efeito translúcido em camadas (`backdrop-filter`) e a elevação de sombras espaciais:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Fundo matizado do Windows 11 (Mica-like tint) */
    --fluent-bg: linear-gradient(135deg, #F3F6FA 0%, #E8F0F8 100%);
    
    /* Superfícies Acrílicas (Translucidez e Saturação Suaves) */
    --fluent-card-bg: rgba(255, 255, 255, 0.65);
    --fluent-card-hover: rgba(255, 255, 255, 0.80);
    
    /* Outlines e Bordas de Destaque */
    --fluent-border: rgba(0, 0, 0, 0.08);
    --fluent-border-hi: rgba(255, 255, 255, 0.55); /* Highlight superior para efeito plástico */
    
    /* Cores de Marca / Fluent Blue */
    --fluent-accent: #0078D4;
    --fluent-accent-hover: #106EBE;
    --fluent-accent-active: #005A9E;
    --fluent-tint-blue: rgba(0, 120, 212, 0.06);
    
    /* Status Semânticos */
    --fluent-emerald: #107C41; /* Verde clássico Office/Excel */
    --fluent-emerald-dim: rgba(16, 124, 65, 0.08);
    --fluent-rose: #A80000;
    --fluent-rose-dim: rgba(168, 0, 0, 0.06);
    
    /* Hierarquia Tipográfica (Baseada em Segoe UI / Selawik) */
    --fluent-text-p1: #201F1E;
    --fluent-text-p2: #605E5C;
    --fluent-text-p3: #A19F9D;
  }

  body {
    background: var(--fluent-bg);
    color: var(--fluent-text-p1);
    font-family: 'Segoe UI', 'Inter', -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
    min-h-screen: 100vh;
  }
}

@layer utilities {
  /* Cartão Acrílico Oficial (Fluent Acrylic Material) */
  .acrylic-card {
    background: var(--fluent-card-bg);
    border: 1px solid var(--fluent-border);
    backdrop-filter: blur(30px) saturate(135%);
    -webkit-backdrop-filter: blur(30px) saturate(135%);
    box-shadow: 
      0 2px 4px rgba(0, 0, 0, 0.04), 
      inset 0 1px 0 var(--fluent-border-hi);
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .acrylic-card:hover {
    background: var(--fluent-card-hover);
    box-shadow: 
      0 8px 16px rgba(0, 0, 0, 0.08), 
      inset 0 1px 0 var(--fluent-border-hi);
  }

  /* Input Acrílico com Sublinhado Ativo */
  .fluent-input {
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid var(--fluent-border);
    border-bottom: 2px solid var(--fluent-border);
    color: var(--fluent-text-p1);
    font-size: 14px;
    border-radius: 4px;
    transition: all 0.15s ease-out;
  }

  .fluent-input:focus {
    background: rgba(255, 255, 255, 0.95);
    border-bottom-color: var(--fluent-accent);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
    outline: none;
  }

  /* Efeito de Gradiente de Destaque */
  .fluent-accent-glow {
    box-shadow: 0 4px 12px rgba(0, 120, 212, 0.25);
  }
}
```

- [ ] **Step 3: Confirmar que a build do CSS está íntegra**

Rode um teste rápido para garantir que não há quebras no build de CSS e a suíte unitária inicializa corretamente.
Run: `npx vitest run src/modules/ledger/core/domain/Gasto.test.ts`
Expected: PASS

---

### Task 2: Envelope de Companion App e Barra de Controle (`src/App.vue`)

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Alterar a estrutura de visualização do App.vue simulando uma Janela de Windows 11**

Modifique o template do `src/App.vue` para que a aplicação seja envelopada por uma moldura acrílica limpa, simulando uma janela nativa com uma barra de controle de sistema no topo.

```vue
<template>
  <div class="min-h-screen bg-transparent flex items-center justify-center p-4">
    <!-- Moldura de Janela do Windows 11 (Companion Shell) -->
    <div class="w-full max-w-[430px] h-[860px] bg-[#E8F0F8]/55 border border-black/10 rounded-f-lg shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-3xl">
      
      <!-- Barra de Título Nativa do Windows 11 -->
      <div class="h-10 bg-white/40 border-b border-black/5 flex justify-between items-center px-4 select-none shrink-0">
        <div class="flex items-center gap-2">
          <!-- Ícone do App DIVI -->
          <span class="text-xs">⚡</span>
          <span class="text-[11px] font-semibold text-fluent-text-p2 uppercase tracking-wider">DIVI • Companion App</span>
        </div>
        <!-- Botões de Controle Clássicos -->
        <div class="flex items-center gap-4 text-fluent-text-p3">
          <span class="w-3 h-3 hover:text-fluent-text-p1 cursor-pointer flex items-center justify-center text-[10px]">─</span>
          <span class="w-3 h-3 hover:text-fluent-text-p1 cursor-pointer flex items-center justify-center text-[9px]">🗖</span>
          <span @click="closeApp" class="w-3 h-3 hover:text-red-600 cursor-pointer flex items-center justify-center text-[11px]">✕</span>
        </div>
      </div>

      <!-- Área Útil do App -->
      <div class="flex-1 overflow-y-auto px-5 py-6 pb-28 relative">
        <header class="text-center mb-6 pt-2">
          <!-- Fluent Badge -->
          <div class="inline-flex items-center gap-1.5 bg-fluent-tint-blue border border-fluent-accent/15 text-fluent-accent text-[10px] font-semibold tracking-wider uppercase py-1 px-2.5 rounded-f-sm mb-3">
            <span class="w-1.5 h-1.5 rounded-full bg-fluent-accent animate-pulse"></span>
            Fluent 2 Ecosystem
          </div>

          <h1 class="text-3xl font-bold tracking-tight text-fluent-text-p1 mb-0.5">
            DIVI
          </h1>
          <p class="text-[11px] text-fluent-text-p2 max-w-[280px] mx-auto leading-relaxed">
            Finanças residenciais com a simplicidade nativa do seu sistema.
          </p>
        </header>

        <!-- Dynamic View Router -->
        <component 
          :is="currentViewComponent" 
          v-bind="viewProps"
          @navigate="onNavigate"
        />
      </div>

      <!-- Botão Flutuante (FAB) Estilo Fluent 2 - Acrílico Azul -->
      <button 
        v-if="currentView === 'dashboard'"
        @click="currentView = 'wizard'"
        class="fixed bottom-6 right-6 w-12 h-12 bg-fluent-accent text-white rounded-full flex items-center justify-center shadow-lg hover:bg-fluent-accent-hover active:bg-fluent-accent-active hover:scale-105 active:scale-95 transition-all duration-200 z-[999]"
        aria-label="Novo lançamento"
      >
        <Plus class="w-6 h-6 stroke-[3px]" />
      </button>
    </div>
  </div>
</template>
```

---

### Task 3: Painel de Saldos e Cards Acrílicos Hover-Lift (`DashboardSaldos.vue`)

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`
- Modify: `src/components/ledger/dashboard/DetalhamentoSaldosCard.vue`

- [ ] **Step 1: Atualizar o Dashboard para usar superfícies Acrílicas (Light Theme)**

Transforme os cards pretos de alto contraste na estética light e limpa do Windows 11. Cada card passa a ser uma placa de acrílico translúcida com a classe `.acrylic-card`:

```vue
<!-- Modificar nos cards de DashboardSaldos.vue -->
<template>
  <div class="space-y-5">
    
    <!-- Painel de Trancamento do Período -->
    <div 
      class="border rounded-f-md p-4 flex justify-between items-center transition-all duration-300"
      :class="isMonthLocked 
        ? 'bg-fluent-rose-dim/40 border-fluent-rose/10 text-fluent-rose' 
        : 'bg-white/40 border-black/5 text-fluent-text-p2'"
    >
      <div class="flex items-center gap-3">
        <span class="text-base">{{ isMonthLocked ? '🔒' : '🔓' }}</span>
        <div>
          <span class="font-bold block text-fluent-text-p1 text-xs">{{ isMonthLocked ? 'Período Trancado' : 'Período Aberto' }}</span>
          <span class="text-[10px] text-fluent-text-p2 mt-0.5 block leading-normal">
            {{ isMonthLocked ? 'Lançamentos congelados pelo administrador.' : 'Lançamentos e rateios liberados.' }}
          </span>
        </div>
      </div>
      <button 
        @click="setMonthLocked(!isMonthLocked)"
        class="bg-white/70 hover:bg-white text-fluent-text-p1 border border-black/10 px-3 py-1.5 rounded-f-sm text-[11px] font-semibold transition-all shadow-sm"
      >
        {{ isMonthLocked ? 'Destrancar' : 'Trancar Mês' }}
      </button>
    </div>

    <!-- Cards de Faturas Fechadas -->
    <div 
      v-for="fatura in faturasFechadas" 
      :key="fatura.id" 
      class="acrylic-card rounded-f-md p-5 space-y-4"
    >
      <div class="flex justify-between items-center border-b border-black/5 pb-3">
        <span class="text-xs font-bold text-fluent-text-p2 uppercase tracking-wider">📁 Fatura Fechada</span>
        <span class="text-xs font-black text-fluent-emerald bg-fluent-emerald-dim px-2 py-0.5 rounded-f-sm">QUITADA</span>
      </div>
      ...
    </div>
  </div>
</template>
```

- [ ] **Step 2: Redesenhar Reembolsos e a Barra de Progresso Clássica**

Modifique a barra de progresso para usar o gradiente linear de azul Microsoft e cantos no padrão `rounded-f-sm`:

```vue
<!-- Modificar no loop de acertos de faturas fechadas -->
<div class="w-full bg-black/5 rounded-f-sm h-1.5 overflow-hidden border border-black/[0.03]">
  <div 
    class="bg-fluent-accent h-full rounded-f-sm transition-all duration-300"
    :style="{ width: `${((acerto.valorPago?.centavos || 0) / acerto.valorAcerto.centavos) * 100}%` }"
  ></div>
</div>
```

- [ ] **Step 3: Redesenhar o Detalhamento de Contas por Coluna (`DetalhamentoSaldosCard.vue`)**

Redesenhe a grade de detalhamento com o padrão minimalista de colunas do Windows 11. Cada canal (PIX, Cartão e Empréstimos) será apresentado como pequenos compartimentos organizados de forma extremamente limpa e com bordas sutis:

```vue
<template>
  <div class="acrylic-card rounded-f-md p-5 space-y-4">
    <div>
      <h3 class="text-[11px] font-bold text-fluent-text-p2 uppercase tracking-widest block mb-0.5">
        🔍 Detalhamento Granular de Contas
      </h3>
      <p class="text-[10px] text-fluent-text-p3">Auditoria de fluxos de caixa de PIX, Cartão e Empréstimos por morador</p>
    </div>

    <div class="space-y-4">
      <div 
        v-for="m in props.membros" 
        :key="m.id" 
        class="border-b border-black/5 pb-4 last:border-b-0 last:pb-0"
      >
        <div class="flex justify-between items-center mb-2.5">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-fluent-accent text-white flex items-center justify-center font-bold text-[10px] uppercase">
              {{ m.nome[0] }}
            </div>
            <span class="font-bold text-xs text-fluent-text-p1">{{ m.nome }}</span>
          </div>
          <span 
            class="text-[9px] font-bold px-2 py-0.5 rounded-f-sm uppercase"
            :class="props.saldosUnificados[m.id] > 0.005 ? 'bg-fluent-emerald-dim text-fluent-emerald' : props.saldosUnificados[m.id] < -0.005 ? 'bg-fluent-rose-dim text-fluent-rose' : 'bg-black/5 text-fluent-text-p2'"
          >
            Saldo: {{ props.saldosUnificados[m.id] > 0.005 ? '+' : '' }}R$ {{ props.saldosUnificados[m.id]?.toFixed(2).replace('.', ',') }}
          </span>
        </div>

        <div class="grid grid-cols-3 gap-2 text-[10px] leading-relaxed">
          <div class="bg-white/30 border border-black/5 rounded-f-sm p-2 space-y-1">
            <span class="block text-[8px] font-bold uppercase text-fluent-accent mb-0.5">⚡ PIX</span>
            <div class="flex justify-between">
              <span class="text-fluent-text-p2">Fez:</span>
              <span class="text-fluent-emerald font-semibold">+{{ formatarBRL(detailedBreakdown[m.id]?.pixFez || 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-fluent-text-p2">Usou:</span>
              <span class="text-fluent-rose font-semibold">-{{ formatarBRL(detailedBreakdown[m.id]?.pixConsumo || 0) }}</span>
            </div>
          </div>

          <div class="bg-white/30 border border-black/5 rounded-f-sm p-2 space-y-1">
            <span class="block text-[8px] font-bold uppercase text-fluent-accent mb-0.5">💳 Cartão</span>
            <div class="flex justify-between">
              <span class="text-fluent-text-p2">Fez:</span>
              <span class="text-fluent-emerald font-semibold">+{{ formatarBRL(detailedBreakdown[m.id]?.cardFez || 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-fluent-text-p2">Usou:</span>
              <span class="text-fluent-rose font-semibold">-{{ formatarBRL(detailedBreakdown[m.id]?.cardConsumo || 0) }}</span>
            </div>
          </div>

          <div class="bg-white/30 border border-black/5 rounded-f-sm p-2 space-y-1">
            <span class="block text-[8px] font-bold uppercase text-fluent-accent mb-0.5">🤝 Empréstimo</span>
            <div class="flex justify-between">
              <span class="text-fluent-text-p2">Fez:</span>
              <span class="text-fluent-emerald font-semibold">+{{ formatarBRL(detailedBreakdown[m.id]?.loanFez || 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-fluent-text-p2">Tomou:</span>
              <span class="text-fluent-rose font-semibold">-{{ formatarBRL(detailedBreakdown[m.id]?.loanTomou || 0) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

---

### Task 4: Checklist de Contas Fixas (Widgets do Windows 11)

**Files:**
- Modify: `src/components/ledger/ContasFixasPanel.vue`

- [ ] **Step 1: Redesenhar o Painel de Contas Fixas com Estilo de Ajustes Rápidos do Menu Iniciar**

Substitua as classes e botões antigos de `ContasFixasPanel.vue` para fazê-los parecer com os cartões informativos dos Widgets do Windows 11:

```vue
<template>
  <div class="acrylic-card p-5 rounded-f-md mt-5 relative text-fluent-text-p1">
    <div class="flex justify-between items-center mb-4">
      <div>
        <h3 class="text-xs font-bold text-fluent-text-p1 flex items-center gap-1.5 uppercase tracking-wider">
          ⚙️ Checklist de Contas Fixas
        </h3>
        <p class="text-[10px] text-fluent-text-p3 mt-0.5">
          Lançamentos recorrentes simplificados.
        </p>
      </div>
      <span class="text-[10px] font-semibold text-fluent-accent bg-fluent-tint-blue px-2 py-1 rounded-f-sm border border-fluent-accent/15">
        {{ pagasCount }}/{{ contasFixas.length }} pagas
      </span>
    </div>

    <div class="grid grid-cols-1 gap-2.5">
      <!-- Widgets de Contas Fixas -->
      <div 
        v-for="bill in contasFixas" 
        :key="bill.id" 
        class="flex items-center justify-between p-3 rounded-f-sm border transition-all duration-200"
        :class="verificarPaga(bill) ? 'bg-fluent-emerald-dim/40 border-fluent-emerald/15 text-fluent-text-p1' : 'bg-white/20 border-black/5 text-fluent-text-p2'"
      >
        <div class="flex items-center gap-2.5">
          <span class="text-2xl">{{ bill.icon }}</span>
          <div>
            <span class="font-bold text-xs block text-fluent-text-p1">{{ bill.name }}</span>
            <span v-if="verificarPaga(bill)" class="text-[9px] text-fluent-emerald flex items-center gap-1 mt-0.5 font-semibold">
              ✓ Pago (R$ {{ obterStatusGasto(bill)?.valorReal.toFixed(2) }} por {{ obterNomeMembro(obterStatusGasto(bill)?.pagoPor) }})
            </span>
            <span v-else class="text-[9px] text-fluent-text-p3 flex items-center gap-1 mt-0.5">
              ⏳ Aguardando Talão
            </span>
          </div>
        </div>
        <div class="flex items-center gap-1.5">
          <button 
            v-if="!verificarPaga(bill)" 
            @click="$emit('lancar', bill)" 
            class="px-2.5 py-1 text-[10px] font-semibold bg-fluent-accent hover:bg-fluent-accent-hover text-white rounded-f-sm transition-all"
            :disabled="isMonthLocked"
          >
            Lançar
          </button>
          <button 
            @click="$emit('configurar', bill)" 
            class="p-1 text-xs bg-white/50 hover:bg-white text-fluent-text-p3 hover:text-fluent-text-p1 rounded-f-sm border border-black/10 transition-all"
          >
            ⚙️
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
```

---

### Task 5: Assistente Moderno com Efeito Slider e Step Dots (`NovoLancamentoWizard.vue`)

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Transformar o Assistente de Lançamentos em um Modal Acrílico Imersivo**

Modifique o template de `NovoLancamentoWizard.vue` para que se comporte como um diálogo de confirmação oficial do Fluent 2:

```vue
<template>
  <div class="acrylic-card rounded-f-md p-6 text-fluent-text-p1 flex flex-col min-h-[500px] relative">
    
    <!-- Barra de Progresso Slim (Step Dots do Windows 11) -->
    <div class="flex items-center justify-between mb-6 px-1">
      <div class="flex-1 flex gap-1">
        <div 
          v-for="s in totalSteps" 
          :key="s"
          :class="[
            'h-1 rounded-full transition-all duration-350 ease-fluent-ease',
            s <= step 
              ? 'w-5 bg-fluent-accent' 
              : 'w-1 bg-black/10'
          ]"
        ></div>
      </div>
      <span class="text-[9px] font-bold text-fluent-accent px-2 tracking-wider uppercase">Passo {{ step }}/5</span>
    </div>

    <!-- Canal de Pagamento (Passo 1) -->
    <div v-if="step === 1" class="space-y-3.5 flex-1">
      <h2 class="text-base font-bold text-fluent-text-p1 text-center tracking-tight leading-snug">Como você pagou ou fez o lançamento?</h2>
      <div class="flex flex-col gap-2">
        <!-- Pix Card -->
        <button 
          @click="selecionarFluxo('expense', 'pix', null)"
          class="flex items-center gap-3 bg-white/40 hover:bg-white/80 border border-black/5 hover:border-fluent-accent/25 rounded-f-md p-3 text-left transition-all active:scale-[0.98] duration-200"
        >
          <span class="text-2xl">💵</span>
          <div>
            <strong class="block text-xs text-fluent-text-p1 font-bold">Fiz um PIX ou Dinheiro</strong>
            <span class="text-[9px] text-fluent-text-p2 block mt-0.5">Gasto à vista do caixa da casa</span>
          </div>
        </button>

        <!-- Cartão Card -->
        <button 
          v-for="c in cartoes" 
          :key="c.id"
          @click="selecionarFluxo('expense', 'card', c.responsavelPadraoId)"
          class="flex items-center gap-3 bg-white/40 hover:bg-white/80 border border-black/5 hover:border-fluent-accent/25 rounded-f-md p-3 text-left transition-all active:scale-[0.98] duration-200"
        >
          <span class="text-2xl">💳</span>
          <div>
            <strong class="block text-xs text-fluent-text-p1 font-bold">Passei no {{ c.nome }}</strong>
            <span class="text-[9px] text-fluent-accent block mt-0.5 font-semibold">Despesa sob fatura de cartão</span>
          </div>
        </button>
      </div>
    </div>
    
    <!-- Rodapé de Ações Clássico do Windows (Botão Primário no Lado Direito) -->
    <div class="border-t border-black/5 pt-4 mt-6 flex justify-end gap-2.5">
      <button 
        type="button" 
        @click="step === 1 ? emit('cancelar') : prev()"
        class="px-4 py-2 bg-white/60 hover:bg-white text-fluent-text-p1 border border-black/10 text-xs font-semibold rounded-f-sm transition-all shadow-sm flex-1"
      >
        {{ step === 1 ? 'Cancelar' : 'Voltar' }}
      </button>

      <button 
        type="button" 
        :disabled="!canAdvance"
        @click="((wizFlow === 'loan' && step === 5) || (wizFlow === 'expense' && step === 5)) ? handleGravar() : next()"
        class="px-4 py-2 bg-fluent-accent hover:bg-fluent-accent-hover text-white text-xs font-semibold rounded-f-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex-1"
      >
        {{ ((wizFlow === 'loan' && step === 5) || (wizFlow === 'expense' && step === 5)) ? 'Confirmar' : 'Avançar' }}
      </button>
    </div>
  </div>
</template>
```

---

### Task 6: Validação Geral de Regressões Visuais e Funcionais

- [ ] **Step 1: Garantir que a cobertura de testes permanece em 100% de sucesso**

Execute toda a suíte de testes do repositório para atestar que os comportamentos de divisão matemática, persistência local e locks atômicos não sofreram regressão devido às melhorias estéticas.
Run: `npx vitest run`
Expected: PASS com 0 erros encontrados.

---
