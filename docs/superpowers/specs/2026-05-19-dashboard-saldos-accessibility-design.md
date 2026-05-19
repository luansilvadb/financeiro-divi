# Especificação de Design: Acessibilidade de Teclado no Seletor de Períodos do DashboardSaldos

Esta especificação detalha as melhorias de acessibilidade via teclado (a11y) e semântica ARIA implementadas no BottomSheet de Histórico e Seleção de Períodos do componente `DashboardSaldos.vue`.

## 1. Problema de UX

No componente `DashboardSaldos.vue`, o seletor de períodos (localizado no cabeçalho e exibido como um BottomSheet de histórico) utiliza contêineres customizados com elementos `div` sem semântica interativa nativa. 
* O dropdown de períodos abertos e a lista de meses arquivados não podem ser focados, navegados ou acionados via teclado.
* Leitores de tela não conseguem identificar o dropdown como um componente interativo (ex: botão ou combobox), nem o estado expandido/colapsado do dropdown.

## 2. Abordagem de Solução (Abordagem B)

Implementar semântica e suporte a teclado nas opções de período usando `role="button"`, `tabindex="0"`, gerenciamento do estado `aria-expanded`, manipulação de eventos de teclado para as teclas `Enter` e `Space` (Espaço), e adição de foco visual baseado nos anéis de foco existentes no projeto.

## 3. Alterações Propostas

### 3.1 Acionador do Dropdown de Meses Abertos
* **Localização:** Linhas 923-940 no arquivo `DashboardSaldos.vue`.
* **Modificação:**
  * Adicionar `role="button"`.
  * Adicionar `tabindex="0"`.
  * Adicionar `:aria-expanded="isDropdownAbertosOpen.toString()"`.
  * Adicionar `@keydown.enter.prevent="isDropdownAbertosOpen = !isDropdownAbertosOpen"`.
  * Adicionar `@keydown.space.prevent="isDropdownAbertosOpen = !isDropdownAbertosOpen"`.
  * Adicionar classes de foco: `focus:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2`.

### 3.2 Itens do Dropdown de Meses Abertos
* **Localização:** Linhas 948-958 no arquivo `DashboardSaldos.vue`.
* **Modificação:**
  * Adicionar `role="button"`.
  * Adicionar `tabindex="0"`.
  * Adicionar `@keydown.enter.prevent="periodoSelecionado = { mes: op.mes, ano: op.ano }; isDropdownAbertosOpen = false; showBottomSheetHistorico = false"`.
  * Adicionar `@keydown.space.prevent="periodoSelecionado = { mes: op.mes, ano: op.ano }; isDropdownAbertosOpen = false; showBottomSheetHistorico = false"`.
  * Adicionar classes de foco: `focus:outline-none focus-visible:ring-2 focus-visible:ring-ember`.

### 3.3 Lista de Meses Arquivados (Fechados)
* **Localização:** Linhas 971-987 no arquivo `DashboardSaldos.vue`.
* **Modificação:**
  * Adicionar `role="button"`.
  * Adicionar `tabindex="0"`.
  * Adicionar `:aria-label="'Selecionar período arquivado ' + item.nome"`.
  * Adicionar `@keydown.enter.prevent="periodoSelecionado = { mes: item.mes, ano: item.ano }; showBottomSheetHistorico = false"`.
  * Adicionar `@keydown.space.prevent="periodoSelecionado = { mes: item.mes, ano: item.ano }; showBottomSheetHistorico = false"`.
  * Adicionar classes de foco: `focus:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2`.

## 4. Critérios de Aceitação e Verificação

1. **Acessibilidade via Teclado:** O usuário deve conseguir focar no botão do dropdown de meses abertos e em cada um dos itens de meses abertos/arquivados usando apenas a tecla `Tab`.
2. **Ativação por Teclado:** Pressionar `Enter` ou `Space` quando o foco estiver no acionador do dropdown deve abrir/fechar o dropdown. Pressionar `Enter` ou `Space` quando o foco estiver em um item de mês deve selecionar o período correspondente e fechar o BottomSheet.
3. **Semântica:** Ferramentas de acessibilidade do navegador e leitores de tela devem ler os botões e itens com a descrição adequada e o estado do dropdown (`aria-expanded`).
4. **Sem Regressões:** O comportamento do mouse (cliques) deve continuar funcionando normalmente.
