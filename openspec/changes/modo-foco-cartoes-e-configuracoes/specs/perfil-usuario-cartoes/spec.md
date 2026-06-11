## MODIFIED Requirements

### Requirement: Gerenciamento Seguro de Cartões pelo Dono
O sistema SHALL permitir que os cartões de crédito sejam cadastrados e excluídos apenas pelo morador correspondente ao usuário logado, utilizando **cards com profundidade Inset (shadow-subtle)**, preenchendo automaticamente o responsável pelo cartão e impedindo a alteração ou exclusão por terceiros. Adicionalmente, o fluxo de criação ou edição de cartões pessoais SHALL adotar o **Modo Foco (Zen Mode)** dentro do BottomSheet de Configurações, ocultando cabeçalhos de tela, abas e perfis de usuário de modo a maximizar a concentração no formulário, fornecendo um **botão circular de voltar premium** para saída linear e limpa.

#### Scenario: Acessar formulário de cartão em Modo Foco
- **WHEN** o usuário clica no botão "Novo Cartão" ou seleciona um cartão próprio na listagem "Meus Cartões"
- **THEN** o sistema ativa o Modo Foco, oculta o card de perfil, as abas de navegação do perfil e o rodapé do BottomSheet, expandindo o card de cartões e exibindo o formulário de cadastro com o botão de voltar circular premium

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

## ADDED Requirements

### Requirement: Modo Foco no Cadastro Inline de Cartão no Wizard
O sistema SHALL permitir o cadastro inline de novos cartões de crédito durante o fluxo de lançamento de despesas em Modo Foco, ocultando os elementos principais do assistente de gastos (cabeçalho de progresso e rodapé do wizard principal) enquanto o formulário de criação de cartões estiver ativo, permitindo o retorno linear por meio do botão circular de voltar.

#### Scenario: Cadastrar cartão inline no Wizard de Lançamentos
- **WHEN** o usuário escolhe a forma de pagamento "Cartão" no passo 2 do Wizard de Lançamentos e clica em "Cadastrar Novo Cartão"
- **THEN** o sistema oculta o cabeçalho de progresso do Wizard, o rodapé principal do Wizard, exibe o sub-fluxo do formulário de criação de cartões e permite o retorno linear à seleção de cartões por meio de um botão circular de voltar
