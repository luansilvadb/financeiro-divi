# Spec: Wizard Conversacional e Humano (DIVI)

**Data:** 2026-05-14
**Status:** Aprovado
**Objetivo:** Transformar o Wizard de novo lançamento em uma experiência conversacional, intuitiva e amigável ("nível criança"), removendo termos técnicos em favor de uma linguagem natural e contextual.

## Design de Conversa

O Wizard será dividido em 5 etapas baseadas em perguntas diretas:

### Passo 1: O Início da Conversa
*   **Pergunta:** "Você quer anotar um gasto ou um ganho?"
*   **Opções:**
    *   💸 **"Um gasto"** (Ex: Pizza, Aluguel, Uber)
    *   💰 **"Um ganho"** (Ex: Salário, Reembolso, Venda)

### Passo 2: O Valor
*   **Pergunta (Gasto):** "Qual é o valor desse gasto?"
*   **Pergunta (Ganho):** "Qual o valor que você recebeu?"
*   **UI:** Campo numérico grande com prefixo "R$".

### Passo 3: O Motivo (Descrição)
*   **Pergunta (Gasto):** "Me conta, o que você pagou?"
*   **Pergunta (Ganho):** "Me conta, de onde veio esse dinheiro?"
*   **Placeholder:** "Ex: Pizza com a galera, Aluguel, Cinema..."

### Passo 4: O Pagador e Responsabilidade
*   **Pergunta:** "Quem vai pagar esse gasto?"
*   **Opções:**
    *   🙋‍♂️ **"Eu mesmo!"** (Eu passei o cartão/dinheiro e a conta é minha ou do grupo)
    *   🤝 **"Eu paguei para um amigo"** (Eu passei o cartão, mas o gasto é de outra pessoa)
    *   👤 **"Um amigo pagou para mim"** (O amigo passou o cartão dele, mas eu sou o dono da dívida)

### Passo 5: A Divisão (Aproveitamento)
*   **Pergunta:** "Além de você, quem mais aproveitou isso?"
*   **Subtexto:** "(Isso ajuda a dividir o valor entre os amigos)"
*   **UI:** Lista de membros com fotos/iniciais e checks grandes.

## Mapeamento Lógico (Desenvolvedor)

| Opção Passo 4 | Origem (Quem tirou o $) | Divisão (Quem aproveitou) | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **Eu mesmo** | `origem_id = 'eu'` | Selecionados no Passo 5 | Dívida dividida entre os selecionados |
| **Eu paguei para amigo** | `origem_id = 'eu'` | Amigo selecionado no Passo 5 | Amigo deve 100% para 'eu' |
| **Amigo pagou para mim**| `origem_id = 'amigo_id'` | Selecionados no Passo 5 | 'eu' (e outros) devem para Amigo |

## Arquitetura Técnica

1.  **Componente:** `NovoLancamentoWizard.vue` será refatorado para suportar o novo fluxo.
2.  **Estado:** Adicionar `tipo` ('gasto' | 'ganho') ao estado reativo.
3.  **UI/UX:** 
    *   Animações de transição suave.
    *   Botões grandes com emojis para facilitar o toque e entendimento.
    *   Remover títulos técnicos como "Fonte" ou "Beneficiários".

## Critérios de Sucesso
*   Um usuário leigo consegue completar o fluxo sem hesitação.
*   Termos como "Fonte", "Beneficiário" e "Origem" foram 100% removidos da UI.
*   O rascunho continua funcionando (auto-save) entre os passos.
