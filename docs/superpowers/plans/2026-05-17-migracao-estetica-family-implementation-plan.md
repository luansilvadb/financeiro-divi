# Plano de Implementação: Migração Estética "Family"

> **Para trabalhadores baseados em agentes:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para implementar este plano tarefa por tarefa. Os passos usam a sintaxe de checkbox (`- [ ]`) para acompanhamento.

**Objetivo:** Migrar o aplicativo DIVI para o sistema de design "Family" (creme, minimalista, lúdico e altamente tátil) e concluir o polimento estético usando as novas classes de tema do Tailwind v4.

**Arquitetura:** Adotaremos uma estratégia progressiva e focada: primeiro injetamos todos os tokens semânticos e utilitários completos no arquivo global de CSS, em seguida adaptamos os componentes fundamentais de interface (Button, Card, SectionLabel, InvertedSection) para corresponderem às especificações premium de design, depois remodelamos o container principal (App.vue) adicionando mascotes lúdicos desenhados sob medida em SVG nativo, e finalizamos adaptando o dashboard e seus subcomponentes para refletirem as novas bordas táteis de pedra quente, fundos em creme e tipografia elegante com tracking negativo.

**Tech Stack:** Vue 3, Tailwind CSS v4, Vite, TypeScript.

---

### Tarefa 1: Configurar Tokens Completos no CSS Global

**Arquivos:**
- Modificar: `src/main.css`

- [ ] **Passo 1: Escrever os tokens e regras base do design system Family no `src/main.css`**

Substitua o conteúdo atual de `src/main.css` para declarar a paleta de cores completa de ampla gama cromática, fontes, espaçamentos personalizados e estilos de borda tátil interna sugeridos pelo `DESIGN.md`.

```css
@import "tailwindcss";

@theme {
  /* Cores do DESIGN.md */
  --color-warm-canvas: #fbfaf9;
  --color-stone-surface: #f2f0ed;
  --color-parchment-card: #f8f7f4;
  --color-graphite: #474645;
  --color-charcoal-primary: #343433;
  --color-midnight: #121212;
  --color-obsidian: #000000;
  --color-ash: #848281;
  --color-fog: #c6c6c6;
  --color-smoke: #a7a7a7;
  --color-pepper: #282624;
  --color-ember-orange: #ff3e00;
  --color-meadow-green: #00ca48;
  --color-sky-blue: #0090ff;
  --color-sunburst-yellow: #ffbb26;
  --color-deep-amber: #d48f00;
  --color-ocean-blue: #0086fc;
  --color-ice-blue: #64c6ff;
  --color-spearmint: #00c978;
  --color-flamingo: #ff58ae;
  --color-violet-pop: #9f4fff;
  --color-coral-red: #ff2b3a;
  --color-valid-green: #00c454;

  /* Aliases Semânticos e de Compatibilidade */
  --color-canvas: var(--color-warm-canvas);
  --color-stone: var(--color-stone-surface);
  --color-card: #ffffff;
  --color-recessed: var(--color-parchment-card);
  --color-charcoal: var(--color-charcoal-primary);
  --color-ember: var(--color-ember-orange);
  --color-meadow: var(--color-meadow-green);
  --color-sky: var(--color-sky-blue);
  --color-sunburst: var(--color-sunburst-yellow);

  /* Tipografia — Famílias de Fontes */
  --font-display: 'Fraunces', ui-serif, Georgia, serif;
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;

  /* Border Radii Personalizados do DESIGN.md */
  --radius-tags: 6px;
  --radius-cards: 10px;
  --radius-icons: 40px;
  --radius-inputs: 10px;
  --radius-buttons: 32px;
  --radius-cardslarge: 24px;
  --radius-buttonspill: 32px;
  --radius-illustrations: 72px;

  /* Sombras e Efeitos Táteis */
  --shadow-subtle: var(--color-stone-surface) 0px 0px 0px 1px inset;
  --shadow-subtle-2: var(--color-stone-surface) 0px 0px 0px 0px inset;
  --shadow-subtle-3: rgba(0, 0, 0, 0.04) 0px 0px 0px 1px;
  --shadow-lg: rgba(0, 0, 0, 0.15) 0px 0px 24px 0px;
  --shadow-sm: rgba(0, 0, 0, 0.04) 0px 1px 6px 0px, rgba(0, 0, 0, 0.05) 0px 0px 24px 0px;
}

@layer base {
  body {
    background-color: var(--color-warm-canvas);
    color: var(--color-graphite);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  /* Escala de texto com tracking negativo */
  .text-caption {
    font-size: 12px;
    line-height: 1.58;
    letter-spacing: -0.14px;
  }
  
  .text-body {
    font-size: 15px;
    line-height: 1.47;
    letter-spacing: -0.2px;
  }
  
  .text-heading-sm {
    font-size: 19px;
    line-height: 1.38;
    letter-spacing: -0.25px;
  }
  
  .text-heading {
    font-size: 23px;
    line-height: 1.2;
    letter-spacing: -0.44px;
  }
  
  .text-heading-lg {
    font-size: 44px;
    line-height: 1.09;
    letter-spacing: -1.14px;
  }
  
  .text-display {
    font-size: 68px;
    line-height: 1.09;
    letter-spacing: -2.11px;
  }
}
```

