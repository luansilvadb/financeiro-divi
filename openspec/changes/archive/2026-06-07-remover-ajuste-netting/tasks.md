## 1. Refatoração Visual (Frontend)

- [x] 1.1 Remover a opção visual de "Ajuste" (método `mutual`) em `BottomSheetAcertoCompensacao.vue` e ajustar a exibição do grid CSS para 2 colunas.
- [x] 1.2 Atualizar as variáveis de estado e lógica reativa em `BottomSheetAcertoCompensacao.vue` para limitar a tipagem do método selecionado a `'pix' | 'cash'`.

## 2. Refatoração dos Modelos e Serviços

- [x] 2.1 Ajustar a tipagem do método de acerto em `Gasto.ts` para restringir a criação a `'pix' | 'cash'`, garantindo que `settlementDetails.method` mantenha a leitura de `'mutual'` como fallback para integridade de transações históricas.
- [x] 2.2 Atualizar assinaturas e tipos em `GastoService.ts` e `useDashboardViewModel.ts` para refletir as alterações no fluxo de acertos.

## 3. Testes Automatizados

- [x] 3.1 Revisar e atualizar testes unitários do frontend que referenciem o método `mutual` ou a opção visual "Ajuste".
- [x] 3.2 Executar a suite de testes no frontend para certificar-se de que a build e todas as especificações continuam passando normalmente.
