# SPDD Analysis: Iteração de Permissões RBAC — Validação de Premissas de Negócio

## Original Business Requirement

> Itere permissões RBAC. Antes de evoluir o desenvolvimento, precisamos iterar sobre o modelo de negócio com um olhar crítico: **o problema que queremos resolver existe de verdade?** Valide as premissas centrais comparando-as com dados reais, feedbacks de usuários ou evidências de mercado. Ajuste o modelo sempre que encontrar descolamento entre a solução proposta e a realidade do público-alvo. Não construímos para hipóteses — construímos para problemas confirmados.

---

## Domain Concept Identification

### Existing Concepts (from codebase)

- **Role (enum ADMIN / MORADOR / VISUALIZADOR)**: Hierarquia sistêmica de governança da moradia. Enforced no `TenantRoleGuard` via `@Roles()`. ADMIN gerencia membros e cargos; MORADOR opera financeiramente; VISUALIZADOR apenas lê. Funcional e testado.

- **Permissao (enum LANCAR_GASTOS / GERENCIAR_CARTOES / GERENCIAR_FATURAS / GERENCIAR_CONTAS_FIXAS / VISUALIZAR_AUDITORIA)**: Refinamento operacional via Cargo. Enforced no guard por `@Permissoes()`. Caminho alternativo ao `@Roles` — um membro sem Role suficiente pode passar via Cargo com a permissão certa. Recém-implementado.

- **Cargo**: Entidade customizável por Tenant. Contém `nome`, `cor`, `permissoes Permissao[]`. Scoped por `tenantId`. Associado a `MembroCasa` via `cargoId` (nullable, `onDelete: SetNull`). Agora persistido corretamente no upsert de membro.

- **MembroCasa**: Possui simultaneamente `role` (hierarquia sistêmica) e `cargoId` (refinamento operacional). A combinação dessas duas camadas define o acesso efetivo do membro.

- **TenantRoleGuard (lógica OR)**: ADMIN sempre passa → verifica `@Roles` → verifica `@Permissoes via cargo`. Qualquer condição satisfeita libera o acesso. Um membro MORADOR sem cargo passa pelas rotas operacionais via `@Roles`. Um membro VISUALIZADOR com Cargo contendo a permissão certa também passa.

- **Produto DIVI (contexto de negócio)**: Ledger colaborativo residencial para casais, repúblicas e famílias. Valor central: simplicidade e confiança mútua, não hierarquia corporativa. Análise de mercado anterior validou: 45–53% de conflitos de casais por finanças, 46% ocultam gastos, 85% dos casais modernos preferem modelo híbrido (ledger compartilhado + contas individuais).

### New Concepts Required

- **Nenhum novo conceito de código**. O descolamento é no modelo de negócio subjacente ao RBAC, não em entidades ausentes.

### Key Business Rules

- **MORADOR já tem acesso operacional pleno**: As rotas de escrita operacional (`POST/DELETE gastos`, `POST/DELETE cartoes`, `POST/DELETE faturas`, `POST/DELETE contas-fixas`) usam `@Roles(ADMIN, MORADOR) @Permissoes(X)` com lógica OR. Qualquer MORADOR passa via `@Roles` — sem precisar de Cargo.

- **Cargo só adiciona valor para VISUALIZADOR hoje**: A camada `@Permissoes` só é o caminho de acesso determinante quando o membro é VISUALIZADOR (que não passa via `@Roles` operacionais). Para MORADOR, Cargo é cosmético no controle de acesso atual.

- **ADMIN é super-papel de governança da moradia**: Cria membros, cria/exclui cargos, vê auditoria. Alinhado com a realidade: o fundador da casa tem responsabilidade diferenciada. Essa regra é sólida e sem descolamento.

- **VISUALIZADOR é a role de convidado/observador**: Típico para: dependente sem renda, ex-parceiro em processo de transição, ou visitante temporário. Cargo com permissão granular pode ser útil aqui para "convidados de confiança parcial".

- **Cargo como sinalização social, não só controle técnico**: Em repúblicas, o "Tesoureiro" ou "Responsável pela conta de luz" tem valor de organização social mesmo que não haja restrição técnica. O Cargo pode ter valor de UX independentemente do enforcement de permissão.

---

## Strategic Approach

### Solution Direction

O modelo RBAC implementado está tecnicamente correto e sem bugs estruturais. A questão de negócio é: **a complexidade de Cargo+Permissões granulares tem utilidade real para o público-alvo agora?**

A resposta é: **parcialmente sim, mas com premissas erradas sobre o caso de uso primário**.

A abordagem recomendada é **preservar a implementação atual, mas reposicionar a narrativa e a UX do Cargo** — não como controle granular de permissões corporativo, mas como **papel social com benefícios de acesso opcionais**. O Cargo deve ser apresentado como "quem faz o quê na casa", com as permissões como consequência natural desse papel, não como configuração técnica que o usuário precisa raciocinar.

