## ADDED Requirements

### Requirement: Autenticação via Email
O sistema DEVE permitir que os usuários se registrem e façam login utilizando um endereço de e-mail válido e uma senha, em vez de um username.

#### Scenario: Login com sucesso usando E-mail
- **WHEN** o usuário fornece um e-mail válido e a senha correta no formulário de login
- **THEN** o sistema autentica o usuário, retornando o JWT, e o redireciona para a tela principal

#### Scenario: Cadastro com e-mail já existente
- **WHEN** um novo usuário tenta se registrar com um e-mail que já existe no banco de dados
- **THEN** o sistema exibe uma mensagem de erro indicando que o e-mail já está em uso

#### Scenario: Validação de E-mail incorreto no login
- **WHEN** o usuário tenta logar com uma credencial (e-mail ou senha) incorreta
- **THEN** o sistema exibe uma mensagem de "Credenciais inválidas" sem revelar se o e-mail existe ou não
