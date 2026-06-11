## ADDED Requirements

### Requirement: Bloqueio de Navegação Sem Casa Ativa
O sistema SHALL bloquear o acesso à navegação global e à dashboard principal caso o usuário logado não possua nenhuma casa (tenant) ativa ou selecionada, forçando-o a passar pelo fluxo de Seleção de Casa (criar ou entrar).

#### Scenario: Usuário loga pela primeira vez sem casa associada
- **WHEN** o usuário faz login e o sistema detecta que ele não possui nenhuma casa vinculada
- **THEN** o sistema exibe a tela de Seleção de Casa (TenantSelectorScreen) de forma exclusiva e oculta a barra de navegação inferior (Floating Island)
