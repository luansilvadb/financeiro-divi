# SPDD Analysis: Revisar e Corrigir Permissões de Cargo Seguindo Boas Práticas de RBAC

## Original Business Requirement

> "quero que analise cargo as permissões não parecem estar corretas seguindos as boas praticas de rbac"

O sistema possui um modelo de `Cargo` com campo `permissoes String[]` e uma relação `MembroCasa → Cargo`, mas as permissões de cargo não estão sendo aplicadas corretamente no controle de acesso. O objetivo é revisar e corrigir a implementação para que o sistema de cargos siga as boas práticas de RBAC (Role-Based Access Control), tornando as permissões associadas a cargos efetivas e auditáveis.

---

## Domain Concept Identification

### Existing Concepts (from codebase)

- **Role (enum)**: Enumeração hardcoded `{ADMIN, MORADOR, VISUALIZADOR}` persistida diretamente em `MembroCasa.role`. É o único mecanismo de autorização atualmente funcional — usado por `TenantRoleGuard` via decorator `@Roles()` no controller.

- **Cargo**: Entidade customizável por Tenant com campos `nome`, `cor`, e `permissoes String[]`. Relacionado a `MembroCasa` via FK `cargoId`. Existe no banco (migration `20260612031600_add_cargos`), é criado/editado via `CargoService`/`CargoDto`, e trafega pelo frontend via `HttpCargoRepository`. Porém, seu campo `permissoes` nunca é lido em nenhuma lógica de autorização — é puramente decorativo.

- **MembroCasa**: Possui simultaneamente `role` (enum `Role`, funcional no guard) e `cargoId` (FK para `Cargo`, decorativo). É a entidade central que liga um usuário autenticado a um Tenant e define seus acessos.

- **TenantRoleGuard**: Guard NestJS que intercepta requisições protegidas por `@Roles()`. Consulta `MembroCasa.role` (enum) para decidir acesso. Nunca carrega `Cargo` nem lê `permissoes`. É o único ponto de enforcement de autorização no backend.

- **Roles decorator**: `@Roles(...roles: Role[])` usado em endpoints do `FinanceiroController`. Define quais roles do enum têm acesso. Não há equivalente para permissões de cargo.

### New Concepts Required

- **Enum de Permissões Canônicas (PermissaoEnum)**: Lista fechada e versionada de permissões do sistema (ex: `GERENCIAR_MEMBROS`, `GERENCIAR_CARGOS`, `LANCAR_GASTOS`, `VISUALIZAR_RELATORIOS`). Substitui `permissoes String[]` livre por um contrato tipado, eliminando permissões fantasma e erros de digitação.

- **Contrato de Permissão ↔ Operação**: Mapeamento explícito que responde "qual permissão canônica habilita qual endpoint/ação?". Necessário para que o guard saiba o que verificar. Atualmente inexistente — nenhum ponto do código faz essa associação.

### Key Business Rules

- **Uma permissão deve ter efeito real**: Uma permissão listada em `Cargo.permissoes` deve efetivamente controlar o acesso a pelo menos uma operação no sistema. Permissões sem efeito são dead-code de negócio.

- **Cargo não substitui Role — Role ainda governa a hierarquia sistêmica**: `ADMIN` é um super-papel de governança da moradia (pode adicionar membros, excluir cargos etc). `Cargo` deve ser um refinamento de permissões operacionais dentro de uma Role, não um substituto. Um membro `MORADOR` com cargo `Tesoureiro` pode ter permissões a mais que um `MORADOR` sem cargo.

- **O cargoId do membro deve ser persistido**: `MembroDto` trafega `cargoId`, mas `persistirMembro()` no backend ignora esse campo no upsert — a associação Membro→Cargo nunca é salva no banco. Isso é um bug de consistência: o frontend envia, o backend descarta.

- **Permissões são do escopo do Tenant**: `Cargo` já é escopado por `tenantId`. As permissões de um cargo só se aplicam dentro daquele Tenant, nunca cross-tenant.

- **Rotas de leitura sem `@Roles` são acessíveis a qualquer membro autenticado**: `GET /cargos`, `GET /membros`, `GET /contas-fixas`, `GET /faturas`, `GET /gastos` não têm decorator `@Roles`. Isso é uma decisão de negócio legítima (dados compartilhados da moradia) mas precisa ser explícita — não acidental.

