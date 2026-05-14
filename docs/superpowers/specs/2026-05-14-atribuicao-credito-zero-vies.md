# Design Spec: Atribuição Dinâmica de Crédito (Lógica Zero Viés)

**Data:** 2026-05-14
**Status:** Aprovado
**Versão:** 3.0.0

## 1. Objetivo
Eliminar o viés de usuário ("Eu") no processo de lançamento, forçando uma decisão consciente sobre quem pagou e quem participou de cada transação. Isso garante a atribuição correta de créditos e débitos no sistema de acerto de contas.

## 2. Mudanças na Interface (Passo 3)

### 2.1 Seleção de Participantes (Quem consome?)
- **Tipo:** Seleção múltipla.
- **Estado Inicial:** Lista vazia (nenhum membro pré-selecionado).
- **Obrigatoriedade:** Pelo menos 1 participante deve ser selecionado.

### 2.2 Seleção de Pagador (Quem abriu a carteira?)
- **Tipo:** Seleção única (Radio buttons ou grid de avatares).
- **Estado Inicial:** Nenhum pagador selecionado.
- **Obrigatoriedade:** Seleção obrigatória para habilitar o botão "Salvar".
- **Visual:** Exibir todos os membros disponíveis de forma neutra.

## 3. Lógica de Domínio e Crédito

### 3.1 Processamento de Saldos
Ao finalizar o lançamento, o sistema deve processar os valores da seguinte forma:
1.  **Valor Pago:** O valor total da transação é atribuído como crédito bruto ao membro selecionado como `pagador`.
2.  **Valor Consumido:** O valor total é dividido igualmente entre todos os membros selecionados como `participantes`.
3.  **Saldo Líquido (Abatimento):**
    - Se o `pagador` também for um `participante`, sua parcela de consumo é subtraída do seu crédito bruto.
    - Se o `pagador` NÃO for um `participante`, ele recebe o crédito bruto total.

### 3.2 Exemplo Prático
- **Valor:** R$ 300,00
- **Pagador:** Maria
- **Participantes:** Maria, João, Luan
- **Cálculo:** 
  - Cada participante consome R$ 100,00.
  - Maria (Pagadora) recebe crédito de R$ 300,00.
  - Como Maria também participou, o sistema abate R$ 100,00 dela.
  - **Resultado Final:** Maria (+ R$ 200,00 crédito), João (- R$ 100,00 débito), Luan (- R$ 100,00 débito).

## 4. Requisitos Técnicos
- Refatorar `NovoLancamentoWizard.vue` para remover o `fonte_id` fixo e as pré-seleções em `beneficiarios_selecionados`.
- Atualizar o componente `WizardFooter.vue` ou a lógica de `canAdvance` para incluir a validação do pagador.
- Garantir que a persistência no LocalStorage suporte o novo campo `pagador_id`.

## 5. Definição de Pronto (DoR)
- [ ] Passo 3 exige seleção explícita de participantes e pagador.
- [ ] Botão "Salvar" só habilita após ambas as seleções.
- [ ] O saldo no Dashboard reflete o abatimento correto conforme a lógica acima.
- [ ] Testes unitários atualizados para cobrir cenários com diferentes pagadores.
