# SPDD Analysis: Recuperação de Senha para Usuários Google

## Original Business Requirement
parece que usuarios que criam conta com google não da usar esqueci senha

## Domain Concept Identification

### Existing Concepts (from codebase)
- **Usuario**: Representa a conta de um usuário no sistema (`Usuario` no schema do Prisma). Pode ter sido criado por e-mail/senha ou via autenticação social (Google OAuth).
- **PasswordResetToken**: Representa o token gerado temporariamente para que o usuário possa redefinir ou cadastrar uma senha no sistema (`PasswordResetToken` no schema do Prisma).

### New Concepts Required
- Nenhum novo conceito é necessário.

### Key Business Rules
- **Login Unificado (Vínculo)**: Um usuário com cadastro originado pelo Google OAuth possui `googleId` preenchido e inicialmente `passwordHash` como `null`.
- **Recuperação de Senha**: O fluxo de recuperação de senha deve gerar um token válido de redefinição de senha mesmo que o usuário não possua `passwordHash` cadastrado (e.g. usuários criados via Google OAuth), permitindo que definam uma senha convencional.
- **Sucesso Silencioso**: Por motivos de segurança, se o e-mail pesquisado não existir na base de dados, a requisição deve retornar sucesso sem expor se o e-mail está ou não cadastrado (prevenção contra enumeração de contas).

## Strategic Approach

### Solution Direction
- Modificar o método `forgotPassword` no serviço `AuthService` (`backend/src/auth/auth.service.ts`) para remover a restrição que impede a geração de token de reset se o usuário não possuir um `passwordHash`.
- Com isso, o token de recuperação será gerado e associado ao usuário.
- Ao acessar a rota `/auth/reset-password` e enviar a nova senha e o token válido, o método `resetPassword` atualizará o campo `passwordHash` com o hash da nova senha. A partir de então, o usuário poderá realizar login tanto por e-mail/senha quanto via Google.

### Key Design Decisions
- **Permitir recuperação para Usuário Google**: Remover a cláusula `!user.passwordHash` da validação de elegibilidade do envio do e-mail de recuperação.
  - *Prós*: Usuários Google podem criar uma senha para a conta a qualquer momento, o que permite o login clássico em dispositivos/plataformas onde o Google login não esteja integrado.
  - *Contras*: Usuários mal-intencionados poderiam tentar forçar a redefinição de senha se obtivessem acesso ao e-mail do usuário. Entretanto, esse é o comportamento padrão e esperado de qualquer fluxo de recuperação baseado em e-mail.
  - *Recomendação*: Remover a cláusula e permitir o fluxo normal de reset.

### Alternatives Considered
- **Criar um fluxo específico de 'Definir Senha Inicial' para contas Google**:
  - *Por que foi rejeitado*: Aumentaria a complexidade do sistema adicionando rotas e telas adicionais. O fluxo tradicional de "Esqueci minha senha" já resolve o problema com perfeição e sem overhead de interface.

## Risk & Gap Analysis

### Requirement Ambiguities
- Não há ambiguidades significativas. O fluxo de redefinição de senha por e-mail já valida a identidade enviando o token para o e-mail do usuário cadastrado.

### Edge Cases
- **Tentativa de login clássico pós-redefinição**: Assim que o usuário define uma senha através do fluxo de reset, o campo `passwordHash` é preenchido. O login convencional passará a aceitar suas credenciais, enquanto o Google Login continuará funcionando. Ambos os canais de entrada estarão habilitados.

### Technical Risks
- Nenhum risco técnico identificado. O fluxo existente de geração de token e de atualização de senha suporta nativamente a transição de um `passwordHash` nulo para um preenchido.

### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1 | Permitir solicitar recuperação de senha para e-mails criados com Google | Sim | Será ajustado no `AuthService.forgotPassword` removendo a restrição de passwordHash |
| 2 | Usuário do Google deve conseguir definir uma senha usando o token recebido | Sim | A lógica de `AuthService.resetPassword` já grava o passwordHash no banco |
