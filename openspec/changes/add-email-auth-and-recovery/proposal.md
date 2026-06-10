## Why

A atual arquitetura de autenticação utiliza apenas um `username`, o que impossibilita a recuperação de senhas perdidas e limita a comunicação com os usuários. Adicionar autenticação baseada em e-mail e uma identidade global (Nome de Exibição) melhora a segurança, introduz o fluxo essencial de "Esqueci a Senha" e prepara o terreno para futuras notificações e integrações.

## What Changes

- O campo `username` será substituído/suplementado pelo `email` para fins de autenticação.
- O cadastro de usuário passará a exigir Email, Nome de Exibição e Senha.
- **BREAKING**: Para simplificar a transição e garantir a consistência dos dados num estágio inicial do projeto, todos os usuários existentes serão removidos do banco de dados (Wipe total da tabela de Usuários).
- Adição da funcionalidade de "Esqueci a Senha" com envio de token de recuperação via e-mail.
- Usuários terão um "Nome de Exibição" global vinculado ao seu `Usuario`, não sendo mais exclusivo por `MembroCasa` de forma isolada, padronizando a identidade através de múltiplos Tenants.

## Capabilities

### New Capabilities
- `auth-email-login`: O usuário deve conseguir realizar login e cadastro informando seu E-mail, Nome de Exibição e Senha.
- `auth-recuperacao-senha`: O usuário deve ser capaz de solicitar um link de recuperação de senha via e-mail e, através deste link, redefinir sua senha com sucesso.
- `perfil-identidade-global`: O usuário tem um Nome de Exibição global que é refletido nas casas (Tenants) em que ele entra.

### Modified Capabilities
- N/A

## Impact

- **Database (Prisma)**: O model `Usuario` será alterado para incluir `email` (unique) e `nome`. O modelo será complementado por uma tabela `PasswordResetToken` para guardar os tokens de recuperação. **ATENÇÃO:** Ocorre um wipe de dados para zerar a base atual de usuários incompatíveis.
- **Backend (NestJS)**:
  - O `AuthService` e o `AuthController` precisarão ser modificados para lidar com e-mail em vez de username no login.
  - Será preciso integrar uma biblioteca de e-mails (`Nodemailer`) e configurar os endpoints de solicitação e reset de senha.
- **Frontend (Vue 3)**:
  - A tela `LoginScreen.vue` precisará ser atualizada para solicitar e-mail e nome de exibição no cadastro, além de suportar a navegação para um fluxo de "Esqueci a senha".
  - Novas telas (ou estados) para recuperação de senha (pedir e-mail e definir nova senha com o token da URL).
- **Isolamento Multi-tenant**: A identidade base `Usuario` é atualizada globalmente. A criação de um `MembroCasa` para um novo tenant irá consumir o `nome` e possivelmente derivar o `avatar` da identidade base.
