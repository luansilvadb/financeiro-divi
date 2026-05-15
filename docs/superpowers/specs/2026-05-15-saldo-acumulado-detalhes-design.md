# Spec: Saldo Acumulado (Running Balance) nos Detalhes do Morador

Para reforçar o entendimento de "extrato", a visualização detalhada de cada morador exibirá uma coluna de saldo acumulado, mostrando a evolução da dívida/crédito após cada lançamento.

## Escopo

- **Componente:** `DashboardSaldos.vue`.
- **Lógica:** Calcular o saldo progressivo baseando-se na ordem cronológica (já implementada).
- **Interface:** Renomear colunas existentes e adicionar a nova coluna "Acumulado".

## Design Técnico

### Lógica de Cálculo (`getMemberDetails`)

A função `getMemberDetails` será alterada para:
1. Calcular os dados de cada transação (pago, consumido, saldo líquido).
2. Ordenar cronologicamente (`a.data - b.data`).
3. Percorrer a lista ordenada mantendo uma variável `acumulado: Dinheiro`.
4. Adicionar o campo `acumulado` em cada item retornado.

```typescript
let runningBalance = Dinheiro.deCentavos(0);
const detailsWithBalance = sortedTransactions.map(item => {
  runningBalance = runningBalance.somar(item.net);
  return { ...item, acumulado: runningBalance };
});
```

### Alterações na Tabela (Template)

1. **Cabeçalho:**
   - "Saldo" -> "Lançamento".
   - Adicionar "Acumulado".
2. **Corpo:**
   - Adicionar célula com `m.acumulado`.
   - Aplicar cores dinâmicas (verde para positivo, vermelho para negativo).

## Verificação

1. Abrir o detalhe de um morador.
2. Validar que o valor do "Acumulado" na última linha corresponde ao saldo total exibido no card do morador.
3. Validar que a soma de "Lançamento" de uma linha com o "Acumulado" da linha anterior resulta no "Acumulado" da linha atual.
