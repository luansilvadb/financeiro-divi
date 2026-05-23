# Especificação Técnica: Restrições de Negócio no Parcelamento (Mãe/Filhas e Desfazimento Reverso)

## Contexto e Objetivo
Evitar inconsistências contábeis e a remoção acidental de dados financeiros passados através de gastos parcelados. A especificação assegura que:
1. Um gasto parcelado só pode ser gerenciado/editado a partir de sua origem (a parcela "mãe", a primeira do grupo).
2. O estorno (exclusão) de parcelas deve ocorrer de trás para frente (da mais distante no futuro de volta para a primeira/mãe), impedindo parcelas órfãs ou a remoção em cascata descontrolada que apague dados de faturas já liquidadas.

---

## Detalhamento das Regras

### 1. Edição Restrita à Parcela Mãe
* **Validação:** Um gasto parcelado possui `grupoParcelasId` e informações de `installments` (parcelas restantes para vencer) e `totalInstallments` (total de parcelas original).
* A primeira parcela (mãe) é aquela onde `installments === totalInstallments` (ou a parcela com o maior valor de `installments` ativo no grupo).
* Qualquer tentativa de chamar `atualizarGastoCompleto` fornecendo o ID de uma parcela filha (`installments < totalInstallments`) será rejeitada com o erro:
  > *"Este lançamento faz parte de um parcelamento. Para editá-lo, acesse a primeira parcela no período de origem do gasto."*
* A edição da parcela mãe atualiza ela mesma e replica as mudanças (descrição, valor da parcela, divisões de rateio) apenas para as parcelas filhas subsequentes que estão em faturas `ABERTA`.

### 2. Exclusão Cronológica Reversa (C ➔ B ➔ A)
* A exclusão deixa de ser executada em cascata automática de todas as parcelas do grupo. 
* Cada chamada a `excluirGasto` atuará individualmente e pontualmente sobre a parcela cujo ID foi fornecido.
* **Validação de Ordem:** Antes de prosseguir com a exclusão de uma parcela, o sistema consulta todos os gastos do mesmo `grupoParcelasId`. A exclusão só é permitida se **não houver nenhuma outra parcela ativa no sistema com o valor de `installments` menor do que a parcela atual** (ou seja, se a parcela atual for a última parcela ativa no tempo).
* Se houver parcelas subsequentes (com `installments` menor do que a atual), o sistema bloqueia a exclusão lançando o erro:
  > *"Não é possível excluir esta parcela pois existem parcelas subsequentes ativas. Exclua as parcelas futuras deste gasto primeiro."*

---

## Componentes Afetados

### [GastoService.ts](file:///d:/projetos/divi/src/models/services/GastoService.ts)
* **Método `excluirGasto`:**
  * Remover a exclusão automática em cascata (`excluirMuitos`).
  * Adicionar validação de ordenação reversa: buscar todas as parcelas do mesmo `grupoParcelasId`. Verificar se a parcela sendo excluída é de fato a última ativa (com o menor valor de `installments`). Se não for, lançar o erro.
  * Proceder com a exclusão individual da parcela e a limpeza do netting do respectivo período.
* **Método `atualizarGastoCompleto`:**
  * Adicionar validação para verificar se o `original.installments === original.totalInstallments` (ou se é a primeira do grupo). Se não for, lançar o erro de bloqueio de edição.

---

## Plano de Testes

### Testes Unitários em `GastoService.test.ts`
1. **Edição:**
   * Garantir que tentar editar uma parcela filha (onde `installments < totalInstallments`) lança erro e impede a alteração.
   * Garantir que a edição da parcela mãe (onde `installments === totalInstallments`) é permitida e atualiza as parcelas filhas abertas de forma consistente.
2. **Exclusão:**
   * Garantir que tentar excluir uma parcela (ex: A ou B) quando a subsequente (ex: C) ainda existe lança erro de bloqueio.
   * Garantir que excluir a última parcela do grupo (C) funciona normalmente e de forma individual.
   * Garantir que, após excluir C, a exclusão da parcela anterior (B) passa a ser permitida.
