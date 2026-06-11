## MODIFIED Requirements

### Requirement: Bloqueio de Navegação Sem Casa Ativa
O sistema SHALL bloquear o acesso à navegação global e à dashboard principal caso o usuário logado não possua nenhuma casa (tenant) ativa ou selecionada, forçando-o a passar pelo fluxo de Seleção de Casa (listagem ou criação).

#### Scenario: Usuário loga pela primeira vez sem casa associada
- **WHEN** o usuário faz login e o sistema detecta que ele não possui nenhuma casa vinculada
- **THEN** o sistema exibe a tela de Seleção de Casa (TenantSelectorScreen) de forma exclusiva e oculta a barra de navegação inferior (Floating Island)

#### Scenario: Usuário escolhe criar uma casa
- **WHEN** o usuário clica em "Criar uma casa nova" na tela de seleção
- **THEN** o sistema transiciona para o Wizard de Onboarding (OnboardingWizard) e oculta a listagem de casas
