# remover-ajuste-netting Specification

## Purpose
TBD - created by archiving change remover-ajuste-netting. Update Purpose after archive.
## Requirements
### Requirement: Registro de acerto via Pix ou Dinheiro
O sistema SHALL permitir que os acertos e compensações de netting entre moradores sejam realizados exclusivamente através de Pix ou Dinheiro.

#### Scenario: Registrar acerto com Pix
- **WHEN** o morador escolhe registrar o acerto com o método Pix
- **THEN** o sistema SHALL salvar o lançamento de acerto com o método "pix" e atualizar os saldos correspondentes.

#### Scenario: Registrar acerto com Dinheiro
- **WHEN** o morador escolhe registrar o acerto com o método Dinheiro
- **THEN** o sistema SHALL salvar o lançamento de acerto com o método "cash" e atualizar os saldos correspondentes.

