# Migração Estética Premium (Visual v19) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a migração visual completa da aplicação real do DIVI para o Dark Mode Premium Sênior v19, baseando-se em variáveis CSS no index.css e estendendo a configuração do Tailwind.

**Architecture:** Abordagem híbrida usando variáveis nativas CSS no `:root` de `src/index.css` e mapeamento destas cores/arredondamentos em `tailwind.config.js`. Adaptação de classes de visualização no App.vue e nos componentes do Dashboard e Wizard.

**Tech Stack:** Vue 3, Tailwind CSS v3, Vitest, Lucide Icons.

---

### Task 1: Infraestrutura de Estilos (Tailwind Config & CSS Variables)

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/index.css`

- [ ] **Step 1: Modificar `tailwind.config.js` para estender o tema**
Substitua o conteúdo de `tailwind.config.js` para mapear os novos tokens cromáticos e os raios de arredondamento premium da v19.

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
        'divi-bg': 'var(--bg)',
        'divi-s1': 'var(--s1)',
        'divi-s2': 'var(--s2)',
        'divi-s3': 'var(--s3)',
        'divi-border': 'var(--border)',
        'divi-border-hi': 'var(--border-hi)',
        'divi-primary': 'var(--primary)',
        'divi-primary-dim': 'var(--primary-dim)',
        'divi-primary-glow': 'var(--primary-glow)',
        'divi-emerald': 'var(--emerald)',
        'divi-emerald-dim': 'var(--emerald-dim)',
        'divi-emerald-glow': 'var(--emerald-glow)',
        'divi-rose': 'var(--rose)',
        'divi-rose-dim': 'var(--rose-dim)',
        'divi-amber': 'var(--amber)',
        'divi-amber-dim': 'var(--amber-dim)',
        'divi-blue': 'var(--blue)',
        'divi-blue-dim': 'var(--blue-dim)',
        'divi-violet': 'var(--violet)',
        'divi-t1': 'var(--t1)',
        'divi-t2': 'var(--t2)',
        'divi-t3': 'var(--t3)',
        'divi-t4': 'var(--t4)',
      },
      borderRadius: {
        'r-sm': '14px',
        'r-md': '20px',
        'r-lg': '26px',
        'r-xl': '32px',
      }
    },
  },
  plugins: [],
}
```

- [ ] **Step 2: Atualizar `src/index.css` com variáveis e utilitários**
Substitua o conteúdo de `src/index.css` com as definições de variáveis CSS `:root`, regras para o body do tema escuro e classes utilitárias personalizadas de glassmorphism e neon glow.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --bg: #07090F;
    --s1: rgba(255, 255, 255, 0.04);
    --s2: rgba(255, 255, 255, 0.07);
    --s3: rgba(255, 255, 255, 0.11);
    --border: rgba(255, 255, 255, 0.07);
    --border-hi: rgba(255, 255, 255, 0.14);
    
    --primary: #6366F1;
    --primary-dim: rgba(99, 102, 241, 0.15);
    --primary-glow: rgba(99, 102, 241, 0.30);
    
    --emerald: #10B981;
    --emerald-dim: rgba(16, 185, 129, 0.12);
    --emerald-glow: rgba(16, 185, 129, 0.25);
    
    --rose: #F43F5E;
    --rose-dim: rgba(244, 63, 94, 0.12);
    
    --amber: #F59E0B;
    --amber-dim: rgba(245, 158, 11, 0.12);
    
    --blue: #3B82F6;
    --blue-dim: rgba(59, 130, 246, 0.12);
    
    --violet: #8B5CF6;
    
    --t1: #F8FAFC;
    --t2: rgba(248, 250, 252, 0.60);
    --t3: rgba(248, 250, 252, 0.35);
    --t4: rgba(248, 250, 252, 0.20);
  }

  body {
    background-color: var(--bg);
    color: var(--t1);
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
}

