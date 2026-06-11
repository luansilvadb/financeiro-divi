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
O sistema SHALL permitir que os cartões de crédito sejam cadastrados e excluídos apenas pelo morador correspondente ao usuário logado, utilizando **cards com profundidade Inset (shadow-subtle)**, preenchendo automaticamente o responsável pelo cartão e impedindo a alteração ou exclusão por terceiros. Adicionalmente, o fluxo de criação ou edição de cartões pessoais SHALL adotar o **Modo Foco (Zen Mode)** dentro do BottomSheet de Configurações, ocultando cabeçalhos de tela, abas e perfis de usuário de modo a maximizar a concentração no formulário, fornecendo um **botão circular de voltar premium** para saída linear e limpa.

#### Scenario: Acessar formulário de cartão em Modo Foco
- **WHEN** o usuário clica no botão "Novo Cartão" ou seleciona um cartão próprio na listagem "Meus Cartões"
- **THEN** o sistema ativa o Modo Foco, oculta o card de perfil, as abas de navegação do perfil e o rodapé do Bottom Sheet, expandindo o card de cartões e exibindo o formulário de cadastro com o botão de voltar circular premium

#### Scenario: Atribuição dinâmica de cores do cartão no frontend
- **WHEN** o usuário insere o nome do cartão (ex: "Nubank", "C6 Carbon", "Inter") e salva o cartão
- **THEN** o sistema identifica se o nome corresponde a alguma marca conhecida no frontend e aplica a cor correspondente (ex: roxo para Nubank, preto/grafite para C6, laranja para Inter), utilizando essa cor para renderização do card e de seus indicadores, sem necessitar de suporte a cores na API do backend

#### Scenario: Cancelar criação do cartão em Modo Foco
- **WHEN** o usuário clica no botão circular de voltar ou no botão de cancelar no formulário
- **THEN** o sistema oculta o formulário de cadastro, desativa o Modo Foco (restaurando o cabeçalho, as abas de navegação e o card de perfil) e exibe novamente a listagem dos cartões do usuário

#### Scenario: Cadastrar cartão de crédito pessoal com sucesso
- **WHEN** o usuário insere o nome do cartão e o dia de fechamento e clica em confirmar no Modo Foco
- **THEN** o sistema cria o cartão de crédito associando-o automaticamente ao ID do membro do usuário autenticado, atualiza a lista em tempo real, desativa o Modo Foco e retorna à listagem de cartões

#### Scenario: Excluir cartão de crédito próprio
- **WHEN** o usuário clica no botão de exclusão de um cartão de sua propriedade na listagem "Meus Cartões"
- **THEN** o sistema remove o cartão de crédito do banco de dados e atualiza a lista em tempo real com animações suaves

### Requirement: Manutenção do Compartilhamento de Cartões para Lançamentos
O sistema SHALL continuar permitindo que qualquer morador selecione e use qualquer cartão de crédito ativo cadastrado na casa no momento de efetuar um novo lançamento de despesa.

#### Scenario: Selecionar cartão no lançamento
- **WHEN** o usuário inicia o wizard de novo lançamento e escolhe pagar com cartão de crédito
- **THEN** o sistema lista todos os cartões cadastrados e ativos na casa, independentemente de quem seja o dono do cartão

