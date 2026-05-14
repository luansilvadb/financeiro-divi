# Design Spec: Lançamentos Multi-Pagadores (Rateio Realista)

**Data:** 2026-05-14
**Status:** Aprovado
**Versão:** 4.0.0

## 1. Objetivo
Permitir que uma única transação seja paga por múltiplos moradores com valores arbitrários, refletindo a realidade de "juntar dinheiro" para contas da casa. O sistema deve calcular o saldo líquido de cada morador (Total Pago - Sua Parte no Consumo) de forma automática e justa.

## 2. Mudanças no Modelo de Dados (Domínio)

### 2.1 Entidade Transacao
- **De:** `origem_id: string` (pagador único).
- **Para:** `pagamentos: { membro_id: string, valor: Dinheiro }[]`.
- **Regra de Integridade:** A soma de todos os `pagamentos.valor` deve ser exatamente igual ao `total` da transação.

## 3. Interface do Usuário (Passo 3)

### 3.1 Seção 1: Participantes (Quem consome?)
- Grid de avatares para seleção múltipla.
- Define como o `total` será dividido entre os devedores.

### 3.2 Seção 2: Pagadores (Quem abriu a carteira?)
- Lista vertical fixa com todos os moradores.
- Cada linha contém: Avatar, Nome e um **Input Numérico (R$)**.
- **Comportamento do Input:**
  - Inicialmente todos em `0,00`.
  - O sistema exibe um indicador de "Restante" no topo.
  - O botão "Salvar" só é habilitado quando `Soma(Pagamentos) == Total`.
- **Visual:** O indicador de "Restante" deve ser vermelho se a soma for menor/maior que o total, e verde/check se estiver equilibrado.

## 4. Algoritmo de Cálculo de Saldo

Para cada membro $M$ envolvido na transação:
$Saldo(M) = Pagamento(M) - Consumo(M)$

Onde:
- $Pagamento(M)$ é o valor inserido no input de pagador para o membro $M$.
- $Consumo(M)$ é a parte do total que cabe ao membro $M$ (Total / Nº de Participantes), caso ele seja um participante.

### Exemplo de Teste:
- **Total:** R$ 300,00 (Mercado)
- **Participantes:** Maria, João, Luan (Consumo: R$ 100,00 cada)
- **Pagadores:** Maria (R$ 50,00), João (R$ 250,00), Luan (R$ 0,00)
- **Resultado:**
  - **Maria:** 50 - 100 = **- R$ 50,00 (Débito)**
  - **João:** 250 - 100 = **+ R$ 150,00 (Crédito)**
  - **Luan:** 0 - 100 = **- R$ 100,00 (Débito)**

## 5. Requisitos Técnicos
- Refatorar `Transacao.ts` e `Transacao.test.ts` para suportar a lista de pagadores.
- Atualizar `CalculadoraSaldos.ts` para iterar sobre a lista de pagadores ao calcular créditos.
- Modificar `NovoLancamentoWizard.vue` para incluir a lista de inputs de pagamento no Passo 3.

## 6. Definição de Pronto (DoR)
- [ ] Wizard permite inserir valores manuais para cada pagador.
- [ ] Validação impede salvamento se a soma não bater com o total.
- [ ] Saldos no Dashboard refletem o cálculo multi-pagador corretamente.
- [ ] Testes de domínio e repositório cobrem cenários com múltiplos pagadores.
