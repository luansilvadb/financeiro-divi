# Capability: Semântica de ViewModel do Dashboard

## Purpose
Melhorar a clareza e manutenibilidade do ViewModel principal do dashboard através de nomenclatura descritiva e documentação de lógicas complexas.

## Requirements

### Requirement: Nomenclatura descritiva de ViewModels
Todas as variáveis e funções no `useDashboardViewModel.ts` SHALL utilizar nomes descritivos em português ou inglês (seguindo a convenção do projeto) que revelem sua intenção imediata, sem necessidade de consultas a outros arquivos. Além disso, a lógica de filtragem SHALL distinguir claramente entre despesas operacionais e acertos de saldo.

#### Scenario: Renomeação de abreviações e clareza de filtros
- **WHEN** uma variável como `cx`, `pd` ou `sel` for encontrada
- **THEN** ela SHALL ser renomeada para termos como `cartoesService`, `periodosState` ou `gastosSelecionados`.
- **AND** os filtros de gastos SHALL utilizar predicados nomeados como `isGastoValidoParaSoma` ou `isAcertoDeSaldo`.

### Requirement: Documentação de lógica complexa
Blocos de código que realizam cálculos de netting ou projeções futuras SHALL possuir comentários breves explicando a "física" do cálculo, se a nomenclatura não for suficiente.

#### Scenario: Explicação de netting
- **WHEN** o cálculo de compensação entre membros for realizado
- **THEN** o código SHALL ser legível o suficiente para que um desenvolvedor entenda o fluxo de dinheiro sem depuração profunda.