- [ ] **Passo 2: Executar build e certificar-se de que os estilos são válidos**

Execute: `npm run build`
Esperado: Sucesso absoluto sem erros de sintaxe CSS ou Tailwind.

- [ ] **Passo 3: Salvar alterações na branch**

```bash
git add src/main.css
git commit -m "style: configurar os tokens semânticos e regras base do tema Family"
```

---

### Tarefa 2: Refatorar Componentes Básicos de Interface (UI Core)

**Arquivos:**
- Modificar: `src/components/ui/Button.vue`
- Modificar: `src/components/ui/Card.vue`
- Modificar: `src/components/ui/SectionLabel.vue`
- Modificar: `src/components/ui/InvertedSection.vue`

- [ ] **Passo 1: Refatorar o `Button.vue`**

Altere `src/components/ui/Button.vue` para suportar os botões táteis tipo pílula do design system Family.

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
    // Mapeamento de tamanho
    props.size === 'default' && 'h-11 px-6 py-2 text-sm font-medium',
    props.size === 'sm' && 'h-9 px-4 text-xs font-medium',
    props.size === 'lg' && 'h-14 px-8 text-base font-medium',
    props.size === 'icon' && 'h-10 w-10 text-sm font-medium',
    // Mapeamento de variantes específicas do DESIGN.md
    props.variant === 'primary' && 'bg-midnight text-white hover:bg-charcoal-primary rounded-buttonspill font-semibold shadow-sm',
    props.variant === 'secondary' && 'bg-[#f6f4ef] text-midnight hover:bg-stone-surface rounded-buttonspill font-medium',
    props.variant === 'outline' && 'bg-transparent text-graphite border border-graphite hover:bg-stone-surface rounded-xl font-medium px-8 py-3',
    props.variant === 'ghost' && 'text-ember-orange hover:text-ember-orange/80 font-medium p-0 border-none bg-transparent',
    props.variant === 'inverted' && 'bg-white text-midnight hover:bg-[#f6f4ef] rounded-buttonspill font-medium shadow-sm',
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

- [ ] **Passo 2: Refatorar o `Card.vue`**

Altere `src/components/ui/Card.vue` para suportar cartões brancos com bordas stone internas, recipientes creme para screenshots/dados e cartões mockup pretos.

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
  <!-- Card Padrão (White) com borda stone tátil interna (subtle inset) -->
  <div 
    v-if="props.variant === 'default' || props.variant === 'featured'"
    :class="cn(
      'rounded-cards bg-card shadow-subtle transition-all duration-300 p-8',
      props.class
    )"
  >
    <slot />
  </div>

  <!-- Card Recessed (Warm Cream) afundado no layout sem sombras -->
  <div 
    v-else-if="props.variant === 'recessed'"
    :class="cn(
      'rounded-[12px] bg-recessed p-[22.8px] transition-all duration-300',
      props.class
    )"
  >
    <slot />
  </div>

  <!-- Card Escuro / Mockup de Celular (Obsidian) -->
  <div 
    v-else-if="props.variant === 'dark'"
    :class="cn(
      'rounded-t-[24px] rounded-b-[24px] bg-obsidian shadow-lg text-white p-6',
      props.class
    )"
  >
    <slot />
  </div>
</template>
```

- [ ] **Passo 3: Refatorar o `SectionLabel.vue`**

Altere `src/components/ui/SectionLabel.vue` para adotar a estética de badge sutil de ação com tons de Ember Orange.

```vue
<script setup lang="ts">
import { cn } from '../../shared/utils/cn'

