# Padronização Estética Completa Sênior v19 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refinar todos os componentes administrativos, modais, feeds de transações e painéis de revisão restantes do DIVI para garantir 100% de consistência estética sob o padrão 💎 SÊNIOR V19 PREMIUM (Glassmorphism e Glow Dark).

**Architecture:** Mapeamento sistemático de classes CSS utilitárias do Tailwind e injeção do padrão `.glass-card` e `.glass-input` nos templates Vue, mantendo a estrutura lógica, estados de reatividade e manipulação de eventos intactos.

**Tech Stack:** Vue 3, Vite, Tailwind CSS, Lucide Vue, Vitest.

---

### Task 1: Modais e Overlays de Transação e Rateio

**Files:**
*   Modify: `src/components/ledger/ModalConfigurarContaFixa.vue`
*   Modify: `src/components/ledger/PopupLancarContaFixa.vue`
*   Modify: `src/components/ledger/dashboard/ModalDivisaoGasto.vue`
*   Modify: `src/components/ledger/dashboard/ModalFecharFatura.vue`

- [ ] **Step 1: Refatorar ModalConfigurarContaFixa.vue**
    Substituir o backdrop cinza por overlay com blur escuro e o card por glass-card.
    ```vue
    <!-- Substituir overlay anterior por: -->
    <div class="fixed inset-0 bg-[#040814]/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] overflow-y-auto">
      <div class="glass-card w-full max-w-[420px] rounded-3xl p-6 relative space-y-6">
        <!-- Substituir inputs de texto por glass-input -->
        <input 
          type="text" 
          class="w-full px-4 py-3 rounded-2xl glass-input outline-none font-medium" 
          ... 
        />
        <!-- Substituir botões cinzas por botões com glow -->
        <button class="w-full py-4.5 rounded-2xl bg-divi-primary hover:bg-indigo-500 font-bold text-white shadow-[0_0_20px_var(--primary-glow)] transition-all ...">
          Salvar Configurações
        </button>
      </div>
    </div>
    ```

- [ ] **Step 2: Refatorar PopupLancarContaFixa.vue**
    Substituir o container flutuante e o campo numérico pelo design premium.
    ```vue
    <!-- Substituir container por: -->
    <div class="fixed inset-0 bg-[#040814]/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
      <div class="glass-card w-full max-w-[420px] rounded-3xl p-6 space-y-6">
        <!-- Campo monetário sênior-friendly de grande visibilidade -->
        <div class="bg-divi-s1 border border-divi-border rounded-2xl p-4 text-center">
          <span class="text-xs text-divi-t3 uppercase font-black tracking-wider">Valor do Talão</span>
          <input class="w-full text-center text-3xl font-black bg-transparent border-none text-divi-t1 outline-none mt-2" ... />
        </div>
      </div>
    </div>
    ```

- [ ] **Step 3: Refatorar ModalDivisaoGasto.vue**
    Adotar o backdrop transparente com desfoque e inputs no estilo glassmorphism.
    ```vue
    <!-- Substituir classes do template principal por: -->
    <div class="fixed inset-0 bg-[#040814]/85 backdrop-blur-md flex items-end sm:items-center justify-center p-4 z-[9999]">
      <div class="glass-card w-full max-w-[420px] rounded-3xl p-6 space-y-6">
        <!-- Inputs e porcentagens no estilo glass-input -->
      </div>
    </div>
    ```

- [ ] **Step 4: Refatorar ModalFecharFatura.vue**
    Refinar a interface de seleção do membro pagador com avatares com glow neon.
    ```vue
    <!-- Substituir classes por: -->
    <div class="fixed inset-0 bg-[#040814]/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
      <div class="glass-card w-full max-w-[420px] rounded-3xl p-6 space-y-6">
        <!-- Seletor de membros simplificado e de alta legibilidade -->
      </div>
    </div>
    ```

- [ ] **Step 5: Rodar testes funcionais dos modais**
    Executar: `npx vitest run src/components/ledger/`
    Expected: Todos os testes passando perfeitamente sem quebras de lógica de emissão de eventos.

- [ ] **Step 6: Commit**
    ```bash
    git add src/components/ledger/ModalConfigurarContaFixa.vue src/components/ledger/PopupLancarContaFixa.vue src/components/ledger/dashboard/ModalDivisaoGasto.vue src/components/ledger/dashboard/ModalFecharFatura.vue
    git commit -m "style(ui): refatorar modais e overlays para o padrao dark glassmorphism v19"
    ```

---

### Task 2: Activity Feed e Histórico de Faturas

**Files:**
*   Modify: `src/components/ledger/ActivityFeed.vue`
*   Modify: `src/components/ledger/dashboard/HistoricoFaturas.vue`

- [ ] **Step 1: Refatorar ActivityFeed.vue**
    Substituir o bloco de histórico por um container glassmorphism de alta elegância.
    ```vue
    <!-- Substituir container raiz por: -->
    <div class="glass-card rounded-3xl p-6 space-y-4">
      <h3 class="text-lg font-black text-divi-t1 tracking-tight flex items-center gap-2">
        Histórico Recente
      </h3>
      <!-- Linhas individuais de transação -->
      <div class="divide-y divide-divi-border">
        <!-- Cada linha com texto text-divi-t1 e metadados text-divi-t2 -->
      </div>
    </div>
    ```

