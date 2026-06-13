# SPDD Analysis: Rastreamento de Gastos à Vista e Empréstimos

## Original Business Requirement
no wizard no passo 1 se eu selecionar pix ou dinheiro, eu consigo concluir todo processo até finalizar, a inserção acontece no banco porém não apresenta ao usuario no frontend, isso ta acontecendo no 'pix ou dinheiro' e emprestimo pessoal, qualquer parte do sistema não consegue rastrear essa movimentação, atividades, saldo unificado etc

## Domain Concept Identification

### Existing Concepts (from codebase)
- **Gasto (Expense/Transaction)**: Representa uma transação financeira registrada pelo usuário. Possui um método de pagamento (`method`) que pode ser 'pix', 'cash' (dinheiro) ou 'card' (cartão), e um `faturaId` opcional que associa o gasto a um período/fatura de cartão de crédito. Relaciona-se com o Comprador (quem pagou), Divisões de Gasto (com quem divide) e, se aplicável, com um Cartão de Crédito e Fatura.
- **DivisaoGasto (Expense Split)**: Representa a fração do valor total do gasto atribuída a cada morador. Relaciona-se com o Gasto e com o MembroCasa.
- **Fatura (Invoice)**: Representa o fechamento de um período para um cartão ou para o caixa geral (Pix/Dinheiro virtual). Permite agrupar os gastos do respectivo ciclo.
- **MembroCasa (Household Member)**: Representa um participante da moradia. Relaciona-se com Usuario, Tenant (moradia), Gastos e Divisões.

### New Concepts Required
- Nenhum conceito novo é requerido, pois o problema é de mapeamento/rastreabilidade de conceitos existentes no fluxo de exibição e cálculo de saldos.

### Key Business Rules
- **Pertencimento ao Período**: Gastos à vista (sem `faturaId`, ex: Pix e Dinheiro) e Empréstimos Pessoais devem pertencer ao período (mês/ano) correspondente à sua data de criação (`createdAt`).
- **Mapeamento de Data de Criação**: A data de criação (`createdAt`) registrada no banco de dados deve ser preservada e consumida fielmente pelo frontend para que os filtros temporais de exibição de atividades e saldos unificados funcionem corretamente em qualquer período selecionado.

---

## Strategic Approach

### Solution Direction
- Ajustar o mapeamento no frontend para garantir que a propriedade `createdAt` do DTO seja parseada e injetada no construtor da entidade `Gasto`.
- Adicionar o campo `createdAt` na interface `GastoDto` do frontend (tanto no DTO de recebimento quanto na serialização/mapeamento para DTO antes do envio ao backend) em [HttpGastoRepository.ts](file:///d:/projetos/financeiro-divi/src/models/repositories/http/HttpGastoRepository.ts).
- Garantir que a propriedade `createdAt` seja inicializada corretamente no construtor de [Gasto.ts](file:///d:/projetos/financeiro-divi/src/models/entities/Gasto.ts) no frontend quando fornecida como string de data do backend.

### Key Design Decisions
- **Mapeamento Explícito de `createdAt`**: Optou-se por incluir o mapeamento explícito do campo `createdAt` no `HttpGastoRepository` no frontend, pois a entidade `Gasto` já suporta o campo em seu construtor e propriedades, mas a camada de transporte HTTP (DTO) o ignorava, fazendo com que ele assumisse `new Date()` (data de hoje) e perdesse a rastreabilidade temporal após recarregar a página ou mudar de período.
  *Trade-offs*: Aumenta ligeiramente a interface do DTO no frontend para corresponder ao modelo do banco de dados, mas é necessário para a corretude dos cálculos temporais e consistência de dados.

### Alternatives Considered
- **Salvar Gastos Pix com um `faturaId` virtual do Pix no Banco**: Gerar um `faturaId` virtual no backend para o Pix no momento da criação (ex: `PIX_DEFAULT_ID-mes-ano`).
  *Por que foi rejeitado*: O sistema já possui regras no frontend (`gastoPertenceAoPeriodo` em `gastoPeriodo.ts`) específicas para gastos com `faturaId` nulo usando o `createdAt`. Alterar a lógica do backend para forçar um `faturaId` virtual para Pix poderia quebrar outras partes que diferenciam gastos com e sem cartão, além de não resolver o problema de perda da data real de criação (`createdAt`) de outros gastos/empréstimos no frontend.

---

## Risk & Gap Analysis

### Requirement Ambiguities
- Nenhuma ambiguidade identificada. O comportamento esperado de que gastos Pix/Dinheiro e Empréstimos apareçam nos feeds de atividade e influenciem os saldos do respectivo mês de lançamento está claro.

### Edge Cases
- **Fuso Horário no Parse de Data**: A string de data retornada do banco de dados pelo NestJS está em formato ISO (UTC). O frontend deve converter essa data adequadamente usando `new Date(item.createdAt)` para evitar discrepâncias de fuso horário que poderiam mover uma transação de final de mês para o mês seguinte/anterior. A lógica existente de `gastoPertenceAoPeriodo` e o construtor do `Gasto` já usam `new Date()`, que lida com o parse local de strings ISO corretamente.

### Technical Risks
- **Testes Unitários Quebrados no Frontend**: Alterações no construtor ou no mapeamento de `Gasto` podem impactar fixtures de testes existentes no frontend. Será necessário revisar e atualizar os testes do `HttpGastoRepository` se houver necessidade.

### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1 | Gastos lançados via Pix ou Dinheiro devem aparecer no feed de atividades do respectivo mês de lançamento. | Yes | Será resolvido mapeando o `createdAt` no frontend para que a filtragem por período funcione. |
| 2 | Empréstimos pessoais devem aparecer no feed de atividades do respectivo mês de lançamento. | Yes | Resolvido pelo mesmo mapeamento de `createdAt` uma vez que empréstimos também têm `faturaId` nulo. |
| 3 | Gastos Pix/Dinheiro e Empréstimos devem influenciar o cálculo de Saldo Unificado e Netting do período correspondente. | Yes | Resolvido, pois os saldos utilizam a lista filtrada de gastos do período ativo. |
