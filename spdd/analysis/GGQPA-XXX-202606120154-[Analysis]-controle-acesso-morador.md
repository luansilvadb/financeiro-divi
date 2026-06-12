# SPDD Analysis: Iteração do Controle de Acesso do Morador no RBAC

## Original Business Requirement

> /spdd-analysis itere controle de acesso do morador quero saber melhor pra mim não tem diferença nenhuma admin

---

## Domain Concept Identification

### Existing Concepts (from codebase)

- **Role (enum ADMIN / MORADOR / VISUALIZADOR)**: Nível de permissão associado a um membro de uma moradia (`MembroCasa`).
- **MembroCasa**: O perfil do morador vinculado a uma casa isolada (Tenant).
- **Renda Mensal (`rendaCentavos`)**: Valor declarado do morador para cálculo do rateio e do netting proporcional de gastos.
- **Governança da Moradia**: Ações administrativas como convidar moradores, rebaixar/promover papéis, suspender/ativar moradores e monitorar faturamento da casa.
- **Operações Financeiras**: Ações cotidianas como registrar gastos compartilhados, gerenciar cartões pessoais e agendar contas fixas.

### New Concepts Required

- **Self-Service de Perfil (Autonomia do Morador)**: Capacidade do morador comum de gerenciar seus próprios dados operacionais (Nome, Cartões e Renda Mensal) sem privilégios administrativos sobre terceiros.

### Key Business Rules

- **Autonomia da Renda**: Todo morador ativo (`ADMIN` ou `MORADOR`) é o proprietário de sua renda e deve poder atualizá-la, já que ela influencia diretamente no cálculo proporcional das despesas do grupo.
- **Soberania Administrativa Restrita**: Apenas membros com a Role `ADMIN` podem convidar novos usuários, suspender/ativar membros ou alterar privilégios de acesso (Roles).
- **Consistência de Mutação**: Um morador sem privilégios de `ADMIN` nunca pode alterar a renda, nome ou status de outros membros da moradia. Ele também não pode alterar a própria `role` (para se auto-promover) ou o seu status de `ativo` (o que burlaria as travas de saldo pendente).

---

## Strategic Approach

### Solution Direction

Atualmente, o `MORADOR` e o `ADMIN` compartilham quase a mesma experiência visual nas abas de configuração, gerando a percepção de que "não há diferença nenhuma". Além disso, há falhas de UX e segurança onde o `MORADOR` comum consegue simular a edição de outros moradores na interface (exibindo campos editáveis de renda) mas recebe erros `403 Forbidden` do backend ao tentar salvar. 

Para diferenciar as duas Roles de forma útil, consistente e segura, dividimos as responsabilidades em dois pilares:

1. **Autonomia Pessoal (Self-Service)**: O `MORADOR` gerencia seus próprios dados pessoais e cartões. Para isso, adicionaremos o campo **Renda Mensal** na aba "Meu Perfil" e permitiremos que ele salve esses dados no backend.
2. **Governança Exclusiva**: A aba "Acessos" (onde são exibidos todos os moradores) passa a ser **somente leitura** para o `MORADOR`. Ele não poderá clicar em terceiros para abrir o painel de edição. O botão "Novo Morador" continua invisível para ele.

---

### Key Design Decisions

#### Decisão 1: Flexibilizar o endpoint de salvamento de membro para permitir edição própria
- **Alternativa A (Manter atual)**: Apenas `ADMIN` acessa a rota `POST /api/financeiro/membros`.
  - *Razão de Rejeição*: Impede que moradores comuns atualizem a própria renda, forçando o administrador a intervir manualmente toda vez que a renda de um colega de quarto mudar.
- **Alternativa B (Recomendada - Self-Service com Validação Estrita)**: Liberar a rota para `ADMIN` e `MORADOR`, mas introduzir validação rígida no backend (`MembroService`) que restringe não-admins a alterarem apenas a si mesmos e bloqueia alterações de `role` e `ativo`.
  - *Rationale*: Confere autonomia de gestão financeira pessoal para o morador sem comprometer a segurança administrativa do Tenant.

#### Decisão 2: Desativar cliques de edição de membros na lista para Moradores no Frontend
- **Alternativa A (Manter atual)**: Morador clica em qualquer membro, abre a gaveta de edição com campos de role e ativo desabilitados, mas com renda habilitada.
  - *Razão de Rejeição*: Causa confusão visual. O usuário acredita que pode alterar a renda do colega, mas a ação falha com erro 403.
- **Alternativa B (Recomendada - Bloqueio Visual)**: Se o usuário logado for `MORADOR` ou `VISUALIZADOR`, a lista de membros em "Acessos" torna-se puramente informativa (sem hover/clique e sem abrir gaveta de edição de terceiros).
  - *Rationale*: Reduz o ruído na interface, deixando claro que a governança de acesso e do grupo pertence exclusivamente ao administrador.

---

### Alternatives Considered

- **Criar uma rota separada `POST /api/financeiro/membros/me`**: Rejeitado para evitar duplicação de lógica de persistência e validações de banco de dados do Prisma. Tratar o escopo de segurança baseado no executor no endpoint unificado é mais limpo e centralizado.

---

## Risk & Gap Analysis

### Requirement Ambiguities

- **Edição própria de Nome na aba de Acessos**: Se o morador clicar em si mesmo na lista de moradores de "Acessos", ele deve poder editar?
  - *Resolução*: Para evitar duplicar formulários, faremos com que a aba "Acessos" seja 100% somente leitura para não-admins. Qualquer alteração pessoal (Nome ou Renda) deve ser feita exclusivamente na aba "Meu Perfil".

### Edge Cases

- **Único Admin tentar se rebaixar a Morador**: A regra de validação atual em `validarRegrasSalvarMembro` já garante que a casa tenha pelo menos um administrador ativo. Esta trava deve ser mantida intocada.
- **Membro tentar burlar o ID do executor no Post**: Se um atacante enviar uma requisição direta com o `id` de outro membro no corpo da mensagem, o backend deve validar o `executorUserId` (extraído do JWT) contra o `id` do payload e barrar a requisição.

### Technical Risks

- **Validação de permissão no Controller**: A rota `POST /api/financeiro/membros` no `FinanceiroController` deve passar de `@Roles(Role.ADMIN)` para `@Roles(Role.ADMIN, Role.MORADOR)`. A validação fina será delegada ao `MembroService` usando o `userId` autenticado.

---

### Acceptance Criteria Coverage

| AC# | Descrição do Requisito | Addressable? | Gaps/Notes |
|-----|------------------------|--------------|------------|
| 1 | Diferenciar visualmente as Roles `ADMIN` e `MORADOR` na UI. | Sim | A aba "Acessos" fica somente leitura (sem cliques) para moradores comuns. |
| 2 | Permitir que o `MORADOR` atualize sua própria renda de forma legítima. | Sim | Campo adicionado na aba "Meu Perfil" e validação de self-service implementada no backend. |
| 3 | Impedir que o `MORADOR` acione rotas administrativas do backend. | Sim | Backend valida que se o executor não for `ADMIN`, ele só pode editar o próprio ID de membro e não pode alterar `role` ou `ativo`. |
| 4 | Manter a governança do grupo restrita ao `ADMIN`. | Sim | Criação de novos membros, alteração de status ativo e atribuição de papéis continuam bloqueados para moradores comuns. |
