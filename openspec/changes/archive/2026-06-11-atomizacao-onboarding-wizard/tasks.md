## 1. Fundação e Lógica (ViewModel)

- [x] 1.1 Criar o arquivo `src/viewmodels/useOnboardingViewModel.ts` seguindo o padrão MVVM do projeto.
- [x] 1.2 Mover os estados reativos do wizard (`etapaWizard`, `nomeCasa`, `contasSugeridas`, `cartoesCadastro`) para o ViewModel.
- [x] 1.3 Migrar a função `finalizarWizard` para o ViewModel, injetando `tenantSessionService`, `contaFixaRepository` e `cartaoRepository` via container.
- [x] 1.4 Implementar métodos auxiliares no ViewModel: `avancarPasso`, `voltar`, `adicionarContaCustomizada`, `adicionarCartaoLista` e `removerCartaoLista`.

## 2. Atomização da UI (Componentes)

- [x] 2.1 Criar o componente `src/views/screens/OnboardingWizard.vue`.
- [x] 2.2 Migrar os templates HTML dos 4 passos (Identidade, Contas Fixas, Cartões, Sucesso) de `TenantSelectorScreen.vue` para o novo componente.
- [x] 2.3 Garantir que o estilo visual e as animações (`Transition`, `animate-in`) sejam preservados na migração.
- [x] 2.4 Declarar o evento `emit('concluido')` para notificar o pai quando a casa for selecionada/criada.

## 3. Refatoração da Tela Principal

- [x] 3.1 Remover todo o código morto e templates do wizard de `src/views/screens/TenantSelectorScreen.vue`.
- [x] 3.2 Atualizar `TenantSelectorScreen.vue` para importar e renderizar o componente `<OnboardingWizard />` quando `modo === 'criar'`.
- [x] 3.3 Garantir a limpeza de mensagens de erro e estados ao alternar entre os modos 'inicio', 'criar' e 'entrar'.

## 4. Validação e Testes

- [x] 4.1 Criar teste unitário para `useOnboardingViewModel.ts` verificando a transição de etapas e a validação do nome da casa.
- [x] 4.2 Realizar teste de fumaça manual para confirmar se a criação de casa com contas fixas e cartões continua persistindo corretamente no banco de dados.
