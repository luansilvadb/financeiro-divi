# SPDD Analysis: Remoção Completa do Conceito de Cargo — Simplificação Total do RBAC para Roles

## Original Business Requirement

> /spdd-analysis cargo como cosmetico não gostei, pode remover e mantem apenas role, que é o rbac que estamos focando

---

## Domain Concept Identification

### Existing Concepts (from codebase)

- **Role (enum ADMIN / MORADOR / VISUALIZADOR)**: O único papel sistêmico de controle de acesso (RBAC) que permanecerá ativo no sistema. Enforced no `TenantRoleGuard` via `@Roles()`. Define a governança macro de moradia: `ADMIN` gerencia membros e auditoria, `MORADOR` executa todas as transações financeiras, e `VISUALIZADOR` tem acesso de somente leitura.
- **MembroCasa**: Entidade que representa o morador da casa. Deixará de possuir associação com cargos (`cargoId` e `cargo` serão removidos).
- **Tenant**: A entidade moradia (`Tenant`). A relação um-para-muitos com `Cargo` será inteiramente eliminada.

### Concepts to Remove

- **Cargo**: Entidade que representa o cargo cosmético/social com `nome` e `cor`. Será totalmente eliminada do banco de dados (schema Prisma), APIs e componentes de interface.
- **Permissao**: Enum que representava as permissões técnicas anteriormente associadas a Cargos (já removido da base de dados e do guard, mas agora os vestígios e DTOs pendentes serão eliminados).

### Key Business Rules

- **RBAC Baseado Exclusivamente em Roles**: Toda restrição de acesso e controle técnico de segurança será baseado unicamente na Role do morador (`ADMIN`, `MORADOR`, `VISUALIZADOR`).
- **Nenhum Overhead Organizacional na UI**: A complexidade cognitiva de criar, editar e vincular cargos aos moradores é removida. O app foca inteiramente na simplicidade e no rateio colaborativo básico de despesas.

---

## Strategic Approach

### Solution Direction

O usuário optou por um caminho de **simplificação absoluta**: em vez de manter o Cargo como um label cosmético na UI, ele quer **excluir o conceito de Cargo completamente** do sistema e focar 100% no RBAC de Roles.

Esta decisão traz grandes benefícios de manutenção:
1. **Redução de Código**: Menos entidades, menos endpoints, remoção de arquivos e testes unitários/E2E obsoletos em ambos os repositórios (backend e frontend).
2. **Banco de Dados Limpo**: A tabela `cargos` e a coluna `cargo_id` em `membros_casa` serão dropadas do banco, simplificando a modelagem do Prisma.
3. **UI/UX mais Direta**: Sem abas extras de "Cargos" ou "Papéis", sem formulários de criação de cargo e sem seletores adicionais na edição de membros.

A abordagem de implementação consistirá em:
- **Prisma Schema**: Remover a tabela `Cargo` e o campo `cargoId` / relação `cargo` em `MembroCasa`.
- **API Backend**: Excluir a injeção e classe de `CargoService`, remover os endpoints de cargos no `FinanceiroController`, e limpar o `MembroService` da leitura e persistência de `cargoId`.
- **Frontend**: Apagar classes, repositórios, viewModels e arquivos de teste de Cargo. Deletar os componentes `GestaoCargosTab.vue` e `CargoFormBottomSheet.vue`, e remover seletores e badges de cargos nas listas e formulários de membros.

---

### Key Design Decisions

#### Decisão 1: Remoção Estrutural de Dados vs. Desativação Lógica
- **Decisão**: Remoção física e estrutural completa. A tabela `cargos`, colunas e chaves estrangeiras relacionadas a cargos serão dropadas fisicamente do PostgreSQL via migration do Prisma. Não haverá flags de desativação lógica, assegurando um banco limpo.

#### Decisão 2: Simplificação das Telas de Gestão de Membros
- O seletor de "Cargo" na tela de edição de membro (`GestaoAcessoTab.vue`) será inteiramente removido. Apenas o seletor "Papel na Casa" (Role: Administrador, Morador, Visualizador) será exibido.
- A aba "Cargos" ou "Papéis" na tela `ConfiguracoesMembros.vue` será removida, restando apenas as abas "Meu Perfil" e "Acessos" (esta última renomeada para mostrar a listagem de moradores da casa de forma direta).

#### Decisão 3: Manutenção do Badge Contextual na Listagem
- O `MembroListItem.vue` exibirá um badge baseado na role do membro:
  - `ADMIN`: badge Ember "Admin" (existente)
  - `MORADOR`: badge cinza neutro "Morador"
  - `VISUALIZADOR`: badge azul neutro "Visualizador"
- Isso garante que o administrador da casa continue identificando visualmente a permissão de cada membro sem precisar de cargos.

---

### Alternatives Considered

- **Manter a tabela Cargo no banco para uso futuro e apenas ocultar na UI**: Rejeitado. Manter tabelas e campos órfãos no banco aumenta o débito técnico e a complexidade de manutenção do schema. Remover tudo agora garante a integridade e limpeza do código.

---

## Risk & Gap Analysis

### Edge Cases

- **Membros vinculados a cargos na base real**: Como a migration removerá fisicamente a coluna `cargo_id` de `membros_casa` e a tabela `cargos`, qualquer vinculação atual será dropada. Isso é seguro, pois já removemos o enforcement de permissões por cargos anteriormente e eles já não exerciam efeito nas regras de acesso reais.
- **Aba Cargos no Modo Foco**: Toda a lógica de ocultação de cabeçalho no Modo Foco sob a aba de Cargos deve ser removida de `ConfiguracoesMembros.vue`.

### Technical Risks

- **Mais uma Migration Prisma**: A exclusão da tabela `cargos` requer uma migration do Prisma. O script gerado deve dropar a tabela `cargos` e a coluna `cargo_id` de `membros_casa`.
- **Exclusão de Testes Unitários de Integração**: Testes que cobriam o salvamento, listagem e vinculação de cargos no backend (`cargo.service.spec.ts`) e no frontend (`useCargos.test.ts`) devem ser permanentemente deletados do repositório para evitar quebra no pipeline.

### Acceptance Criteria Coverage

| AC# | Descrição da Premissa / Alteração | Impacto Técnico | Status | Notas |
|-----|-----------------------------------|-----------------|--------|-------|
| 1 | Eliminação completa do conceito de Cargo | **Remoção de Código**: Deletar tabelas do Prisma, DTOs, controllers, repositórios, viewModels e componentes Vue de Cargo. | Sim | Simplificação extrema do domínio. |
| 2 | Controle de acesso baseado apenas em Roles | **Simplificação do Guard**: O `TenantRoleGuard` valida unicamente a role e as rotas operacionais utilizam apenas `@Roles()`. | Sim | Foco 100% no RBAC simplificado de moradia. |
| 3 | Limpeza da Interface de Configurações | **Ajustes de UI**: Remover aba de Cargos, seletor de cargo do form de membros e badges de cargo na listagem. | Sim | UI limpa e sem ruído corporativo. |
| 4 | Sem restos de código órfão | **Exclusão de arquivos de teste**: Garantir a exclusão de arquivos de especificação (`*.spec.ts` / `*.test.ts`) obsoletos. | Sim | Evita falso-positivos em CI/CD. |
