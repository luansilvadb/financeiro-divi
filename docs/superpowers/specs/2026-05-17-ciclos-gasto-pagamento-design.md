# Design Spec: Ciclos de Gasto e Pagamento (Separação Gasto vs. Pagamento)

**Data:** 2026-05-17
**Status:** Em Revisão
**Versão:** 1.0.0

## 1. Objetivo
Separar o conceito de **gasto** (consumo de um bem ou serviço) do **pagamento** (liquidação financeira da dívida). Este modelo foca especialmente no fluxo de Cartão de Crédito, onde o gasto ocorre ao longo do mês e o pagamento ao banco e o acerto entre membros ocorrem em momentos distintos e postergados.

## 2. Visão Geral do Modelo
O sistema agora diferencia entre pagamentos imediatos (Pix/Dinheiro) e pagamentos diferidos (Cartão de Crédito).

- **Transação (Atual):** Mantida para pagamentos imediatos. O pagador é registrado no momento do lançamento.
- **Ciclo de Cartão (Novo):** Introduz as fases de Gasto, Acúmulo (Fatura), Fechamento (Pagamento ao Banco) e Acerto (Entre membros).

## 3. Entidades de Domínio

### 3.1 Cartão
Representa o meio de pagamento diferido.
- `id: string`
- `nome: string`
- `diaFechamento: number` (1 a 28)
- `responsavelPadraoId: string` (Membro que normalmente paga a fatura ao banco)

### 3.2 Fatura
O contêiner que agrupa os gastos de um período.
- `id: string`
- `cartaoId: string`
- `periodo: { mes: number; ano: number }`
- `responsavelId: string` (Quem efetivamente pagou esta fatura ao banco. Herda do Cartão por padrão)
- `status: 'ABERTA' | 'FECHADA' | 'ACERTADA'`
- `dataPagamentoBanco?: Date` (Registrada no momento do fechamento)

### 3.3 Gasto
Representa o consumo via cartão.
- `id: string`
- `faturaId: string`
- `descricao: string`
- `valorTotal: Dinheiro`
- `divisoes: Divisao[]` (Lista de membros que consumiram o item e seus respectivos valores)
- *Nota: Não possui lista de pagadores, pois a responsabilidade financeira é transferida para a Fatura.*

### 3.4 Antecipação
Registro de valores transferidos ao responsável antes do fechamento da fatura.
- `id: string`
- `faturaId: string`
- `membroId: string`
- `valor: Dinheiro`
- `data: Date`

### 3.5 AcertoMembro (Persistido)
Snapshot imutável gerado no momento do fechamento da fatura.
- `id: string`
- `faturaId: string`
- `membroId: string` (Nunca é o `responsavelId` da fatura)
- `totalConsumido: Dinheiro` (Soma das divisões do membro na fatura)
- `totalAntecipado: Dinheiro` (Soma das antecipações do membro na fatura)
- `saldoDevido: Dinheiro` (`totalConsumido - totalAntecipado`)
- `pago: boolean`
- `dataPagamento?: Date` (Quando o responsável marcou como recebido)

## 4. Máquina de Estados da Fatura

| Estado | Descrição | Regras |
| :--- | :--- | :--- |
| **ABERTA** | Período de acúmulo de gastos. | Permite novos `Gastos` e `Antecipações`. |
| **FECHADA** | O responsável pagou ao banco. | **Gatilho Manual**. Gera registros de `AcertoMembro`. Bloqueia novos `Gastos`. |
| **ACERTADA** | Todos os membros pagaram o responsável. | Transição automática quando todos os `AcertoMembro` da fatura estão `pago: true`. |

## 5. Regras de Integridade e Auditoria

1. **Exclusão do Responsável:** O responsável da fatura não aparece na lista de `AcertoMembro`. O valor que ele consumiu é considerado "pago" pelo ato de quitar a fatura junto ao banco.
2. **Imutabilidade do Acerto:** Uma vez gerado o `AcertoMembro` no fechamento, ele não muda se um `Gasto` for editado (embora a edição de gastos em faturas fechadas deva ser bloqueada pela UI).
3. **Soberania do Responsável:** Apenas o responsável da fatura (ou um administrador) pode marcar um `AcertoMembro` como pago.
4. **Fronteira Clara:** `Transacao` (imediata) e `Gasto` (cartão) são entidades distintas para evitar colapso de conceitos e facilitar o cálculo de saldos no Dashboard.

## 6. Interface do Usuário (Mudanças)

1. **Novo Lancamento:** No passo de pagamento, se selecionado "Cartão", o sistema solicita a Fatura (ou assume a aberta atual) e remove a seleção de pagadores.
2. **Gestão de Faturas:** Nova tela para visualizar faturas ABERTAS, realizar o fechamento manual e gerenciar o checkout de acertos das faturas FECHADAS.
3. **Checkout de Acerto:** Lista simples de membros devedores com botão "Marcar como Pago".

## 7. Definição de Pronto (DoR)
- [ ] Entidades implementadas no domínio com testes unitários.
- [ ] Serviço de Fechamento de Fatura implementado com persistência de `AcertoMembro`.
- [ ] Regras de validação impedindo gastos em faturas fechadas.
- [ ] Dashboard adaptado para distinguir saldo imediato de saldo de faturas.
