## Purpose

Padronizar a aparência visual e o comportamento dos Bottom Sheets no projeto Financeiro Divi, garantindo consistência com o design system "Family".
## Requirements
### Requirement: Espaçamento Interno Consistente
Todos os bottom sheets MUST possuir um espaçamento interno (padding) consistente para garantir que o conteúdo não encoste nas bordas e mantenha o respiro visual do design "Family".

#### Scenario: Visualização de Conteúdo Padrão
- **WHEN** um bottom sheet é aberto
- **THEN** o conteúdo principal DEVE possuir um padding horizontal de no mínimo 24px (px-6) e padding inferior adequado para evitar sobreposição com elementos do sistema.

### Requirement: Cabeçalho Padronizado
Todos os bottom sheets MUST utilizar uma estrutura de cabeçalho uniforme com título em tipografia Fraunces (font-display) no tamanho `text-2xl` (24px), com a palavra-chave do contexto destacada em `text-ember`. O botão de fechar MUST ser um círculo sutil que muda para `bg-stone` ao passar o mouse.

#### Scenario: Cabeçalho com Título e Accent Ember
- **WHEN** um bottom sheet é aberto com título definido
- **THEN** o título DEVE usar `font-display text-2xl text-charcoal` (Fraunces 24px 700) e DEVE conter pelo menos uma palavra-chave em `text-ember`

#### Scenario: Subtítulo Descritivo
- **WHEN** o bottom sheet possui uma descrição auxiliar
- **THEN** a descrição DEVE usar `text-xs text-graphite font-medium` (Inter 12px) abaixo do título, com `mt-1` de espaçamento

#### Scenario: Botão de Fechar
- **WHEN** o bottom sheet é renderizado com `showClose=true`
- **THEN** o botão DEVE ser um círculo de 40px (`w-10 h-10`) com ícone X em `text-ash`, transição para `bg-stone text-charcoal` no hover

### Requirement: Cores e Tokens de Design
O conteúdo interno dos bottom sheets MUST utilizar exclusivamente os tokens de cor definidos no `DESIGN.md`.

#### Scenario: Fundo e Textos
- **WHEN** o conteúdo é renderizado
- **THEN** o fundo do bottom sheet DEVE ser `--color-canvas` e os textos de corpo DEVEM ser `--color-graphite` ou `--color-ash` conforme a hierarquia.

### Requirement: Padronização de Ações e Botões
As ações principais e secundárias dentro do bottom sheet MUST seguir a hierarquia visual de "Pills" táteis.

#### Scenario: Botões de Ação em Formulários
- **WHEN** um formulário é exibido no bottom sheet
- **THEN** o botão de confirmação DEVE usar o fundo `Midnight` com texto branco e o botão de cancelar/voltar DEVE usar o fundo `Stone` com texto `Graphite`.

### Requirement: Dimensões Padronizadas
Todos os bottom sheets MUST utilizar dimensões consistentes para garantir uniformidade visual em qualquer contexto do app.

#### Scenario: Altura Máxima Padrão
- **WHEN** um bottom sheet é renderizado em qualquer tela
- **THEN** o `maxHeight` DEVE ser `90dvh`, sem overrides customizados por componente

#### Scenario: Largura Desktop Padrão
- **WHEN** um bottom sheet é renderizado em viewport desktop (md+)
- **THEN** o `widthClass` DEVE ser `md:w-[480px]`, sem overrides customizados por componente

#### Scenario: Padding de Conteúdo Padrão
- **WHEN** o conteúdo principal do bottom sheet é renderizado
- **THEN** o `contentClass` padrão DEVE ser `px-6 pb-8`, exceto quando requisitos funcionais (como dropdowns com overflow) exigirem override técnico

### Requirement: Atualização do DESIGN.md
O documento DESIGN.md MUST conter uma seção documentando o padrão visual do componente BottomSheet.

#### Scenario: Seção BottomSheet no DESIGN.md
- **WHEN** um desenvolvedor consulta o DESIGN.md para implementar um bottom sheet
- **THEN** DEVE existir uma seção `### BottomSheet (Overlay Sheet)` dentro de "Components — Key Patterns" com todas as specs de header, dimensões, padding e comportamento

#### Scenario: Escopo Expandido do Fraunces
- **WHEN** um desenvolvedor consulta a seção de tipografia Display no DESIGN.md
- **THEN** a descrição DEVE incluir "section titles" no escopo de uso, permitindo Fraunces em headers de bottom sheets e títulos de seção

