# Design Specification: Remoção da Seção "Próximas Faturas"

## 1. Visão Geral
A funcionalidade "Próximas Faturas" (também exibida como "Gastos Ativos") na tela de Faturas do Dashboard atualmente exibe uma lista de cartões em aberto com os gastos rateados por membro. Após avaliação de UX, concluiu-se que essa funcionalidade gera ruído visual sem agregar valor suficiente ao usuário. O objetivo é remover completamente esta seção visual, mantendo o foco do aplicativo no Feed de Lançamentos e nas Faturas Fechadas.

## 2. Escopo da Remoção
- **UI:** Remoção do bloco `<section>` correspondente a "Próximas Faturas" dentro da visualização `v-show="isFaturas"` no componente `DashboardSaldos.vue`.
- **Estado e Lógica da UI:** Remoção das variáveis reativas e métodos atrelados exclusivamente à visualização desta seção:
  - `faturasExpandidas`
  - `toggleFaturaExpandida`
- **Testes:** Ajuste na suíte de testes `DashboardSaldos.test.ts`. O teste que valida a presença do card de próximas faturas (`it('renderiza o card de proximas faturas...')`) deve ser removido ou alterado para validar sua ausência.

## 3. O que NÃO será alterado
- A propriedade `faturasAbertas` (prop do componente) e a lógica de cálculo subjacente (Saldos Unificados, Netting, Rollover) continuarão intactas. O sistema interno de ledger precisa continuar sabendo quais faturas estão abertas, apenas não exibiremos o bloco visual delas na aba de Faturas.
- A mecânica de trancar/destrancar período, saldos unificados e acertos otimizados permanecem inalterados.

## 4. Impacto Esperado
- Interface mais limpa e focada.
- Redução de complexidade no arquivo `DashboardSaldos.vue`.
- Melhora na legibilidade para o usuário, direcionando a atenção para ações que realmente importam (liquidar faturas fechadas e acertos otimizados).