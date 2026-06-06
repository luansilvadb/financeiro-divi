## Context

Atualmente, o aplicativo utiliza o componente `BottomSheet.vue` como base para modais deslizantes. No entanto, o conteúdo interno desses componentes (formulários, listas, detalhes) não segue um padrão rigoroso de espaçamento, tipografia e estilos de botões, resultando em uma experiência visual levemente fragmentada que se desvia das diretrizes do design "Family".

## Goals / Non-Goals

**Goals:**
- Refatorar o componente `BottomSheet.vue` para fornecer melhores padrões (defaults) de layout.
- Auditar e atualizar todos os componentes que utilizam `BottomSheet` para garantir conformidade com o `DESIGN.md`.
- Padronizar o uso de botões "Pill" e tipografia `Inter` dentro dos modais.
- Garantir que o espaçamento interno (padding) seja consistente em todos os casos.

**Non-Goals:**
- Alterar a lógica de negócio dos formulários dentro dos bottom sheets.
- Alterar o comportamento de animação/transição (que já segue o `ease-spring`).
- Adicionar novas funcionalidades aos bottom sheets.

## Decisions

### 1. Centralização do Padding no Componente Base
**Decisão:** Adicionar uma classe de padding padrão (`px-6 pb-8`) ao container de conteúdo do `BottomSheet.vue`, mas permitir sobrescrita via props caso necessário.
**Racional:** A grande maioria dos bottom sheets precisa do mesmo respiro visual. Centralizar isso reduz a repetição de classes utilitárias em cada componente individual.

### 2. Padronização de Cabeçalhos e Divisores
**Decisão:** Reforçar o uso do divisor (`h-px bg-stone`) apenas quando houver cabeçalho e garantir que o título utilize sempre `text-charcoal` e `text-heading`.
**Racional:** Mantém a clareza visual e a separação entre o título da ação e o conteúdo do formulário.

### 3. Migração para Botões do Design System
**Decisão:** Substituir o uso de botões genéricos ou estilos customizados por componentes `Button.vue` (se disponíveis) ou classes Tailwind que repliquem exatamente o comportamento de "Pill" Midnight/Stone.
**Racional:** O design "Family" é muito específico sobre a interatividade dos botões (spring scale, cores Midnight).

## Risks / Trade-offs

- **[Risco]** Quebra de layouts em bottom sheets com conteúdo muito denso ou listas complexas.
  - **Mitigação:** Realizar uma revisão visual de cada componente afetado e utilizar uma prop `padding-less` ou similar para casos excepcionais onde o conteúdo deve ir até a borda (ex: listas com divisores full-width).
- **[Trade-off]** Aumento da rigidez do componente base.
  - **Mitigação:** Manter a flexibilidade através de slots, garantindo que o "wrapper" forneça a consistência necessária.
