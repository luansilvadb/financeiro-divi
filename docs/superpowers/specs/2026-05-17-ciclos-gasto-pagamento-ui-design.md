# Design Spec: UI de Ciclos de Gasto e Pagamento (Foco em Cartões)

**Data:** 2026-05-17  
**Status:** Em Revisão  
**Versão:** 1.0.0  
**Autor:** Antigravity  

## 1. Objetivo
Integrar os conceitos do domínio de ciclos de cartões e faturas (`Cartao`, `Fatura`, `Gasto`, `Antecipacao` e `AcertoMembro`) na interface do usuário (UI) do DIVI. Com base no feedback do usuário, a experiência de saldo imediato (Pix/Dinheiro) foi despriorizada para concentrar 100% do foco e atenção do Dashboard na gestão administrativa, acúmulo e checkout de faturas de cartão de crédito.

## 2. Visão Geral da Interface

A jornada do usuário será adaptada em dois pontos de contato principais:
1. **Dashboard & Cockpit de Faturas (Principal)**: Exibição central de acertos pendentes de faturas fechadas e previsão de consumo de faturas abertas.
2. **Wizard de Novo Lançamento**: Simplificação do fluxo de lançamento para gastos com cartão de crédito, determinando a fatura e o responsável de forma transparente.

---

## 3. Arquitetura e Fluxo de Dados na UI

Para alimentar a interface reativa no Vue 3, estruturaremos a comunicação através de repositórios locais mockados ou reativos (usando `localStorage` e Web Locks).

### 3.1 Componibilização do Dashboard (`DashboardSaldos.vue`)
O componente central do Dashboard será remodelado para exibir duas seções empilhadas verticalmente:

1. **Faturas Fechadas (Acertos Pendentes)**:
   - Busca todas as faturas com status `FECHADA`.
   - Para cada fatura fechada, exibe a lista de acertos (`AcertoMembro`) pendentes (`pago: false`).
   - Apresenta a direção do acerto de forma extremamente clara (ex: "Maria deve R$ 80,00 para João").
   - Disponibiliza um botão de ação **Quitar** que invoca o `AcertoService.marcarPago()`, recalculando a lista de acertos e atualizando o status da fatura para `ACERTADA` automaticamente quando todos forem quitados.
   
2. **Faturas Abertas (Previsão de Gastos)**:
   - Busca todas as faturas com status `ABERTA`.
   - Para cada cartão de crédito, mostra a fatura aberta do período corrente.
   - Apresenta o valor total acumulado e a quebra de quanto cada participante consumiu até o momento (rateio em tempo real com base nas divisões de cada gasto associado àquela fatura).

---

## 4. Componentes de UI e Layout (Mockups Aprovados)

### 4.1 Wireframe Focado no Dashboard
O layout aprovado organiza-se da seguinte forma:

```
+---------------------------------------------+
|                    DIVI                     |
|        Gestão de Cartões & Faturas          |
+---------------------------------------------+
| [⚠️ Faturas Fechadas (Acertos Pendentes)]    |
|   💳 Nubank • Maio/2026                     |
|   Responsável: João                         |
|   +---------------------------------------+ |
|   | Maria deve R$ 80,00 para João  [Quitar]| |
|   +---------------------------------------+ |
+---------------------------------------------+
| [🔍 Faturas Abertas (Previsão de Gastos)]   |
|   💳 Nubank • Junho/2026      Total: R$ 155 |
|   - Consumo Maria: R$ 45,00                 |
|   - Consumo João: R$ 110,00                 |
|                                             |
|   💳 XP Visa • Junho/2026     Total: R$ 35  |
|   - Consumo João: R$ 35,00                  |
|   - Consumo Maria: R$ 0,00                  |
+---------------------------------------------+
```

---

## 5. Simulação do Wizard de Novo Lançamento

No fluxo do `NovoLancamentoWizard.vue`:
1. Ao selecionar a opção de despesa, o usuário poderá escolher o método de pagamento: **Dinheiro/Pix** ou **Cartão de Crédito**.
2. Ao selecionar **Cartão de Crédito**:
   - Mostra a seleção dos cartões cadastrados.
   - Oculta a escolha de "Quem pagou", pois o responsável legal pelo pagamento ao banco é o responsável da fatura (`responsavelId`).
   - Associa a data informada para o gasto para calcular automaticamente a fatura correspondente (`determinarPeriodoFatura`), gerando o `Gasto` no banco de dados local.

---

## 6. Plano de Testes de UI

Para garantir a qualidade, testaremos a integração da UI com o domínio via testes automatizados (Vitest + Vue Test Utils):
- **Teste 1**: Deve renderizar a lista de faturas abertas com a quebra exata de consumo acumulado por membro.
- **Teste 2**: Deve exibir apenas acertos de membros pendentes para faturas fechadas.
- **Teste 3**: Deve disparar a ação de acerto e sumir com o acerto da lista ao clicar em "Quitar" (ciclo reativo).
