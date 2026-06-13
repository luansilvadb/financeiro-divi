# SPDD Analysis: Improve Detailed Analysis UI UX Accessibility

## Original Business Requirement
Preciso melhorar a UI UX do análise detalhada, não está bem facil interpretação, principalmente para pessoas mais velhas, precisamo facilitar o entendimento para todos os publico trazendo clareza.

## Domain Concept Identification

### Existing Concepts (from codebase)
- **DetalhamentoSaldosCard**: Componente principal que serve de container para a análise detalhada dos saldos e fluxos dos membros ([DetalhamentoSaldosCard.vue](file:///d:/projetos/financeiro-divi/src/views/components/ledger/dashboard/DetalhamentoSaldosCard.vue)).
- **DetalhamentoMembroCard**: Componente que exibe os saldos e o detalhamento dos fluxos (PIX/Dinheiro, Faturas, Empréstimos) de um membro específico ([DetalhamentoMembroCard.vue](file:///d:/projetos/financeiro-divi/src/views/components/ledger/dashboard/DetalhamentoMembroCard.vue)).
- **ItemExtratoCard**: Componente que exibe os itens individuais do extrato de transações de um membro ([ItemExtratoCard.vue](file:///d:/projetos/financeiro-divi/src/views/components/ledger/dashboard/ItemExtratoCard.vue)).
- **BreakdownGranular**: Estrutura de dados contendo os valores acumulados de gastos feitos e consumidos por cada membro para cada tipo de fluxo (PIX, Faturas, Empréstimos).
- **ExtratoService**: Serviço responsável pelo cálculo e processamento das informações acumuladas de cada membro ([ExtratoService.ts](file:///d:/projetos/financeiro-divi/src/models/services/ExtratoService.ts)).

### New Concepts Required
- **HelpExplanationModal / InfoTooltip**: Componente ou elemento explicativo amigável que explica a matemática do grupo de forma acessível.
- **FriendlyFlowLabel**: Rótulos descritivos estendidos e didáticos aplicados aos fluxos para evitar a confusão matemática entre o ato físico de pagar e o crédito no acerto do grupo.

### Key Business Rules
- **Matemática de Divisão de Gastos**:
  - Quem paga uma despesa para o grupo acumula um **crédito** (+R$ a receber).
  - Quem consome uma despesa alheia acumula um **débito** (-R$ a pagar).
  - O saldo final do membro é a diferença direta entre tudo o que ele pagou e tudo o que ele consumiu no período.
- **Acessibilidade Visual & Cognitiva**:
  - Fontes legíveis para idosos: evitar tamanhos abaixo de `12px` (como `text-[9px]` ou `text-[10px]`) para rótulos secundários, substituindo-os por fontes maiores e mais espaçadas.
  - Eliminar o uso exclusivo de opacidade fraca (`opacity-60` ou inferior) em dados críticos.
  - Cores com alto contraste para indicar se o saldo ou fluxo é positivo (a receber) ou negativo (a pagar).

## Strategic Approach

### Solution Direction
1. **Redesenhar a Informação de Saldo do Membro**:
   - Substituir o badge de saldo compacto por uma visualização explícita em texto legível.
   - Mostrar se o membro tem "A receber" (verde) ou "A pagar" (vermelho). Para saldo zerado, mostrar "Saldo equilibrado" (cinza neutro).
   - Adicionar uma frase explicativa amigável logo abaixo do saldo (ex: *"Você pagou mais do que consumiu, tem dinheiro a receber do grupo"* ou *"Você consumiu mais do que pagou, precisa pagar a diferença"*).
2. **Didática de Fluxos (PIX, Faturas, Empréstimos)**:
   - Adicionar legendas ou textos explicativos sob as labels dos fluxos no [DetalhamentoMembroCard.vue](file:///d:/projetos/financeiro-divi/src/views/components/ledger/dashboard/DetalhamentoMembroCard.vue):
     - **PIX / Dinheiro**:
       - `Pagou` -> `Pagou para o grupo` (+). Texto de apoio: *"Compras pagas por você"*
       - `Consumiu` -> `Sua parte consumida` (-). Texto de apoio: *"O que você gastou destas compras"*
     - **Faturas**:
       - `Usou` -> `Fez no seu cartão` (+). Texto de apoio: *"Faturas do grupo no seu cartão"*
       - `Consumiu` -> `Sua parte na fatura` (-). Texto de apoio: *"O que você consumiu na fatura de outros"*
     - **Empréstimos**:
       - `Emprestou` -> `Você emprestou` (+). Texto de apoio: *"Dinheiro que você enviou"*
       - `Tomou` -> `Pegou emprestado` (-). Texto de apoio: *"Dinheiro que você recebeu"*
3. **Melhorias de Acessibilidade Visual**:
   - Ajustar tamanhos de fonte mínimos para `text-xs` (12px) e `text-sm` (14px).
   - Utilizar fundos semânticos leves nos cartões para agrupar as ações de crédito (verde) e débito (vermelho).
   - Exibir R$ 0,00 com cor neutra (`text-graphite`) em vez de aplicar o verde de crédito ou o vermelho de débito quando não houver fluxo ativo.
   - Adicionar um botão de ajuda (ícone `HelpCircle` ou `Info`) no cabeçalho do componente principal ([DetalhamentoSaldosCard.vue](file:///d:/projetos/financeiro-divi/src/views/components/ledger/dashboard/DetalhamentoSaldosCard.vue)) para abrir um modal explicativo simples e interativo.

### Key Design Decisions
- **Tradução de Conceitos Técnicos**: Focar na linguagem comum ("A receber" / "A pagar") em vez de sinais matemáticos abstratos (+ e -). Isso é crucial para pessoas idosas.
- **Apoio Textual em Interface Limpa**: Incluir pequenas explicações sem poluir a interface usando fontes elegantes e cores equilibradas de acordo com as regras de design premium do DIVI.
- **Diferenciação Cromática Neutra para Valores Zerados**: Atualmente o sistema exibe `+R$ 0,00` em verde e `-R$ 0,00` em vermelho. Isso causa poluição visual. Valores zerados devem ser cinza e sem sinais desnecessários.

### Alternatives Considered
- **Simplificar removendo o detalhamento de fluxos e mostrando apenas o extrato histórico**: Rejeitado. O detalhamento por modalidade (PIX, Faturas, Empréstimos) ajuda a entender onde o dinheiro foi gasto ou investido, apenas precisamos torná-lo legível.

## Risk & Gap Analysis

### Requirement Ambiguities
- **Nível de detalhamento do guia explicativo**: Como deve ser o modal/guia explicativo? Deve ser direto ao ponto para evitar fadiga de leitura. Faremos um design com ilustrações simples/ícones e tópicos curtos.

### Edge Cases
- **Membro com saldo exatamente zerado**: O sistema deve exibir a mensagem neutra *"Saldo Equilibrado"* em vez de sugerir pagamentos ou recebimentos.
- **Dispositivos móveis antigos/pequenos**: O aumento do tamanho do texto pode causar quebra de linhas indesejadas no grid.
  - *Mitigação*: O layout utiliza `grid-cols-1 md:grid-cols-3`, o que garante empilhamento completo em dispositivos móveis, oferecendo espaço adequado para os textos explicativos.

### Technical Risks
- Nenhum risco técnico identificado. As mudanças afetam apenas componentes de apresentação e estilos CSS/Tailwind.

### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1   | Substituir o indicador de saldo compacto por um formato legível indicando textualmente se o membro tem "A receber" ou "A pagar" | Yes | Resolvido com lógica baseada no valor do saldo (`saldoUnificado`). |
| 2   | Adicionar frase explicativa simples e dinâmica logo abaixo do saldo do membro explicando o estado do acerto de contas | Yes | Exemplo: "Você tem a receber" ou "Você deve pagar". |
| 3   | Melhorar a clareza das labels dos fluxos de PIX, Faturas e Empréstimos, adicionando contexto explicativo ou legendas amigáveis | Yes | Evitar termos puros sem apoio visual. |
| 4   | Aumentar a legibilidade das fontes (tamanho e contraste), eliminando opacidades baixas e fontes excessivamente pequenas nos textos informativos | Yes | Ajustar classes de fonte do Tailwind. |
| 5   | Exibir valores zerados (R$ 0,00) com cor neutra em vez de verde/vermelho ativo | Yes | Ajustar regras condicionais de estilização de cores de texto. |
| 6   | Adicionar um botão/link explicativo ("Como funciona?") com ajuda simples sobre a divisão de saldos | Yes | Pode ser adicionado no cabeçalho ou no rodapé do componente principal. |