### Key Design Decisions

- **Decisão 1: Manter MORADOR com acesso operacional pleno vs. restringir MORADOR via Cargo**
  - Restringir: MORADOR sem Cargo perde acesso a algumas operações → forçaria o uso de Cargo como controle real → modelo corporativo. Cria fricção: "por que não consigo lançar meu gasto?".
  - Manter atual (MORADOR pleno, Cargo aditivo): Qualquer morador confiado pela casa já opera normalmente. Cargo só adiciona acesso a quem não teria por Role. Sem fricção desnecessária.
  - **Recomendação**: Manter MORADOR com acesso operacional pleno. O produto não vende controle granular — vende colaboração. A fricção de "precisa de cargo para fazer X" não combina com o posicionamento de ledger baseado em confiança.

- **Decisão 2: Simplificar Cargo para apenas label social (sem permissões técnicas) vs. manter permissões como feature de diferenciação**
  - Remover permissões de Cargo: Simplifica o modelo, reduz complexidade de configuração, elimina a tensão de UX. Cargo seria apenas `nome` + `cor` — crachá de organização social.
  - Manter permissões como opção avançada: Diferenciação para grupos maiores (repúblicas de 8+ pessoas), onde há justificativa de dar acesso parcial a um morador temporário (VISUALIZADOR + permissão específica). Feature de valor futuro demonstrável.
  - **Recomendação**: Manter permissões no Cargo, mas mudar o enquadramento de UX. A tela de gestão de cargos deve apresentar permissões como "o que este papel pode fazer", não como checkboxes de controle técnico. Para casais e grupos pequenos, o padrão é: Cargo sem permissões = apenas label visual. Para grupos maiores, as permissões se tornam naturalmente úteis sem necessidade de mudança de código.

- **Decisão 3: A role VISUALIZADOR tem case de uso suficiente para justificar sua existência?**
  - Casos reais confirmados: filho adulto que mora junto mas não participa do rateio principal; ex-parceiro em fase de transição com acesso de leitura; contador externo vendo a saúde financeira da república.
  - O VISUALIZADOR com Cargo específico (ex: "Auditoria") é a combinação de mais valor real no curto prazo.
  - **Recomendação**: Manter VISUALIZADOR. Documentar cases de uso na UX (tooltip ou onboarding da role selection) para guiar o usuário ao uso correto.

### Alternatives Considered

- **Migrar para RBAC puro (apenas Cargo, sem Role enum)**: Rejeitado. Apagaria a semântica de governança ADMIN e a proteção "último admin ativo" — regras de negócio válidas e difíceis de reconstituir via Cargo.

- **Remover Cargo completamente e operar só com Role**: Rejeitado. Elimina o valor de organização social e a feature de diferenciação para grupos maiores. A implementação já está feita sem custo marginal relevante.

- **Adicionar modo de configuração "Modo Simples / Modo Avançado" para RBAC**: Considerado, mas prematuro. O modelo atual com MORADOR pleno já funciona como "Modo Simples" implicitamente — não precisa de toggle. Criar essa abstração agora seria over-engineering.

---

## Risk & Gap Analysis

### Requirement Ambiguities

- **"Validar premissas comparando com dados reais"**: O requisito pede validação de mercado, mas não especifica quais premissas específicas do RBAC devem ser questionadas. A análise tomou como escopo as premissas que mostram maior risco de descolamento — o padrão de uso de Cargo em grupos residenciais.

- **"Ajustar o modelo"**: Não está claro se "ajustar" significa mudar o código (schema, guard, controller) ou apenas a narrativa/UX. A análise conclui que o código está correto; o ajuste necessário é de **posicionamento de produto e UX da feature de Cargo**.

- **Escopo do RBAC no contexto de Privacidade de Gastos**: A análise anterior identificou que `VISUALIZADOR` não deveria conseguir editar a renda de membros. Isso já está coberto pelo `@Roles(ADMIN)` em `POST /membros`. Mas o alinhamento entre permissões de Cargo e a lógica de `isPrivate` não foi explicitado — um VISUALIZADOR com `LANCAR_GASTOS` pode criar gastos privados?

### Edge Cases

- **VISUALIZADOR + Cargo com LANCAR_GASTOS lança um gasto privado**: O guard libera o acesso. O `isPrivate` flag é controlado no DTO do gasto — qualquer membro que consiga lançar pode marcar como privado. Não há validação de "apenas MORADOR pode criar gasto privado". Pode ser intencional, mas deve ser uma decisão explícita.

- **Cargo sem nenhuma permissão atribuída**: Válido pelo schema (`permissoes @default([])`). Para MORADOR, não altera nada. Para VISUALIZADOR, torna o Cargo puramente cosmético (sem acesso adicional). A UX deve comunicar isso claramente — um Cargo sem permissões não dá acesso extra.

