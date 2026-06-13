# SPDD Analysis: Mobile-First Icon Selection Responsiveness

## Original Business Requirement
melhore a responsividade não está mobile first

## Domain Concept Identification

### Existing Concepts (from codebase)
- **ContaFixa**: Modelo de despesa ou receita recorrente configurada pelo usuário. Possui um atributo `icon` que define o emoji correspondente.
- **BottomSheetConfigurarContaFixa**: Componente que encapsula o formulário de configuração da ContaFixa e o seletor de emojis/ícones.
- **BottomSheet**: Componente de folha de arrasto base reutilizável do projeto.

### New Concepts Required
Nenhum novo conceito é requerido. Trata-se de uma refatoração estética de responsividade do layout existente.

### Key Business Rules
- O usuário deve poder selecionar um emoji de uma coleção pré-definida ou inserir um caractere personalizado (emoji livre, sigla) de até 4 caracteres.
- A experiência de inserção deve ser intuitiva e adaptada a dispositivos móveis, sem quebrar os elementos fora da tela ou esmagá-los.

## Strategic Approach

### Solution Direction
- Ajustar o formulário de inserção de emoji customizado no arquivo [BottomSheetConfigurarContaFixa.vue](file:///d:/projetos/financeiro-divi/src/views/components/ledger/BottomSheetConfigurarContaFixa.vue).
- Mudar o container flexível de horizontal (`flex gap-2`) para empilhamento vertical responsivo (`flex flex-col sm:flex-row gap-2`).
- Definir que o input ocupe a largura inteira (`w-full`), permitindo redimensionamento dinâmico.
- Ajustar o botão "Confirmar" para ocupar a largura total do container no mobile (`w-full`) e reverter para tamanho automático no desktop (`sm:w-auto`).

### Key Design Decisions
- **Uso do Layout Flex Direcional responsivo**: `flex flex-col sm:flex-row` garante que em telas mobile (abaixo de 640px) os elementos fiquem empilhados verticalmente, fornecendo uma área de toque e visualização confortável para digitação. Em telas maiores, os elementos permanecem lado a lado de forma compacta.
- **Botão com largura total**: No mobile, botões com largura total são mais fáceis de tocar (acessibilidade) e evitam distorções de texto no rótulo "Confirmar".

### Alternatives Considered
- **Manter horizontal com flex-wrap**: Rejeitado, pois ainda poderia espremer o input em telas pequenas (e.g. 320px) antes de quebrar a linha, gerando desalinhamentos estéticos indesejáveis.

## Risk & Gap Analysis

### Requirement Ambiguities
Nenhuma ambiguidade identificada. A captura de tela deixa evidente o esmagamento do botão e do input no layout atual do celular.

### Edge Cases
- **Teclado Virtual sobrepondo o BottomSheet**: Ao focar no input de texto customizado no mobile, o teclado virtual do sistema operacional é acionado. O BottomSheet base já possui `max-height="90dvh"` e o contêiner de conteúdo possui rolagem interna (`overflow-y-auto`), permitindo rolar o conteúdo se o espaço for reduzido pelo teclado virtual.

### Technical Risks
Nenhum risco técnico identificado. Alteração restrita a classes de estilização TailwindCSS do próprio componente.

### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1   | Empilhar verticalmente o input de emoji e o botão no mobile | Yes | Resolvido via classes `flex-col sm:flex-row`. |
| 2   | Garantir botão Confirmar com largura total no mobile | Yes | Resolvido via `w-full sm:w-auto`. |
