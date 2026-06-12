# SPDD Analysis: Redundância de RBAC — "Papel na Casa" vs. "Cargo" no Contexto Residencial

## Original Business Requirement

> /spdd-analysis "PAPEL NA CASA" X "CARGO" Antes de evoluir o desenvolvimento, precisamos iterar sobre o modelo de negócio com um olhar crítico: **o problema que queremos resolver existe de verdade?** Valide as premissas centrais comparando-as com dados reais, feedbacks de usuários ou evidências de mercado. Ajuste o modelo sempre que encontrar descolamento entre a solução proposta e a realidade do público-alvo. Não construímos para hipóteses — construímos para problemas confirmados.
> 
> AMBOS PRA MIM TEM INTENÇÃO DE CONTROLE DE PERMISSÃO ESTÁ REDUNDANTE RBAC

---

## Domain Concept Identification

### Existing Concepts (from codebase)

- **Role (enum ADMIN / MORADOR / VISUALIZADOR)**: Define o papel sistêmico estrutural da moradia (ex: quem governa o grupo vs. quem apenas consome informações). Está mapeado no banco de dados como o campo `role` em `MembroCasa` e é validado no backend através do `TenantRoleGuard` usando o decorator `@Roles()`.
- **Cargo**: Entidade customizável vinculada a um tenant (`Cargo`), que contém `nome`, `cor` e uma lista de `permissoes Permissao[]`. É associado a `MembroCasa` via `cargoId`.
- **Permissao (enum LANCAR_GASTOS / GERENCIAR_CARTOES / GERENCIAR_FATURAS / GERENCIAR_CONTAS_FIXAS / VISUALIZAR_AUDITORIA)**: Mapeamento granular de acessos técnicos que podem ser atribuídos a um `Cargo`. Validado no backend via decorator `@Permissoes()`.
- **TenantRoleGuard (lógica OR)**: Combina a checagem de `Role` e `Permissoes` do cargo associado ao membro.
- **Contexto Residencial (Casais, Famílias e Repúblicas)**: O ecossistema de negócio do DIVI. Baseia-se em rateio colaborativo e relações de convívio social, onde a confiança mútua e a facilidade de uso diário são prioritárias em relação à auditoria rígida ou restrição de ações de membros.

### New Concepts Required

- **Nenhum**. O objetivo desta análise é justamente a **simplificação conceitual** e a eliminação de redundâncias, identificando conceitos obsoletos ou excessivamente corporativos para remoção.

### Key Business Rules

- **Redundância Operacional**: O `MORADOR` e o `ADMIN` têm acesso operacional pleno por padrão (lógica OR no guard). Logo, qualquer membro com role `MORADOR` consegue executar todas as operações financeiras sem precisar de nenhum cargo.
- **Cargo e Permissões Técnicas**: Atualmente, as permissões vinculadas ao `Cargo` só alteram o comportamento de segurança de forma determinante para o papel de `VISUALIZADOR`. Para moradores comuns, a configuração de permissões de cargo é completamente ignorada pelo guard, tornando-se meramente cosmética.
- **Complexidade Cognitiva**: Apresentar uma matriz de permissões técnicas para usuários finais gerenciarem o acesso da própria casa gera fricção de onboarding e descaracteriza o DIVI como um aplicativo residencial simples.

---

## Strategic Approach

### Solution Direction

A crítica do usuário é extremamente precisa: **o controle de permissões granular baseado em cargos (RBAC corporativo clássico) é redundante e descolado da realidade de um app residencial.**

Em ambientes domésticos (casais, pequenas repúblicas ou famílias):
1. **O problema de restrição rígida de escrita não existe de verdade**: As pessoas que dividem despesas não querem ou precisam gerenciar se o parceiro pode "lançar gastos" mas não "gerenciar cartões". Se um parceiro é morador da casa, ele tem acesso completo de escrita. Se for um terceiro (ex: filho menor de idade, ex-cônjuge em transição, fiador, contador), ele será um `VISUALIZADOR` (somente leitura) ou `MORADOR` (acesso total).
2. **A redundância técnica é real**: Manter duas camadas de verificação (Roles sistêmicas e Cargos com arrays de Permissões) gera complexidade de banco de dados, DTOs, testes e regras de guard no backend para um cenário de uso marginal (dar permissões específicas a um Visualizador).
3. **O valor do Cargo é puramente social/organizacional**: Definir "Quem cuida das faturas da casa" ou "Responsável pela luz (Tesoureiro)" ajuda a organizar quem executa tarefas na dinâmica da casa, atuando como um rótulo visual (badge) e de responsabilidade social, e não como uma ferramenta de segurança da informação (ACL).

Portanto, a direção estratégica proposta é **remover as permissões técnicas associadas aos cargos, transformando o conceito de "Cargo" em uma sinalização social 100% cosmética/organizacional**.

---

### Key Design Decisions

#### Decisão 1: Simplificar o modelo de Cargo eliminando as Permissões Técnicas
- **Alternativa A (Manter modelo híbrido)**: Manter a estrutura de `Permissao[]` no banco, guard e API para atender o cenário de "Visualizador com acessos parciais".
  - *Razão de Rejeição*: Over-engineering. O caso de uso de um Visualizador que precisa lançar gastos, mas não pode ver faturas, é extremamente incomum e artificial no ambiente familiar. Se ele precisa operar ativamente no financeiro, ele deve ser configurado como `MORADOR`.
