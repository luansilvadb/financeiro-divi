# Especificação de Design - Unificação de Acertos e Netting Expansível

Esta especificação detalha o design UI/UX da evolução da funcionalidade de **Acertos Otimizados (Netting)**. O objetivo é descontinuar o painel secundário redundante "Acertos do Período" e unificar o "melhor de dois mundos" em um único painel inteligente, agregando rastreabilidade, visualização de progresso e a simulação de pagamentos de forma transparente.

---

## 1. Princípios da Nova Interface (UI/UX)

1. **Ponto Único de Ação:** O morador resolve todas as suas obrigações financeiras exclusivamente através do painel de **Acertos Otimizados**. Não há mais botões de "Registrar Pix" espalhados em múltiplas tabelas.
2. **Transparência e Rastreabilidade:** Cada card de transferência sugerido pelo algoritmo de netting (ex: `João deve enviar R$ 80,00 para Luan`) passa a ser expansível (Accordion). Ao expandir, ele exibe a composição original dos acertos que geraram aquela quantia.
3. **Controle de Progresso:** Cada dívida de origem listada no detalhamento possui sua própria barra de progresso visual, mostrando quanto foi amortizado.
4. **Resiliência a Dízimas e Amortização Parcial:** Ao clicar em "Confirmar Pix", abre-se um **BottomSheet** deslizante (slide-up). O usuário pode alterar o valor a ser pago (pagamento parcial). O sistema distribui o valor proporcionalmente entre as dívidas de origem, atualiza o progresso visual de cada uma delas e recalcula o netting de forma dinâmica e instantânea.

---

## 2. Detalhes Visuais e Composição do Accordion

```
+-------------------------------------------------------------+
| [->] João deve enviar para Luan          R$ 80,00           |
|                                         [Confirmar Pix] [v] |
| ----------------------------------------------------------- |
|  Composição desta transferência:                            |
|  • R$ 50,00 (Fatura de Abril - Nubank)         [60% pago]   |
|    R$ 30,00 pagos de R$ 50,00                               |
|  • R$ 30,00 (Saldo Inicial Pendente de Março)  [100% pago]  |
|    R$ 30,00 pagos de R$ 30,00                               |
+-------------------------------------------------------------+
```

* **Cabeçalho:** Segue o padrão de design system em vigor no app (fundo branco, borda lateral na cor acentuada coral/ember, tipografia Outfit em negrito para os nomes e valor destacado).
* **Barra de Progresso:** Altura reduzida (6px) em formato capsule, com preenchimento em gradiente sutil violeta/indigo (`from-coral to-royal`), oferecendo retorno visual do avanço dos repasses.
* **Badges e Sub-itens:** Textos com tamanho reduzido (10px a 11px) em tom grafite/cinza (`text-ash`), oferecendo uma boa relação de contraste e hierarquia limpa.

---

## 3. Mockup Visual da UI/UX (BottomSheet)

Abaixo está o mockup conceitual de design atualizado com o BottomSheet deslizante no rodapé para guiar a implementação da interface premium e suas transições:

![Mockup do Netting Expansível com BottomSheet](/C:/Users/luan.souza/.gemini/antigravity-ide/brain/7610a376-5e44-42f8-8f0c-7c0bc677969b/netting_ui_bottomsheet_1780072884669.png)

---

## 4. Protótipo Interativo Local

Para testar a nova experiência interativa (UX) de ponta a ponta com dízimas periódicas (R$ 200,00 dividido por 3) e pagamentos parciais no navegador com o BottomSheet deslizante, você pode acessar o nosso servidor local de simulação:

* **URL de Teste:** [http://localhost:52341](http://localhost:52341)

### O que você pode testar no Protótipo:
1. **Composição dos Acertos:** Clique em qualquer card de transferência (João ou Maria) para expandi-los e ver a origem do consumo no Nubank (R$ 66,67 e R$ 66,66).
2. **Reembolso Parcial no BottomSheet:** Clique em "Confirmar Pix" no João. O **BottomSheet** deslizará de baixo para cima suavemente. Mude o valor no input para `40.00` e clique em Confirmar. A barra de progresso subirá e o card sugerido de João atualizará na tela para **R$ 26,67**, atualizando os saldos unificados de todos.
3. **Quitação Completa:** Faça o pagamento total (ou atinja o total) e veja o card do devedor sumir com efeito fade-out. Ao quitar todos os moradores, o estado vazio de saldos equilibrados será renderizado.