- **Grupo residencial de 2 pessoas (casal)**: Cenário mais comum. Tipicamente: um é ADMIN (quem criou), outro é MORADOR. Cargo nunca será configurado nesse contexto — complexidade desnecessária visível na UI. A feature de Cargo deve ser colapsável/oculta para grupos pequenos ou apresentada como "opcional para grupos maiores".

- **Membro ADMIN atribuído a um Cargo**: Tecnicamente possível. O guard faz ADMIN passar antes de verificar qualquer coisa — o Cargo é completamente ignorado para ADMIN. Isso é correto, mas a UI não deve mostrar a seleção de Cargo para membros ADMIN, evitando confusão.

- **Novo membro sem Cargo em tenant com Cargos configurados**: O padrão é `cargoId = null`. O guard trata isso corretamente (sem NullPointerError). A UX de onboarding de novo membro deve indicar que atribuir Cargo é opcional.

### Technical Risks

- **Semantics drift do @Permissoes decorator**: O decorator `@Permissoes()` está atualmente aplicado sempre junto com `@Roles(ADMIN, MORADOR)`. Se no futuro uma rota receber apenas `@Permissoes()` sem `@Roles`, o MORADOR sem cargo seria bloqueado — comportamento diferente do esperado intuitivamente. Esse padrão precisa ser documentado como convenção de equipe (ver Norms no prompt).

- **Sincronização manual do type Permissao no frontend**: `src/models/entities/Permissao.ts` é um union type mantido manualmente em sincronia com o enum Prisma do backend. Qualquer adição de novo valor no schema Prisma que não seja refletida nesse arquivo causará type mismatch silencioso no frontend (não há verificação automática em CI). Risco baixo no estágio atual, mas cresce com a evolução do produto.

- **Performance do guard com include cargo**: O `findFirst` com `include: { cargo: true }` faz um JOIN em toda requisição protegida. Volume esperado (< 20 membros por tenant) torna o impacto desprezível, mas o pattern de "JOIN em todo request" deve ser monitorado se o produto escalar para grupos maiores ou múltiplas casas simultâneas.

- **Ausência de teste de integração E2E do fluxo VISUALIZADOR + Cargo**: Os testes unitários do guard cobrem os cenários de happy path. Não há teste que valide o fluxo completo: criar cargo com permissão → atribuir a VISUALIZADOR → fazer request → confirmar acesso. Isso é um gap de cobertura para o AC mais crítico do RBAC.

### Acceptance Criteria Coverage

| AC# | Premissa de Negócio | Evidência / Descolamento | Addressable? | Gaps/Notas |
|-----|---------------------|--------------------------|--------------|------------|
| 1 | Casais/repúblicas operam por confiança, não hierarquia corporativa | **Confirmado**: 85% dos casais preferem modelo híbrido; produto DIVI posiciona-se como ledger colaborativo, não ERP doméstico | Sim | MORADOR tem acesso pleno por design — sem fricção desnecessária. Cargo é aditivo, não restritivo. ✅ |
| 2 | O Cargo tem valor real para o público-alvo | **Parcialmente confirmado**: para casais (2 pessoas), Cargo é overhead. Para repúblicas (5–10 pessoas), a sinalização social de "Tesoureiro" / "Responsável de contas" tem valor organizacional real | Parcial | Valor confirmado para grupos maiores. Para casais, é noise de UI. Gap: a UX deve diferenciar esses contextos (ex: ocultar Cargo para grupos pequenos). |
| 3 | Permissões granulares são necessárias agora | **Não confirmado como necessidade primária**: o caso de uso principal que as justifica (VISUALIZADOR com acesso parcial) é cenário secundário no público de casais/grupos pequenos | Parcial | O código é correto e não prejudica. O risco é de over-engineering de UX — apresentar 5 checkboxes de permissão para um casal que nunca vai usar. Gap: apresentar permissões como feature "para grupos maiores" com defaults inteligentes. |
| 4 | ADMIN como papel de governança da moradia alinha com realidade | **Totalmente confirmado**: quem funda a casa tem responsabilidade diferenciada (paga o aluguel, assina o contrato). ADMIN para fundador é natural e esperado | Sim | Sem descolamento. Regra "último ADMIN ativo" também válida — ninguém quer uma moradia sem dono. ✅ |
| 5 | VISUALIZADOR tem cases de uso legítimos | **Confirmado**: filho adulto dependente, contador externo, ex-parceiro em transição, convidado temporário. Combinação VISUALIZADOR + Cargo é o case de mais valor imediato do RBAC de Cargo | Sim | Caso de uso confirmado. Gap: a UX de criação de membro deve apresentar exemplos concretos para VISUALIZADOR, não apenas o nome da role. |
| 6 | O bug de persistência do cargoId impedia o RBAC de funcionar | **Confirmado e corrigido**: `persistirMembro` agora inclui `cargoId ?? null` no create e update. Teste unitário adicionado em `membro.service.spec.ts` | Sim | Corrigido. ✅ |