- [ ] **Step 2: Refatorar HistoricoFaturas.vue**
    Ajustar o histórico de faturas arquivadas (acertos anteriores) para usar accordions escuros translúcidos.
    ```vue
    <!-- Substituir container de fatura fechada por: -->
    <div class="bg-divi-s1/50 border border-divi-border rounded-2xl p-4 ...">
      <!-- Status pago no badge esmeralda translucido -->
      <span class="bg-divi-emerald-dim/15 text-divi-emerald border border-divi-emerald/25 ...">
        Pago
      </span>
    </div>
    ```

- [ ] **Step 3: Executar testes de integração**
    Executar: `npx vitest run src/components/ledger/dashboard/`
    Expected: Passagem limpa de todas as asserções de renderização de faturas.

- [ ] **Step 4: Commit**
    ```bash
    git add src/components/ledger/ActivityFeed.vue src/components/ledger/dashboard/HistoricoFaturas.vue
    git commit -m "style(ui): aplicar identidade premium v19 no activity feed e historico de faturas"
    ```

---

### Task 3: Painéis Administrativos de Membros e Cartões

**Files:**
*   Modify: `src/components/ledger/ConfiguracoesMembros.vue`
*   Modify: `src/components/ledger/ConfiguracoesCartoes.vue`

- [ ] **Step 1: Refatorar ConfiguracoesMembros.vue**
    Modernizar o gerenciamento de membros adicionando inputs de vidro e botões neon.
    ```vue
    <!-- Substituir inputs e botões por: -->
    <input class="w-full px-4 py-3 rounded-2xl glass-input outline-none font-medium" ... />
    <button class="bg-divi-rose-dim/12 text-divi-rose hover:bg-divi-rose-dim/20 border border-divi-rose/20 ...">
      Remover
    </button>
    ```

- [ ] **Step 2: Refatorar ConfiguracoesCartoes.vue**
    Substituir o grid de cartões e inputs pelo padrão uniforme v19.
    ```vue
    <!-- Substituir cards por: -->
    <div class="glass-card rounded-2xl p-5 border border-divi-border bg-gradient-to-b from-divi-s2/20 to-transparent">
      <!-- Metadados do cartao com cores vivas e alta legibilidade -->
    </div>
    ```

- [ ] **Step 3: Validar testes administrativos**
    Executar: `npx vitest run src/components/ledger/ConfiguracoesMembros.test.ts`
    Expected: Passagem com 0 erros.

- [ ] **Step 4: Commit**
    ```bash
    git add src/components/ledger/ConfiguracoesMembros.vue src/components/ledger/ConfiguracoesCartoes.vue
    git commit -m "style(ui): refatorar paineis de configuracao de membros e cartoes sob o design system"
    ```

---

### Task 4: Fluxo de Revisão e Painel de Acertos

**Files:**
*   Modify: `src/components/ledger/dashboard/ListaGastosRevisao.vue`
*   Modify: `src/components/ledger/dashboard/PreviaAcertos.vue`
*   Modify: `src/components/ledger/dashboard/SugestaoAcertos.vue`
*   Modify: `src/components/ledger/dashboard/RevisaoFatura.vue`

- [ ] **Step 1: Refatorar ListaGastosRevisao.vue**
    Refinar a listagem de auditoria fina dos gastos da fatura antes do fechamento.
    ```vue
    <!-- Substituir itens por: -->
    <div class="bg-divi-s1 border border-divi-border rounded-2xl p-4 flex items-center justify-between">
      <!-- Descricao text-divi-t1 e badges de rateio text-divi-t2 -->
    </div>
    ```

- [ ] **Step 2: Refatorar PreviaAcertos.vue**
    Aplicar a tabela de cálculo de consumos de cada membro como cards transparentes individuais de 1 coluna.
    ```vue
    <!-- Grid ajustado para envelope mobile -->
    <div class="grid grid-cols-1 gap-4">
      <!-- Itens de resumo e divida liquida -->
    </div>
    ```

- [ ] **Step 3: Refatorar SugestaoAcertos.vue**
    Converter as sugestões do "quem paga quem" (fluxo Pix) para layouts de alto contraste com setas brilhantes.
    ```vue
    <!-- Pix cards no estilo glow amber -->
    <div class="bg-divi-amber-dim/5 border border-divi-amber/20 rounded-2xl p-4 space-y-2">
      <!-- Badge e dados legiveis da chave Pix -->
    </div>
    ```

- [ ] **Step 4: Refatorar RevisaoFatura.vue**
    Ajustar o container principal da tela de fechamento/revisão para harmonizar com a UI v19.

- [ ] **Step 5: Executar suite completa de testes e build de producao**
    Executar: `npx vitest run` e depois `npm run build`
    Expected: 100% de cobertura operacional operacional e build gerado sem erros.

- [ ] **Step 6: Commit**
    ```bash
    git add src/components/ledger/dashboard/ListaGastosRevisao.vue src/components/ledger/dashboard/PreviaAcertos.vue src/components/ledger/dashboard/SugestaoAcertos.vue src/components/ledger/dashboard/RevisaoFatura.vue
    git commit -m "style(ui): uniformizar fluxo de revisao e calculo de acertos Pix na v19"
    ```
