## 1. Banco de Dados e Prisma

- [x] 1.1 Atualizar o arquivo `schema.prisma`: alterar `Usuario` (remover `username`, adicionar `email` e `nome`) e criar o modelo `PasswordResetToken`
- [x] 1.2 Gerar e aplicar a migração de reset (`npx prisma migrate dev` para fazer o wipe da base de dados e aplicar o novo schema)

## 2. Backend - Core Auth & Mailer

- [x] 2.1 Instalar dependências para envio de e-mails (`nodemailer` e seus types) no backend
- [x] 2.2 Criar o serviço `MailService` ou configurar o Nodemailer globalmente para envio de e-mails transacionais utilizando SMTP
- [x] 2.3 Atualizar os DTOs em `auth/dto`: modificar `RegisterDto` (email, nome) e `LoginDto` (email)
- [x] 2.4 Refatorar `AuthService` e `AuthController` para utilizar `email` na autenticação (login, cadastro, JWT payload) em vez do `username`
- [x] 2.5 Atualizar a lógica de criação de `MembroCasa` no `AuthService.register()` para utilizar o `Usuario.nome` por padrão

## 3. Backend - Fluxo de Recuperação de Senha

- [x] 3.1 Criar DTOs para o fluxo de reset (`ForgotPasswordDto`, `ResetPasswordDto`)
- [x] 3.2 Implementar método no `AuthService` para gerar token seguro de 32 bytes, salvá-lo no banco (`PasswordResetToken`) com expiração e enviar o link por e-mail via Nodemailer
- [x] 3.3 Implementar método no `AuthService` para validar o token e redefinir o hash da senha
- [x] 3.4 Expor os endpoints `POST /auth/forgot-password` e `POST /auth/reset-password` no `AuthController`
- [x] 3.5 Atualizar (ou criar) testes (unitários/e2e) cobrindo as rotas de auth e o fluxo de recuperação

## 4. Frontend - API Services

- [x] 4.1 Atualizar os métodos de login e register no `TenantSessionService` para enviar `email` e `nome` na chamada API
- [x] 4.2 Adicionar métodos de `forgotPassword(email)` e `resetPassword(token, newPassword)` no `TenantSessionService`

## 5. Frontend - Telas de Autenticação

- [x] 5.1 Refatorar `LoginScreen.vue` e `useLoginViewModel.ts` para capturar "E-mail" e "Nome de Usuário (Exibição)" no lugar de username (apenas Nome no cadastro, e-mail em ambos)
- [x] 5.2 Criar/adicionar UI de "Esqueci a Senha" na `LoginScreen` (ou em nova tela dedicada `ForgotPasswordScreen.vue`)
- [x] 5.3 Criar a tela `ResetPasswordScreen.vue` para capturar o token da URL e solicitar a nova senha
- [x] 5.4 Adicionar as rotas novas no roteador principal (se houver Vue Router) ou gerenciar o estado na View principal
