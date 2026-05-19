# Especificação de Design: Evolução UI/UX do Botão de Configuração Geral

Este documento detalha a evolução visual e interativa do botão de configurações do cabeçalho principal no aplicativo DIVI, alinhando-o com a linguagem minimalista do datepicker e garantindo a usabilidade e acessibilidade em dispositivos móveis.

---

## 1. Contexto e Motivação
O botão de configurações geral atual no `DashboardSaldos.vue` possui uma moldura cinza com borda (`bg-stone/30 hover:bg-stone/50 border border-stone/20 rounded-2xl`), o que cria um ruído visual no cabeçalho e não se alinha perfeitamente à linguagem fluida e de grupo adotada pelo datepicker no lado esquerdo. 
Esta evolução remove esses elementos supérfluos, adotando uma abordagem de ícone puro de 24px com mudança de cor sutil para Ember ao interagir, mantendo uma área de toque apropriada de 44px para dispositivos móveis.

---

## 2. Especificação Técnica e Visual

### 2.1 Estrutura HTML/Vue
No componente `src/components/ledger/DashboardSaldos.vue` (linhas 483-490), o botão será reestruturado para remover a moldura cinza e o tamanho de ícone antigo:

* **Contêiner (botão):**
  - Fundo transparente: `bg-transparent` (ou remoção de `bg-stone/30` e `hover:bg-stone/50`).
  - Sem bordas: remoção de `border border-stone/20`.
  - Área física expandida: `w-11 h-11` (44px) para fins de touch target e centralização via flex.
  - Foco de Acessibilidade: `focus:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2`.
  - Transições: `transition-all duration-200`.

* **Ícone Interno (Settings):**
  - Componente Lucide: `<Settings class="..." />`
  - Tamanho: Ajustado de `w-5 h-5` para `w-6 h-6` (24px) para melhor peso visual proporcional.
  - Classe de Cor e Efeitos: `text-ash group-hover:text-ember transition-colors duration-200`.

### 2.2 Comportamento de Interação (Hover/Focus)
* **Hover (Mouse) / Active (Toque):**
  - O ícone transiciona de sua cor base `text-ash` (`#848281`) diretamente para a cor `text-ember` (`#ff3e00`).
  - **Sem rotação:** O ícone permanece estático, mudando apenas sua cor de forma suave.
* **Acessibilidade (Teclado):**
  - O anel de foco em Ember será exibido apenas quando o elemento for navegado por teclado (`focus-visible`).

---

## 3. Critérios de Aceitação e Testes

### 3.1 Critérios Visuais
* O botão de engrenagem no canto superior direito não deve conter mais fundos cinzas ou bordas sólidas.
* O tamanho do ícone de engrenagem deve ser de 24px (`w-6 h-6`).
* Ao passar o mouse sobre o botão, o ícone deve transicionar suavemente para Ember (`#ff3e00`).
* Não deve ocorrer rotação ou deslocamento espacial do ícone durante o hover.

### 3.2 Acessibilidade & Semântica
* O botão deve reter o atributo `aria-label="Configurações"` e `title="Configurações"`.
* O botão deve ser navegável via teclado (`Tab`) e possuir anel de foco visível.

### 3.3 Testes Automatizados
* Garantir que os testes existentes em `DashboardSaldos.vue` ou `App.test.ts` relacionados a disparar as configurações através do clique continuem passando normalmente.
