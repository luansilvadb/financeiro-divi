# Avanço de Iteração Estética "Family" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the visual quality of DIVI to the absolute premium Tier 1 of the "Family" Design System by loading the correct serif hybrid Display font (Fraunces), introducing playful flat-illustrated mascot SVG creatures for empty states, and replacing dull warning components with lúdicos character widgets.

**Architecture:** We will load Fraunces at weight 500 via Google Fonts, ensuring our display typography tracking-negative headers match the Pixar storyboard theme perfectly. Then, we will enrich three key components (ActivityFeed, ContasFixasPanel, and NovoLancamentoWizard) with animated vector flat mascot characters that bring the "finance-as-a-boardgame" philosophy to life.

**Tech Stack:** Vue 3, Tailwind CSS v4, Lucide Icons, SVG, Google Fonts.

---

### Task 1: Carregar Google Font 'Fraunces' no HTML Global

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Substituir import de Calistoga por Fraunces no `index.html`**

Altere a tag `<link>` do Google Fonts para carregar a família `'Fraunces'` com suporte a fontes variáveis e pesos necessários, mantendo a compatibilidade do Inter.

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Divi</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;1,9..144,500&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 2: Executar build e certificar-se de que compila perfeitamente**

Run: `npm run build`
Expected: Sucesso total com código de saída 0.

- [ ] **Step 3: Commitar a alteração**

```bash
git add index.html
git commit -m "style: carregar a fonte serifada de exibição Fraunces do design system Family"
```

---

### Task 2: Adicionar Mascote de Monstrinho no Estado Vazio do Feed de Registros

**Files:**
- Modify: `src/components/ledger/ActivityFeed.vue`

- [ ] **Step 1: Refatorar o container vazio de `ActivityFeed.vue` para exibir o mascote em SVG plano**

Substitua o bloco de estado vazio simples de `ActivityFeed.vue` (linhas 48-50) por um monstrinho azul-celeste lúdico com pernas de palito olhando através de uma lupa, expressando frustração divertida por não haver transações ainda.

```vue
    <div v-if="sortedGastos.length === 0" class="text-center py-16 border border-dashed border-stone rounded-xl space-y-4 bg-canvas/30">
      <!-- Mascote Azul Celeste com Lupa -->
      <svg viewBox="0 0 100 100" class="w-20 h-20 mx-auto animate-pulse" style="animation-duration: 4s;">
        <!-- Corpo Blob Celeste -->
        <path d="M20,40 Q30,10 60,15 Q90,20 80,60 Q70,90 40,80 Q10,70 20,40 Z" fill="var(--color-sky-blue)" />
        <!-- Olhinhos -->
        <circle cx="45" cy="45" r="4.5" fill="#000" />
        <circle cx="65" cy="45" r="4.5" fill="#000" />
        <!-- Boca Curva Decepção/Espera -->
        <path d="M48,58 Q55,54 62,58" stroke="#000" stroke-width="3" stroke-linecap="round" fill="none" />
        <!-- Lupa nas Mãozinhas -->
        <circle cx="30" cy="65" r="10" fill="none" stroke="#000" stroke-width="3" />
        <line x1="37" y1="72" x2="48" y2="83" stroke="#000" stroke-width="3.5" stroke-linecap="round" />
        <!-- Perninhas de Palito -->
        <line x1="38" y1="80" x2="28" y2="95" stroke="#000" stroke-width="3" stroke-linecap="round" />
        <line x1="62" y1="80" x2="72" y2="95" stroke="#000" stroke-width="3" stroke-linecap="round" />
      </svg>
      <div class="space-y-1">
        <p class="text-xs font-bold text-charcoal uppercase tracking-wider">Tudo deserto por aqui</p>
        <p class="text-[11px] text-ash max-w-[220px] mx-auto leading-normal">
          Nenhum gasto ou acerto registrado neste período ainda.
        </p>
      </div>
    </div>
```

- [ ] **Step 2: Rodar o build de produção**

Run: `npm run build`
Expected: Compilação concluída com sucesso.