---

## Strategic Approach

### Solution Direction

Corrigir o RBAC em três camadas coordenadas, da mais crítica à mais evolutiva:

1. **Fechar o bug de persistência** — `persistirMembro` deve gravar `cargoId` no upsert. Sem isso, qualquer evolução do sistema de cargos é inviável.

2. **Definir o contrato de permissões** — Criar um enum `Permissao` com as operações do sistema, substituir `permissoes String[]` livre por `permissoes Permissao[]` (enum Prisma) ou manter `String[]` mas adicionar validação via `IsEnum` no DTO. O enum é a fonte da verdade.

3. **Fazer o guard consultar permissões de cargo** — Evoluir `TenantRoleGuard` para, além de verificar `membro.role`, carregar `membro.cargo.permissoes` e cruzar com a permissão requerida pelo endpoint quando necessário. O modelo de acesso final é: `@Roles(Role.ADMIN)` continua para operações de governança; um novo decorator `@Permissoes(Permissao.X)` é usado para operações operacionais refinadas por cargo.

O fluxo geral: `Request → JwtAuthGuard → TenantRoleGuard → [verifica Role OU Permissão de Cargo] → Handler`.

### Key Design Decisions

- **Decisão 1: Enum Prisma vs. String[] validada**
  - `permissoes Permissao[]` com enum Prisma: forte tipagem no banco, migração necessária, backward-incompatível com dados existentes. Garante consistência total.
  - `permissoes String[]` com `IsEnum(Permissao, { each: true })` no DTO: sem migração de schema, mais flexível, mas o banco aceita strings inválidas se inseridas fora da API.
  - **Recomendação**: Enum Prisma. O sistema está em desenvolvimento e a consistência vale o custo da migração. Dados existentes em `permissoes` são strings livres sem semântica — podem ser descartados (não há enforcement atual).

- **Decisão 2: Guard unificado vs. dois guards separados**
  - Guard único `TenantRoleGuard` que resolve tanto `Role` quanto `Permissao de Cargo`: menos boilerplate, mais complexidade interna.
  - Dois guards: `TenantRoleGuard` (Role) e `TenantPermissaoGuard` (Cargo): separação clara de concerns, composição via `@UseGuards(A, B)`.
  - **Recomendação**: Guard único evoluído. O guard já faz o lookup de `MembroCasa` — é mais eficiente carregar `cargo.permissoes` no mesmo query via `include` do que fazer dois round-trips ao banco.

- **Decisão 3: Manter Role enum + adicionar Cargo/Permissão, ou migrar para RBAC puro baseado em Cargo**
  - Migrar para RBAC puro (apenas Cargo, sem Role enum): mais flexível, mas quebra o modelo mental simples de ADMIN/MORADOR/VISUALIZADOR e requer reescrever toda a lógica de governança (ex: "último admin ativo").
  - Manter Role como hierarquia de governança + Cargo como refinamento operacional: menor impacto, preserva as regras de negócio existentes.
  - **Recomendação**: Manter Role + Cargo como camadas complementares. ADMIN governa; Cargo refina o que MORADOR/VISUALIZADOR pode fazer operacionalmente.

### Alternatives Considered

- **Remover Cargo.permissoes e usar apenas Role enum**: Rejeitado. Remove a feature de customização que o produto propõe (cargos por casa). Não resolve o requisito de RBAC flexível.

- **Usar CASL ou outro authorization framework**: Rejeitado por ora. O escopo é pequeno (um único controller, operações bem definidas). Introduzir uma biblioteca de autorização seria over-engineering para o estágio atual. A solução nativa NestJS (guard + decorator) é suficiente e mantém a convenção existente.

---

## Risk & Gap Analysis

### Requirement Ambiguities

- **Quais são as permissões canônicas do sistema?** O requisito pede boas práticas de RBAC mas não especifica a lista de permissões que devem existir. As operações disponíveis no controller são o melhor proxy: `LANCAR_GASTOS`, `GERENCIAR_CARTOES`, `GERENCIAR_FATURAS`, `GERENCIAR_CONTAS_FIXAS`, `GERENCIAR_MEMBROS`, `GERENCIAR_CARGOS`, `VISUALIZAR_AUDITORIA`, `CONSULTAR_VALIDACAO`. A lista final precisa de confirmação do produto.

