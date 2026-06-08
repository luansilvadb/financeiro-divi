## ADDED Requirements

### Requirement: Nomenclatura descritiva de ViewModels
Todas as variáveis e funções no `useDashboardViewModel.ts` SHALL utilizar nomes descritivos em português ou inglês (seguindo a convenção do projeto) que revelem sua intenção imediata, sem necessidade de consultas a outros arquivos.

#### Scenario: Renomeação de abreviações
- **WHEN** uma variável como `cx`, `pd` ou `sel` for encontrada
- **THEN** ela SHALL ser renomeada para termos como `cartoesService`, `periodosState` ou `gastosSelecionados`.

### Requirement: Documentação de lógica complexa
Blocos de código que realizam cálculos de netting ou projeções futuras SHALL possuir comentários breves explicando a "física" do cálculo, se a nomenclatura não for suficiente.

#### Scenario: Explicação de netting
- **WHEN** o cálculo de compensação entre membros for realizado
- **THEN** o código SHALL ser legível o suficiente para que um desenvolvedor entenda o fluxo de dinheiro sem depuração profunda.
