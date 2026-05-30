# Polimento Estético Alta Densidade Sênior v19 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refinar todos os componentes de extrato, feeds e cartões do DIVI sob a Abordagem 1 (Alta Densidade Estrita, Contraste Fintech e Glassmorphism) mantendo 100% de estabilidade nos testes.

**Architecture:** Reduzir sistematicamente paddings de `p-6` para `p-3.5` / `p-3`, diminuir o espaçamento vertical para `gap-2` / `space-y-2`, adotar fontes ultra-encorpadas `font-black` para valores numéricos, usar avatares compactos de 32px e remover classes legadas em favor do Dark Glassmorphism.

**Tech Stack:** Vue 3, TailwindCSS, CSS Variables, Vitest.

---

### Task 1: ActivityFeed Compacto v19

**Files:**
- Modify: `src/components/ledger/ActivityFeed.vue`
- Test: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`

- [ ] **Step 1: Modificar o template de ActivityFeed.vue**
  Ajustar o padding de `p-4` para `p-3.5` e o espaçamento vertical entre itens de `space-y-3` para `space-y-2`. Compactar avatares para 32px (`w-8 h-8`) e aumentar o contraste dos valores com `font-black`.
  
  Substituir o bloco de template correspondente:
  ```html
  <template>
    <div class="glass-card border border-divi-border rounded-3xl p-3.5 shadow-lg max-w-md mx-auto text-divi-t1">
      <!-- Header -->
      <div class="flex justify-between items-center border-b border-divi-border/40 pb-2 mb-3">
        <h3 class="text-xs font-black uppercase text-divi-t2 tracking-wider flex items-center gap-1.5">
          <span>⚡</span> Atividades Recentes
        </h3>
        <span class="text-[9px] bg-divi-s2 border border-divi-border text-divi-t2 font-bold px-2 py-0.5 rounded-full">
          {{ transacoesExibidas.length }} lançamentos
        </span>
      </div>

      <!-- Empty State -->
      <div v-if="transacoesExibidas.length === 0" class="text-center py-6 text-xs text-divi-t3">
        Nenhuma atividade recente encontrada neste período.
      </div>

      <!-- Feed List -->
      <div v-else class="space-y-2">
        <div 
          v-for="t in transacoesExibidas" 
          :key="t.id"
          class="flex justify-between items-center p-2.5 rounded-2xl bg-divi-s1/30 border border-divi-border/40 hover:border-divi-primary/30 transition-all hover:bg-divi-s1/50"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <!-- Compact Avatar -->
            <div class="w-8 h-8 rounded-full bg-divi-s2 border border-divi-border font-black text-xs text-divi-t1 flex items-center justify-center shrink-0 shadow-sm uppercase">
              {{ t.descricao[0] }}
            </div>
            
            <div class="min-w-0">
              <strong class="text-xs text-divi-t1 font-bold block truncate leading-tight">{{ t.descricao }}</strong>
              <span class="text-[9px] text-divi-t3 block mt-0.5 uppercase tracking-wider font-medium">
                {{ formatarData(t.data) }} • {{ t.tipo === 'GASTO_CARTAO' ? 'Cartão' : 'Conta Fixa' }}
              </span>
            </div>
          </div>

          <div class="text-right shrink-0">
            <strong class="text-xs font-black text-divi-t1 block">R$ {{ (t.valorCentavos / 100).toFixed(2).replace('.', ',') }}</strong>
          </div>
        </div>
      </div>
    </div>
  </template>
  ```

- [ ] **Step 2: Rodar testes de regressão**
  Run: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`
  Expected: PASS

- [ ] **Step 3: Commit**
  ```bash
  git add src/components/ledger/ActivityFeed.vue
  git commit -m "style(ui): refatorar ActivityFeed para alta densidade e tipografia v19"
  ```

---

### Task 2: PreviaAcertos Compacto & Glows Neon

