# SPDD Analysis: Google OAuth Sign-In Integration

## Original Business Requirement
Preciso evoluir a experiência de novos usuarios, atualmente o app conta com entrada de email e senha para novos usuarios, hoje vejo a necessidade de conectar com google por exemplo para facilitar e reduzir churn por fricção do proprio usuario ter que ir e criar a conta manualmente.

## Domain Concept Identification

#### Existing Concepts (from codebase)
- **Usuario**: Entidade central de autenticação e perfil — proprietário de credenciais de acesso. Atualmente exige senha local obrigatória (`passwordHash`).
- **MembroCasa**: Ponte entre Usuario e Tenant — define o acesso do usuário em uma casa específica e armazena informações de exibição (nome, avatar) e perfil financeiro.
- **Tenant**: Unidade de organização ou casa — contexto de isolamento de dados multitenant.
- **PasswordResetToken**: Token temporário para recuperação de senha local.

#### New Concepts Required
- **ProvedorAutenticacao**: Conceito lógico que define o método pelo qual o usuário se autenticou (Local ou Google OAuth).
- **UsuarioGoogleId**: Atributo identificador único fornecido pelo Google (sub do payload do ID Token) associado ao Usuário para logins sociais subsequentes.

#### Key Business Rules
- **Cadastro sem Fricção (Just-in-Time Provisioning)**: Se o usuário autenticar-se pelo Google e o e-mail não existir na base de dados, a conta de usuário é criada automaticamente e logada de forma instantânea.
- **Associação de Convites Resiliente**: O cadastro via Google deve preservar o fluxo de onboarding por convite (`inviteCode` e `membroId`). Se o usuário vier de um link de convite, o novo usuário gerado pelo Google deve ser vinculado ao Tenant e ao Membro correspondente.
- **Unificação de Contas por E-mail**: Se o e-mail retornado pelo Google já existir como usuário local, a conta deve ser associada ao identificador do Google e logada, em vez de disparar um erro de conflito, facilitando a reconexão.
- **Login sem Senha**: Usuários que criaram suas contas via Google OAuth não possuem senha local cadastrada e não podem logar pelo fluxo clássico de e-mail/senha a menos que cadastrem uma senha local posteriormente.

## Strategic Approach

#### Solution Direction
- **Fluxo Baseado em ID Token (Frontend-to-Backend)**: O frontend (`LoginScreen.vue`) inicializa o Google Identity Services (GIS), renderiza o botão oficial de login e obtém o ID Token (JWT) do Google com segurança. Este token é transmitido para o backend no endpoint `POST /api/auth/google`.
- **Validação Autônoma no Backend**: O backend valida o ID Token do Google de forma segura contra a API do Google (verificando assinatura, expiração, audiência `aud` e integridade do e-mail), provisionando ou atualizando o usuário conforme necessário.
- **Emissão de Token do App**: Após a validação do Google, o backend gera um token JWT do próprio aplicativo (DIVI), mantendo a arquitetura de autenticação sem estado (Stateless JWT) existente e os guards de autorização intactos.

#### Key Design Decisions
- **Tornar `passwordHash` opcional no Schema**: Alterar a coluna `password_hash` da tabela `usuarios` para opcional (`passwordHash String? @map("password_hash")`).
  * *Trade-off*: Exige atualização de tipos e validações no backend para evitar que logins tradicionais passem sem senha.
  * *Rationale*: Evita a geração de senhas aleatórias "dummy" (que representariam falhas potenciais de segurança ou impediriam o usuário de usar o fluxo de recuperação de senha corretamente).
- **Vinculação de Identidade Direta na Tabela `Usuario`**: Adicionar a coluna opcional `googleId String? @unique` em `usuarios`.
  * *Trade-off*: Simplicidade inicial vs. flexibilidade para múltiplos logins sociais (Apple, Facebook, etc.).
  * *Rationale*: Como o escopo atual é focado apenas no Google, a coluna direta simplifica consultas e a migração de banco de dados, evitando a complexidade de uma tabela relacional de identidades federadas neste momento.