interface Props {
  pulse?: boolean
  class?: string
}

withDefaults(defineProps<Props>(), {
  pulse: true
})
</script>

<template>
  <div :class="cn('inline-flex items-center gap-3 rounded-tags border border-ember-orange/20 bg-ember-orange/5 px-4 py-1.5', $props.class)">
    <span 
      :class="cn(
        'h-2 w-2 rounded-full bg-ember-orange',
        pulse && 'animate-pulse'
      )" 
    />
    <span class="font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-ember-orange">
      <slot />
    </span>
  </div>
</template>
```

- [ ] **Passo 4: Refatorar o `InvertedSection.vue`**

Altere `src/components/ui/InvertedSection.vue` para usar a cor semântica `midnight` com textura pontilhada de pedra quente.

```vue
<template>
  <section class="relative bg-midnight text-white py-16 md:py-24 overflow-hidden rounded-cardslarge my-12">
    <!-- Texture layer -->
    <div class="absolute inset-0 pointer-events-none opacity-[0.03]" aria-hidden="true" style="background-image: radial-gradient(var(--color-stone-surface) 1px, transparent 0); background-size: 16px 16px;"></div>
    
    <div class="relative max-w-2xl mx-auto px-6 z-10">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * InvertedSection.vue
 * A high-contrast section with near-black (midnight) background and light text.
 */
