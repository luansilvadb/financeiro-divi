## ADDED Requirements

### Requirement: Fluxo de configuração inicial (Wizard)
O sistema DEVE guiar o usuário através de 4 passos obrigatórios para criar uma casa: Nome, Contas Fixas Sugeridas, Cartões de Crédito e Sucesso com Código de Convite.

#### Scenario: Avançar no Wizard
- **WHEN** o usuário preenche o nome da casa e clica em "Continuar"
- **THEN** o sistema DEVE avançar para o passo de seleção de contas fixas

### Requirement: Configuração de Contas Fixas
O sistema DEVE permitir que o usuário selecione contas sugeridas (Aluguel, Luz, etc.) e defina valores (opcional).

#### Scenario: Adicionar conta customizada
- **WHEN** o usuário digita o nome de uma nova conta e confirma
- **THEN** a conta DEVE ser adicionada à lista de seleção do wizard

### Requirement: Cadastro de Cartões no Onboarding
O sistema DEVE permitir a adição de cartões de crédito durante o onboarding.

#### Scenario: Remover cartão da lista
- **WHEN** o usuário clica no ícone de lixeira em um cartão da lista temporária
- **THEN** o cartão DEVE desaparecer da listagem sem ser salvo no banco de dados ainda

### Requirement: Finalização e Persistência
O sistema SÓ DEVE persistir a casa e suas configurações (contas e cartões) ao clicar no botão de finalizar no último passo antes da tela de sucesso.

#### Scenario: Falha na criação
- **WHEN** ocorre um erro de rede durante a finalização
- **THEN** o sistema DEVE exibir uma mensagem de erro e manter o usuário no último passo para tentar novamente
