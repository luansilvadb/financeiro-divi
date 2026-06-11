## Context

Atualmente, `TenantSelectorScreen.vue` é um arquivo de 650+ linhas que tenta ser uma tela de seleção e um configurador complexo. Isso fere o princípio de responsabilidade única e dificulta a manutenção do fluxo de onboarding. A lógica de persistência e validação está misturada com templates HTML extensos, criando uma "névoa" técnica.

## Goals / Non-Goals

**Goals:**
- Isolar o wizard de onboarding em um componente especializado (`OnboardingWizard.vue`).
- Mover a lógica de estado do onboarding para um ViewModel (`useOnboardingViewModel.ts`).
- Simplificar a `TenantSelectorScreen.vue` para focar em listagem e entrada.
- Unificar o consumo de serviços de tenant através de padrões MVVM.

**Non-Goals:**
- Refatorar o backend ou o esquema do banco de dados.
- Alterar as regras de negócio de criação de casa (como código de convite ou lógica de persistência).
- Implementar novas funcionalidades de produto além da refatoração estrutural.

## Decisions

### 1. Novo ViewModel `useOnboardingViewModel`
Centralizará os estados reativos de `etapaWizard`, `nomeCasa`, `contasSugeridas` e `cartoesCadastro`.
- **Racional**: O estado do onboarding é transiente, complexo e possui regras de validação específicas (ex: "nome da casa não pode ser vazio"). Mantê-lo na View causa poluição visual e técnica.

### 2. Componente Atomizado `OnboardingWizard.vue`
Este componente conterá os templates dos 4 passos do wizard, consumindo o `useOnboardingViewModel`.
- **Racional**: Permite que o fluxo de criação seja testado isoladamente com Vitest e facilita ajustes de UI sem impactar a tela de seleção de casas.

### 3. Orquestração no `App.vue` ou `TenantSelectorScreen.vue`
`TenantSelectorScreen.vue` continuará sendo o ponto de entrada principal quando o usuário não tem casa, mas funcionará como um orquestrador leve:
- Estado `modo === 'inicio'` ou `'entrar'`: Renderiza a listagem/entrada.
- Estado `modo === 'criar'`: Renderiza o `<OnboardingWizard />`.

## Risks / Trade-offs

- **[Risco] Fragmentação de Estado** → **Mitigação**: Garantir que o `useOnboardingViewModel` seja inicializado corretamente e limpo ao cancelar o fluxo.
- **[Risco] Regressão na Persistência** → **Mitigação**: Copiar rigorosamente a lógica de `finalizarWizard` para o novo ViewModel e verificar se todos os repositórios (`contaFixaRepository`, `cartaoRepository`) continuam injetados corretamente via container.
- **[Trade-off] Aumento do número de arquivos** → Aceito em troca de maior manutenibilidade e redução da "névoa" em arquivos gigantes.