- **Uso do Google Identity Services HTML/JS API**: Integração nativa no frontend sem dependência de wrappers de terceiros pesados ou desatualizados de Vue.
  * *Trade-off*: Exige carregar o script do SDK do Google dinamicamente ou via index.html.
  * *Rationale*: Garante total conformidade com as diretrizes do Google (UX/UI e segurança) e atualização automática de segurança do SDK.

#### Alternatives Considered
- **Fluxo tradicional de Redirecionamento OAuth (Backend-driven)**:
  * *Por que rejeitado*: Exige gerenciar redirecionamentos complexos, sessões temporárias e estado no backend, o que degrada a experiência do usuário em SPAs rápidas e dificulta a portabilidade para aplicativos móveis nativos ou híbridos no futuro.

## Risk & Gap Analysis

#### Requirement Ambiguities
- **Foto de Perfil do Google**: O token do Google fornece uma URL de imagem de perfil (`picture`). O app deve usá-la no avatar do usuário/membro?
  * *Mitigação*: Na criação de um novo membro ou cadastro, se o avatar não estiver definido, a imagem do Google pode ser usada, mas deve ser opcional para respeitar a privacidade e customização do app.
- **E-mails Não Verificados**: O Google permite criar contas com e-mails não verificados em alguns cenários.
  * *Mitigação*: O backend deve validar explicitamente a flag `email_verified: true` contida no payload do ID Token do Google. Se for falso, recusar a autenticação.

#### Edge Cases
- **Tentativa de login por e-mail/senha comum em conta OAuth pura**: Um usuário que se cadastrou com Google tenta digitar seu e-mail e uma senha qualquer no login clássico.
  * *Mitigação*: O backend deve validar se o `passwordHash` é nulo e retornar um erro amigável orientando o usuário a entrar com o Google ou utilizar a recuperação de senha para definir uma senha local.
- **Fluxo de convite com e-mail do Google diferente do e-mail do convite**: O administrador da casa convidou `usuario@trabalho.com`, mas o usuário clica em "Entrar com Google" usando `usuario@gmail.com`.
  * *Mitigação*: Se o usuário usar um e-mail diferente, a associação automática falhará porque o e-mail não coincide com o do MembroCasa criado pelo administrador. Deve-se instruir o usuário na tela de boas-vindas do convite ou validar o vínculo se ele estiver usando o `membroId` explicitamente.

#### Technical Risks
- **Carregamento Assíncrono do SDK do Google**: O script do Google pode sofrer bloqueios por adblockers ou lentidão na rede, fazendo com que o botão não apareça ou fique inativo.
  * *Mitigação*: O frontend deve tratar o ciclo de vida do SDK do Google com estados de carregamento adequados e fornecer alternativas claras (como a entrada clássica por e-mail/senha que permanece operacional).
- **Atualização do Schema do Prisma com Dados Existentes**: Tornar `passwordHash` opcional e adicionar `googleId` em produção.
  * *Mitigação*: A migration do Prisma deve ser testada localmente para garantir compatibilidade com registros existentes (que já possuem senha cadastrada).

#### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1 | Botão "Entrar com Google" no Login e Registro | Sim | Exigirá ajustes no layout premium de `LoginScreen.vue`. |
| 2 | Autenticação e validação segura do ID Token no Backend | Sim | Implementação de novo serviço no backend usando `google-auth-library` ou verificação direta. |
| 3 | Provisionamento automático de conta (Cadastro sem Fricção) | Sim | Alteração de obrigatoriedade no schema Prisma e fluxo de registro no `AuthService`. |
| 4 | Integração com fluxo de Onboarding/Convites | Sim | A lógica de `associarUsuarioAoTenantTx` já existente no backend deve ser reutilizada no fluxo de login do Google. |
| 5 | Vinculação com contas existentes por e-mail | Sim | Tratamento de conflito de e-mail no backend para vincular o `googleId` se a conta já existir. |
