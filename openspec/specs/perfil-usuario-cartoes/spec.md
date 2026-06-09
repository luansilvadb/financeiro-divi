# perfil-usuario-cartoes Specification

## Purpose
Implementar a visualização e edição das configurações pessoais dos moradores, incluindo o perfil e seus cartões de crédito associados, com foco na identidade Family e segurança de dados.
## Requirements
### Requirement: Exibição e Edição do Perfil do Usuário
O sistema SHALL permitir que o usuário logado visualize e edite suas informações de perfil (utilizando o **MembroAvatar orgânico** e permitindo alterar o nome de exibição inline), e gerencie sua sessão em uma aba dedicada chamada "Meu Perfil", além de navegar para a aba "Controle de Acesso" utilizando a **navegação Floating Island** para gerenciar os moradores da casa.

#### Scenario: Visualizar perfil pessoal
- **WHEN** o usuário clica no avatar do cabeçalho
- **THEN** o sistema exibe o Bottom Sheet do "Perfil do Usuário" na aba "Meu Perfil" com os dados do usuário autenticado, seguindo a estética Family e tipografia Fraunces nos títulos

#### Scenario: Sair da conta (Logout)
- **WHEN** o usuário clica no botão "Sair da Conta" (estilo **Tactile Pill**) dentro da aba "Meu Perfil"
- **THEN** o sistema limpa os dados de sessão e redireciona o usuário para a tela de Login

#### Scenario: Habilitar modo de edição do nome
- **WHEN** o usuário clica no ícone de edição (lápis) ao lado de seu nome na aba "Meu Perfil"
- **THEN** o sistema oculta a exibição do nome de texto estático e exibe um campo de entrada de texto (input) contendo o nome atual focado e com botões de confirmar (✓) e cancelar (✗)

#### Scenario: Cancelar edição do nome
- **WHEN** o usuário clica no botão de cancelar (✗) com o campo de edição ativo
- **THEN** o sistema cancela as alterações, oculta o campo de entrada e restaura a visualização do nome original estático

#### Scenario: Confirmar edição do nome com sucesso
- **WHEN** o usuário insere um nome válido no campo de edição e clica no botão de confirmar (✓)
- **THEN** o sistema salva o novo nome de exibição no repositório, oculta o campo de entrada, exibe um Toast de sucesso "Nome atualizado com sucesso" e atualiza em tempo real todas as instâncias do nome do usuário na aplicação

#### Scenario: Tentar salvar nome vazio ou inválido
- **WHEN** o usuário apaga todo o texto do campo de edição ou insere apenas espaços e clica em confirmar (✓)
- **THEN** o sistema impede a requisição de salvamento, mantém o campo de edição ativo e exibe um Toast de erro correspondente

### Requirement: Gerenciamento Seguro de Cartões pelo Dono
O sistema SHALL permitir que os cartões de crédito sejam cadastrados e excluídos apenas pelo morador correspondente ao usuário logado, utilizando **cards com profundidade Inset (shadow-subtle)**, preenchendo automaticamente o responsável pelo cartão e impedindo a alteração ou exclusão por terceiros.

#### Scenario: Cadastrar cartão de crédito pessoal
- **WHEN** o usuário insere o nome do cartão e o dia de fechamento na aba "Meu Perfil" e clica em "Cadastrar Cartão"
- **THEN** o sistema cria o cartão de crédito associando-o automaticamente ao ID do membro do usuário autenticado, exibindo-o em um card padronizado com o novo design

#### Scenario: Excluir cartão de crédito próprio
- **WHEN** o usuário clica no botão de exclusão de um cartão de sua propriedade na listagem "Meus Cartões"
- **THEN** o sistema remove o cartão de crédito do banco de dados e atualiza a lista em tempo real com animações suaves

### Requirement: Manutenção do Compartilhamento de Cartões para Lançamentos
O sistema SHALL continuar permitindo que qualquer morador selecione e use qualquer cartão de crédito ativo cadastrado na casa no momento de efetuar um novo lançamento de despesa.

#### Scenario: Selecionar cartão no lançamento
- **WHEN** o usuário inicia o wizard de novo lançamento e escolhe pagar com cartão de crédito
- **THEN** o sistema lista todos os cartões cadastrados e ativos na casa, independentemente de quem seja o dono do cartão

