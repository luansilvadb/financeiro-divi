## ADDED Requirements

### Requirement: Resolução unificada de cartão
O sistema SHALL fornecer uma função pura `resolverCartao` que encapsula a lógica de resolução de cartão de pagamento, eliminando duplicação entre services.

#### Scenario: Pagamento via PIX (sem cartão)
- **WHEN** o método de pagamento é `pix`
- **THEN** a função SHALL retornar `cartaoId: 'PIX_DEFAULT_ID'`, `cardOwner: null`, e `responsavelFaturaId` igual ao `compradorId`

#### Scenario: Pagamento via cartão com cardOwnerId válido (match por ID)
- **WHEN** o método de pagamento é `card` e o `cardOwnerId` corresponde ao `id` de um cartão existente
- **THEN** a função SHALL retornar o `id` do cartão como `cartaoId`, o `responsavelPadraoId` do cartão como `cardOwner`, e o `responsavelPadraoId` como `responsavelFaturaId`

#### Scenario: Pagamento via cartão com cardOwnerId válido (match por responsavelPadraoId)
- **WHEN** o método de pagamento é `card` e o `cardOwnerId` corresponde ao `responsavelPadraoId` de um cartão existente
- **THEN** a função SHALL retornar o `id` do cartão como `cartaoId`, o `responsavelPadraoId` do cartão como `cardOwner`, e o `responsavelPadraoId` como `responsavelFaturaId`

#### Scenario: Pagamento via cartão sem match de cardOwnerId
- **WHEN** o método de pagamento é `card` e o `cardOwnerId` não corresponde a nenhum cartão
- **THEN** a função SHALL usar o primeiro cartão disponível como fallback, ou `PIX_DEFAULT_ID` se nenhum cartão existir

#### Scenario: Pagamento via cartão sem cardOwnerId
- **WHEN** o método de pagamento é `card` e o `cardOwnerId` é `null`
- **THEN** a função SHALL usar o primeiro cartão disponível como fallback, ou `PIX_DEFAULT_ID` se nenhum cartão existir

### Requirement: Consumo da função pelos services existentes
`GastoService` e `LancamentoService` SHALL utilizar a função `resolverCartao` em vez de implementar lógica inline duplicada.

#### Scenario: GastoService usa resolverCartao
- **WHEN** `GastoService.atualizarGastoCompleto` precisa resolver o cartão de pagamento
- **THEN** SHALL delegar para `resolverCartao` em todas as ocorrências (linhas que hoje contêm lógica de resolução inline)

#### Scenario: LancamentoService usa resolverCartao
- **WHEN** `LancamentoService.lancarGastoOuEmprestimo` precisa resolver o cartão de pagamento
- **THEN** SHALL delegar para `resolverCartao` em vez de implementar resolução inline
