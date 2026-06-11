## MODIFIED Requirements

### Requirement: Nomenclatura descritiva de ViewModels
Todas as variáveis e funções no `useDashboardViewModel.ts` SHALL utilizar nomes descritivos em português ou inglês (seguindo a convenção do projeto) que revelem sua intenção imediata, sem necessidade de consultas a outros arquivos. Além disso, a lógica de filtragem SHALL distinguir claramente entre despesas operacionais e acertos de saldo.

#### Scenario: Renomeação de abreviações e clareza de filtros
- **WHEN** uma variável como `cx`, `pd` ou `sel` for encontrada
- **THEN** ela SHALL ser renomeada para termos como `cartoesService`, `periodosState` ou `gastosSelecionados`.
- **AND** os filtros de gastos SHALL utilizar predicados nomeados como `isGastoValidoParaSoma` ou `isAcertoDeSaldo`.
