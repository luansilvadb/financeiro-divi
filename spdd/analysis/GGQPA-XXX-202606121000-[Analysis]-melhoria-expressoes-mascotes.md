# SPDD Analysis: GGQPA-XXX-202606121000-[Analysis]-melhoria-expressoes-mascotes

## Original Business Requirement
quero melhorar as expressões dos mascotes dando mais vida a eles

## Domain Concept Identification

#### Existing Concepts (from codebase)
- **IllustrationMascot**: Componente principal que renderiza os personagens baseados em blobs SVG.
- **Mascot Variant**: Define a cor e identidade do mascote (`ember`, `meadow`, `sky`, `sunburst`, `flamingo`).
- **Mascot Mood**: Define a expressão atual (`happy`, `chill`, `surprised`), controlando olhos e boca.
- **Animations**: Ciclos de animação existentes como `breathe` (respiração) e `blink` (piscar de olhos).

#### New Concepts Required
- **Mascot Expression Pack**: Expansão do conjunto de humores (moods) para incluir estados como `excited`, `thinking`, `sleeping`, `proud`.
- **Blob Morphing**: Animação do path do SVG para que o corpo não seja estático, mas sim fluido e orgânico.
- **Micro-Interactions**: Reações ao hover do usuário ou mudanças de estado (ex: pular quando clicado).
- **Secondary Embellishments**: Elementos visuais secundários como bochechas rosadas (blush), brilho nos olhos ou gotas de suor para enfatizar expressões.

#### Key Business Rules
- **Minimalist Aesthetic**: Manter o estilo "wobble blob" minimalista e amigável.
- **Color Consistency**: Manter o mapeamento de cores primárias definido no `DESIGN.md`.
- **Non-Intrusive**: As animações devem ser sutis para não distrair o usuário das tarefas financeiras principais.

## Strategic Approach

#### Solution Direction
- Refatorar o componente `IllustrationMascot.vue` para suportar um sistema de expressões mais robusto.
- Implementar animações CSS mais ricas para os membros (braços e pernas) que estão atualmente estáticos ou desativados.
- Utilizar SMIL ou CSS Transitions para suavizar a transição entre diferentes humores.

#### Key Design Decisions
- **CSS-based Morphing vs SMIL**: Usar CSS transitions para paths de SVG (quando o número de nós é constante) para melhor performance e compatibilidade Vue.
- **Mood Expansion**: Adicionar pelo menos 3 novos humores para cobrir mais estados da UI (sucesso, espera, erro).
- **Hover States**: Adicionar uma animação de "excitação" ou "foco" quando o mouse passa sobre o mascote.

#### Alternatives Considered
- **Lottie/Rive**: Descartado para manter o bundle size baixo e a simplicidade de edição direta via código Vue/CSS.
- **Canvas API**: Descartado pois a natureza vetorial e declarativa do SVG se encaixa perfeitamente no estilo de ilustração atual.

## Risk & Gap Analysis

#### Requirement Ambiguities
- Quais telas específicas devem ser priorizadas para essa "vida extra"? (Assumindo que todas que usam o componente se beneficiarão).
- Existem mascotes específicos para estados de erro ou sucesso que ainda não foram implementados?

#### Edge Cases
- Mascotes em tamanhos muito reduzidos (ex: 32px no header) podem perder detalhes se as expressões forem muito complexas.
- Múltiplos mascotes animados na mesma tela podem causar impacto visual excessivo.

#### Technical Risks
- **SVG Path Incompatibility**: Morphing de paths via CSS exige que os paths tenham o mesmo número e tipo de pontos de controle para evitar saltos visuais.
- **Performance**: Animações infinitas (`breathe`) em muitos elementos simultâneos.

#### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1 | Adicionar novos humores ao mascote | Sim | Definir lista final (excited, thinking, sleeping, etc.) |
| 2 | Tornar o corpo (blob) mais dinâmico | Sim | Requer refatoração do `blobPath` para múltiplos estados. |
| 3 | Melhorar as animações de membros | Sim | Reativar animações de braços/pernas. |
| 4 | Adicionar detalhes expressivos extras | Sim | Blush, brilho nos olhos, etc. |