</script>
```

- [ ] **Passo 5: Verificar o Build e salvar alterações**

Execute: `npm run build`
Esperado: Sucesso absoluto.

```bash
git add src/components/ui/Button.vue src/components/ui/Card.vue src/components/ui/SectionLabel.vue src/components/ui/InvertedSection.vue
git commit -m "style: refatorar botões, cartões, rótulos e seções invertidas para o padrão Family"
```

---

### Tarefa 3: Reestruturar o App Shell (`App.vue`)

**Arquivos:**
- Modificar: `src/App.vue`

- [ ] **Passo 1: Substituir estilos de brilho ambiental e estruturar layout e mascotes**

Modifique a seção `<template>` e `<script>` do `src/App.vue` para remover as sombras, glows antigos e adotar o cabeçalho envolto por mascotes lúdicos e expressivos em SVG plano, além do Floating Action Button perfeitamente tátil.

Ajuste as linhas 44-192 do `src/App.vue` da seguinte forma:

```vue
<template>
  <div class="min-h-screen bg-canvas text-graphite font-sans selection:bg-ember/20">
    <div class="max-w-[1200px] mx-auto px-6 py-16 md:py-24 relative">
      <!-- Header Lúdico e Centralizado -->
      <header class="mb-20 space-y-8 relative">
        <!-- Mascote Ilustrado 1: Ember Orange (Esquerda) -->
        <div class="absolute -left-16 top-2 hidden xl:block">
          <svg viewBox="0 0 100 100" class="w-16 h-16 animate-bounce" style="animation-duration: 4s;">
            <path d="M15,50 Q10,20 50,15 Q90,10 85,50 Q80,85 50,85 Q20,85 15,50 Z" fill="var(--color-ember)" />
            <circle cx="40" cy="45" r="4" fill="#000" />
            <circle cx="60" cy="45" r="4" fill="#000" />
            <path d="M45,55 Q50,60 55,55" stroke="#000" stroke-width="3" stroke-linecap="round" fill="none" />
            <line x1="35" y1="82" x2="25" y2="95" stroke="#000" stroke-width="3" stroke-linecap="round" />
            <line x1="65" y1="82" x2="75" y2="95" stroke="#000" stroke-width="3" stroke-linecap="round" />
          </svg>
        </div>

        <!-- Mascote Ilustrado 2: Sky Blue (Direita) -->
        <div class="absolute -right-20 top-6 hidden xl:block">
          <svg viewBox="0 0 100 100" class="w-20 h-20 animate-pulse" style="animation-duration: 3s;">
            <path d="M20,40 Q30,10 60,15 Q90,20 80,60 Q70,90 40,80 Q10,70 20,40 Z" fill="var(--color-sky)" />
            <circle cx="45" cy="45" r="4" fill="#000" />
            <circle cx="65" cy="45" r="4" fill="#000" />
            <path d="M50,58 Q55,62 60,58" stroke="#000" stroke-width="3" stroke-linecap="round" fill="none" />
            <line x1="38" y1="80" x2="28" y2="95" stroke="#000" stroke-width="3" stroke-linecap="round" />
            <line x1="62" y1="80" x2="72" y2="95" stroke="#000" stroke-width="3" stroke-linecap="round" />
          </svg>
        </div>

        <div class="flex justify-between items-start">
          <div class="space-y-4">
            <SectionLabel>Finanças Residenciais</SectionLabel>
            <h1 class="text-display font-display leading-[1.09] tracking-[-2.11px] text-charcoal">
              DIVI<span class="text-ember">.</span>
            </h1>
            <p class="text-body text-graphite max-w-[480px] leading-[1.47] tracking-[-0.2px]">
              Gestão inteligente e minimalista para quem compartilha a vida.
            </p>
          </div>

          <div class="flex gap-2">
            <Button 
              v-if="currentView === 'dashboard'"
              variant="secondary" 
              size="icon"
              @click="currentView = 'settings'"
              class="rounded-full border border-stone-surface"
            >
              <Settings class="w-4 h-4 text-graphite" />
            </Button>
            <Button 
              v-else
              variant="secondary"
              size="icon"
              @click="currentView = 'dashboard'"
              class="rounded-full border border-stone-surface"
            >
              <X class="w-4 h-4 text-graphite" />
            </Button>
          </div>
        </div>

        <!-- View Title/Navigation -->
        <nav v-if="currentView !== 'dashboard'" class="pt-4">
          <button 
            @click="currentView = 'dashboard'"
            class="group flex items-center gap-2 text-sm font-semibold text-graphite hover:text-ember transition-colors"
          >
            <ChevronLeft class="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Voltar para o Dashboard
          </button>
        </nav>
      </header>

      <!-- Main Content -->
      <main class="relative z-10">
        <transition 
          enter-active-class="transition duration-500 ease-out"
          enter-from-class="opacity-0 translate-y-4"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-300 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-4"
          mode="out-in"
        >
          <div :key="currentView">
            <DashboardSaldos 
              v-if="currentView === 'dashboard'"
              :membros="todosMembros"
              :faturasAbertas="faturasAbertas"
              :faturasFechadas="faturasFechadas"
              :acertosPendentes="acertos"
              :cartoes="cartoes"
              :calcular-consumo="calcularConsumoMembro"
              :calcular-adiantamento="calcularAdiantamentoMembro"
              @quitarAcerto="quitarAcertoMembro"
              @fecharFatura="fecharFaturaManual"
              @reabrirFatura="reabrirFaturaManual"
            />
            
            <NovoLancamentoWizard 
              v-else-if="currentView === 'wizard'"
              :membros="ativos"
              @salvar="handleSalvarTransacao"
              @cancelar="currentView = 'dashboard'"
            />

            <ConfiguracoesMembros
              v-else-if="currentView === 'settings'"
              @voltar="currentView = 'dashboard'"
            />
          </div>
        </transition>
      </main>
    </div>

    <!-- Footer Inverted Section -->
    <div class="max-w-[1200px] mx-auto px-6">
      <InvertedSection v-if="currentView === 'dashboard'">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div class="space-y-4">
            <div class="flex items-center gap-2 text-ember">
              <ShieldCheck class="w-5 h-5" />
              <span class="font-bold tracking-wider uppercase text-[10px]">Privacidade Garantida</span>
            </div>
            <h3 class="text-heading font-display">Seus dados não saem daqui.</h3>
            <p class="text-white/60 text-sm max-w-sm leading-relaxed">
              O DIVI utiliza persistência local e sincronização atômica entre abas. 
              Nada é enviado para servidores externos.
            </p>
          </div>
          
          <div class="flex flex-col gap-4">
            <div class="text-white/40 text-xs flex items-center gap-1.5">
              Feito com <Heart class="w-3 h-3 fill-current text-ember" /> para finanças reais.
            </div>
          </div>
        </div>
      </InvertedSection>
    </div>

    <!-- Floating Action Button (FAB) -->
    <transition
      enter-active-class="transition duration-500 delay-300 ease-out"
      enter-from-class="opacity-0 scale-50"
      enter-to-class="opacity-100 scale-100"
    >
      <Button
        v-if="currentView === 'dashboard'"
        variant="primary"
        class="fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-lg z-[100] active:scale-95"
        @click="currentView = 'wizard'"
      >
        <Plus class="w-6 h-6 stroke-[3px]" />
      </Button>
    </transition>
  </div>
