# SPDD Analysis: Alinhamento do Modelo de Negócios com a Realidade

## Original Business Requirement
itere o modelo de negocio e compara se reflete a realidade para que não criamos app que tenha resolver um problema que não existe, precisamos de solução condizentes com a realidade.

## Domain Concept Identification

#### Existing Concepts (from codebase)
- **Tenant (Moradia)**: Representa o isolamento de dados de um grupo residencial (moradia, casal, república). Reflete perfeitamente a realidade de grupos fechados que dividem contas.
- **Usuario**: Credencial de acesso à plataforma.
- **MembroCasa**: Representação de um participante da moradia. Pode ser um membro virtual/órfão (`userId` opcional) ou linkado a um `Usuario`. Reflete bem a realidade, pois permite calcular gastos de pessoas que não usam o app diretamente (ex: crianças ou moradores analógicos).
- **CargoCasa**: Tabela de cargos e permissões customizáveis (`permissoes String[]` no Prisma) dentro de cada moradia. **[Desalinhado / Over-engineering]**
- **Cartao**: Cartão de crédito de um morador com responsável padrão e data de fechamento.
- **Fatura**: Fatura mensal do cartão de crédito de um morador.
- **Gasto**: Registro de transação financeira, seja ela despesa comum, empréstimo (`isLoan`) ou liquidação de saldo (`isSettlement`).
- **DivisaoGasto**: Proporção do valor de um gasto distribuído para cada membro da casa.
- **ContaFixa**: Despesa recorrente da moradia (ex: aluguel, internet) com rateio padrão definido por JSON.

#### New Concepts Required
- **Gasto Direto / Avulso (Sem Fatura)**: Transações feitas em dinheiro, PIX ou débito em conta que ocorrem imediatamente e de forma avulsa, sem depender ou estar associadas a uma fatura mensal de cartão de crédito. Atualmente, este conceito não existe de forma nativa no banco de dados, sendo forçado a se vincular a faturas e cartões virtuais criados via gambiarra de software.

#### Key Business Rules
- **Independência de Cartão**: Pagamentos instantâneos (PIX, Débito, Dinheiro) não devem possuir ciclos de fatura. O débito de saldo ocorre no momento da criação da transação.
- **Estrutura de Confiança Mutualista**: Em uma moradia compartilhada, o controle de acesso é baseado em confiança mútua e não em governança corporativa. As regras de cargos e permissões devem ser simplificadas para evitar atrito operacional e evitar que um morador seja impedido de lançar uma despesa urgente por restrição de sistema.
- **Flexibilidade no Cadastro de Cartões**: Qualquer morador ativo deve poder cadastrar cartões que são de interesse do grupo ou pertencem a outros moradores sem bloqueios de segurança corporativos (como a regra atual de que o usuário só pode cadastrar cartões nos quais ele próprio é o responsável padrão).

---

## Strategic Approach

#### Solution Direction
1. **Tornar `faturaId` Opcional no Prisma Schema**: 
   Alterar o campo `faturaId` em `Gasto` no `schema.prisma` para `String? @map("fatura_id")`. Isso permite que transações em PIX, dinheiro e débito sejam registradas diretamente de forma isolada, eliminando o artifício técnico de criar cartões/faturas fictícios (`PIX_DEFAULT_ID` e `PIX_SYSTEM_OWNER`) em tempo de execução no frontend e backend.
2. **Depreciação de `CargoCasa` com Permissões Granulares**: 
   Substituir a complexidade de regras baseadas em tabelas de permissões por um modelo simples de flags ou roles básicas integradas no próprio `MembroCasa` (ex: Proprietário do Grupo vs. Membro Comum).
3. **Eliminar Restrições Rígidas de Posse de Cartões**:
   Remover a validação de segurança no backend que impede um usuário de salvar um cartão se ele não for o responsável padrão. Em moradias compartilhadas, é comum que uma pessoa gerencie as finanças e cadastre cartões de membros que não têm facilidade com tecnologia.

#### Key Design Decisions
- **Decisão**: Alterar o Schema do Prisma para tornar `faturaId` opcional vs. Manter a emulação de PIX no frontend.
  - *Trade-offs*: Tornar opcional requer alteração no banco e migração SQL, mas limpa todo o fluxo técnico de resolvers do frontend, remove faturas falsas do banco, e reduz a chance de erros de integridade ou confusão no dashboard de saldos.
  - *Recomendação*: Alterar o schema, pois resolve o problem técnico na raiz e reflete o fluxo real do dinheiro.
- **Decisão**: Depreciar `CargoCasa` em prol de `Role` simples (ADMIN, MORADOR, VISUALIZADOR).
  - *Trade-offs*: Simplifica drasticamente a manutenção do banco e reduz a complexidade ciclomática de cadastros de moradores, eliminando a tela de "gerenciar cargos" que é de baixa utilidade em contextos residenciais.
  - *Recomendação*: Seguir com a simplificação.

#### Alternatives Considered
- **Manter a Emulação de Cartão Virtual "PIX" no Banco**: Rejeitado, pois introduz poluição nos relatórios mensais e nas faturas do banco de dados, exigindo que o código ignore registros artificiais (`PIX_DEFAULT_ID`) ao listar relatórios financeiros reais do usuário.

---

## Risk & Gap Analysis

#### Requirement Ambiguities
- **Fluxo de Caixa vs. Fechamento de Mês**: Sem faturas virtuais para PIX, como as despesas avulsas são agrupadas para fechamento de balanço? Na realidade, despesas avulsas são agrupadas por data de competência (mês e ano da transação) e não por uma entidade `Fatura` física. Isso precisa estar claro na lógica de cálculo de saldos.

#### Edge Cases
- **Transição de Gastos Antigos**: Gastos legados que já apontavam para faturas com ID `PIX_DEFAULT_ID` precisarão ser tratados em uma migração de dados ou continuar funcionando retroativamente no backend.
- **Membro Órfão sem Usuário como Responsável**: Se permitirmos que qualquer usuário cadastre cartões de qualquer membro, o sistema precisa garantir que o `responsavelPadraoId` pertença a um membro válido daquela moradia (`tenantId`), evitando cartões vinculados a moradores de outras casas.

#### Technical Risks
- **Rompimento de Chave Estrangeira (FK)**: A alteração no schema do Prisma exige reavaliação de índices e chaves estrangeiras de `Gasto` com `Fatura`.
- **Efeitos de Arredondamento e Conversão**: A conversão de faturas que deixam de existir para agrupamentos mensais dinâmicos pode alterar levemente a exibição de históricos de balanço se o cálculo de netting não for idempotente por datas.

#### Acceptance Criteria Coverage
| Ref. | Proposta / Critério | Aderência Realidade | Notas / Gaps |
|------|---------------------|-------------------|--------------|
| 1 | Tornar `faturaId` opcional | Total | Remove a aberração técnica de "faturas de PIX". |
| 2 | Depreciar `CargoCasa` granular | Total | Elimina controle de segurança burocrática inútil para famílias. |
| 3 | Permitir cadastro cooperativo de cartões | Total | Permite que membros gerenciem dados de terceiros da mesma moradia. |
| 4 | Agrupamento por competência de data | Total | Substitui a necessidade de "fatura virtual" para transações instantâneas. |
