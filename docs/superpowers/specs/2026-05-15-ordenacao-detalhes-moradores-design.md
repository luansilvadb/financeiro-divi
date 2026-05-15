# Spec: Inversão de Ordenação nos Detalhes dos Moradores

O usuário solicitou que, na visualização detalhada de cada morador (drilldown), as transações sejam exibidas em ordem cronológica (mais antigas no topo), funcionando como um extrato.

## Escopo

- **Alvo:** Apenas o componente `DashboardSaldos.vue`, especificamente a função `getMemberDetails`.
- **Fora de Escopo:** O componente `ActivityFeed.vue` deve manter sua ordenação atual (mais recentes no topo).

## Design Técnico

### Componente `DashboardSaldos.vue`

Atualmente, a função `getMemberDetails` utiliza:
```typescript
.sort((a, b) => b.data.getTime() - a.data.getTime())
```

A alteração proposta é inverter para:
```typescript
.sort((a, b) => a.data.getTime() - b.data.getTime())
```

Isso garantirá que:
- Data `10/05` venha antes de `15/05`.
- A leitura visual dos detalhes siga a ordem de ocorrência dos fatos.

## Verificação

1. Abrir os detalhes de um morador com múltiplas transações em datas diferentes.
2. Validar que a transação com a data mais antiga é a primeira da lista.
3. Validar que o Feed de Atividades principal continua mostrando o lançamento mais recente no topo.