@layer utilities {
  .glass-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
  }
  
  .glass-input {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border);
    color: var(--t1);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .glass-input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 16px var(--primary-glow);
  }

  .glow-primary {
    box-shadow: 0 0 20px var(--primary-glow);
  }
  
  .glow-emerald {
    box-shadow: 0 0 20px var(--emerald-glow);
  }

  .text-glow-emerald {
    text-shadow: 0 0 8px var(--emerald-glow);
  }
}
```

- [ ] **Step 3: Validar compilação**
Execute os testes do Vitest para verificar se a estrutura do compilador não foi afetada por estilos.
Run: `npx vitest run src/modules/ledger/core/domain/Gasto.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add tailwind.config.js src/index.css
git commit -m "style: configurar variáveis de design premium v19 no css e tailwind"
```

---

### Task 2: Layout Global e Envelope (`src/App.vue`)

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Adaptar envelope e container do App.vue**
Substitua as classes e a estrutura externa do `App.vue` para centralizar a visualização em uma largura de `430px`, alterando o fundo para `bg-divi-bg`.

```vue
<!-- Modificar no template do src/App.vue -->
<template>
  <div class="min-h-screen bg-divi-bg text-divi-t1 flex flex-col items-center overflow-x-hidden font-sans">
    <div class="w-full max-w-[430px] min-h-screen flex flex-col px-4 pt-14 pb-10 pb-24 relative">
```

- [ ] **Step 2: Redesenhar o Cabeçalho (Header)**
Substitua o cabeçalho existente (linhas 44-67) pelo cabeçalho premium contendo o badge animado e o título em gradiente metálico.

```vue
      <header class="relative text-center mb-6 pt-4">
        <!-- Badge Premium -->
        <div class="inline-flex items-center gap-1.5 bg-divi-emerald-dim border border-emerald-500/20 text-[#34D399] text-[10px] font-black tracking-widest uppercase py-1.5 px-3 rounded-full mb-3 shadow-[0_0_12px_rgba(16,185,129,0.1)]">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          💎 SÊNIOR V19 PREMIUM
        </div>

        <h1 class="text-4xl font-black tracking-tighter bg-gradient-to-br from-slate-50 to-slate-400 bg-clip-text text-transparent mb-1">
          DIVI
        </h1>
        <p class="text-xs text-divi-t2 leading-relaxed max-w-[280px] mx-auto">
          Despesas da casa divididas com inteligência e zero atrito.
        </p>
        
        <!-- Botão de Configuração e Navegação -->
        <div class="absolute right-0 top-1/2 -translate-y-1/2 flex gap-2 z-10">
          <button 
            v-if="currentView === 'dashboard'"
            @click="currentView = 'settings'"
            class="p-2 text-divi-t3 hover:text-divi-t1 hover:bg-divi-s2 rounded-full transition-all"
            aria-label="Configurações"
          >
            <Settings class="w-5 h-5" />
          </button>

          <button 
            v-if="currentView !== 'dashboard'"
            @click="currentView = 'dashboard'"
            class="p-2 text-divi-t3 hover:text-divi-t1 hover:bg-divi-s2 rounded-full transition-all"
            :aria-label="currentView === 'wizard' ? 'Cancelar lançamento' : 'Voltar'"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </header>
```

- [ ] **Step 3: Redesenhar o FAB (Floating Action Button) de Novo Lançamento**
Substitua o botão de Novo Lançamento na base do template do `App.vue` (linhas 102-109) para torná-lo um círculo de vidro violeta vibrante suspenso sobre a tela de Dashboard.

```vue
      <!-- Botão Flutuante (FAB) Premium v19 -->
      <button 
        v-if="currentView === 'dashboard'"
        @click="currentView = 'wizard'"
        class="fixed bottom-8 right-1/2 translate-x-1/2 w-14 h-14 bg-divi-primary text-white rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(99,102,241,0.55)] border border-indigo-400/30 hover:scale-105 active:scale-95 transition-all duration-300 z-[9999]"
        aria-label="Novo lançamento"
      >
        <Plus class="w-7 h-7 stroke-[3px] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
      </button>
