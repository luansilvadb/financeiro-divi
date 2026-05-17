# Design Spec: Extrato de Membros e Refatoração do Dashboard

**Data:** 2026-05-16
**Status:** Draft
**Tópico:** Modularização e Robustez do Dashboard de Saldos

## 1. Visão Geral
O componente `DashboardSaldos.vue` é atualmente um componente "monolítico" que lida com cálculos de saldo acumulado, formatação de UI complexa e gerenciamento de estado de expansão. Esta especificação detalha a extração da lógica de cálculo para o Core Domain e a quebra da UI em componentes especializados.

## 2. Objetivos
- **Lógica Centralizada:** Mover o cálculo do extrato (netting por transação e saldo acumulado) para `CalculadoraSaldos.ts`.
- **Modularidade Visual:** Criar o componente `CardSaldoMembro.vue` para isolar a complexidade da lista de saldos.
- **Testabilidade:** Permitir testes unitários puros para o extrato de membros sem dependência de componentes Vue.

## 3. Arquitetura Proposta

### 3.1 Core Domain: `CalculadoraSaldos.ts`
Adição do método estático `obterExtratoMembro(membroId: string, transacoes: Transacao[]): ItemExtrato[]`.

**Tipo `ItemExtrato`:**
```typescript
interface ItemExtrato {
  id: string; // ID da transação
  descricao: string;
  data: Date;
  valorPago: Dinheiro;
  valorConsumido: Dinheiro;
  valorLiquido: Dinheiro; // (Pago - Consumido)
  saldoAcumulado: Dinheiro;
}
```

### 3.2 Estrutura de Componentes
Local: `src/components/ledger/dashboard/` (Novo diretório)

1.  **`CardSaldoMembro.vue`:**
    - Props: `nome`, `saldo`, `isExpanded`.
    - Eventos: `toggle`.
    - Slots: `details` (para renderizar o extrato quando expandido).
    - Encapsula o estilo visual do card (Lucide icons, cores de saldo positivo/negativo).

2.  **`DashboardSaldos.vue` (Refatorado):**
    - Orquestra a lista de membros.
    - Usa `CalculadoraSaldos.obterExtratoMembro` para alimentar o drilldown.
    - Gerencia qual membro está expandido (`selectedMemberId`).

## 4. Plano de Transição
1. **Core:** Implementar e testar `obterExtratoMembro` na `CalculadoraSaldos`.
2. **UI:** Criar `CardSaldoMembro.vue` extraindo o template e estilos do `DashboardSaldos.vue`.
3. **Integração:** Refatorar `DashboardSaldos.vue` para usar o novo componente e o novo método do Service.
4. **Limpeza:** Remover funções redundantes (`getMemberDetails`, `formatDataCurta`, etc.) do componente Vue.

## 5. Critérios de Sucesso
- `DashboardSaldos.vue` reduzido em pelo menos 50% de linhas.
- Testes unitários para `CalculadoraSaldos.obterExtratoMembro` cobrindo cenários de saldo acumulado.
- UI idêntica à atual para o usuário final.
