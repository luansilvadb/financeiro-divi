# Capability: auth-recuperacao-senha

## Purpose
TBD

## Requirements

### Requirement: Solicitação de Recuperação de Senha
O sistema DEVE permitir que um usuário não autenticado solicite a redefinição de sua senha através de seu e-mail, enviando um token de uso único.

#### Scenario: E-mail de recuperação enviado com sucesso
- **WHEN** o usuário informa um e-mail cadastrado na tela de "Esqueci a Senha"
- **THEN** o sistema gera um token no banco de dados, expira em X horas, e envia um link de recuperação para o e-mail fornecido

#### Scenario: E-mail não cadastrado na recuperação
- **WHEN** o usuário informa um e-mail que não existe na base de dados
- **THEN** o sistema age como se o e-mail tivesse sido enviado para evitar vazamento de informações (user enumeration), sem gerar token

### Requirement: Redefinição de Senha com Token
O sistema DEVE permitir a alteração da senha mediante a provisão de um token válido e não expirado.

#### Scenario: Senha redefinida com sucesso
- **WHEN** o usuário acessa o link com o token válido e informa uma nova senha
- **THEN** o sistema atualiza o `passwordHash` no banco, invalida o token usado, e permite o login com a nova senha

#### Scenario: Token expirado ou inválido
- **WHEN** o usuário tenta redefinir a senha com um token que já expirou ou foi usado
- **THEN** o sistema exibe erro de token inválido e sugere solicitar um novo link
