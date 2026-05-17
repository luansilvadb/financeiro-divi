# Design Spec: Migração Estética "Family" (Tailwind v4)

Esta especificação define a migração completa da interface do DIVI para o sistema de design "Family", substituindo a estética Fluent 2/Dark Glassmorphism por uma interface leve, quente e minimalista, baseada no Tailwind CSS v4.

---

## 1. Visão Geral
*   **Conceito:** "Pixar storyboard on cream paper" — fintech que parece um jogo de aventura caloroso.
*   **Base:** Fundo creme (#fbfaf9), tipografia Graphite (#474645) e acentos em Ember Orange (#ff3e00).
*   **Engine:** Upgrade para **Tailwind CSS v4**, utilizando configuração baseada em CSS (`@theme`).

## 2. Tokens de Design (Tailwind v4)

### 2.1. Cores
```css
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
}
```

### 2.2. Tipografia
*   **Display:** Font serifada (Fraunces ou Playfair Display) com tracking `-0.031em`.
*   **UI:** Inter (pesos 400, 500, 600) com tracking progressivamente mais apertado em tamanhos maiores.

### 2.3. Formas e Elevação
*   **Botões:** Pill shape (radius 32px).
*   **Cards:** Radius 10px com **Inset Stone Border** (`box-shadow: var(--color-stone) 0px 0px 0px 1px inset`).
*   **Layout:** Max-width 1200px, gaps verticais de 120-180px entre seções.

## 3. Arquitetura de Implementação

### 3.1. Upgrade de Infraestrutura
1.  Atualizar dependências no `package.json` para Tailwind CSS v4 e o plugin correspondente para Vite.
2.  Substituir `tailwind.config.js` pela configuração nativa no `src/main.css`.

### 3.2. Refatoração do App Shell (`App.vue`)
*   Remover glows ambientais e backdrops translúcidos (Glassmorphism).
*   Aplicar fundo `bg-canvas` no `body`.
*   Reestruturar o cabeçalho para usar a tipografia Display e o estilo minimalista.

### 3.3. Adaptação de Componentes
*   **Cards:** Aplicar `bg-card shadow-subtle` (inset border).
*   **Botões:** Converter para os estilos Pill Dark e Pill Light.
*   **Inputs:** Remover bordas pesadas e sombras; usar bordas stone sutis e focus em Ember.

## 4. Critérios de Sucesso
*   A interface deve ser predominantemente clara e "quente" (creme), nunca branca pura ou escura.
*   Zero dependência do `tailwind.config.js` antigo.
*   Consistência total com o `DESIGN.md` em termos de cores e tipografia.
