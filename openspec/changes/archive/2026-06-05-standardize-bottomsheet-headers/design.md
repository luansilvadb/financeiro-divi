## Context

Os bottom sheets do Divi usam 3 padrões visuais diferentes:

1. **Dashboard** (Casas, Histórico, NovoPeriodo, AcertoCompensacao, ConfigurarContaFixa, AjustarGasto): Fraunces 24px com accent ember, `md:w-[480px]`
2. **Configurações** (Editar Membro, Novo Cargo, Permissões, Novo Morador, Novo Cartão): Inter 16px com ícone lateral, `md:w-[560px]`
3. **Estorno/Popup**: Inter 24px com `text-heading` (token correto)

O DESIGN.md define o token `--text-heading` como 24px/700 em Inter (UI Sans), e reserva Fraunces para "brand wordmark and massive headlines". Porém, o uso de Fraunces nos headers de bottom sheets do Dashboard **reforça a identidade playful do produto** e se tornou a assinatura visual reconhecível do Divi.

Referências de tokens existentes em `DESIGN.md`:
- `--text-heading`: 24px, weight 700, tracking -0.02em
- `--ease-spring`: cubic-bezier(0.19, 1, 0.22, 1)
- `--color-ember`: #ff3e00
- `--color-charcoal`: #343433
- `--color-graphite`: #474645
- `--color-canvas`: #fbfaf9
- `--radius-pill`: 32px

## Goals / Non-Goals

**Goals:**
- Estabelecer UM padrão visual para headers de bottom sheets em todo o app
- Atualizar o DESIGN.md para documentar esse padrão (BottomSheet como componente)
- Expandir o escopo do Fraunces no DESIGN.md para incluir "section titles"
- Corrigir inconsistências de `maxHeight`, `widthClass` e `contentClass`

**Non-Goals:**
- Alterar o conteúdo ou lógica interna dos bottom sheets
- Mudar o componente base `BottomSheet.vue` (props defaults já estão corretos)
- Redesenhar os footers ou layouts de formulários

## Decisions

### 1. Fraunces (font-display) para títulos de BottomSheet

**Decisão:** Todos os headers de bottom sheet usarão `text-2xl font-display text-charcoal` (Fraunces 24px 700).

**Alternativas consideradas:**
- Inter 24px (text-heading font-bold): Seguiria o DESIGN.md atual, mas perderia a personalidade "storybook" da marca
- Inter 16px (text-base): Tamanho que não existe na escala tipográfica e parece um subtítulo

**Racional:** O Fraunces nos headers cria uma sensação de "nova página do livro" a cada bottom sheet que abre. Isso está alinhado com a identidade "Pixar storyboard on cream paper" do DESIGN.md. A perda de 35px de espaço vertical (~5%) não impacta a usabilidade.

### 2. Padrão de accent em ember na palavra-chave

**Decisão:** O título DEVE conter uma palavra-chave destacada em `text-ember`, seguindo o padrão já usado nos bottom sheets de Dashboard.

**Exemplos:**
- `Editar <span class="text-ember">Membro</span>`
- `Novo <span class="text-ember">Cargo</span>`
- `Novo <span class="text-ember">Cartão</span>`
- `Novo <span class="text-ember">Morador</span>`
- `Permissões do <span class="text-ember">Cargo</span>`

### 3. Largura única `md:w-[480px]`

**Decisão:** Todos os bottom sheets usarão `md:w-[480px]` (o default do componente).

**Alternativa:** Manter 560px para formulários complexos de Configurações.

**Racional:** 480px é suficiente para formulários com grid de 2-3 colunas. Manter um único valor elimina inconsistência visual no desktop. Em mobile, ambos são full-width, então não há diferença.

### 4. maxHeight fixo em 90dvh

**Decisão:** Remover overrides de `maxHeight` (85dvh, 95dvh). Todos usam o default 90dvh.

**Racional:** O scroll interno já cobre conteúdo longo. 90dvh dá espaço suficiente sem cobrir toda a tela.

### 5. Subtítulo opcional em Inter

**Decisão:** Subtítulos abaixo do título usam `text-xs text-graphite font-medium` (Inter 12px).

**Racional:** Mantém a hierarquia clara entre título (Fraunces, expressivo) e descrição (Inter, informativo).

### 6. Atualização do DESIGN.md

**Decisão:** Adicionar seção `### BottomSheet (Overlay Sheet)` ao DESIGN.md na área de "Components — Key Patterns", e expandir a descrição do Display font para incluir "section titles".

## Risks / Trade-offs

- **[Quebra de familiaridade]** Usuários habituados ao header compacto dos bottom sheets de Configurações notarão a mudança → Mitigação: a mudança alinha com o padrão já presente em 60% dos bottom sheets, então a familiaridade global aumenta
- **[Espaço em mobile]** Bottom sheets com formulários longos (AjustarGasto) perdem ~35px com headers maiores → Mitigação: 35px = menos de 1 campo de formulário; scroll compensa sem impacto funcional
- **[Ícones removidos dos headers de Configurações]** Os headers atuais de Configurações usam ícones (Shield, CreditCard, User) que serão substituídos pelo padrão de texto puro → Mitigação: os ícones podem ser movidos para o subtítulo ou mantidos como complemento caso o designer julgue necessário
