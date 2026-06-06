## ADDED Requirements

### Requirement: Espaçamento Interno Consistente
Todos os bottom sheets DEVEM possuir um espaçamento interno (padding) consistente para garantir que o conteúdo não encoste nas bordas e mantenha o respiro visual do design "Family".

#### Scenario: Visualização de Conteúdo Padrão
- **WHEN** um bottom sheet é aberto
- **THEN** o conteúdo principal DEVE possuir um padding horizontal de no mínimo 24px (px-6) e padding inferior adequado para evitar sobreposição com elementos do sistema.

### Requirement: Cabeçalho Padronizado
Todos os bottom sheets DEVEM utilizar uma estrutura de cabeçalho uniforme que inclua o título em tipografia `text-heading` e um botão de fechar acessível.

#### Scenario: Cabeçalho com Título e Fechar
- **WHEN** o bottom sheet possui um título definido
- **THEN** o título DEVE usar a cor `text-charcoal` com `font-bold` e o botão de fechar DEVE ser um círculo sutil que muda para `bg-stone` ao passar o mouse.

### Requirement: Cores e Tokens de Design
O conteúdo interno dos bottom sheets DEVE utilizar exclusivamente os tokens de cor definidos no `DESIGN.md`.

#### Scenario: Fundo e Textos
- **WHEN** o conteúdo é renderizado
- **THEN** o fundo do bottom sheet DEVE ser `--color-canvas` e os textos de corpo DEVEM ser `--color-graphite` ou `--color-ash` conforme a hierarquia.

### Requirement: Padronização de Ações e Botões
As ações principais e secundárias dentro do bottom sheet DEVEM seguir a hierarquia visual de "Pills" táteis.

#### Scenario: Botões de Ação em Formulários
- **WHEN** um formulário é exibido no bottom sheet
- **THEN** o botão de confirmação DEVE usar o fundo `Midnight` com texto branco e o botão de cancelar/voltar DEVE usar o fundo `Stone` com texto `Graphite`.
