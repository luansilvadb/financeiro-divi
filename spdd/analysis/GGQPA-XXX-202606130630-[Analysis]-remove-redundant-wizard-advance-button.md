# SPDD Analysis: Remoção do Botão Avançar Redundante no Primeiro Passo do Wizard de Lançamentos

## Original Business Requirement
no wizard quando aperta no 'FAB' de adicionar despesas no primeiro passo tem avançar, e cancelar, esse avançar pra mim não faz sentido pelo fato de se o usuario apertar por exemplo pix ou dinheiro o passo já avança automatico

## Domain Concept Identification

### Existing Concepts (from codebase)
- **NovoLancamentoWizard**: Componente principal que gerencia o fluxo de múltiplos passos para criação de um novo lançamento ([NovoLancamentoWizard.vue](file:///d:/projetos/financeiro-divi/src/views/screens/NovoLancamentoWizard.vue)).
- **StepFlowSelection**: Subcomponente da primeira etapa do Wizard para seleção da forma de pagamento e tipo de fluxo ([StepFlowSelection.vue](file:///d:/projetos/financeiro-divi/src/views/components/wizard/StepFlowSelection.vue)).
- **WizardState**: Tipo que define as etapas lógicas do assistente, sendo `'FLOW_SELECTION'` a etapa inicial de escolha da forma de pagamento ([NovoLancamentoWizard.vue](file:///d:/projetos/financeiro-divi/src/views/screens/NovoLancamentoWizard.vue#L46)).

### New Concepts Required
- **ConditionalFooterNavigation**: Lógica de exibição condicional de ações de progresso do assistente baseada na etapa ativa. Especificamente, o botão de "Avançar" deve ser ocultado na primeira etapa (`FLOW_SELECTION`), uma vez que a seleção das opções já realiza a transição automática.

### Key Business Rules
- **Navegação Sem Fricção**:
  - No passo inicial (`FLOW_SELECTION`), o usuário deve apenas selecionar a forma de pagamento (ex: Pix ou Cartão) para avançar automaticamente.
  - Não deve ser exibido um botão de "Avançar" no rodapé durante o primeiro passo para evitar poluição visual, redundância cognitiva e cliques em estados inválidos (ex: avançar sem selecionar nenhum fluxo).
  - O rodapé do primeiro passo deve apresentar apenas o botão de "Cancelar", ocupando a largura total (full-width) disponível de forma limpa.

## Strategic Approach

### Solution Direction
1. **Ocultação Condicional do Botão no Rodapé**:
   - No arquivo [NovoLancamentoWizard.vue](file:///d:/projetos/financeiro-divi/src/views/screens/NovoLancamentoWizard.vue), adicionaremos uma diretiva `v-if="currentState !== 'FLOW_SELECTION'"` (ou `v-if="stepIndex !== 0"`) ao botão principal de "Avançar".
2. **Estilização Responsiva e Harmônica**:
   - Como o botão de cancelamento possui a classe `flex-1`, ao ocultar o botão principal (`flex-[2]`), o Flexbox do container (`flex gap-3`) fará com que o botão "Cancelar" se estenda automaticamente por toda a largura do rodapé. Isso cria um visual limpo e focado, seguindo os princípios de design tátil e focado.
3. **Validação de Testes Unitários**:
   - Garantir que o comportamento de avanço automático continue íntegro e que os testes unitários do Wizard não quebrem (o teste atual simula o avanço via emissão de eventos nos subcomponentes e não depende do clique do rodapé no primeiro passo, portanto está seguro).

### Key Design Decisions
- **Uso do Estado Atual (`currentState`) como Gatilho**: Utilizar a reatividade do Vue baseada no `currentState` para manter a lógica declarativa e de fácil leitura na UI.

### Alternatives Considered
- **Desabilitar o botão Avançar no primeiro passo**: Rejeitado. Se desabilitado, o botão causaria ruído visual e frustração ao usuário. Ocultá-lo completamente é a melhor prática de UX de acordo com o feedback do usuário.

## Risk & Gap Analysis

### Requirement Ambiguities
- Nenhuma ambiguidade detectada. A regra é clara: ocultar o botão no primeiro passo.

### Edge Cases
- **Retorno à primeira etapa**: Caso o usuário use o botão "Voltar" a partir da segunda etapa, o assistente deve voltar para a primeira etapa e o botão de "Avançar" deve desaparecer novamente de forma suave. Isso é garantido nativamente pela reatividade da propriedade computada `currentState` e pela diretiva `v-if` do Vue.

### Technical Risks
- n/a.

### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1   | Ocultar o botão "Avançar" no rodapé do Wizard de Lançamentos quando o passo atual for a seleção do fluxo (`FLOW_SELECTION` ou passo 1) | Sim | Implementado via `v-if` em [NovoLancamentoWizard.vue](file:///d:/projetos/financeiro-divi/src/views/screens/NovoLancamentoWizard.vue). |
| 2   | Garantir que o botão "Cancelar" no passo 1 ocupe a largura completa da tela de forma esteticamente agradável | Sim | O flexbox expande o botão automaticamente devido à classe `flex-1`. |
| 3   | Assegurar que os testes unitários de simulação do fluxo continuem passando com sucesso | Sim | Verificado em `NovoLancamentoWizard.test.ts`. |
