# Spec: Refatoração de Contas Fixas para Centavos (Alineamento com GEMINI.md)

Este documento especifica a refatoração do tratamento financeiro de Contas Fixas (templates de lançamentos recorrentes), eliminando o uso de números de ponto flutuante (floats) no domínio, nos repositórios e no ViewModel, em estrito alinhamento com as diretrizes do [GEMINI.md](../../../GEMINI.md).

## Cenário Atual e Problema

1. A interface `ContaFixa` define a propriedade `fixedValue` como `number | null`, representando valores monetários em reais (floats).
2. Nos templates de contas padrão, os valores sugeridos são definidos em float (ex: `1500.00` e `120.00`).
3. O repositório Supabase possui uma coluna chamada `fixed_value_centavos`, porém persistia o valor bruto em reais (ex: `1500` em vez de `150000`), fazendo com que o nome da coluna fosse inconsistente com o seu conteúdo de dados real.
4. O serviço de lançamento (`LancamentoService`) recebia o valor em reais e realizava conversão posterior (`Dinheiro.deReais`), trafegando floats pela borda do domínio.

## Proposta de Solução

### 1. Modificação da Entidade de Domínio
A interface [ContaFixa.ts](../../../src/models/entities/ContaFixa.ts) será alterada de:
```typescript
export interface ContaFixa {
  id: string
  name: string
  icon: string
  fixedValue: number | null
  defaultSplit: string[]
}
```
Para:
```typescript
export interface ContaFixa {
  id: string
  name: string
  icon: string
  fixedValueCentavos: number | null
  defaultSplit: string[]
}
```

### 2. Adaptação dos Repositórios e Tolerância a Falhas

#### Supabase (`SupabaseContaFixaRepository`)
- Gravar o valor em centavos reais na coluna `fixed_value_centavos`.
- Ler e mapear a coluna diretamente para a propriedade `fixedValueCentavos`.

#### LocalStorage (`LocalStorageContaFixaRepository`)
Para manter a compatibilidade com registros salvos em versões anteriores no LocalStorage (que utilizavam `fixedValue` em reais):
- Ao listar as contas, se um registro contiver `fixedValue` mas não contiver `fixedValueCentavos`, realizar a migração em tempo de leitura: `fixedValueCentavos = Math.round(registro.fixedValue * 100)`.
- Ao salvar novas contas, persistir utilizando a nova propriedade `fixedValueCentavos`.

### 3. Ajuste de Assinatura dos Serviços
A assinatura de `lancarGastoContaFixa` no serviço de lançamento de gastos e viewmodels será ajustada para trafegar `valorCentavos: number` em vez de `valorTotal` em float/reais.
No `LancamentoService`, o gasto será criado usando `Dinheiro.deCentavos(dados.valorCentavos)`.

### 4. Ajustes nas Views e Validação
As views continuarão aceitando a digitação em reais do usuário para fins de UX, mas realizarão a conversão para centavos (`* 100`) antes de propagar as ações para o ViewModel e Domínio.
- [PopupLancarContaFixa.vue](../../../src/views/components/ledger/PopupLancarContaFixa.vue)
- [BottomSheetConfigurarContaFixa.vue](../../../src/views/components/ledger/BottomSheetConfigurarContaFixa.vue)

## Plano de Verificação

### Testes Unitários
- Todos os testes de ViewModel (`useContasFixas.test.ts`, `useDashboardViewModel.test.ts`) e repositórios locais deverão ser atualizados e passar sem erros.
- Executar `npx vitest run` para atestar a correção do comportamento.
