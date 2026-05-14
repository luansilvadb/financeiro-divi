# Spec: Wizard Conversacional Premium (DIVI)

**Data:** 2026-05-14
**Status:** Aprovado
**Objetivo:** Criar uma experiência de registro de gastos 100% intuitiva e "viva", onde o usuário decide a intenção de divisão de forma mandatória, evitando erros e facilitando o entendimento humano.

## Fluxo de Conversa

O Wizard será dividido em passos claros com foco em UI/UX premium:

### Passo 1: O Início
*   **Pergunta:** "Você quer anotar um gasto ou um ganho?"
*   **Ação:** Botões gigantes com emojis (💸 Gasto / 💰 Ganho).

### Passo 2: O Valor
*   **Pergunta:** "Qual é o valor desse gasto/ganho?"
*   **UI:** Campo numérico com prefixo R$ em destaque (Calculadora Visual).

### Passo 3: O Motivo
*   **Pergunta:** "Me conta, o que você pagou/recebeu?"
*   **UI:** Input de texto simples com placeholders amigáveis.

### Passo 4: Intenção e Divisão (O Diferencial)
*   **Pergunta:** "Isso é só seu, [Nome do Usuário]?"
*   **Opção A (Só meu):** Registra 100% para o usuário e pula para o fim.
*   **Opção B (Dividir):** Expande um painel (Grid de Avatares).
    *   **Grid de Seleção:** Toque nas fotos dos amigos para incluir/excluir da divisão.
    *   **Cálculo em Tempo Real:** Mostra "R$ XX,XX para cada" conforme seleciona.
    *   **Segurança:** Aviso visual (cor amarela) se apenas 1 pessoa estiver marcada.

### Passo 5: A Origem (Quem passou o cartão)
*   **Pergunta:** "Quem passou o cartão ou deu o dinheiro?"
*   **Opções:** Lista dos participantes selecionados no Passo 4 (Padrão: Usuário logado).

## Mapeamento Lógico

| Escolha | Origem (`origem_id`) | Participantes (`divisoes`) |
| :--- | :--- | :--- |
| **Só meu** | Usuário Logado | [Usuário Logado] |
| **Dividir (Eu paguei)** | Usuário Logado | [Selecionados no Grid] |
| **Dividir (Amigo pagou)** | Amigo Selecionado | [Selecionados no Grid] |

## Arquitetura Técnica

1.  **Componente:** `NovoLancamentoWizard.vue` será o host do fluxo.
2.  **Sub-componentes:** Criar `GridSelecaoMembros.vue` para reutilizar a lógica de avatares.
3.  **Animações:** Usar transições do Vue 3 (`<Transition>`) para a expansão do painel de divisão.
4.  **Estado:** Manter o rascunho no `localStorage` para não perder o progresso.
