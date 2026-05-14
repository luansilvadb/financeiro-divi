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

### Passo 4: O Pagador
*   **Pergunta:** "Quem foi que pagou essa conta?"
*   **Opções:**
    *   🙋‍♂️ **"Fui eu mesmo!"** (pagador_id = 'eu')
    *   👤 **"Um amigo pagou"** (abre seleção de membro)

### Passo 5: A Divisão (Aproveitamento)
*   **Pergunta:** "Além de você, quem mais aproveitou isso?"
*   **Subtexto:** "(Isso ajuda a dividir o valor entre os amigos)"
*   **UI:** Lista de membros com fotos/iniciais e checks grandes.

## Arquitetura Técnica

1.  **Componente:** `NovoLancamentoWizard.vue` será refatorado para suportar o novo fluxo.
2.  **Estado:** Adicionar `tipo` ('despesa' | 'receita') ao estado reativo e ao rascunho (auto-save).
3.  **Lógica de Finalização:** 
    *   Se for **Receita**, inverter o sinal dos valores ou tratar como um crédito inverso (a ser definido na implementação da `CalculadoraSaldos`). *Nota: Por enquanto, manteremos o foco em Despesa mas a UI já estará preparada para ambos.*
4.  **UX:** Animações de transição suave (fade-in/slide) entre os passos.

## Critérios de Sucesso
*   Um usuário leigo consegue completar o fluxo sem hesitação.
*   Termos como "Fonte", "Beneficiário" e "Origem" foram 100% removidos da UI.
*   O rascunho continua funcionando (auto-save) entre os passos.
