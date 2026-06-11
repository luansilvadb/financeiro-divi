## Why

O sistema atual apresenta sinais de entropia em seus pontos mais críticos: o wizard de lançamento é um monólito de interface e o modelo de Gasto tenta abraçar responsabilidades divergentes (despesas, empréstimos e acertos). Este saneamento visa restaurar a clareza e a vitalidade do código, garantindo que cada bifurcação tenha uma razão declarável e que o organismo-código pulse sem névoas.

## What Changes

- **Atomização do Wizard**: Decomposição do `NovoLancamentoWizard.vue` em componentes de passo independentes (`FlowSelection`, `ParticipantSelection`, `ValueInput`, etc.).
- **Saneamento do Gasto**: Refatoração da entidade `Gasto` e dos serviços associados para tratar despesas comuns, empréstimos e acertos como fluxos distintos, eliminando a lógica condicional excessiva.
- **Poda de Entropia**: Remoção de delegações redundantes nos serviços do backend e eliminação de código morto identificado durante a ausculta.
- **Clarificação de Runtime**: Padronização da inicialização do sistema no `App.vue` para evitar ciclos de carregamento redundantes.

## Capabilities

### New Capabilities
- `atomizacao-wizard-lancamento`: Especialização e isolamento de cada etapa do fluxo de entrada de dados financeiros.
- `segregacao-fluxos-financeiros`: Definição de contratos claros para os diferentes tipos de transação (Despesa, Empréstimo, Acerto).

### Modified Capabilities
- `semantica-viewmodel-dashboard`: Refinamento da lógica de filtragem e exibição no dashboard para refletir a nova segregação de fluxos.

## Impact

- **Frontend**: 
  - `src/views/screens/NovoLancamentoWizard.vue` (refatoração total)
  - `src/viewmodels/useDashboardViewModel.ts` (simplificação de filtros)
  - `src/models/entities/Gasto.ts` (especialização de tipos)
- **Backend**:
  - `backend/src/financeiro/lancamento.service.ts` (divisão de responsabilidades de salvamento)
  - `backend/src/financeiro/financeiro.service.ts` (limpeza de delegação redundante)
- **API**: Mudanças nos DTOs de Gasto para suportar a nova semântica.