```

- [ ] **Step 4: Confirmar compilação do App.vue**
Rode os testes para assegurar que os botões com `aria-label` e o gerenciador de views continuam com comportamento idêntico.
Run: `npx vitest run src/components/ledger/ConfiguracoesMembros.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/App.vue
git commit -m "style(ui): aplicar envelope mobile-first e header premium no App.vue"
```

---

### Task 3: Redesenho do Dashboard de Saldos (`DashboardSaldos.vue`)

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Step 1: Ajustar a Barra de Trancamento de Período**
Modifique o trecho da barra de trancamento (linhas 410-438) para usar cores e glows neon correspondentes ao status reativo.

```vue
    <!-- BARRA DE TRANCAMENTO SENIOR V18 -->
    <div 
      class="border rounded-2xl p-4 flex justify-between items-center transition-all duration-300"
      :class="isMonthLocked 
        ? 'bg-divi-amber-dim/10 border-divi-amber/30 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.06)]' 
        : 'bg-divi-s1 border-divi-border text-divi-t2'"
    >
      <div class="flex items-center gap-3">
        <span class="text-lg">{{ isMonthLocked ? '🔒' : '🔓' }}</span>
        <div>
          <span class="font-extrabold block text-divi-t1">{{ isMonthLocked ? 'Período Trancado' : 'Período Aberto' }}</span>
          <span class="text-[10px] text-divi-t3 mt-0.5 block leading-normal">
            {{ isMonthLocked ? 'Lançamentos congelados. Inicie um novo período.' : 'Lançamentos e rateios permitidos.' }}
          </span>
        </div>
      </div>
      <div class="flex gap-2">
        <button 
          v-if="isMonthLocked"
          @click="abrirNovoPeriodoModal"
          class="bg-divi-amber hover:bg-yellow-500 text-slate-950 px-3 py-2 rounded-xl text-xs font-black transition-all shadow-[0_0_12px_rgba(245,158,11,0.25)]"
        >
          🚀 Novo Período
        </button>
        <button 
          @click="setMonthLocked(!isMonthLocked)"
          class="bg-divi-s2 hover:bg-divi-s3 text-divi-t1 border border-divi-border px-3 py-2 rounded-xl text-xs font-bold transition-all"
        >
          {{ isMonthLocked ? 'Destrancar' : 'Trancar Mês' }}
        </button>
      </div>
    </div>
```

- [ ] **Step 2: Converter Faturas Fechadas para `glass-card`**
Localize o loop de `faturasFechadas` (linha 440) e substitua a classe do card de `bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl text-white overflow-hidden relative` para a estilização unificada com desfoque de vidro.

```vue
    <!-- Seção 1: Faturas Fechadas -->
    <div v-for="fatura in faturasFechadas" :key="fatura.id" class="glass-card rounded-3xl p-6 shadow-2xl text-divi-t1 overflow-hidden relative">
```

- [ ] **Step 3: Redesenhar Reembolsos de Fatura Fechada**
Atualize a interface de Reembolsos Pendentes das Faturas Fechadas. O card interno de acerto deve usar `bg-divi-s1 border-divi-border`, a barra de progresso deve usar o gradiente violeta/indigo, e o container de amortização de Pix deve usar `glass-input` e botões otimizados.

```vue
        <!-- Acertos da Fatura -->
        <div v-for="acerto in acertosDaFatura(fatura.id)" :key="acerto.id" class="bg-divi-s1 rounded-2xl border border-divi-border p-4 space-y-3">
          <div class="flex justify-between items-center">
            <div>
              <span class="font-extrabold text-sm block text-divi-t1">
                {{ getMembroNome(acerto.membroId) }} deve para {{ getMembroNome(fatura.responsavelId) }}
              </span>
              <span class="text-[10px] text-divi-t3 mt-1 block">
                Total Acerto: R$ {{ formatarDinheiro(acerto.valorAcerto.centavos).toFixed(2).replace('.', ',') }}
              </span>
            </div>
            <div class="text-right">
              <span :class="['font-black text-sm block', acerto.pago ? 'text-divi-emerald text-glow-emerald' : 'text-divi-rose']">
                {{ acerto.pago ? '✅ Quitado' : 'R$ ' + formatarDinheiro(acerto.valorAcerto.centavos - (acerto.valorPago?.centavos || 0)).toFixed(2).replace('.', ',') + ' Restante' }}
              </span>
              <button 
                v-if="!acerto.pago"
                @click="iniciarPix(acerto)"
                class="text-[10px] font-black text-divi-primary hover:underline mt-1"
              >
                Registrar Pix
              </button>
            </div>
          </div>

          <!-- Barra de Progresso do Reembolso -->
          <div class="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-divi-border">
            <div 
              class="bg-gradient-to-r from-divi-primary to-divi-violet h-full rounded-full transition-all duration-300"
              :style="{ width: `${((acerto.valorPago?.centavos || 0) / acerto.valorAcerto.centavos) * 100}%` }"
            ></div>
          </div>

          <!-- Amortização Pix Parcial / Customizado expandido -->
          <div v-if="acertoPixId === acerto.id" class="bg-slate-950 border border-divi-border rounded-2xl p-4 mt-2 space-y-4">
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs font-black uppercase text-divi-primary">Registrar Baixa de Acerto</span>
            </div>

            <!-- Seleção de Método -->
            <div class="flex gap-2">
              <button 
                v-for="m in [{id:'pix', nome:'⚡ Pix'}, {id:'cash', nome:'💵 Dinheiro'}, {id:'mutual', nome:'🤝 Abatimento'}]" 
                :key="m.id"
                @click="metodoAcerto = m.id as any"
                class="flex-1 py-2 px-1 text-[10px] font-extrabold rounded-xl border text-center transition-all"
                :class="metodoAcerto === m.id ? 'bg-divi-primary border-divi-primary text-white' : 'bg-divi-s2 border-divi-border text-divi-t3'"
              >
                {{ m.nome }}
              </button>
            </div>

            <!-- Input de Valor -->
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <span class="text-divi-t3 text-xs font-bold">R$</span>
                <input 
                  v-model.number="valorPixInput"
                  type="number"
                  step="0.01"
                  class="glass-input rounded-xl p-2 font-black text-divi-t1 focus:outline-none focus:border-divi-primary text-xs flex-1"
                />
                <button 
                  @click="enviarReembolsoPix(acerto.id)"
                  class="bg-divi-primary hover:bg-indigo-500 text-white font-black text-xs px-4 py-2 rounded-lg transition-colors"
                >
                  Registrar
                </button>
              </div>

              <!-- Reassurance e Atalho de Quitação com Ajuste -->
              <div class="text-[10px] text-divi-t3 leading-relaxed">
                <span v-if="metodoAcerto === 'mutual'" class="text-divi-amber font-bold block mb-1">
                  💡 Abatimento/Ajuste: Ideal para perdoar centavos ou fazer descontos mútuos.
                </span>
                Deseja quitar a dívida inteira com ajuste redondo? 
                <button 
                  @click="quitarComAjuste(acerto.id)" 
                  class="text-divi-emerald hover:text-emerald-300 font-black underline ml-1 cursor-pointer"
                >
                  Quitar Total
                </button>
              </div>
            </div>
          </div>
        </div>
