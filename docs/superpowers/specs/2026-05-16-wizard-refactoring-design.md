# Design Spec: Refatoração do NovoLancamentoWizard

**Data:** 2026-05-16
**Status:** Draft
**Tópico:** Desinficação e Modularização do Fluxo de Lançamento

## 1. Visão Geral
O componente `NovoLancamentoWizard.vue` cresceu significativamente e hoje acumula responsabilidades de gerenciamento de estado complexo, persistência em `localStorage`, lógica de negócio (criação de instâncias de `Transacao` e `Dinheiro`) e renderização de múltiplos passos da UI. Esta especificação detalha a quebra deste componente em unidades menores e a extração da lógica para um Composable.

## 2. Objetivos
- **Modularidade:** Isolar cada passo do Wizard em seu próprio componente.
- **Separação de Preocupações:** Mover a lógica de estado e persistência para um Composable dedicado.
- **Testabilidade:** Facilitar o teste unitário de cada passo e da lógica do Wizard de forma independente da UI.
- **Manutenibilidade:** Reduzir o tamanho do arquivo principal para facilitar futuras expansões (ex: OCR, anexos).

## 3. Arquitetura Proposta

### 3.1 Composable: `useNovoLancamentoWizard`
Local: `src/modules/ledger/composables/useNovoLancamentoWizard.ts` (ou local equivalente sugerido pela estrutura).

**Responsabilidades:**
- Manter o estado reativo do formulário (`tipo`, `valor`, `descricao`, `pagamentos`, `beneficiarios_selecionados`).
- Gerenciar o passo atual (`step`).
- Sincronizar automaticamente com o `localStorage` (Debounced Save).
- Fornecer métodos de navegação (`next()`, `prev()`, `reset()`).
- Encapsular a lógica de finalização (conversão de Reais para Centavos, criação da `Transacao`).

### 3.2 Estrutura de Componentes
Local: `src/components/ledger/wizard/`

1.  **`NovoLancamentoWizard.vue` (Orquestrador):**
    - Consome o composable.
    - Renderiza o `WizardProgressBar`.
    - Atua como um "switch" entre os passos.
    - Renderiza o `WizardFooter`.

2.  **`WizardStep1Tipo.vue`:**
    - Botões de "Gasto" e "Ganho".
    - Chama `selecionarTipo(t)` no composable.

3.  **`WizardStep2Dados.vue`:**
    - Inputs de Valor (com auto-focus) e Descrição.
    - Vinculação bidirecional com o estado do composable.

4.  **`WizardStep3Divisao.vue`:**
    - Seleção de beneficiários.
    - Lógica de divisão de pagamentos entre os membros.
    - Botão final de "Salvar".

## 4. Plano de Transição
1. **Criar o Composable:** Mover a lógica existente no `script setup` do Wizard para o novo arquivo `.ts`.
2. **Extrair Componentes de Passo:** Criar os 3 novos arquivos `.vue` movendo o respectivo HTML e estilos.
3. **Refatorar o Orquestrador:** Limpar o `NovoLancamentoWizard.vue` para que ele apenas use o composable e os novos componentes.
4. **Validar:** Garantir que o rascunho (draft) continue funcionando e que os testes existentes (ou novos) passem.

## 5. Considerações de UI/UX
- Manter as animações e o "feel" atual do componente.
- Garantir que o foco no input de valor (Passo 2) continue funcionando ao mudar de passo.
- Preservar o comportamento do botão flutuante (FAB) e do fechamento do wizard.

## 6. Critérios de Sucesso
- `NovoLancamentoWizard.vue` reduzido em pelo menos 60% de linhas de código.
- Nenhuma regressão na persistência de rascunhos.
- Testes unitários do composable cobrindo o fluxo completo.
