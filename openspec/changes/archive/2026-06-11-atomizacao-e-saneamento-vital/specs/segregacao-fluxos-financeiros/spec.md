## ADDED Requirements

### Requirement: Fluxo Especializado de Despesa
O backend SHALL processar despesas comuns validando o comprador, o método de pagamento e a fatura associada.

#### Scenario: Lançamento em Fatura de Cartão
- **WHEN** uma despesa é lançada com método "card"
- **THEN** o sistema SHALL assegurar a existência da fatura para o período e vincular o gasto a ela, aplicando parcelamento se solicitado.

### Requirement: Fluxo Especializado de Empréstimo
O sistema SHALL tratar empréstimos como dívidas diretas entre dois membros, sem necessariamente envolver rateio entre outros.

#### Scenario: Registro de Empréstimo Pessoal
- **WHEN** um fluxo de "loan" é processado
- **THEN** o sistema SHALL marcar o gasto com `isLoan: true` e preencher obrigatoriamente o `borrowerId`.

### Requirement: Registro de Acerto de Netting
O sistema SHALL permitir o registro de pagamentos de dívidas (acertos) de forma distinta de despesas de consumo.

#### Scenario: Acerto entre membros
- **WHEN** um acerto é registrado via dashboard
- **THEN** o sistema SHALL marcar o gasto com `isSettlement: true` e registrar os detalhes de `from` e `to` no campo `settlementDetails`.