- **Alternativa B (Recomendada - Simplificação Radical)**: Remover o enum `Permissao` e o array de permissões do modelo de `Cargo`. O `Cargo` passará a conter apenas `nome` e `cor` (atuando como uma tag de sinalização de responsabilidade da casa). O controle de acesso no backend será baseado exclusivamente em `Role` (`ADMIN`, `MORADOR`, `VISUALIZADOR`), que é simples, intuitivo e suficiente para a segurança do sistema.
  - *Trade-off*: Exige a remoção de código implementado recentemente no backend (`TenantRoleGuard` simplificado, decorator `@Permissoes` deletado, schemas limpos). No entanto, isso "paga" a dívida técnica imediatamente, reduzindo o custo de manutenção futura e limpando a UX de onboarding.

#### Decisão 2: Como tratar a governança no backend (simplificação do Guard)
- Com a eliminação das permissões do cargo, o `TenantRoleGuard` volta a analisar exclusivamente as `Roles` sistêmicas.
- As rotas operacionais do `FinanceiroController` serão protegidas apenas por `@Roles(Role.ADMIN, Role.MORADOR)`. Apenas administradores e moradores normais operam o financeiro. Visualizadores ficam estritamente em somente leitura.
- Isso elimina a lógica complexa de OR e JOINs adicionais no guard para carregar o cargo na requisição de autorização.

#### Decisão 3: Enquadramento de UX dos "Cargos"
- Na UI, os Cargos serão reposicionados puramente como **"Papéis Sociais da Casa"** (Ex: "Responsável pelas Compras", "Gestor da Internet", "Tesoureiro").
- A criação de cargos consistirá apenas em dar um **Nome** e selecionar uma **Cor** para o Badge. Não haverá checkboxes de permissão técnica, reduzindo a carga cognitiva e tornando a tela limpa e amigável.

---

### Alternatives Considered

- **Substituir Roles sistêmicos inteiramente por Cargos customizados (RBAC puro)**: Rejeitado. Isso obrigaria o usuário a configurar um cargo do zero para poder fazer qualquer coisa no sistema ao criar uma nova casa. A distinção básica entre "Dono/Admin" (quem gerencia membros/assinatura) e "Membro comum" (quem usa no dia a dia) é universal e deve ser tratada nativamente pelas Roles de sistema.
- **Deixar o backend com suporte a Permissões e apenas ocultar na UI**: Rejeitado. Criaria descolamento crônico entre a arquitetura técnica e o modelo de negócio, deixando código "morto" que precisa ser testado e mantido no backend sem uso real.

---

## Risk & Gap Analysis

### Requirement Ambiguities

- **Validação com dados reais de uso**: A premissa central é que em contextos residenciais, a governança financeira se resolve na base da comunicação e confiança física/social, não por controles de acesso de software de nível corporativo.
- **Impacto no fluxo de validação do produto**: A eliminação do RBAC de cargo afeta as telas e APIs de validação existentes, mas de forma positiva (simplificando testes e mockups).

### Edge Cases

- **Membro com Cargo antigo que possuía permissões**: Se as permissões forem removidas do schema, a migração do banco simplesmente dropará a coluna `permissoes` de `Cargo` e o enum `Permissao`. Isso é seguro, pois não existe enforcement em produção que dependa dessa distinção fina.
- **Visualizador querendo lançar gastos pontuais**: Sem as permissões granulares, um `VISUALIZADOR` nunca poderá criar gastos. A solução real para o negócio é ele pedir para um `MORADOR` lançar, ou ser promovido temporariamente para `MORADOR` caso precise operar ativamente.

### Technical Risks

- **Necessidade de Migration do Prisma**: A eliminação do enum `Permissao` e da relação com cargos requer uma migration de schema estrutural. O script da migration deve remover a coluna `permissoes` do model `Cargo` e dropar o enum `Permissao`.
- **Alteração nos Testes Unitários e E2E**: Testes que cobriam a lógica de `@Permissoes` no guard e no controller precisarão ser deletados ou simplificados para focar apenas nas `@Roles`.

### Acceptance Criteria Coverage

Abaixo, a avaliação de como os requisitos de negócio originais e a crítica de redundância de RBAC são mapeados para a proposta de simplificação:

| AC# | Descrição do Problema / Premissa | Proposta de Solução / Alinhamento | Status | Notas |
|-----|----------------------------------|----------------------------------|--------|-------|
| 1 | "Papel na Casa" vs "Cargo" têm intenção de permissão redundante | **Resolvido**: Permissões são removidas de Cargo. A única camada de controle técnico de acesso passa a ser o "Papel na Casa" (Role). | Sim | Elimina a redundância apontada pelo usuário. |
| 2 | O problema de controle técnico granular de acesso doméstico não existe de verdade | **Validado**: Em finanças de casais e famílias, a confiança é o padrão. A burocracia de micropermissões corporativas é removida da UI. | Sim | Alinha o modelo de negócio com as evidências do mercado consumidor. |
| 3 | Cargos devem servir para organização, não para bloqueio técnico | **Ajustado**: O Cargo se torna uma tag cosmética que indica funções sociais ("Tesoureiro", "Responsável pelas Compras"), gerando engajamento sem criar travas técnicas. | Sim | Mantém o valor afetivo e organizacional do Cargo sem o overhead de ACL. |
| 4 | Simplificação e limpeza do código | **Arquitetura enxuta**: Elimina `@Permissoes()`, enum `Permissao` no Prisma, e simplifica o `TenantRoleGuard` para apenas checar `@Roles()`. | Sim | Melhora a performance e reduz o débito técnico. |
