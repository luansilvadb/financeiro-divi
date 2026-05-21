# Design Spec: Refatoração MVVM e Limpeza da Codebase

Este documento descreve o plano arquitetural para refatorar a codebase do DIVI, focando na adoção rigorosa do padrão MVVM, na injeção de dependências para desacoplar as ViewModels dos adaptadores concretos, e na migração de regras de negócio complexas do controller/composable (ViewModel) para os serviços de domínio (Model).

## 1. Arquitetura Proposta (MVVM + Portas/Adaptadores)

Para garantir que a ViewModel não dependa diretamente de infraestrutura concreta (como o LocalStorage) ou implemente regras de persistência complexas diretamente, propomos o seguinte fluxo de dados:

```
[ View (Vue Component) ]
          │
          ▼
[ ViewModel (Vue Composable) ]
          │
          ▼ (Interage via interfaces de portas ou serviços de domínio)
[ Domain Services (Model) ]
          │
          ▼ (Portas / Interfaces de Repositório)
[ Ports (IGastoRepository, etc.) ]
          ▲
          │ (Implementação concreta)
[ Adapters (LocalStorageGastoRepository, etc.) ]
```

---

## 2. Componentes e Mudanças Planejadas

### 2.1. Criação de Serviços no Model (Camada de Domínio)

#### [NEW] `src/modules/ledger/core/services/GastoService.ts`
Isolar a regra de negócio de criação e parcelamento de despesas e empréstimos que hoje polui a ViewModel do Wizard (`useNovoLancamentoWizard`).

* **Responsabilidades**:
  * Receber instâncias de `IGastoRepository`, `IFaturaRepository`, `ICartaoRepository` no construtor.
  * Implementar método `lancarGastoOuEmprestimo(...)` contendo:
    * Validação de fluxos.
    * Distribuição/criação das parcelas futuras (`projetarGastosParcelados`).
    * Busca ou criação da fatura ativa no mês correspondente.

#### [NEW] `src/modules/ledger/core/services/FaturaRolloverService.ts`
Isolar a lógica pesada de fechamento de faturas, cálculo de netting final e criação de faturas do período subsequente.

* **Responsabilidades**:
  * Receber `IFaturaRepository`, `IGastoRepository` no construtor.
  * Executar a lógica de encerramento do mês atual, decremento de parcelas vigentes e lançamento de saldos carryover (Netting de Saldo Inicial).

---

### 2.2. Refatoração e Desacoplamento das ViewModels

#### [MODIFY] `useNovoLancamentoWizard.ts`
* Remover imports de repositórios concretos do escopo global.
* Receber as portas de persistência (`IGastoRepository`, `IFaturaRepository`, `ICartaoRepository`) via objeto de dependências opcional no composable.
* Delegar todo o processo de salvamento e projeção de parcelas futuras para o novo `GastoService`.

```typescript
export interface WizardDependencies {
  gastoRepository?: IGastoRepository
  faturaRepository?: IFaturaRepository
  cartaoRepository?: ICartaoRepository
  gastoService?: GastoService
}

export function useNovoLancamentoWizard(
  membros: { id: string; nome: string }[] = [],
  dependencies: WizardDependencies = {}
) {
  // Inicialização desacoplada
}
```

#### [MODIFY] `useDashboardViewModel.ts`
* Remover instanciações diretas de `new LocalStorageGastoRepository()`.
* Receber as portas/serviços de domínio através de injeção opcional de dependências.
* Substituir o uso de `useFaturaRollover` pela chamada direta ao novo `FaturaRolloverService`.

#### [MODIFY] `useFaturaRollover.ts`
* Limpar o composable para remover a lógica de persistência e repositórios. Ele se tornará uma ViewModel simples apenas para gerenciar o estado reativo local de lock (`isMonthLocked`). Ele delegará a execução do rollover para `FaturaRolloverService`.

---

### 2.3. Simplificação de Complexidade Ciclática e Código Morto

#### [MODIFY] `useDashboardCalculations.ts`
* Simplificar as assinaturas de funções para aceitar apenas tipos concretos (não usar uniões híbridas do tipo `Ref<T> | T` que causam ifs e condicionais complexos `'value' in ref`).
* Remover verificações redundantes e condicionais aninhados.

---

## 3. Plano de Verificação e Testes

* **Testes Unitários Existentes**: Como os repositórios reais serão injetados de forma opcional (usando defaults concretos em produção), a retrocompatibilidade é mantida.
* **Refatoração dos Testes**: Atualizar os arquivos `useDashboardViewModel.test.ts`, `useNovoLancamentoWizard.test.ts` e `useFaturaRollover.test.ts` para injetar os mocks diretamente nos construtores/composables, tornando os testes mais rápidos, limpos e sem acoplamento de `vi.mock` físico.
* **Validação**: Rodar `npx vitest run` e garantir que todos os 125 testes existentes continuem passando com 100% de sucesso.
