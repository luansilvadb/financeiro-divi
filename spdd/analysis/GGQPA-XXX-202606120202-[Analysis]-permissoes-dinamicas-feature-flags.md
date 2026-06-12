# SPDD Analysis: Design de Permissões Dinâmicas de Moradores como Feature Flags

## Original Business Requirement

> /spdd-analysis para facilitar a manutenção precisamos atomizar as permissões como feature flags para que o proprio admin na ui consiga configurar

---

## Domain Concept Identification

### Existing Concepts (from codebase)

- **Tenant (Moradia)**: Agrupamento isolado onde residem membros, cartões, faturas e gastos compartilhados.
- **Role (ADMIN / MORADOR / VISUALIZADOR)**: Papel estático do membro na moradia.
- **MembroCasa**: Relação de um usuário com o Tenant correspondente.
- **Restrição de Acesso (RBAC)**: Proteção estática das rotas financeiras do backend e desativação visual de elementos no frontend.

### New Concepts Required

- **Feature Flags de Permissões (Tenant Permissions)**: Configurações dinâmicas a nível de Tenant (moradia) que definem quais operações os moradores comuns (`Role.MORADOR`) podem realizar.
- **Painel de Configuração da Casa (House Settings UI)**: Interface visual restrita ao `ADMIN` para ativar/desativar as chaves (toggles) das permissões dinâmicas da moradia.

### Key Business Rules

- **Soberania do Admin na Configuração**: Apenas o membro com a Role `ADMIN` pode visualizar e alterar as Feature Flags de permissão da moradia.
- **Autonomia Padrão**: Por padrão, ao criar um novo Tenant, todas as Feature Flags de permissão para moradores devem vir ativadas (`true`), mantendo o princípio de alta colaboração do DIVI.
- **Escopo do Visualizador**: As Feature Flags controlam exclusivamente os privilégios dos moradores comuns (`MORADOR`). O `VISUALIZADOR` continua sendo estritamente somente leitura em qualquer cenário (não sendo afetado pelas flags).
- **Validação de Retaguarda**: O backend deve validar de forma dinâmica a Feature Flag correspondente no banco ao interceptar qualquer operação de alteração financeira feita por um `MORADOR`.

---

## Strategic Approach

### Solution Direction

Para evitar a rigidez de permissões duramente codificadas e facilitar futuras manutenções sem precisar refatorar as Roles e o Guard, as permissões serão atomizadas em chaves booleanas armazenadas em um único campo do tipo `Json` na entidade `Tenant`. 

As permissões a serem atomizadas são:
1. `ALLOW_MORADOR_LANCAR_GASTO` (Lançar despesas comuns e parceladas)
2. `ALLOW_MORADOR_GERENCIAR_CARTOES` (Adicionar e excluir seus cartões)
3. `ALLOW_MORADOR_GERENCIAR_CONTAS_FIXAS` (Cadastrar e agendar contas recorrentes)
4. `ALLOW_MORADOR_REGISTRAR_NETTING` (Registrar pagamento de acertos/netting)
5. `ALLOW_MORADOR_VER_AUDIT_LOGS` (Visualizar histórico de auditoria)

No frontend, essas flags serão expostas reativamente na UI para desativar/ocultar elementos operacionais do `MORADOR`, alinhando-se com a estrutura de proteção visual já existente.

---

### Key Design Decisions

#### Decisão 1: Persistir permissões como campo JSON na tabela Tenant
- **Alternativa A**: Criar colunas booleanas individuais no modelo `Tenant` do Prisma.
  - *Razão de Rejeição*: Baixa manutenção. Toda vez que uma nova permissão/funcionalidade for criada, exigiria uma migration física de banco de dados para adicionar a nova coluna.
- **Alternativa B (Recomendada - Campo JSON Flexível)**: Adicionar um campo `permissions Json? @default("{}")` na tabela `Tenant`.
  - *Rationale*: Permite adicionar novas chaves de feature flags e permissões dinâmicas de forma ágil, apenas alterando as validações do código, sem fricção de migrações e com retrocompatibilidade automática (caso a chave não exista no JSON, assume-se o valor padrão `true`).

#### Decisão 2: Canal de Sincronização Dinâmica via WebSocket e Sessão
- **Premissa**: Quando o Admin altera as permissões na UI, todos os moradores conectados devem ter suas restrições visuais aplicadas em tempo real.
  - *Rationale*: Usar o canal existente de WebSockets (`socketService.on('tenant_permissions_changed')`) para recarregar as configurações de sessão e as permissões ativas nos clients conectados de forma instantânea.

---

### Alternatives Considered

- **Criar uma tabela `TenantPermission` relacionada**: Rejeitada. A complexidade de fazer joins a cada requisição financeira não se justifica. Um campo JSON direto no modelo `Tenant` (que já é lido no contexto da sessão de moradia) oferece performance excelente e simplicidade técnica.

---

## Risk & Gap Analysis

### Requirement Ambiguities

- **Sessão ativa de Moradores**: Se o morador já estiver com o modal de novo lançamento aberto e o Admin desativar a flag de lançamentos, o que acontece?
  - *Resolução*: O backend deve validar a flag no momento da persistência e lançar `ForbiddenException` com uma mensagem amigável ("O administrador da casa desativou a permissão de moradores lançarem gastos."), impedindo a inserção indevida mesmo se a UI não tiver sincronizado a tempo.

### Edge Cases

- **Ausência de chaves no JSON**: Tenants antigos terão o campo `permissions` como nulo ou vazio no banco de dados.
  - *Resolução*: O serviço de leitura de configurações deve mapear propriedades faltantes para `true`, evitando que moradores de casas antigas percam o acesso repentinamente.

### Technical Risks

- **Sobrecarga de chamadas ao banco**: Validar a permissão a cada salvamento de gasto exige ler a entidade `Tenant`.
  - *Mitigação*: Como o `Tenant` já é lido na validação de escopo multitenant ou na verificação do ID da moradia, a leitura pode ser aproveitada da mesma transação ou consulta do Prisma, sem impacto perceptível de performance.

---

### Acceptance Criteria Coverage

| AC# | Descrição do Requisito | Addressable? | Gaps/Notes |
|-----|------------------------|--------------|------------|
| 1 | Adicionar campo JSON de permissões na entidade `Tenant`. | Sim | Migração simples no Prisma `schema.prisma`. |
| 2 | Criar rota `PATCH /financeiro/tenants/permissions` para o Admin salvar. | Sim | Restrita à Role `ADMIN` no controller. |
| 3 | Backend valida as Feature Flags ao processar despesas, cartões, contas e netting de moradores. | Sim | Mapeado no `MembroService` ou nos respectivos serviços do backend. |
| 4 | Frontend oculta/desativa elementos operacionais de moradores baseando-se nas flags ativas. | Sim | Reutiliza as props e condicionais já criadas para o somente-leitura. |
| 5 | UI de Configurações da Casa com chaves switch (switches de toggle) para o Admin gerenciar. | Sim | Nova aba ou seção elegante inserida em `ConfiguracoesMembros.vue`. |