- **VISUALIZADOR deve poder fazer quê?** Atualmente `VISUALIZADOR` não tem nenhum endpoint habilitado além dos que não têm `@Roles` (leituras livres). Com cargos, um `VISUALIZADOR` poderia ganhar permissões específicas? Ou Cargo só refina `MORADOR`?

- **Permissões de Cargo são aditivas ou substitutivas?** Se um `MORADOR` sem cargo pode lançar gastos, e um cargo `Visualizador Restrito` tem apenas `VISUALIZAR_RELATORIOS`, o membro com esse cargo perde o direito de lançar gastos? A semântica de "cargo restringe" vs "cargo expande" precisa ser definida.

### Edge Cases

- **Membro sem cargo**: `cargoId` é nullable. O guard deve funcionar corretamente quando `cargo` é null — nesse caso, apenas `role` governa o acesso. Não pode lançar NullPointerError ao tentar acessar `membro.cargo.permissoes`.

- **Cargo excluído com membros associados**: `onDelete: SetNull` no schema garante que `cargoId` vira null quando o cargo é excluído. O guard deve tratar esse estado como "sem cargo" sem erro.

- **Dados existentes em `permissoes String[]`**: Se houver cargos criados com strings livres (ex: `"gastos"`, `"admin"`) antes da migração para enum, esses dados precisam de estratégia de descarte ou mapeamento.

- **`atualizarCargoMembro` no frontend passa `cargoId` para `MembroService.atualizarCargoMembro`**, que chama `repository.salvar()` com `cargoId`. O `HttpMembroRepository.salvar()` serializa `cargoId` no body. Porém o backend em `persistirMembro` ignora `cargoId` no upsert. Ou seja: o frontend está correto na intenção, o bug é exclusivamente no backend.

### Technical Risks

- **Migração do schema de String[] para enum Permissao[]**: Requer `prisma migrate` com ALTER TABLE. Dados existentes em `permissoes` são strings não-tipadas — a migração deve tratar o cast (provavelmente com `DEFAULT ARRAY[]` e descarte dos valores existentes, já que não têm efeito real hoje). Risco: baixo, pois é não-destrutivo para a lógica funcional.

- **Performance do guard com `include: { cargo: true }`**: A query atual do guard já faz um `findFirst` em `membroCasa`. Adicionar `include: { cargo: true }` faz um JOIN adicional. Para o volume esperado de uma moradia (< 20 membros), o impacto é desprezível. Risco: negligível.

- **Inconsistência no `useMembros.test.ts`**: Os testes do frontend para `useMembros` mocam `membroRepository` diretamente e não testam a serialização de `cargoId`. Após a correção do backend, os testes de integração precisam cobrir o round-trip `cargoId`.

- **`GET /cargos` sem `@Roles`**: Qualquer membro autenticado pode listar todos os cargos e suas permissões do Tenant. Isso é aceitável (são metadados da casa), mas deve ser uma decisão consciente documentada no código — não um esquecimento.

### Acceptance Criteria Coverage

| AC# | Descrição | Addressable? | Gaps/Notas |
|-----|-----------|--------------|------------|
| 1 | Permissões de Cargo têm efeito real no controle de acesso | Sim | Requer evolução do `TenantRoleGuard` para ler `cargo.permissoes` |
| 2 | `Cargo.permissoes` usa valores canônicos tipados, não strings livres | Sim | Requer definição do enum `Permissao` e migração do schema |
| 3 | Associação Membro→Cargo é persistida corretamente | Sim | Bug simples: adicionar `cargoId` ao upsert em `persistirMembro` |
| 4 | Endpoints têm proteção de acesso explícita e auditável | Parcial | Endpoints sem `@Roles` precisam de decisão consciente; novo decorator `@Permissoes()` precisa ser criado |
| 5 | Sistema suporta Role (hierarquia) + Cargo (refinamento) como camadas complementares | Sim | Abordagem recomendada preserva regras de negócio existentes (último ADMIN, etc.) |
