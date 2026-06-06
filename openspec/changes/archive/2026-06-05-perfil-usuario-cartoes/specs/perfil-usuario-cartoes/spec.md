## ADDED Requirements

### Requirement: Exibição e Edição do Perfil do Usuário
O sistema DEVE permitir que o usuário logado visualize suas informações de perfil (avatar, nome de exibição e nome de usuário) e gerencie sua sessão em uma aba dedicada chamada "Meu Perfil".

#### Scenario: Visualizar perfil pessoal
- **WHEN** o usuário clica no avatar do cabeçalho
- **THEN** o sistema exibe o Bottom Sheet do "Perfil do Usuário" na aba "Meu Perfil" com os dados do usuário autenticado

#### Scenario: Sair da conta (Logout)
- **WHEN** o usuário clica no botão "Sair da Conta" dentro da aba "Meu Perfil"
- **THEN** o sistema limpa os dados de sessão e redireciona o usuário para a tela de Login

### Requirement: Gerenciamento Seguro de Cartões pelo Dono
O sistema DEVE permitir que os cartões de crédito sejam cadastrados e excluídos apenas pelo morador correspondente ao usuário logado, preenchendo automaticamente o responsável pelo cartão e impedindo a alteração ou exclusão por terceiros.

#### Scenario: Cadastrar cartão de crédito pessoal
- **WHEN** o usuário insere o nome do cartão e o dia de fechamento na aba "Meu Perfil" e clica em "Cadastrar Cartão"
- **THEN** o sistema cria o cartão de crédito associando-o automaticamente ao ID do membro do usuário autenticado

#### Scenario: Excluir cartão de crédito próprio
- **WHEN** o usuário clica no botão de exclusão de um cartão de sua propriedade na listagem "Meus Cartões"
- **THEN** o sistema remove o cartão de crédito do banco de dados e atualiza a lista em tempo real

### Requirement: Manutenção do Compartilhamento de Cartões para Lançamentos
O sistema DEVE continuar permitindo que qualquer morador selecione e use qualquer cartão de crédito ativo cadastrado na casa no momento de efetuar um novo lançamento de despesa.

#### Scenario: Selecionar cartão no lançamento
- **WHEN** o usuário inicia o wizard de novo lançamento e escolhe pagar com cartão de crédito
- **THEN** o sistema lista todos os cartões cadastrados e ativos na casa, independentemente de quem seja o dono do cartão
