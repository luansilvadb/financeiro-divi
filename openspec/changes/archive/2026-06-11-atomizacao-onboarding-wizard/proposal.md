## Why

Atualmente, a tela `TenantSelectorScreen.vue` sofre de alta entropia, misturando a seleção de casas com um wizard complexo de 4 passos para criação de moradias. Isso cria uma "névoa" cognitiva e técnica, dificultando a manutenção e violando o princípio de responsabilidade única. A atomização é necessária para tornar o processo de onboarding testável, isolado e visualmente consistente.

## What Changes

- **Extração do Onboarding Wizard**: Todo o fluxo de 4 passos (Nome, Contas Fixas, Cartões, Sucesso) será movido de `TenantSelectorScreen.vue` para um componente dedicado `OnboardingWizard.vue`.
- **Criação do ViewModel de Onboarding**: Introdução de `useOnboardingViewModel.ts` para gerenciar o estado e a lógica de criação de casas, desonerando a View.
- **Isolamento de Seleção de Casa**: `TenantSelectorScreen.vue` passará a focar exclusivamente na listagem e entrada em casas existentes.
- **Unificação de Lógica de Criação**: A lógica de criação de casas será padronizada para usar o `useCasasMultitenant` ou o novo ViewModel, eliminando chamadas diretas ao service na View.

## Capabilities

### New Capabilities
- `onboarding-criacao-casa`: Gerenciamento do fluxo inicial de configuração de uma nova moradia (Wizard).

### Modified Capabilities
- `navegacao-global`: Ajuste no fluxo de entrada do usuário para separar claramente "Seleção" de "Criação/Configuração".

## Impact

- **Frontend (Vue 3)**:
  - `src/views/screens/TenantSelectorScreen.vue`: Reduzido para focar apenas em listagem e entrada por convite.
  - `src/views/screens/OnboardingWizard.vue`: Novo componente isolando o fluxo de 4 passos.
  - `src/viewmodels/useOnboardingViewModel.ts`: Novo ViewModel para orquestrar o estado complexo do onboarding.
- **APIs & Backend**: Nenhum impacto imediato; a refatoração é puramente arquitetural no frontend.