```

- [ ] **Step 4: Converter Faturas Abertas para `glass-card`**
Localize o card de Faturas Abertas (linha 611) e altere a classe de `bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4` para a estilização escura com textos legíveis em `text-divi-t1` e `text-divi-t2`.

```vue
    <!-- Seção 2: Faturas Abertas -->
    <div class="glass-card rounded-3xl p-6 shadow-2xl space-y-4 text-divi-t1">
      <h3 class="text-xs font-black text-divi-t3 uppercase tracking-widest">🔍 Faturas Abertas (Previsão de Gastos)</h3>
      
      <div v-for="fatura in faturasAbertas" :key="fatura.id" class="border-b border-divi-border last:border-0 pb-4 mb-4 last:pb-0 last:mb-0">
        <div class="flex justify-between items-center mb-5">
          <div class="flex flex-col">
            <span class="font-extrabold text-divi-t1 text-base">💳 {{ getCartaoNome(fatura.cartaoId) }} • {{ fatura.periodo.mes }}/{{ fatura.periodo.ano }}</span>
            <span class="text-xs text-divi-t2 font-bold mt-0.5">Total Fatura: R$ {{ formatarDinheiro(calcularTotalFatura(fatura.id)).toFixed(2).replace('.', ',') }}</span>
          </div>
          <button 
            @click="abrirFecharFatura(fatura.id)" 
            class="text-xs font-black bg-divi-t1 text-slate-950 px-4 py-2.5 rounded-xl hover:bg-slate-200 shadow-md transition-colors disabled:opacity-40 disabled:pointer-events-none"
            :disabled="isMonthLocked"
          >
            Fechar Fatura
          </button>
        </div>

        <div class="space-y-3">
          <div v-for="membro in membros" :key="membro.id" class="flex flex-col border-b border-divi-border/40 pb-2.5 mb-2.5 last:border-0 last:pb-0 last:mb-0">
            <div class="flex justify-between items-center text-sm">
              <span class="font-bold text-divi-t2">
                {{ membro.nome }} 
                <span v-if="membro.id === fatura.responsavelId" class="text-[9px] text-divi-primary font-black uppercase ml-1 bg-divi-primary-dim px-1.5 py-0.5 rounded-md">Dono</span>:
              </span>
              <span class="font-extrabold text-divi-t1">
                Pendente: R$ {{ formatarDinheiro(getConsumo(fatura.id, membro.id) - getAdiantamento(fatura.id, membro.id)).toFixed(2).replace('.', ',') }}
              </span>
            </div>
            <div class="flex justify-between items-center text-[11px] text-divi-t3 mt-1 pl-2">
              <span>Consumo: R$ {{ formatarDinheiro(getConsumo(fatura.id, membro.id)).toFixed(2).replace('.', ',') }}</span>
              <span v-if="getAdiantamento(fatura.id, membro.id) > 0" class="text-divi-emerald font-bold">
                Adiantado: - R$ {{ formatarDinheiro(getAdiantamento(fatura.id, membro.id)).toFixed(2).replace('.', ',') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
```

- [ ] **Step 5: Rodar testes unitários do Dashboard**
Execute a suíte de testes de renderização e mock de dados para assegurar que nada foi quebrado no fluxo de faturas.
Run: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git add src/components/ledger/DashboardSaldos.vue
git commit -m "style(ui): aplicar visual dark mode e glassmorphism nos cards do Dashboard"
```

---

### Task 4: Adaptação Estética do Painel de Contas Fixas (`ContasFixasPanel.vue`)

**Files:**
- Modify: `src/components/ledger/ContasFixasPanel.vue`

- [ ] **Step 1: Atualizar classes e cores em ContasFixasPanel.vue**
Substitua o template do checklist de contas fixas para remover as referências antigas a `bg-panel-dark`, `bg-emerald-05` e text/border cinza, adotando as novas classes de design híbridas.

```vue
<!-- Modificar no template do src/components/ledger/ContasFixasPanel.vue -->
<template>
  <div class="glass-card p-6 rounded-3xl mt-6 relative text-divi-t1">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h3 class="text-xl font-black text-divi-t1 flex items-center gap-2">
          Checklist de Contas Fixas
        </h3>
        <p class="text-xs text-divi-t3 mt-1">
          Gerencie e lance de forma simples os talões do mês sem precisar de formulários longos
        </p>
      </div>
      <span class="text-xs font-semibold text-divi-amber bg-divi-amber-dim/20 p-2.5 rounded-xl border border-divi-amber/20">
        {{ pagasCount }}/{{ contasFixas.length }} pagas
      </span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Cards de Contas Fixas -->
      <div 
        v-for="bill in contasFixas" 
        :key="bill.id" 
        class="flex items-center justify-between p-4 rounded-2xl border transition-all duration-200"
        :class="verificarPaga(bill) ? 'bg-divi-emerald-dim border-emerald-500/20 text-divi-t1' : 'bg-divi-s1 border-divi-border text-divi-t2'"
      >
        <div class="flex items-center gap-3">
          <span class="text-3xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">{{ bill.icon }}</span>
          <div>
            <span class="font-extrabold text-sm block text-divi-t1">{{ bill.name }}</span>
            <span v-if="verificarPaga(bill)" class="text-xs text-divi-emerald flex items-center gap-1 mt-1 font-bold text-glow-emerald">
              ✅ Pago (R$ {{ obterStatusGasto(bill)?.valorReal.toFixed(2) }} por {{ obterNomeMembro(obterStatusGasto(bill)?.pagoPor) }})
            </span>
            <span v-else class="text-xs text-divi-amber flex items-center gap-1 mt-1 font-bold">
              ⏳ Aguardando Talão
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button 
            v-if="!verificarPaga(bill)" 
            @click="$emit('lancar', bill)" 
            class="px-4 py-2 text-xs font-black bg-divi-amber hover:bg-yellow-500 text-slate-950 rounded-xl transition-all"
            :disabled="isMonthLocked"
          >
            Lançar
          </button>
          <button 
            @click="$emit('configurar', bill)" 
            class="p-2 text-xs bg-divi-s2 hover:bg-divi-s3 text-divi-t3 hover:text-divi-t1 rounded-xl border border-divi-border transition-all"
          >
            ⚙️
          </button>
        </div>
      </div>

      <!-- Adicionar Nova Conta -->
      <div 
        @click="$emit('novo')" 
        class="border-2 border-dashed border-divi-border hover:border-divi-primary bg-divi-s1 hover:bg-divi-primary-dim/20 rounded-2xl flex justify-center items-center gap-2 p-4 cursor-pointer transition-all duration-200"
      >
        <span class="text-divi-primary font-black text-sm">➕ Adicionar Conta Fixa</span>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Rodar testes unitários do checklist**
Garanta que os botões de Lançar e Configurar continuam emitindo seus respectivos eventos normalmente sob a nova estilização.
Run: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add src/components/ledger/ContasFixasPanel.vue
git commit -m "style(ui): adaptar painel de contas fixas para estética v19"
```

---

### Task 5: Refactoring Visual do Assistente (Wizard) (`NovoLancamentoWizard.vue`)

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Atualizar container do Wizard e Barra de Dots**
Substitua as linhas 122-134 do `NovoLancamentoWizard.vue` para torná-lo um `glass-card` com a micro-animação dos `step-dots` do progresso.

```vue
<!-- Modificar template do NovoLancamentoWizard.vue -->
<template>
  <div class="glass-card rounded-3xl p-6 text-divi-t1 flex flex-col min-h-[520px] relative">
    
    <!-- Barra de Progresso Sênior Premium (Step Dots) -->
    <div class="flex items-center justify-between mb-8 px-2">
      <div class="flex-1 flex gap-1.5">
        <div 
          v-for="s in totalSteps" 
          :key="s"
          :class="[
            'h-1.5 rounded-full transition-all duration-350 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
            s <= step 
              ? 'w-6 bg-divi-primary glow-primary' 
              : 'w-1.5 bg-divi-s3'
          ]"
        ></div>
      </div>
      <span class="text-[10px] font-black text-divi-primary px-3 tracking-widest uppercase">Passo {{ step }}/5</span>
    </div>
```

- [ ] **Step 2: Redesenhar Canais de Pagamento (Passo 1)**
Substitua os botões de escolha de fluxo do Passo 1 (linhas 140-181) para usar o padrão de cards com desfoque e realce luminoso da v19.

```vue
      <!-- Passo 1: Escolha do Fluxo/Canal de Pagamento -->
      <div v-if="step === 1" class="space-y-4">
        <h2 class="text-lg font-black text-divi-t1 text-center tracking-tight leading-snug">Como você pagou ou fez o lançamento?</h2>
        <div class="flex flex-col gap-3">
          <!-- Pix / Dinheiro -->
          <button 
            @click="selecionarFluxo('expense', 'pix', null)"
            class="flex items-center gap-4 bg-divi-s1 hover:bg-divi-s2 border border-divi-border hover:border-divi-primary/30 rounded-2xl p-4 text-left transition-all active:scale-[0.98] duration-200"
          >
            <span class="text-3xl filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.2)]">💵</span>
            <div>
              <strong class="block text-sm text-divi-t1 font-extrabold">Fiz um PIX ou Dinheiro (Da Casa)</strong>
              <span class="text-[10px] text-divi-t3 block mt-0.5">Gasto imediato fora de faturas de cartões</span>
            </div>
          </button>

          <!-- Cartões Dinâmicos -->
          <button 
            v-for="c in cartoes" 
            :key="c.id"
            @click="selecionarFluxo('expense', 'card', c.responsavelPadraoId)"
            class="flex items-center gap-4 bg-divi-primary-dim/20 hover:bg-divi-primary-dim/30 border border-divi-primary/20 hover:border-divi-primary/45 rounded-2xl p-4 text-left transition-all active:scale-[0.98] duration-200"
          >
            <span class="text-3xl filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.2)]">💳</span>
            <div>
              <strong class="block text-sm text-divi-t1 font-extrabold">Passei no {{ c.nome }}</strong>
              <span class="text-[10px] text-divi-primary block mt-0.5 font-bold">Gasto registrado sob fatura de cartão</span>
            </div>
          </button>

          <!-- Empréstimo Pessoal -->
          <button 
            @click="selecionarFluxo('loan', 'pix', null)"
            class="flex items-center gap-4 bg-divi-emerald-dim/20 hover:bg-divi-emerald-dim/30 border border-divi-emerald/20 hover:border-divi-emerald/45 rounded-2xl p-4 text-left transition-all active:scale-[0.98] duration-200"
          >
            <span class="text-3xl filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.2)]">🤝</span>
            <div>
              <strong class="block text-sm text-divi-emerald font-extrabold">Fiz um Empréstimo Pessoal</strong>
              <span class="text-[10px] text-divi-emerald/80 block mt-0.5 font-bold">Dinheiro emprestado direto para outro morador</span>
            </div>
          </button>
        </div>
      </div>
```

- [ ] **Step 3: Redesenhar Seletores de Integrantes (Passos 2, 3 Loan e 5 Expense)**
Ajuste os botões de seleção de comprador, tomador e rateio. Quando selecionados, adicione contorno brilhante `glow-primary` (para o pagador/lender) e check verde no canto para o rateio.

*   **Passo 2 (Quem pagou):**
    ```vue
              <button 
                v-for="m in props.membros" 
                :key="m.id" 
                @click="compradorSelecionadoId = m.id; next();"
                class="flex flex-col items-center gap-2.5 p-3.5 bg-divi-s1 hover:bg-divi-s2 border rounded-2xl transition-all duration-200"
                :class="compradorSelecionadoId === m.id ? 'border-divi-primary glow-primary' : 'border-divi-border'"
              >
                <div class="w-12 h-12 bg-divi-primary text-white rounded-full flex items-center justify-center font-black text-lg shadow-inner">
                  {{ m.nome[0] }}
                </div>
                <span class="text-[10px] font-black text-divi-t1">{{ m.nome }}</span>
              </button>
    ```
*   **Passo 5 (Rateio Coletivo):**
    ```vue
            <button 
              v-for="m in props.membros" 
              :key="m.id" 
              @click="toggleSplitMember(m.id)"
              class="relative flex flex-col items-center gap-2 p-4 border rounded-2xl transition-all duration-200"
              :class="[participantesDivisao.includes(m.id) ? 'border-divi-primary bg-divi-primary-dim/20' : 'border-divi-border bg-divi-s1']"
            >
              <div class="w-10 h-10 bg-divi-primary text-white rounded-full flex items-center justify-center font-black text-sm">
                {{ m.nome[0] }}
              </div>
              <span class="text-[10px] font-black text-divi-t2">{{ m.nome }}</span>
              <!-- Check de confirmação luminoso -->
              <span v-if="participantesDivisao.includes(m.id)" class="absolute top-2 right-2 text-[9px] bg-divi-emerald-dim border border-emerald-500/30 text-divi-emerald font-black py-0.5 px-1.5 rounded-full text-glow-emerald">
                ✓
              </span>
            </button>
    ```

- [ ] **Step 4: Redesenhar Input de Valor e Incremetador de Parcelas**
Ajuste a interface do Passo de Valor para destacar o valor com fonte ultra-escura, CIFRÃO violeta e controlador circular tátil de parcelamento.

```vue
      <!-- Passo de Valor -->
      <div v-else-if="(step === 3 && wizFlow === 'expense') || (step === 4 && wizFlow === 'loan')" class="space-y-6">
        <h2 class="text-lg font-black text-divi-t1 text-center tracking-tight">
          {{ wizFlow === 'loan' ? 'Qual o valor total do empréstimo?' : 'Qual foi o valor total?' }}
        </h2>
        <div class="bg-slate-950 border border-divi-border rounded-3xl p-6 text-center shadow-inner">
          <div class="flex items-baseline justify-center gap-2 mb-4">
            <span class="text-divi-violet text-2xl font-black">R$</span>
            <input 
              v-model.number="valor"
              type="number"
              step="0.01"
              class="w-40 text-4xl font-black text-divi-t1 bg-transparent text-center focus:outline-none border-b border-dashed border-divi-border focus:border-divi-primary transition-colors"
              placeholder="0,00"
              autofocus
            />
          </div>

          <!-- Parcelamento Digitável -->
          <div v-if="wizFlow === 'loan' || wizPayment === 'card'" class="border-t border-divi-border pt-4 mt-2">
            <span class="block text-[10px] font-black text-divi-t3 uppercase tracking-wider mb-3">
              {{ wizFlow === 'loan' ? '🤝 Quer parcelar a devolução deste empréstimo?' : '📋 Quer parcelar esta compra no cartão?' }}
            </span>
            <div class="flex items-center justify-center gap-4">
              <button 
                type="button" 
                @click="ajustarParcelas(-1)" 
                class="w-9 h-9 rounded-full border border-divi-border font-extrabold bg-divi-s2 text-divi-t1 hover:bg-divi-s3 transition-all flex items-center justify-center shadow-sm"
              >-</button>
              <input 
                v-model.number="installments" 
                type="number"
                min="1"
                class="w-14 text-center font-black bg-slate-900 border border-divi-border rounded-xl py-1 text-sm focus:outline-none focus:border-divi-primary"
              />
              <button 
                type="button" 
                @click="ajustarParcelas(1)" 
                class="w-9 h-9 rounded-full border border-divi-border font-extrabold bg-divi-s2 text-divi-t1 hover:bg-divi-s3 transition-all flex items-center justify-center shadow-sm"
              >+</button>
              <span class="text-xs text-divi-t3 font-bold">meses</span>
            </div>
            <span class="block text-xs text-divi-primary mt-3.5 font-bold leading-relaxed">
              {{ infoParcelamento }}
            </span>
          </div>
        </div>
      </div>
```

- [ ] **Step 5: Ajustar Lembrete, Quick Sugestions Chips e Barra de Botões do Wizard**
Modifique o input de descrição, mude os chips rápidos para usar `bg-divi-s2` com contorno de vidro e ajuste os botões inferiores para usar botões escuros com desfoque de vidro.

*   **Lembrete/Sugestões:**
    ```vue
              <input 
                v-model="descricao"
                type="text"
                :placeholder="wizFlow === 'loan' ? 'Ex: Pagar a conta de luz dele, Pix rápido...' : 'Ex: Supermercado, Almoço, Farmácia...'"
                class="glass-input w-full p-4 rounded-2xl text-center text-sm font-bold focus:outline-none focus:border-divi-primary shadow-sm"
                autofocus
              />
              <!-- Sugestões -->
              <div class="flex justify-center gap-2 flex-wrap max-w-sm mx-auto">
                <button 
                  v-for="chip in quickChips" 
                  :key="chip"
                  type="button"
                  @click="selecionarChip(chip)"
                  class="text-[10px] font-bold bg-divi-s2 border border-divi-border hover:bg-divi-s3 text-divi-t1 py-2 px-3.5 rounded-full transition-all active:scale-95"
                >
                  {{ chip }}
                </button>
              </div>
    ```
*   **Safety Cognitive Summary & Rateio Final:**
    ```vue
            <!-- Feedback cognitivo de segurança -->
            <div class="bg-divi-primary-glow/10 border border-divi-primary/10 rounded-2xl p-4 text-[9px] font-bold text-indigo-300 leading-normal">
              {{ cognitiveSummary }}
            </div>

            <!-- Quadro final de rateio -->
            <div class="bg-divi-emerald-dim border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 shadow-md">
              <span class="text-3xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">📊</span>
              <div class="text-left leading-normal">
                <strong class="block text-divi-emerald text-[11px] font-black">{{ splitSummaryTitle }}</strong>
                <span class="text-[10px] text-emerald-400 font-extrabold text-glow-emerald">{{ splitSummaryDesc }}</span>
              </div>
            </div>
    ```
*   **Barra de Ações do Wizard (Navegação):**
    ```vue
        <div class="border-t border-divi-border pt-5 mt-5 flex justify-between gap-4">
          <button 
            type="button" 
            @click="step === 1 ? emit('cancelar') : prev()"
            class="flex-1 bg-divi-s2 hover:bg-divi-s3 text-divi-t1 border border-divi-border font-black text-xs py-3.5 rounded-2xl transition-all shadow-sm"
          >
            {{ step === 1 ? 'Cancelar' : 'Voltar' }}
          </button>

          <button 
            type="button" 
            :disabled="!canAdvance"
            @click="((wizFlow === 'loan' && step === 5) || (wizFlow === 'expense' && step === 5)) ? handleGravar() : next()"
            class="flex-1 bg-divi-primary hover:bg-indigo-500 text-white font-black text-xs py-3.5 rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/10"
          >
            {{ ((wizFlow === 'loan' && step === 5) || (wizFlow === 'expense' && step === 5)) ? 'Confirmar e Gravar' : 'Avançar' }}
          </button>
        </div>
    ```

- [ ] **Step 6: Executar a suíte de testes unitários do Wizard**
Garanta que todas as regras de navegação rápida, incrementação de parcelas e geração final de transações/gastos continuam 100% corretas.
Run: `npx vitest run src/components/ledger/NovoLancamentoWizard.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**
```bash
git add src/components/ledger/NovoLancamentoWizard.vue
git commit -m "style(ui): redesenhar o NovoLancamentoWizard para estética Sênior v19 com step-dots"
```

---

### Task 6: Auditoria Geral de Testes e Ajustes Finos

**Files:**
- Modify: `src/components/ledger/ConfiguracoesMembros.vue`

- [ ] **Step 1: Estilizar Configurações de Membros**
Visualize a tela de configurações e adapte de forma simplificada para usar o dark mode.

```vue
<!-- Modificar classes no template do src/components/ledger/ConfiguracoesMembros.vue -->
<!-- Exemplo: Trocar 'bg-white rounded-3xl p-6 border border-slate-100 shadow-xl' por 'glass-card rounded-3xl p-6 shadow-2xl text-divi-t1' -->
```

- [ ] **Step 2: Executar todos os testes do workspace**
Rode a suíte completa de testes unitários e de renderização do Vitest para verificar estabilidade total.
Run: `npx vitest run`
Expected: 115 passed

- [ ] **Step 3: Commit final**
```bash
git add src/components/ledger/ConfiguracoesMembros.vue
git commit -m "style(ui): estilizar configurações de membros e finalizar auditoria de testes"
```
