## ADDED Requirements

### Requirement: Registro de acerto via Pix ou Dinheiro
O sistema SHALL permitir que os acertos e compensações de netting entre moradores sejam realizados exclusivamente através de Pix ou Dinheiro.

#### Scenario: Registrar acerto com Pix
- **WHEN** o morador escolhe registrar o acerto com o método Pix
- **THEN** o sistema SHALL salvar o lançamento de acerto com o método "pix" e atualizar os saldos correspondentes.

#### Scenario: Registrar acerto com Dinheiro
- **WHEN** o morador escolhe registrar o acerto com o método Dinheiro
- **THEN** o sistema SHALL salvar o lançamento de acerto com o método "cash" e atualizar os saldos correspondentes.

## REMOVED Requirements

### Requirement: Registro de acerto via Ajuste contábil
**Reason**: A funcionalidade de Ajuste contábil (mutual) adicionava complexidade e carga cognitiva desnecessárias para os usuários no momento de registrar o acerto de contas (netting).
**Migration**: O fluxo de acerto de compensação passa a aceitar apenas os métodos de baixa Pix e Dinheiro. Os registros históricos do método "Ajuste" serão preservados de forma passiva no backend.
