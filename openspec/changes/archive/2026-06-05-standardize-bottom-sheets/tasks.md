## 1. Preparação e Componente Base

- [x] 1.1 Auditar o componente `BottomSheet.vue` para identificar oportunidades de melhoria no layout padrão.
- [x] 1.2 Adicionar uma prop `contentClass` ou similar ao `BottomSheet.vue` para permitir injeção de classes de layout no container de conteúdo.
- [x] 1.3 Aplicar o padding padrão (`px-6 pb-8`) no `BottomSheet.vue` e garantir que o divisor de cabeçalho siga as diretrizes.

## 2. Padronização dos Componentes de Ledger

- [x] 2.1 Refatorar `BottomSheetAjustarGasto.vue`: ajustar espaçamentos e botões.
- [x] 2.2 Refatorar `BottomSheetConfigurarContaFixa.vue`: ajustar formulário e ações.
- [x] 2.3 Refatorar `BottomSheetConfirmacaoEstorno.vue`: garantir estilo de confirmação visual.
- [x] 2.4 Refatorar `PopupLancarContaFixa.vue`: padronizar campos de entrada e botões.
- [x] 2.5 Refatorar `BottomSheetAcertoCompensacao.vue`: alinhar com o design system.
- [x] 2.6 Refatorar `BottomSheetCasas.vue`: ajustar lista de casas e seleção.
- [x] 2.7 Refatorar `BottomSheetHistorico.vue`: garantir que a lista de histórico use tipografia correta.
- [x] 2.8 Refatorar `BottomSheetNovoPeriodo.vue`: ajustar formulário de criação de período.

## 3. Padronização em Telas e Gerenciadores

- [x] 3.1 Refatorar `ConfiguracoesCartoes.vue`: ajustar bottom sheets internos de edição de cartão.
- [x] 3.2 Refatorar `ConfiguracoesMembros.vue`: ajustar os diversos bottom sheets de gestão de membros.
- [x] 3.3 Revisar `DashboardModalsManager.vue` para garantir que a passagem de props para os modais esteja correta.

## 4. Verificação e Testes

- [x] 4.1 Executar os testes unitários do `BottomSheet.test.ts`.
- [x] 4.2 Verificar se as mudanças não introduziram regressões visuais em telas com scroll.
- [x] 4.3 Validar a acessibilidade básica (cores de contraste e foco nos botões).
