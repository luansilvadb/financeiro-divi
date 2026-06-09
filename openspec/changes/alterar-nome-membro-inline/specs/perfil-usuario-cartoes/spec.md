## MODIFIED Requirements

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
