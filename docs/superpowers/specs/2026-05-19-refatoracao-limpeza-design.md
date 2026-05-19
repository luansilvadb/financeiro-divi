# Especificação de Design - Refatoração e Limpeza de Código Morto

## Contexto e Objetivo
Esta especificação detalha a refatoração e a higienização da codebase do projeto **Divi**. O foco principal é a eliminação de código morto (módulos e funções inativas), a redução de complexidade ciclomática na inicialização de dados financeiros e a densificação do projeto para garantir responsabilidades claras por arquivo.

O sistema atualmente usa as entidades `Gasto`, `Fatura` e a lógica reescrita de `useSaldosUnificados` para os cálculos financeiros em tempo real. Uma camada anterior baseada em `Transacao`, `Divisao` e `CalculadoraSaldos` permanece na codebase sem uso produtivo e será completamente eliminada.

## 1. Eliminação de Módulos Inativos (Ecossistema de Transações)
Os seguintes arquivos físicos constituem código morto e serão removidos por completo do repositório:

1. `src/modules/ledger/core/domain/Transacao.ts` e seu teste correspondente `Transacao.test.ts`.
2. `src/modules/ledger/core/domain/Divisao.ts`.
3. `src/modules/ledger/core/ports/ITransacaoRepository.ts`.
4. `src/modules/ledger/adapters/LocalStorageTransacaoRepository.ts` e seu teste `LocalStorageTransacaoRepository.test.ts`.
5. `src/modules/ledger/composables/useTransacoes.ts`.
6. `src/modules/ledger/core/services/CalculadoraSaldos.ts` e seus testes `CalculadoraSaldos.test.ts` / `CalculadoraSaldos.spec.ts`.
7. `src/modules/ledger/index.ts`.

### Ajuste em `src/modules/ledger/composables/useStorageSync.ts`
* Remover o import de `useTransacoes`.
* Remover a reação à chave de storage `divi_transactions` no escopo do listener `storage`.

## 2. Remoção de Métodos e Campos Mortos nos Composables Ativos
Iremos expurgar as seguintes propriedades e funções inativas dos composables que permanecem no sistema:

### `src/modules/ledger/composables/useCartoesEFaturas.ts`
* Remover as funções auxiliares `atualizarGastoDivisoesManual` e `atualizarGastoCompradorManual` e seus respectivos retornos no composable.

### `src/modules/ledger/composables/useNovoLancamentoWizard.ts`
* Remover a variável reativa `querDividirAgora` e seu retorno no composable.

### `src/modules/ledger/composables/useDashboardCalculations.ts`
* Remover os métodos `getCartaoNome`, `faturaTemAcertosAtivos`, `sugerirProximoPeriodo`, `getAdiantamento` e a propriedade calculada duplicada `totalFuturasVencer` (o componente `DashboardSaldos.vue` já calcula isso localmente de forma otimizada).

## 3. Redução de Complexidade Ciclomática (`useCartoesEFaturas.ts`)
Para reduzir a complexidade e aninhamento de condicionais no método `carregar()` do composable `useCartoesEFaturas.ts`, toda a lógica de desduplicação e migração de faturas duplicadas do LocalStorage será isolada em uma função helper pura no final do arquivo:

```typescript
async function desduplicarEMigrarFaturas(todasFaturas: Fatura[]): Promise<Fatura[]> {
  // Lógica de desduplicação e migração atual de faturas...
}
```

Dessa forma, o corpo da função `carregar()` reduz sua complexidade apenas para invocar a helper:
```typescript
todasFaturas = await desduplicarEMigrarFaturas(todasFaturas)
```

## Critérios de Sucesso e Validação
1. Todos os 130 testes existentes do Vitest devem continuar passando com sucesso.
2. O build de produção (`npm run build`) deve compilar sem nenhum erro de tipagem ou referência quebrada.
