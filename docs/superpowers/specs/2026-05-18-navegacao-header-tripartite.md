# Design Specification: Nova Navegação e Header Tripartite

## 1. Visão Geral
Esta especificação detalha a reestruturação da navegação principal e do cabeçalho do Divi. O objetivo é remover a aba de "Histórico" (substituindo-a por uma navegação temporal dinâmica na Home) e redesenhar o cabeçalho e a barra de navegação inferior (Bottom Nav) para uma estética mais moderna, equilibrada e funcional.

## 2. Mudanças na Navegação Inferior (Bottom Nav)
- **Remoção da aba "Histórico":** A aba de histórico será eliminada da `BottomTabBar.vue`.
- **Novo Layout da Bottom Nav:**
    - A navegação passará a ter apenas duas abas principais: **Hoje** e **Faturas**.
    - O **FAB (Floating Action Button)** para "Novo Lançamento" será movido para o centro da Bottom Nav, em um estilo "docked" (ancorado), saltando levemente para fora da barra.
    - O layout será: `[ Hoje ]  [ FAB Central ]  [ Faturas ]`.

## 3. Novo Header Tripartite (Cabeçalho)
O cabeçalho será redesenhado para seguir uma estrutura de 3 colunas distribuídas horizontalmente:
- **Coluna Esquerda (Seletor de Período):**
    - **Rótulo Superior:** "PERÍODO" em fonte minúscula, bold, cor cinza (`#aaa`), com alto espaçamento entre letras (letter-spacing).
    - **Display do Mês:** Nome do mês atual em destaque (ex: "Junho"), fonte preta (`#1a1a1a`), peso 900, escala grande (~22px-24px).
    - **Indicador de Seleção:** Uma setinha `▾` em vermelho Ember (`#ff5e5e`) ao lado do mês para indicar que é um dropdown/clicável.
    - **Nota:** O ano será exibido apenas dentro do menu de seleção que se abre ao clicar no mês.
- **Coluna Central (Brand):**
    - **Slogan:** "FINANÇAS RESIDENCIAIS" centralizado acima do logo, em fonte minúscula e discreta.
    - **Logo:** "DIVI." centralizado, em fonte Black, peso 900, escala maior que o mês (~30px).
- **Coluna Direita (Ações):**
    - O botão de **Configurações (Settings)** será mantido à direita, em um container circular ou com bordas suaves, equilibrando o peso visual do seletor de mês na esquerda.

## 4. Funcionalidade do Carrossel de Meses
- Como a aba de Histórico foi removida, a troca de períodos (meses anteriores/futuros) será feita através do seletor no Header.
- Ao clicar no Mês (Coluna Esquerda), um `BottomSheet` ou menu de seleção será aberto permitindo ao usuário escolher outros meses/anos.
- A Home (`activeTab === 'hoje'`) reagirá a essa mudança de período, atualizando os Saldos Unificados e o Activity Feed para o mês selecionado.

## 5. Impacto Técnico
- **App.vue:** Atualização da lógica de troca de abas e ajuste no posicionamento do FAB.
- **BottomTabBar.vue:** Remoção do item de histórico e ajuste de CSS para o FAB centralizado.
- **DashboardSaldos.vue / Header:** Implementação do novo componente de header tripartite e integração com a lógica de filtro por período.
- **Testes:** Atualização dos testes de navegação para refletir as novas abas e o comportamento do FAB.