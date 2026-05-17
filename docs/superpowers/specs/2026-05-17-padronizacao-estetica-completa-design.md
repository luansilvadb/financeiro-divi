# Documento de Especificação de Design: Padronização Estética Completa Sênior v19

## 1. Visão Geral e Objetivos

Este documento formaliza as especificações para a segunda fase da migração estética da plataforma DIVI. O objetivo principal é atingir **consistência visual absoluta de UI/UX** sob o padrão **💎 SÊNIOR V19 PREMIUM** (Glassmorphism e Glow Dark).

Todos os popups, modais, feeds de transações, listas de revisão e painéis de configuração que ainda restavam com estilos antigos (claros, cinzas sólidos ou sem opacidades dinâmicas) serão unificados com a mesma linguagem visual implementada com sucesso no Dashboard e no Wizard de Lançamento.

---

## 2. O Mapeamento do Design System v19

Os componentes estenderão e utilizarão as variáveis cromáticas HSL injetadas no `:root` e as classes utilitárias de Tailwind estendidas no `tailwind.config.js`:

*   **Tema Geral:** Fundo escuro profundo `#07090F` (`bg-divi-bg`).
*   **Envelopes:** `.glass-card` com desfoque de fundo de `40px`, bordas semi-transparentes em 7% de opacidade branca (`border-divi-border`) e sombras intensas.
*   **Campos de Formulário:** `.glass-input` com foco reativo contendo glow indigo (`shadow-[0_0_16px_var(--primary-glow)]`).
*   **Status de Ação:**
    *   **Verde/Esmeralda:** Para itens pagos, liquidados ou acertos concluídos (`text-divi-emerald`, `bg-divi-emerald-dim/15`).
    *   **Amarelo/Âmbar:** Para itens pendentes, aguardando talões ou prazos (`text-divi-amber`, `bg-divi-amber-dim/15`).
    *   **Vermelho/Rose:** Para ações destrutivas ou exclusões (`text-divi-rose`, `bg-divi-rose-dim/12`).

---

## 3. Detalhamento Técnico das Refatorações

### 3.1. Modais de Ação e Overlays
*   `src/components/ledger/ModalConfigurarContaFixa.vue`
*   `src/components/ledger/PopupLancarContaFixa.vue`
*   `src/components/ledger/dashboard/ModalDivisaoGasto.vue`
*   `src/components/ledger/dashboard/ModalFecharFatura.vue`

*   **Ações de Estilo:**
    *   Substituir o backdrop opaco claro/escuro simples por um overlay escuro com blur: `fixed inset-0 bg-[#040814]/80 backdrop-blur-md z-[9999]`.
    *   Converter os cartões centrais em `.glass-card` com cantos `rounded-3xl` e padding generoso.
    *   Todos os campos de texto, números e seletores serão convertidos para `.glass-input`.
    *   Botões de ação seguem os botões com glow (ex: `bg-divi-primary hover:bg-indigo-500 shadow-[0_0_20px_var(--primary-glow)]`).

### 3.2. Feeds e Accordions de Informação
*   `src/components/ledger/ActivityFeed.vue`
*   `src/components/ledger/dashboard/HistoricoFaturas.vue`

*   **Ações de Estilo:**
    *   Transformar o container geral em `.glass-card` com borda e espaçamento fluidos.
    *   Tornar as linhas de itens individuais mais escuras e integradas usando `bg-divi-s1/50 border border-divi-border rounded-2xl`.
    *   Substituir ícones pretos e textos pretos por tons legíveis em cinza e branco (`text-divi-t1` e `text-divi-t2`).

### 3.3. Painéis de Configurações Administrativas
*   `src/components/ledger/ConfiguracoesCartoes.vue`
*   `src/components/ledger/ConfiguracoesMembros.vue`

*   **Ações de Estilo:**
    *   Substituir cabeçalhos e fundos brancos.
    *   Usar os chips de membros no estilo de avatares com bordas e glow neon.
    *   Substituir os botões cinzas e vermelhos pelos equivalentes estéticos premium do design system.

### 3.4. Lista de Rateio e Revisão Fina
*   `src/components/ledger/dashboard/ListaGastosRevisao.vue`
*   `src/components/ledger/dashboard/PreviaAcertos.vue`
*   `src/components/ledger/dashboard/SugestaoAcertos.vue`
*   `src/components/ledger/dashboard/RevisaoFatura.vue`

*   **Ações de Estilo:**
    *   Mesmo em layouts maiores (desktop), a revisão usará o fundo escuro uniforme, os cards imersivos `.glass-card` e o fluxo de acerto com setas estilizadas em degradê de alta fidelidade visual.

### 3.5. Especificações de Tipografia e Alta Densidade (Grid Compacto)
Para atingir o equilíbrio perfeito entre visibilidade de dados e estética premium no mobile-first, os seguintes padrões de espaçamento e tipografia de alta densidade são obrigatórios em todos os componentes refinados:

*   **Paddings Compactos:** Cartões de lista, itens de feed e extratos reduzem o padding de `p-6` (ou `p-4`) para `p-3.5` ou `p-3` no mobile.
*   **Margens Verticais Apertadas:** Em vez de `space-y-3` ou `gap-3`, o fluxo vertical de listas usará `space-y-2` ou `gap-2` para otimizar a área útil da tela.
*   **Hierarquia de Pesos (Apple/Fintech Style):**
    *   Valores numéricos e preços usarão `font-black` (peso 900) para pop imediato.
    *   Títulos principais em `font-bold` (peso 700) com tamanho ajustado para `text-sm` ou `text-xs` nas listas.
    *   Rótulos secundários usarão opacidades de auto-contraste (`text-divi-t2` com `text-[10px]` ou `text-[9px]`) e espaçamento de letras sutil (`tracking-wider`).
*   **Avatares Compactos:** Avatares de membros no feed e listas de rateio passam a ter diâmetro de `32px` (anteriormente `40px`), garantindo que a linha de transação mantenha-se em linha única sem quebras.

---

## 4. Plano de Testes e Validação

Para cada componente editado:
1.  **Garantia Funcional:** Rodar os testes do Vitest (`npx vitest run`) para garantir que os seletores funcionais e eventos emitidos continuem operando perfeitamente (zero quebra física de testes).
2.  **Validação Visual (Vite Dev Server):** Acessar a aplicação localmente e inspecionar os elementos refinados no navegador para atestar a perfeição de espaçamento de 8px entre linhas e alinhamento dos textos em auto-contraste.
3.  **Build de Produção:** Testar a compilação final (`npm run build`) para verificar se nenhuma tipagem TypeScript ou importação foi afetada pelas alterações visuais.

