## Context

O Divi atualmente utiliza um sistema de autenticação simples baseado em `username` e senha (JWT). Este modelo não permite a recuperação de senha caso o usuário a esqueça, e não provê uma "identidade global" amigável (Nome de Exibição) através de múltiplos Tenants (casas). A ausência de e-mail também impede o envio de notificações importantes ou a implementação de segurança aprimorada. 

## Goals / Non-Goals

**Goals:**
- Mudar o modelo `Usuario` no Prisma para suportar `email` e `nome` de exibição.
- Implementar infraestrutura de e-mail transacional (usando `nodemailer` no backend NestJS) focada na recuperação de senha.
- Criar a funcionalidade completa de "Esqueci a Senha": solicitação de reset (gerando token temporário) e o endpoint de confirmação de nova senha.
- Limpar ("Wipe") a tabela atual de Usuários e `MembroCasa` para garantir a consistência do banco desde o dia 1 do novo modelo.
- Atualizar o Frontend (MVVM) para pedir e-mail e nome no cadastro e adaptar as telas para o fluxo de reset de senha.

**Non-Goals:**
- Autenticação via Google/Apple/Social Logins neste momento.
- Notificações de atividades ou relatórios da casa por e-mail (apenas e-mail transacional de senha).
- Manter compatibilidade do banco com usuários sem e-mail (serão deletados nesta intervenção).

## Decisions

1. **Email como Identificador Único:** O `username` atual será totalmente substituído pelo `email` como chave única de login. Rationale: Elimina confusão entre "username" e "nome de exibição" e simplifica o processo de login para o que é padrão na indústria. Alternativa considerada: Manter username e adicionar e-mail como opcional. Foi descartada porque gera manutenção dobrada e atrito no login.
2. **Nodemailer como Provider de Email:** Usaremos o pacote `nodemailer` configurado com SMTP (no caso, com o Zoho/custom domain fornecido pelo usuário via variáveis de ambiente `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).
3. **PasswordResetToken no Banco de Dados:** Criaremos o modelo `PasswordResetToken` com os campos `id`, `email`, `token` (hash ou raw, a decidir) e `expiresAt`. O token será um string seguro de 32 bytes gerado via `crypto.randomBytes()`. Rationale: É mais simples e escalável do que injetar o estado do reset dentro do JWT ou de uma coluna extra no próprio `Usuario`.
4. **Wipe do Banco de Dados:** Uma migration rodará um `DELETE FROM usuarios;` (e por cascade, apagará os perfis membro) ou o próprio dev rodará `npx prisma migrate reset` se estiver local.

## Risks / Trade-offs

- **[Risk] Envio de E-mail Falhar:** Se as credenciais do Zoho estiverem incorretas ou houver block por rate limit, o usuário não consegue recuperar a senha. → Mitigation: Logs adequados no `AuthService` para monitorar falhas do `nodemailer`. Mostrar erro claro no front.
- **[Risk] Migração/Wipe destrutiva:** Perda de dados dos primeiros testadores. → Mitigation: Isso já foi alinhado com os stakeholders como "Opção B - Wipe", que aceitaram como parte da etapa inicial de desenvolvimento do projeto.

## Migration Plan

1. Modificar o `schema.prisma`.
2. Adicionar biblioteca `@nestjs-modules/mailer` ou `nodemailer` diretamente.
3. Criar a nova migration do Prisma e fazer o deploy resetando as tabelas (Wipe).
4. Modificar Controllers/Services de Auth.
5. Ajustar e testar `LoginScreen.vue`.
