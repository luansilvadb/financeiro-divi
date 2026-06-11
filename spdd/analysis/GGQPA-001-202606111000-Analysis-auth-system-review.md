# SPDD Analysis: Review do Sistema de Autenticação

## Original Business Requirement
Análise e revisão técnica do sistema de autenticação existente (Auth) para garantir integridade, segurança e funcionamento correto no fluxo de produção.

## Domain Concept Identification

#### Existing Concepts (from codebase)
- **Usuario**: Entidade central de autenticação e perfil — proprietário de credenciais e associado a múltiplos Tenants.
- **Tenant**: Unidade de organização ou casa — contexto de isolamento de dados multitenant.
- **MembroCasa**: Ponte entre Usuario e Tenant — define o acesso do usuário em uma casa específica.
- **PasswordResetToken**: Conceito temporário para recuperação de senha — garante lifecycle de segurança para redefinição.
- **JWT (JSON Web Token)**: Mecanismo de sessão sem estado — gerencia o contexto de autenticação do cliente.

#### New Concepts Required
- Nenhuma nova entidade requerida nesta fase de revisão.

#### Key Business Rules
- **Autenticação**: Uso de bcrypt para hashing de senhas.
- **Autorização**: Baseada em token JWT, com mecanismos de bypass via decorador @Public.
- **Multitenancy**: O registro de usuário pode vincular automaticamente um membro a um tenant através de inviteCode.

## Strategic Approach

#### Solution Direction
- Auditoria do sistema atual com foco em segurança (process.env.JWT_SECRET) e robustez do fluxo de multitenancy (registro com inviteCode).
- Manter o padrão atual de NestJS (Guards, Strategies, Decorators) por ser idiomaticamente correto e funcional.

#### Key Design Decisions
- **Uso de Passport-JWT**: Trade-off de complexidade vs. padrão de mercado. Recomendado manter devido ao ecossistema NestJS.
- **Lógica de Registro/Convite**: A complexidade atual em `AuthService.register` é necessária para suportar o onboarding multitenant. Trade-off: acoplamento entre AuthService e FinanceiroGateway. Recomendação: monitorar e testar rigorosamente este fluxo.

#### Alternatives Considered
- **Refatoração para Auth externo (Auth0/Firebase)**: Rejeitado. Introduziria latência e custo operacional desnecessários dado o escopo atual.

## Risk & Gap Analysis

#### Requirement Ambiguities
- Não há clareza se a expiração de 60d do JWT está alinhada com a política de segurança da empresa.

#### Edge Cases
- Registro de usuário com código de convite inválido ou expirado.
- E-mail de reset de senha falhando (tratado com catch silencioso, o que pode mascarar problemas operacionais).

#### Technical Risks
- **Segurança**: Dependência direta de `JWT_SECRET` via env. Risco de exposição se o ambiente não estiver blindado.
- **Performance**: Chamadas sequenciais ao Prisma em operações de registro podem ser lentas.

#### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1 | Revisão de Segurança | Yes | Verificar políticas de key rotation |
| 2 | Robustez de Fluxo Auth | Yes | Testes de integração necessários |