- [ ] **Step 3: Commitar o novo mascote**

```bash
git add src/components/ledger/ActivityFeed.vue
git commit -m "style: adicionar mascote blob celeste ilustrado para o feed de registros vazio"
```

---

### Task 3: Inserir Moedinha Animada no Box de Resumo do Rateio do Assistente

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Substituir o ícone de informação simples por um mascote animado em `NovoLancamentoWizard.vue`**

No passo de divisão (linhas 330-337), substitua o ícone `Info` por uma moedinha saltitante (Meadow Green) piscando estrelas Sunburst Yellow, trazendo mais calor visual e reforçando cognitivamente o feedback de divisão dos custos.

```vue
            <div class="p-5 rounded-xl bg-meadow/5 border border-meadow/20 flex gap-4 items-center">
              <!-- Mascote Ilustrado: Moedinha Feliz Meadow Green -->
              <svg viewBox="0 0 100 100" class="w-14 h-14 shrink-0 animate-bounce" style="animation-duration: 5s;">
                <circle cx="50" cy="50" r="40" fill="var(--color-meadow-green)" />
                <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="3" />
                <!-- Olhinhos Felizes -->
                <circle cx="40" cy="45" r="4.5" fill="#000" />
                <circle cx="60" cy="45" r="4.5" fill="#000" />
                <!-- Sorriso -->
                <path d="M42,56 Q50,64 58,56" stroke="#000" stroke-width="3.5" stroke-linecap="round" fill="none" />
                <!-- Brilho Estrela -->
                <path d="M78,22 L80,26 L85,27 L81,31 L82,36 L78,33 L74,36 L75,31 L71,27 L76,26 Z" fill="var(--color-sunburst-yellow)" />
              </svg>
              <div class="space-y-1 min-w-0">
                <p class="text-[10px] font-bold text-meadow uppercase tracking-widest">{{ splitSummaryTitle }}</p>
                <p class="text-xs font-semibold text-meadow leading-relaxed">{{ splitSummaryDesc }}</p>
              </div>
            </div>
```

- [ ] **Step 2: Verificar o build do projeto**

Run: `npm run build`
Expected: Sucesso total.

- [ ] **Step 3: Commitar a moedinha ilustrada**

```bash
git add src/components/ledger/NovoLancamentoWizard.vue
git commit -m "style: adicionar moedinha ilustrada animada ao box de rateio do wizard"
```

---

### Task 4: Adicionar Mascote de Monstrinho para Contas Fixas Vazias

**Files:**
- Modify: `src/components/ledger/ContasFixasPanel.vue`

- [ ] **Step 1: Criar um estado vazio estilizado com mascote em `ContasFixasPanel.vue`**

Modifique o painel de contas fixas para exibir um monstrinho verde-esmeralda lúdico com uma prancheta de talão de notas quando não houver contas configuradas, estimulando o morador a criar as recorrências.

Substitua a declaração da lista de contas fixas de forma que se `contasFixas.length === 0`, mostre o estado vazio; caso contrário, mostre os widgets e o botão de inserção.