</template>
```

- [ ] **Passo 2: Verificar o build e commitar as modificações**

Execute: `npm run build`
Esperado: Sucesso absoluto.

```bash
git add src/App.vue
git commit -m "style: atualizar App.vue com layout de ampla largura, mascotes SVG planos e pílulas de navegação"
```

---

### Tarefa 4: Refatorar o Componente Principal do Dashboard (`DashboardSaldos.vue`)

**Arquivos:**
- Modificar: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Passo 1: Limpar as referências de estilo Fluent 2 e aplicar as classes do design system Family**

Modifique o arquivo `src/components/ledger/DashboardSaldos.vue` para substituir os gradientes (`gradient-text`, `bg-accent`, `border-accent/30`) por classes limpas de alto contraste baseadas na escala Family (usando `text-ember` para detalhes inline, `bg-[#f6f4ef]` para botões creme de segundo nível, cartões táteis com borda stone interna e pílulas texturizadas).

Altere as ocorrências de classes conforme abaixo nas linhas 438-735 do arquivo:

```vue
    <!-- BARRA DE TRANCAMENTO (Design System Family) -->
    <div 
      class="flex justify-between items-center p-4 rounded-xl border transition-all duration-300 shadow-subtle bg-parchment-card"
      :class="isMonthLocked 
        ? 'border-ember/20 bg-ember/5 text-charcoal' 
        : 'border-stone-surface text-graphite'"
    >
      <div class="flex items-center gap-4">
        <div 
          class="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          :class="isMonthLocked ? 'bg-ember text-white' : 'bg-stone-surface border border-stone-surface text-ash'"
        >
          <Lock v-if="isMonthLocked" class="w-4 h-4" />
          <Unlock v-else class="w-4 h-4" />
        </div>
        <div>
          <span class="font-bold block text-sm leading-tight text-charcoal">{{ isMonthLocked ? 'Período Trancado' : 'Período Aberto' }}</span>
          <span class="text-[11px] text-ash block mt-0.5 leading-normal">
            {{ isMonthLocked ? 'Lançamentos congelados.' : 'Lançamentos liberados.' }}
          </span>
        </div>
      </div>
      <div class="flex gap-2">
        <Button 
          v-if="isMonthLocked"
          @click="abrirNovoPeriodoModal"
          size="sm"
          variant="primary"
          class="h-9 px-4 text-[11px]"
        >
          🚀 Novo Período
        </Button>
        <Button 
          variant="secondary"
          @click="setMonthLocked(!isMonthLocked)"
          size="sm"
          class="h-9 px-4 text-[11px] border border-stone-surface"
        >
          {{ isMonthLocked ? 'Destrancar' : 'Trancar' }}
        </Button>
      </div>
    </div>

    <!-- Painel de Saldo Real Unificado (Design System Family) -->
    <section class="space-y-6">
      <div class="flex justify-between items-end">
        <div class="space-y-2">
          <SectionLabel>Visão Geral</SectionLabel>
          <h2 class="text-heading font-display text-charcoal">Saldo <span class="text-ember">Unificado</span></h2>
        </div>
        <span class="text-[10px] font-mono uppercase tracking-widest text-ash bg-stone px-3 py-1 rounded-full border border-stone-surface">
          {{ currentMonthName }}
        </span>
      </div>

      <Card class="overflow-hidden relative bg-card shadow-subtle p-8 rounded-cards">
        <div class="space-y-4 relative z-10">
          <div 
            v-for="m in props.membros" 
            :key="m.id" 
            class="group flex justify-between items-center p-4 rounded-xl border border-stone bg-[#fbfaf9] hover:border-ember/30 hover:bg-white transition-all duration-300"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full bg-stone flex items-center justify-center font-display text-lg text-charcoal group-hover:bg-ember group-hover:text-white transition-all">
                {{ m.nome[0] }}
              </div>
              <div>
                <span class="font-bold text-base block text-charcoal">{{ m.nome }}</span>
                <span class="text-[11px] text-ash block mt-0.5">
                  {{ saldosUnificadosAtivos[m.id] > 0.005 ? 'Crédito acumulado' : saldosUnificadosAtivos[m.id] < -0.005 ? 'Débito pendente' : 'Tudo em dia' }}
                </span>
              </div>
            </div>
            <div class="text-right">
              <span :class="['font-display text-xl block', saldosUnificadosAtivos[m.id] > 0.005 ? 'text-meadow' : saldosUnificadosAtivos[m.id] < -0.005 ? 'text-coral-red' : 'text-ash']">
                {{ saldosUnificadosAtivos[m.id] > 0.005 ? '+' : '' }}R$ {{ saldosUnificadosAtivos[m.id]?.toFixed(2).replace('.', ',') }}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </section>
```

- [ ] **Passo 2: Executar testes de sanidade da interface**

Execute: `npm run build`
Esperado: Sucesso absoluto, gerando bundles sem avisos de estilos quebrados.

- [ ] **Passo 3: Salvar alterações na branch**

```bash
git add src/components/ledger/DashboardSaldos.vue
git commit -m "style: refatorar classes do dashboard principal para adotar cores e cartões táteis do Family"
```

---

### Tarefa 5: Refatorar Registros Recentes (`ActivityFeed.vue`)

**Arquivos:**
- Modificar: `src/components/ledger/ActivityFeed.vue`

- [ ] **Passo 1: Atualizar classes estéticas da lista de atividades recentes**

Modifique `src/components/ledger/ActivityFeed.vue` para alinhar com o design Family (usando o cartão tátil com box-shadow interno, badges sutis de tipo de transação com tons adequados e tipografia correta).

Ajuste as linhas 33-103 da seguinte forma:

```vue
<template>
  <Card class="p-8 shadow-subtle bg-card rounded-cards">
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-ember/5 flex items-center justify-center">
          <Clock class="w-5 h-5 text-ember" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-charcoal uppercase tracking-widest">Registros Recentes</h3>
          <p class="text-[10px] text-ash font-semibold uppercase tracking-wider mt-0.5">
            {{ sortedGastos.length }} movimentações
          </p>
        </div>
      </div>
    </div>

    <div v-if="sortedGastos.length === 0" class="text-center py-12 border border-dashed border-stone rounded-xl">
      <p class="text-sm text-ash">Nenhum lançamento no período ativo.</p>
    </div>

    <div v-else class="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
      <div 
        v-for="g in sortedGastos" 
        :key="g.id"
        class="group flex flex-col p-4 rounded-xl border border-stone bg-canvas hover:border-ember/30 transition-all duration-200 space-y-4"
      >
        <div class="flex justify-between items-start gap-4">
          <div class="space-y-1">
            <span class="font-bold text-sm text-charcoal block">{{ g.descricao }}</span>
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span class="text-[10px] font-bold text-ember uppercase tracking-wider">
                {{ g.isLoan ? '🤝 Empréstimo' : g.isSettlement ? '🔄 Acerto' : g.method === 'card' ? '💳 Cartão' : '⚡ Pix' }}
              </span>
              <span class="text-[10px] text-ash">
                • Pago por <strong class="text-charcoal font-semibold">{{ getMembroNome(g.compradorId) }}</strong>
              </span>
            </div>
          </div>
          <div class="text-right">
            <span class="font-display text-lg text-charcoal">
              R$ {{ (g.valorTotal.centavos / 100).toFixed(2).replace('.', ',') }}
            </span>
          </div>
        </div>

        <!-- Ações do Feed -->
        <div class="flex justify-end gap-2 pt-3 border-t border-stone opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            v-if="!g.isSettlement"
            variant="secondary"
            size="sm"
            class="h-8 px-3 text-[10px] border border-stone-surface"
            @click="emit('ajustarGasto', g.id)"
            :disabled="props.isMonthLocked"
          >
            <Edit3 class="w-3.5 h-3.5 mr-1.5" />
            Ajustar
          </Button>
          <Button 
            variant="secondary"
            size="sm"
            class="h-8 px-3 text-[10px] text-coral-red hover:bg-[#fff0f0] border border-transparent"
            @click="handleDelete(g.id)"
            :disabled="props.isMonthLocked"
          >
            <Trash2 class="w-3.5 h-3.5 mr-1.5" />
            Excluir
          </Button>
        </div>
      </div>
    </div>
  </Card>
</template>
```

- [ ] **Passo 2: Verificar o build e commitar**

Execute: `npm run build`
Esperado: Sucesso absoluto.

```bash
git add src/components/ledger/ActivityFeed.vue
git commit -m "style: refatorar registros recentes no feed para usar cartões e cores do Family"
```
