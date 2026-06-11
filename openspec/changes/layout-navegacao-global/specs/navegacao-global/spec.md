## ADDED Requirements

### Requirement: Estrutura da Barra de Navegação Inferior
O sistema DEVE prover uma barra de navegação global com 4 ações principais dispostas ao redor de 1 FAB centralizado, na seguinte ordem lógica: Casas, Hoje, FAB (+), Faturas e Perfil.

#### Scenario: Transitar entre as abas principais
- **WHEN** o usuário toca nas abas "Hoje", "Faturas" ou "Perfil"
- **THEN** o sistema atualiza a visão principal para a tela correspondente de forma instantânea sem recarregar a página

### Requirement: Troca Rápida de Casa via Bottom Sheet
O sistema DEVE permitir que o usuário gerencie e troque o seu contexto (Tenant ativo) sem perder a referência da tela que estava navegando.

#### Scenario: Abrir o seletor de casas na navegação
- **WHEN** o usuário toca na opção "Casas" da barra de navegação inferior
- **THEN** o sistema abre um Bottom Sheet contendo a lista de suas casas (TenantSelector) mantendo a tela atual escurecida no fundo

#### Scenario: Trocar de casa através do Bottom Sheet
- **WHEN** o usuário seleciona uma casa diferente no Bottom Sheet
- **THEN** o sistema fecha o Bottom Sheet, atualiza o Tenant ativo, e recarrega os dados (viewmodels) mantendo o usuário na mesma aba que estava (ex: "Faturas")