```vue
    <div class="grid gap-3">
      <!-- Estado Vazio Ilustrado se não houver contas fixas cadastradas -->
      <div v-if="contasFixas.length === 0" class="text-center py-12 border border-dashed border-stone rounded-xl space-y-4 bg-canvas/30">
        <!-- Mascote Verde Meadow com Talão de Notas -->
        <svg viewBox="0 0 100 100" class="w-20 h-20 mx-auto animate-bounce" style="animation-duration: 6s;">
          <path d="M15,50 Q20,15 50,20 Q80,25 85,55 Q90,85 50,80 Q10,75 15,50 Z" fill="var(--color-meadow-green)" />
          <circle cx="42" cy="45" r="4.5" fill="#000" />
          <circle cx="62" cy="45" r="4.5" fill="#000" />
          <path d="M46,56 Q52,62 58,56" stroke="#000" stroke-width="3" stroke-linecap="round" fill="none" />
          <!-- Clipboard/Talão de Notas -->
          <rect x="25" y="62" width="18" height="22" rx="2" fill="#ffffff" stroke="#000" stroke-width="2" />
          <rect x="29" y="58" width="10" height="4" rx="1" fill="var(--color-ember-orange)" stroke="#000" stroke-width="1.5" />
          <line x1="30" y1="69" x2="40" y2="69" stroke="#000" stroke-width="2" />
          <line x1="30" y1="75" x2="40" y2="75" stroke="#000" stroke-width="2" />
          <!-- Perninhas -->
          <line x1="35" y1="78" x2="25" y2="92" stroke="#000" stroke-width="3" stroke-linecap="round" />
          <line x1="65" y1="78" x2="75" y2="92" stroke="#000" stroke-width="3" stroke-linecap="round" />
        </svg>
        <div class="space-y-1">
          <p class="text-xs font-bold text-charcoal uppercase tracking-wider">Nenhuma conta agendada</p>
          <p class="text-[11px] text-ash max-w-[240px] mx-auto leading-normal">
            Cadastre aluguel, luz ou internet para fazer lançamentos recorrentes rápidos.
          </p>
        </div>
      </div>

      <!-- Widgets de Contas Fixas (Se existirem) -->
      <template v-else>
        <div 
          v-for="bill in contasFixas" 
          :key="bill.id" 
          class="group flex items-center justify-between p-4 rounded-xl border transition-all duration-300"
          :class="verificarPaga(bill) ? 'bg-meadow/5 border-meadow/20' : 'bg-[#fbfaf9] border-stone-surface hover:border-ember/30'"
        >
          <div class="flex items-center gap-4 min-w-0 flex-1">
            <div class="w-10 h-10 rounded-lg bg-card border border-stone-surface flex items-center justify-center text-xl shadow-subtle">
              {{ bill.icon }}
            </div>
            <div class="min-w-0 flex-1">
              <span class="font-bold text-sm block text-charcoal truncate">{{ bill.name }}</span>
              <div v-if="verificarPaga(bill)" class="flex items-center gap-1 mt-1">
                <Check class="w-3 h-3 text-meadow" />
                <span class="text-[10px] text-meadow font-bold uppercase tracking-wider">
                  R$ {{ obterStatusGasto(bill)?.valorReal.toFixed(2).replace('.', ',') }} • {{ obterNomeMembro(obterStatusGasto(bill)?.pagoPor) }}
                </span>
              </div>
              <span v-else class="text-[10px] text-ash flex items-center gap-1 mt-1 font-semibold">
                ⏳ Aguardando Talão
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0 ml-4">
            <Button 
              v-if="!verificarPaga(bill)" 
              @click="$emit('lancar', bill)" 
              variant="primary"
              size="sm"
              class="h-8 px-3 text-[10px]"
              :disabled="isMonthLocked"
            >
              Lançar
            </Button>
            <Button 
              variant="secondary" 
              size="icon"
              @click="$emit('configurar', bill)" 
              class="w-8 h-8 rounded-lg border border-stone-surface"
            >
              <Settings class="w-4 h-4 text-ash" />
            </Button>
          </div>
        </div>
      </template>

      <!-- Adicionar Nova Conta -->
      <button 
        @click="$emit('novo')" 
        class="group flex justify-center items-center gap-2 p-4 rounded-xl border border-dashed border-stone hover:border-ember hover:bg-ember/5 transition-all duration-300 text-ash hover:text-ember font-bold text-xs uppercase tracking-widest mt-2"
      >
        <Plus class="w-4 h-4 transition-transform group-hover:scale-110" />
        <span>Adicionar Conta Fixa</span>
      </button>
    </div>
```

- [ ] **Step 2: Executar compilação final e testar visualmente**

Run: `npm run build`
Expected: Build concluído com sucesso e sem erros de template.

- [ ] **Step 3: Commitar o novo mascote do painel de contas**

```bash
git add src/components/ledger/ContasFixasPanel.vue
git commit -m "style: adicionar mascote blob ilustrado para painel de contas fixas vazio"
```
