## MODIFIED Requirements

### Requirement: Exibição e Edição do Perfil do Usuário
O sistema DEVE permitir que o usuário logado visualize suas informações de perfil (utilizando o **MembroAvatar orgânico**), nome de exibição (com **tipografia Inter Bold**) e nome de usuário, e gerencie sua sessão em uma aba dedicada chamada "Meu Perfil", além de navegar para a aba "Controle de Acesso" utilizando a **navegação Floating Island** para gerenciar as permissões dos moradores da casa.

#### Scenario: Visualizar perfil pessoal
- **WHEN** o usuário clica no avatar do cabeçalho
- **THEN** o sistema exibe o Bottom Sheet do "Perfil do Usuário" na aba "Meu Perfil" com os dados do usuário autenticado, seguindo a estética Family e tipografia Fraunces nos títulos

#### Scenario: Sair da conta (Logout)
- **WHEN** o usuário clica no botão "Sair da Conta" (estilo **Tactile Pill**) dentro da aba "Meu Perfil"
- **THEN** o sistema limpa os dados de sessão e redireciona o usuário para a tela de Login

### Requirement: Gerenciamento Seguro de Cartões pelo Dono
O sistema DEVE permitir que os cartões de crédito sejam cadastrados e excluídos apenas pelo morador correspondente ao usuário logado, utilizando **cards com profundidade Inset (shadow-subtle)**, preenchendo automaticamente o responsável pelo cartão e impedindo a alteração ou exclusão por terceiros.

#### Scenario: Cadastrar cartão de crédito pessoal
- **WHEN** o usuário insere o nome do cartão e o dia de fechamento na aba "Meu Perfil" e clica em "Cadastrar Cartão"
- **THEN** o sistema cria o cartão de crédito associando-o automaticamente ao ID do membro do usuário autenticado, exibindo-o em um card padronizado com o novo design

#### Scenario: Excluir cartão de crédito próprio
- **WHEN** o usuário clica no botão de exclusão de um cartão de sua propriedade na listagem "Meus Cartões"
- **THEN** o sistema remove o cartão de crédito do banco de dados e atualiza a lista em tempo real com animações suaves
