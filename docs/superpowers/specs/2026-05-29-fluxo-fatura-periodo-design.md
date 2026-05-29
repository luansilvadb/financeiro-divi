# Design Spec: Fluxo Real de Fatura, Acertos e Encerramento de Mês

**Data:** 2026-05-29  
**Status:** Aprovado para planejamento  
**Contexto:** Ajustar a regra de negócio do DIVI para refletir o uso real da casa: gastos no cartão só viram cobrança entre moradores depois que a fatura fecha/paga. Antecipações durante o mês existem, mas são exceção usada principalmente para liberar limite.

## 1. Núcleo da Regra

O DIVI deve separar dois conceitos que hoje podem parecer iguais:

- **Fechar fatura:** evento financeiro. Confirma que alguém pagou ou assumiu a fatura do banco e, a partir disso, cria dívidas reais entre moradores.
- **Encerrar mês:** evento operacional. Arquiva o período da casa, bloqueia novas edições ordinárias e conduz pendências para o próximo período.

Cartão em fatura aberta é **previsão de consumo**, não cobrança real. Pix, dinheiro e empréstimos diretos continuam afetando o saldo imediatamente.

## 2. Estados e Linguagem de Produto

### Fatura

- `ABERTA`: recebe compras do cartão. Seus valores aparecem como prévia.
- `FECHADA`: a fatura do banco foi paga/assumida por um responsável. O sistema gera `AcertoMembro`.
- `ACERTADA`: todos os acertos gerados pela fatura foram quitados.

### Período/Mês

- `ATUAL`: período editável da casa.
- `ARQUIVADO`: período encerrado para edição ordinária.

`FECHADA` é estado de fatura. `ARQUIVADO` é estado do mês. Um mês pode ser arquivado mesmo se alguma fatura ainda estiver aberta, mas o app deve deixar isso explícito.

## 3. Fluxo do Usuário

### Durante o mês

1. Usuário lança Pix/dinheiro.
   - Entra no saldo à vista.
   - Pode virar acerto entre moradores imediatamente.

2. Usuário lança cartão.
   - Entra na fatura aberta do cartão.
   - Aparece na prévia por pessoa.
   - Não entra no saldo principal de cobrança.

3. Usuário registra antecipação, se necessário.
   - A antecipação fica ligada à fatura aberta, membro e responsável do cartão.
   - Ela reduz o valor que será cobrado no fechamento.
   - Não deve ser tratada como acerto final da casa.

### Fechar fatura

1. Usuário abre a fatura aberta.
2. App mostra:
   - total da fatura;
   - consumo por morador;
   - antecipações registradas;
   - valor líquido a acertar por morador.
3. Usuário confirma quem pagou/assumiu o banco.
4. App gera `AcertoMembro` para cada morador com valor líquido diferente de zero.
5. O responsável da fatura não recebe acerto contra si mesmo.

### Encerrar mês

1. Usuário aciona `Encerrar mês`.
2. App mostra uma revisão:
   - saldos à vista pendentes;
   - faturas abertas com consumo;
   - faturas fechadas ainda não quitadas;
   - pendências que seguirão para o próximo período.
3. Usuário escolhe conscientemente:
   - fechar alguma fatura antes de encerrar;
   - manter faturas abertas;
   - arquivar o mês mesmo assim.
4. App arquiva o período e abre o próximo.

`Encerrar mês` não deve fechar fatura automaticamente.

## 4. Dashboard

O dashboard deve evitar um saldo único ambíguo. A visão principal deve separar:

- **Saldo à vista:** Pix, dinheiro, empréstimos e acertos confirmados. É pagável agora.
- **Prévia de faturas abertas:** consumo acumulado em cartão, agrupado por fatura/cartão. Não é cobrança final.
- **Acertos pendentes:** dívidas reais geradas por faturas fechadas ou por acertos à vista.

Regra de exibição:

- Cartão `ABERTA` aparece como previsão.
- Cartão `FECHADA` aparece via acertos pendentes.
- Cartão `ACERTADA` aparece como histórico quitado.

## 5. Antecipação

Antecipação é exceção, não fluxo principal. Ela existe para o caso real em que alguém paga parte antes do fechamento para liberar limite do cartão.

Modelo mínimo:

- `faturaId`
- `membroId`
- `responsavelId`
- `valor`
- `data`
- `observacao` opcional

No fechamento:

```text
valorAcerto = consumoDoMembro - antecipacoesDoMembro
```

Se `valorAcerto > 0`, o membro paga o responsável.

Se `valorAcerto < 0`, o responsável deve devolver ao membro ou compensar em outro acerto. Este caso é raro, mas precisa ser representável para não corromper a regra.

## 6. Regras de Integridade

- Fatura aberta não gera cobrança principal.
- Fatura fechada gera snapshot de acertos.
- Responsável da fatura não aparece como devedor de si mesmo.
- Edição de gasto em fatura fechada deve ser bloqueada ou exigir reabertura explícita.
- Reabrir fatura remove/recalcula acertos ainda não quitados.
- Reabrir fatura com acerto já pago deve exigir estorno antes.
- Encerrar mês não altera estado de fatura sem confirmação explícita.

## 7. Fora do Escopo Inicial

- Pix automático ou copia e cola.
- Confirmação dupla de pagamento.
- Disputa/raise flag.
- Governança por votação.
- OCR de recibos.
- Workflow sofisticado de limite de cartão.

Esses itens não são necessários para validar a regra central.

## 8. Trade-offs

**Ganhamos:** fluxo compatível com a vida real e menor risco de cobrança antes da hora.  
**Perdemos:** o dashboard deixa de ter um único número mágico para tudo.  
**6m:** se antecipações ficarem frequentes, pode ser necessário evoluir para uma gestão mais rica de limite/fatura aberta. Até lá, antecipação como abatimento basta.

## 9. Walking Skeleton

1. Separar cálculo de saldo real e prévia de cartão.  
   **Done:** gastos de cartão em fatura `ABERTA` não aparecem no netting principal; aparecem em prévia.

2. Corrigir fechamento de fatura.  
   **Done:** fechar fatura gera `AcertoMembro` líquido por morador, exclui o responsável de cobrança contra si mesmo e respeita antecipações quando existirem.

3. Ajustar `Encerrar mês`.  
   **Done:** botão abre revisão de pendências e arquiva o período sem fechar faturas automaticamente.

4. Cobrir regras com testes.  
   **Done:** testes provam que cartão aberto não gera dívida real, fatura fechada gera acertos e antecipação reduz cobrança final.

