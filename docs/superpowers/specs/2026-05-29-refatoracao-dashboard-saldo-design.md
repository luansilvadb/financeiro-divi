# Design de Refatoração - Dashboard Saldo Service

Design para simplificar a estrutura de condicionais e melhorar a legibilidade no arquivo `DashboardSaldoService.ts` sem alterar as regras de negócios existentes.

## Objetivos
1. **Reduzir Complexidade Ciclomática**: Eliminar aninhamento excessivo e a lógica procedural encadeada na função principal.
2. **Clareza de Intenção**: Extrair decisões de negócio para predicados puros (funções isoladas com nomes semânticos).
3. **Código Morto**: Remover quaisquer construções obsoletas e redundantes.

## Mudanças Propostas

### [DashboardSaldoService.ts](file:///d:/projetos/divi/src/models/services/DashboardSaldoService.ts)

Criação dos seguintes predicados purificados e simplificação de `separarGastosSaldoRealEPreviaCartao`:

```typescript
function ehGastoDeCartao(gasto: Gasto): boolean {
  return gasto.method === 'card' || !!gasto.cardOwner
}

function deveIrParaSaldoReal(
  gasto: Gasto,
  faturaAberta: boolean,
  fatura: Fatura | undefined,
  faturas: Fatura[]
): boolean {
  if (gasto.isSettlement) {
    return deveIncluirSettlement(gasto, faturaAberta, fatura, faturas)
  }
  if (gasto.isLoan) {
    return true
  }
  return faturaAberta && !ehGastoDeCartao(gasto)
}

function deveIrParaPrevisaoCartao(gasto: Gasto, faturaAberta: boolean): boolean {
  if (gasto.isSettlement || gasto.isLoan) {
    return false
  }
  return faturaAberta && ehGastoDeCartao(gasto)
}
```

E simplificação da função exportada:

```typescript
export function separarGastosSaldoRealEPreviaCartao(
  gastos: Gasto[],
  faturas: Fatura[]
): SeparacaoGastosDashboard {
  const faturasPorId = new Map(faturas.map(f => [f.id, f]))
  const gastosSaldoReal: Gasto[] = []
  const gastosPrevisaoCartao: Gasto[] = []

  for (const gasto of gastos) {
    const fatura = faturasPorId.get(gasto.faturaId)
    const faturaAberta = !fatura || fatura.status === 'ABERTA'

    if (deveIrParaSaldoReal(gasto, faturaAberta, fatura, faturas)) {
      gastosSaldoReal.push(gasto)
    } else if (deveIrParaPrevisaoCartao(gasto, faturaAberta)) {
      gastosPrevisaoCartao.push(gasto)
    }
  }

  return { gastosSaldoReal, gastosPrevisaoCartao }
}
```

## Plano de Verificação

### Testes Automatizados
- Executar os testes existentes do arquivo [DashboardSaldoService.test.ts](file:///d:/projetos/divi/src/models/services/DashboardSaldoService.test.ts) que cobrem todos os cenários (Pix, Cartão Aberto/Fechado, Settlements com e sem netting, carryovers e netting físico) para garantir 100% de compatibilidade reversa.
- Comando: `npx vitest run src/models/services/DashboardSaldoService.test.ts`
