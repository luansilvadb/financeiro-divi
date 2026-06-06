## MODIFIED Requirements

### Requirement: Exibição e Edição do Perfil do Usuário
O sistema DEVE permitir que o usuário logado visualize suas informações de perfil (avatar, nome de exibição e nome de usuário) e gerencie sua sessão em uma aba dedicada chamada "Meu Perfil", além de navegar para a aba "Controle de Acesso" para gerenciar as permissões dos moradores da casa.

#### Scenario: Visualizar perfil pessoal
- **WHEN** o usuário clica no avatar do cabeçalho
- **THEN** o sistema exibe o Bottom Sheet do "Perfil do Usuário" na aba "Meu Perfil" com os dados do usuário autenticado

#### Scenario: Sair da conta (Logout)
- **WHEN** o usuário clica no botão "Sair da Conta" dentro da aba "Meu Perfil"
- **THEN** o sistema limpa os dados de sessão e redireciona o usuário para a tela de Login
