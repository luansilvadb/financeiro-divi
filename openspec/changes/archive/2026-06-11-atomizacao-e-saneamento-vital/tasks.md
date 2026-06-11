## 1. Backend: Saneamento e Segregação

- [x] 1.1 Refatorar `FinanceiroController` para injetar serviços de domínio (`MembroService`, `CartaoService`, `LancamentoService`) diretamente, eliminando a dependência do `FinanceiroService` (Proxy).
- [x] 1.2 Segregar a lógica de `salvarGasto` em métodos especializados no `LancamentoService`: `salvarDespesaComum`, `salvarEmprestimo` e `registrarAcerto`.
- [x] 1.3 Validar os novos fluxos através de testes unitários no `LancamentoService`.

## 2. Frontend: Atomização do Wizard

- [x] 2.1 Criar diretório `src/views/components/wizard/` para abrigar os componentes de etapa.
- [x] 2.2 Extrair `StepFlowSelection.vue` do `NovoLancamentoWizard.vue`.
- [x] 2.3 Extrair `StepMemberSelection.vue` (para seleção de Comprador, Emprestador e Tomador).
- [x] 2.4 Extrair `StepValueInput.vue` (incluindo lógica de parcelamento).
- [x] 2.5 Extrair `StepDescriptionInput.vue` (incluindo chips de sugestão).
- [x] 2.6 Extrair `StepSplitSelector.vue` (com lógica de divisão entre membros).
- [x] 2.7 Refatorar `NovoLancamentoWizard.vue` para atuar apenas como orquestrador de estado e navegação.

## 3. Frontend: Saneamento de Dashboard e Inicialização

- [x] 3.1 Unificar ritos de inicialização no `App.vue` no método `assegurarDadosIniciais`, garantindo execução idempotente.
- [x] 3.2 Refatorar filtros e predicados no `useDashboardViewModel.ts` para maior clareza semântica (`isGastoValidoParaSoma`, `isAcertoDeSaldo`).
- [x] 3.3 Remover código morto e comentários obsoletos identificados na fase de ausculta.

## 4. Validação Final

- [x] 4.1 Verificar persistência correta de cada tipo de fluxo no banco de dados.
- [x] 4.2 Confirmar que as notificações via WebSocket continuam funcionando após a refatoração do Controller.
- [x] 4.3 Garantir que a cobertura de testes do Dashboard e Wizard permaneça íntegra.