**Files:**
- Modify: `src/components/ledger/dashboard/PreviaAcertos.vue`
- Test: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`

- [ ] **Step 1: Refatorar o template de PreviaAcertos.vue**
  Reduzir paddings de cartões de moradores para `p-3.5`, margens verticais e avatares de moradores do Pix para 32px (`w-8 h-8`), adicionando glows em balanços de crédito.
  
  Substituir o template correspondente:
  ```html
  <template>
    <div class="space-y-4">
      <div class="flex justify-between items-center border-b border-divi-border pb-1.5">
        <span class="text-xs font-black uppercase text-divi-t2 tracking-wider">Prévia de Acertos (Saldos Coletivos)</span>
        <span class="text-[9px] text-divi-primary font-black bg-divi-primary-dim border border-indigo-500/20 px-2 py-0.5 rounded">Reativo</span>
      </div>

      <!-- Tabela de Consumos e Adiantamentos Individuais -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        <div 
          v-for="s in saldosLiquidos" 
          :key="s.id"
          :class="[
            'p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-2.5 glass-card',
            s.id === props.responsavelId ? 'border-divi-primary/40 bg-divi-primary-dim/10' : 'border-divi-border'
          ]"
        >
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-divi-s2 border border-divi-border font-black text-[9px] flex items-center justify-center text-divi-t1 shadow-[0_0_8px_rgba(255,255,255,0.05)]">
                {{ s.nome[0].toUpperCase() }}
              </div>
              <strong class="text-xs text-divi-t1 font-bold">{{ s.nome }}</strong>
            </div>
            <span 
              v-if="s.id === props.responsavelId" 
              class="text-[8px] bg-divi-primary-dim text-divi-primary font-black border border-indigo-500/20 px-1.5 py-0.5 rounded uppercase"
            >
              Quitou Fatura
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-[9px]">
            <div>
              <span class="text-divi-t2 font-medium block">Consumido:</span>
              <strong class="text-divi-t1 font-bold">R$ {{ s.consumo.toFixed(2).replace('.', ',') }}</strong>
            </div>
            <div>
              <span class="text-divi-t2 font-medium block">Adiantado:</span>
              <strong class="text-divi-t1 font-bold">R$ {{ s.antecipado.toFixed(2).replace('.', ',') }}</strong>
            </div>
          </div>

          <div class="pt-1.5 border-t border-divi-border/30 flex justify-between items-center text-[10px]">
            <span class="text-divi-t2 font-bold">Líquido:</span>
            <strong 
              :class="[
                'font-black',
                s.balanco > 0 ? 'text-divi-rose' : s.balanco < 0 ? 'text-divi-emerald text-glow-emerald' : 'text-divi-t3'
              ]"
            >
              {{ s.balanco > 0 ? `Deve R$ ${s.balanco.toFixed(2).replace('.', ',')}` : s.balanco < 0 ? `Crédito R$ ${Math.abs(s.balanco).toFixed(2).replace('.', ',')}` : 'Zerado' }}
            </strong>
          </div>
        </div>
      </div>

      <!-- Fluxo Pix Recomendado (Quem Paga Quem) -->
      <div class="glass-card border border-divi-border text-divi-t1 rounded-3xl p-4 shadow-lg space-y-3">
        <div class="flex items-center gap-2">
          <span class="text-base">💸</span>
          <div>
            <h4 class="text-xs font-black uppercase tracking-wider text-divi-t1">Fluxo do Acerto (Pix)</h4>
            <span class="text-[9px] text-divi-t2 font-bold block mt-0.5">Transferências calculadas para acerto de contas</span>
          </div>
        </div>

        <div v-if="transferenciasPix.length === 0" class="text-center py-3 text-xs text-divi-t2">
          ⚖️ Contas zeradas! Não há necessidade de transferências Pix.
        </div>

        <div class="space-y-2" v-else>
          <div 
            v-for="(t, idx) in transferenciasPix" 
            :key="idx"
            class="flex items-center justify-between bg-divi-s1/30 border border-divi-border/40 p-3 rounded-2xl"
          >
            <!-- Remetente -->
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <div class="w-8 h-8 rounded-full bg-divi-s2 border border-divi-border font-black text-xs text-divi-t1 flex items-center justify-center shrink-0">
                {{ t.deNome[0].toUpperCase() }}
              </div>
              <div class="min-w-0">
                <strong class="text-xs font-bold block truncate leading-tight">{{ t.deNome }}</strong>
                <span class="text-[8px] text-divi-t3 font-medium">envia Pix</span>
              </div>
            </div>

            <!-- Seta com Direção e Valor -->
            <div class="flex flex-col items-center justify-center px-3 shrink-0">
              <span class="text-xs font-black text-divi-amber text-glow-amber">R$ {{ t.valor.toFixed(2).replace('.', ',') }}</span>
              <span class="text-xs tracking-widest text-divi-t3/30 mt-0.5">➔➔➔</span>
            </div>

            <!-- Destinatário -->
            <div class="flex items-center gap-2 flex-1 justify-end min-w-0 text-right">
              <div class="min-w-0">
                <strong class="text-xs font-bold block truncate leading-tight">{{ t.paraNome }}</strong>
                <span class="text-[8px] text-divi-t3 font-medium">recebe Pix</span>
              </div>
              <div class="w-8 h-8 rounded-full bg-divi-s2 border border-divi-border font-black text-xs text-divi-t1 flex items-center justify-center shrink-0">
                {{ t.paraNome[0].toUpperCase() }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  ```

- [ ] **Step 2: Rodar testes**
  Run: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`
  Expected: PASS

- [ ] **Step 3: Commit**
  ```bash
  git add src/components/ledger/dashboard/PreviaAcertos.vue
  git commit -m "style(ui): compactar PreviaAcertos para alta densidade e micro-layouts"
  ```

---

### Task 3: ListaGastosRevisao Compacto v19

**Files:**
- Modify: `src/components/ledger/dashboard/ListaGastosRevisao.vue`
- Test: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`

- [ ] **Step 1: Ajustar template de ListaGastosRevisao.vue**
  Reduzir paddings de cartões de gastos de `p-4` para `p-3`, avatares de compradores para 32px (`w-8 h-8`) e espaçamento geral da listagem para `space-y-2`.
  
  Substituir o template correspondente:
  ```html
  <template>
    <div class="space-y-3">
      <div class="flex justify-between items-center border-b border-divi-border pb-2">
        <span class="text-xs font-black uppercase text-divi-t2 tracking-wider">Itens da Fatura (Extrato)</span>
        <span class="text-[10px] text-divi-t2 font-bold bg-divi-s2 border border-divi-border px-2.5 py-0.5 rounded-full">{{ props.gastos.length }} compras</span>
      </div>

      <div v-if="props.gastos.length === 0" class="text-center py-8 bg-divi-s1/20 rounded-3xl border border-dashed border-divi-border">
        <span class="text-2xl block mb-1">🛒</span>
        <strong class="text-xs text-divi-t2 block">Nenhuma compra registrada nesta fatura.</strong>
      </div>

      <div v-else class="space-y-2">
        <div 
          v-for="g in props.gastos" 
          :key="g.id"
          class="flex justify-between items-center bg-divi-s1/40 border border-divi-border/40 hover:border-divi-primary/30 p-3 rounded-2xl transition-all group hover:bg-divi-s1/60 hover:shadow-[0_0_12px_var(--primary-glow)] duration-150"
        >
          <div class="flex items-center gap-2.5 flex-1 min-w-0">
            <!-- Compact Avatar -->
            <div 
              v-tooltip="getCompradorNome(g.compradorId)"
              class="w-8 h-8 rounded-full bg-divi-primary-dim/20 text-divi-primary font-black text-xs flex items-center justify-center border border-divi-primary/25 shadow-[0_0_8px_var(--primary-glow)] shrink-0"
            >
              {{ getCompradorNome(g.compradorId)[0].toUpperCase() }}
            </div>

            <!-- Dados do Gasto -->
            <div class="min-w-0 flex-1">
              <div class="flex items-baseline gap-2">
                <strong class="text-xs font-bold text-divi-t1 truncate leading-tight">{{ g.descricao }}</strong>
              </div>
              <span class="text-[9px] text-divi-t2 font-medium block mt-0.5">{{ formatarDivisao(g) }}</span>
            </div>
          </div>

          <!-- Valor e Acoes -->
          <div class="flex items-center gap-3 shrink-0">
            <div class="text-right">
              <strong class="text-xs font-black text-divi-t1">R$ {{ (g.valorTotal.centavos / 100).toFixed(2).replace('.', ',') }}</strong>
            </div>

            <button 
              type="button"
              @click="emit('editarRateio', g)"
              class="px-2.5 py-1.5 bg-divi-s2 hover:bg-divi-primary hover:text-white border border-divi-border hover:border-indigo-400/25 rounded-xl text-[9px] font-black text-divi-t2 transition-all active:scale-95 hover:shadow-[0_0_12px_var(--primary-glow)] duration-150"
            >
              ✂️ Ratear
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  ```

- [ ] **Step 2: Rodar testes**
  Run: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`
  Expected: PASS

- [ ] **Step 3: Commit**
  ```bash
  git add src/components/ledger/dashboard/ListaGastosRevisao.vue
  git commit -m "style(ui): unificar ListaGastosRevisao na alta densidade estrita v19"
  ```

---

### Task 4: ItemExtratoCard Dark Glassmorphism v19

**Files:**
- Modify: `src/components/ledger/dashboard/ItemExtratoCard.vue`
- Test: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`

- [ ] **Step 1: Refatorar o template e os estilos de ItemExtratoCard.vue**
  Substituir o template claro legado por um visual espetacular de `.glass-card` com auto-contraste nas cores de crédito/débito e paddings compactos (`p-4` e `p-3`).
  
  Substituir o template inteiro a partir da linha 47:
  ```html
  <template>
    <div class="glass-card border border-divi-border rounded-[24px] shadow-lg relative overflow-hidden flex flex-col mb-3">
      <!-- Borda Semântica Lateral -->
      <div :class="['absolute top-0 left-0 w-1 h-full', 
                     item.valorLiquido.centavos > 0 ? 'bg-divi-emerald' : (item.valorLiquido.centavos === 0 ? 'bg-divi-t3' : 'bg-divi-rose')]"></div>

      <!-- Nível 1: Cabeçalho Compacto -->
      <div class="p-4 pb-3 flex justify-between items-center text-divi-t1">
        <div class="flex-1 min-w-0 pr-3">
          <h2 class="text-sm font-bold text-divi-t1 leading-tight truncate">{{ item.descricao }}</h2>
          <span :class="['inline-flex items-center px-2 py-0.5 rounded-md text-[8px] font-black mt-1.5 uppercase tracking-wider border',
                          item.valorLiquido.centavos > 0 ? 'bg-divi-emerald-dim/15 text-divi-emerald border-divi-emerald/20' : 
                          (item.valorLiquido.centavos === 0 ? 'bg-divi-s2 text-divi-t2 border-divi-border' : 'bg-divi-rose-dim/15 text-divi-rose border-divi-rose/20')]">
            {{ item.valorLiquido.centavos > 0 ? 'CRÉDITO' : (item.valorLiquido.centavos === 0 ? 'NEUTRO' : 'DÉBITO') }}
          </span>
        </div>
        <div class="text-right shrink-0">
          <div :class="['text-lg font-mono font-black tracking-tighter text-glow-indigo', 
                        item.valorLiquido.centavos > 0 ? 'text-divi-emerald text-glow-emerald' : (item.valorLiquido.centavos === 0 ? 'text-divi-t3' : 'text-divi-rose')]">
            {{ item.valorLiquido.centavos > 0 ? '+' : '' }}{{ formatarDinheiro(item.valorLiquido).replace('R$', '').trim() }}
          </div>
          <p class="text-[9px] font-black text-divi-t3 mt-0.5 uppercase tracking-widest">{{ formatDataCurta(item.data) }}</p>
        </div>
      </div>

      <!-- Nível 2: Grid de Fluxo Compactado -->
      <div class="mx-4 py-3 flex border-t border-divi-border/40 text-divi-t1">
        <div class="flex-1 space-y-0.5 pr-3 border-r border-divi-border/30">
          <span class="text-[8px] font-bold text-divi-t2 uppercase tracking-wider">Você Pagou</span>
          <p class="text-xs font-mono font-bold text-divi-t1">{{ formatarDinheiro(item.valorPago) }}</p>
        </div>
        <div class="flex-1 space-y-0.5 pl-4">
          <span class="text-[8px] font-bold text-divi-t2 uppercase tracking-wider">Sua Parte</span>
          <p class="text-xs font-mono font-bold text-divi-t1">{{ formatarDinheiro(item.valorConsumido) }}</p>
        </div>
      </div>

      <!-- Nível 2: Avatares e Botão Detalhes Compacto -->
      <div class="px-4 pb-4 flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <div class="flex -space-x-1.5">
            <div v-for="pagador in pagamentosDetalhados.slice(0, 3)" :key="pagador.nome"
                 class="w-6 h-6 rounded-full bg-divi-s2 border border-divi-border flex items-center justify-center text-[9px] font-black text-divi-t1 uppercase">
              {{ pagador.nome.substring(0, 1) }}
            </div>
          </div>
          <span v-if="pagamentosDetalhados.length > 3" class="text-[8px] font-bold text-divi-t3">
            +{{ pagamentosDetalhados.length - 3 }}
          </span>
        </div>
        <button @click="toggleDetails" 
                class="flex items-center gap-1 py-1 px-3 rounded-full bg-divi-s2 hover:bg-divi-s3 text-[8px] font-black text-divi-t2 border border-divi-border transition-all active:scale-95">
          {{ isExpanded ? 'OCULTAR' : 'DETALHES' }}
          <svg :class="['w-2.5 h-2.5 transition-transform', isExpanded ? 'rotate-180' : '']" 
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M19 9l-7 7-7-7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- Nível 3: Auditoria Compacta -->
      <div v-if="isExpanded" class="bg-divi-s1/20 border-t border-divi-border/40 p-4 space-y-3 text-divi-t1">
        <div class="flex justify-between items-center border-b border-divi-border/30 pb-2">
          <span class="text-[9px] font-black text-divi-t2 uppercase tracking-wider">Total Bruto da Nota</span>
          <span class="text-xs font-mono font-black text-divi-t1">{{ formatarDinheiro(item.transacao.total) }}</span>
        </div>

        <div class="space-y-2.5">
          <div v-for="p in pagamentosDetalhados" :key="p.nome" class="flex items-center gap-2.5">
            <div class="w-6 h-6 rounded-full bg-divi-s2 flex items-center justify-center text-[9px] font-black text-divi-t1 border border-divi-border shadow-sm uppercase">
              {{ p.nome.substring(0, 1) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between text-[10px] font-bold text-divi-t1">
                <span class="truncate pr-2">{{ p.nome }}</span>
                <span class="text-divi-t2 shrink-0">Parte: {{ formatarDinheiro(p.valor) }}</span>
              </div>
              <div class="text-[8px] text-divi-t3 mt-0.5">
                {{ p.valor.centavos > 0 ? 'Contribuiu no pagamento' : 'Não contribuiu no pagamento' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Rodapé: Saldo Acumulado -->
      <div :class="['px-4 py-2 flex justify-between items-center border-t border-divi-border/30', 
                     item.valorLiquido.centavos > 0 ? 'bg-divi-emerald-dim/5' : 
                     (item.valorLiquido.centavos === 0 ? 'bg-divi-s1/5' : 'bg-divi-rose-dim/5')]">
        <span :class="['text-[9px] font-black uppercase tracking-wider', 
                        item.valorLiquido.centavos > 0 ? 'text-divi-emerald/60' : (item.valorLiquido.centavos === 0 ? 'text-divi-t2/55' : 'text-divi-rose/60')]">
          Saldo pós lançamento
        </span>
        <div :class="['text-xs font-mono font-black', 
                       item.saldoAcumulado.centavos > 0 ? 'text-divi-emerald text-glow-emerald' : (item.saldoAcumulado.centavos === 0 ? 'text-divi-t3' : 'text-divi-rose')]">
          {{ item.saldoAcumulado.centavos > 0 ? '+' : '' }}{{ formatarDinheiro(item.saldoAcumulado) }}
        </div>
      </div>
    </div>
  </template>
  ```

- [ ] **Step 2: Rodar testes**
  Run: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`
  Expected: PASS

- [ ] **Step 3: Commit**
  ```bash
  git add src/components/ledger/dashboard/ItemExtratoCard.vue
  git commit -m "style(ui): refatorar ItemExtratoCard para visual premium escuro v19"
  ```

---

### Task 5: CardSaldoMembro Glassmorphism

**Files:**
- Modify: `src/components/ledger/dashboard/CardSaldoMembro.vue`
- Test: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`

- [ ] **Step 1: Refatorar CardSaldoMembro.vue**
  Converter o container de moradores para `.glass-card` com cores HSL e glows táteis neon.
  
  Substituir o template a partir da linha 18:
  ```html
  <template>
    <div class="rounded-2xl overflow-hidden border border-divi-border glass-card mb-3 text-divi-t1">
      <div 
        @click="$emit('toggle')"
        :class="['flex items-center justify-between p-3.5 cursor-pointer transition-colors', isExpanded ? 'bg-divi-primary-dim/15' : 'hover:bg-divi-s1/30']"
      >
        <div class="flex items-center gap-2.5">
          <div :class="['p-2 rounded-full border', saldo.centavos >= 0 ? 'bg-divi-emerald-dim/15 text-divi-emerald border-divi-emerald/20 shadow-[0_0_8px_var(--emerald-glow)]' : 'bg-divi-rose-dim/15 text-divi-rose border-divi-rose/20']">
            <User class="w-4 h-4" />
          </div>
          <span class="text-xs font-bold text-divi-t1">{{ nome }}</span>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-right">
            <div :class="['font-black text-sm font-mono', saldo.centavos >= 0 ? 'text-divi-emerald text-glow-emerald' : 'text-divi-rose']">
              {{ saldo.centavos > 0 ? '+' : '' }}{{ formatarDinheiro(saldo) }}
            </div>
          </div>
          <component :is="isExpanded ? ChevronUp : ChevronDown" class="w-3.5 h-3.5 text-divi-t2" />
        </div>
      </div>
      
      <div v-if="isExpanded" class="bg-divi-s1/10 border-t border-divi-border/40 p-3.5 space-y-3">
        <slot name="details" />
      </div>
    </div>
  </template>
  ```

- [ ] **Step 2: Rodar testes**
  Run: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`
  Expected: PASS

- [ ] **Step 3: Commit**
  ```bash
  git add src/components/ledger/dashboard/CardSaldoMembro.vue
  git commit -m "style(ui): refatorar CardSaldoMembro para dark glassmorphism v19"
  ```

---

### Task 6: Validação de Estabilidade & Build de Produção

- [ ] **Step 1: Executar a suíte de testes globais**
  Run: `npx vitest run`
  Expected: Todos os 115 testes passam com sucesso.

- [ ] **Step 2: Executar build de produção**
  Run: `npm run build`
  Expected: Sucesso total sem erros de compilação ou TypeScript.

- [ ] **Step 3: Commit de encerramento**
  ```bash
  git commit --allow-empty -m "style(ui): concluir polimento de alta densidade e tipografia v19 premium"
  ```
