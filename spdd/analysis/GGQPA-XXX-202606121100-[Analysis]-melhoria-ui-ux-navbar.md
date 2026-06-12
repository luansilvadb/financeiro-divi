# SPDD Analysis: Melhoria UI/UX Navbar e Header (Premium & Family)

## Original Business Requirement
"quero melhorar a ui ux da navbar trazendo mais profissionalismo e polidez premium mantenho o design familly"

## Domain Concept Identification

### Existing Concepts (from codebase)
- **BottomTabBar**: Componente de navegação inferior principal, contendo abas (Casas, Hoje, Faturas, Perfil) e o FAB de novos lançamentos.
- **DashboardHeader**: Cabeçalho superior que exibe o período atual (mês/ano), o nome da casa (tenant) e notificações/logs.
- **IllustrationMascot**: O mascote "ember" que dá o tom "family-friendly" à aplicação.
- **FAB (Fast Action Button)**: Botão central da navbar para ação rápida de novo lançamento.

### New Concepts Required
- **Premium Micro-interactions**: Feedbacks visuais refinados em estados de hover, active e foco.
- **Floating Navigation Strategy**: Uma abordagem onde a navbar não parece "grudada" no fundo, mas flutua com sombras suaves e blurs.

### Key Business Rules
- **Family-Friendly Aesthetic**: Deve manter cantos arredondados (radius-card-lg/pill), cores quentes (ember, sunburst) e a presença do mascote.
- **Professionalism/Premium**: Deve transmitir confiança e precisão financeira através de espaçamento consistente, hierarquia tipográfica clara e ausência de poluição visual.
- **Role Awareness**: A navbar e o header devem respeitar permissões (ex: ocultar FAB para Visualizador).

## Strategic Approach

### Solution Direction
- **Refatoração do BottomTabBar**: Transformar a barra fixa em uma "Floating Bar" ou pelo menos aumentar a percepção de profundidade com sombras multi-camada e blurs mais densos.
- **Simplificação do DashboardHeader**: Reduzir a carga cognitiva no cabeçalho, refinando a forma como o seletor de mês e o nome da casa coexistem.
- **Harmonização de Ícones**: Garantir que todos os ícones da `lucide-vue-next` usem pesos consistentes e que os estados ativos tenham um "brilho" (glow) ou destaque premium.
- **Aprimoramento de Feedback**: Adicionar transições de mola (spring) mais orgânicas e estados ativos que pareçam táteis.

### Key Design Decisions
- **Uso de Glassmorphism**: Manter `backdrop-blur` mas aumentar a saturação do fundo para um efeito mais cristalino (premium).
- **Elevação do FAB**: O botão de "+" deve se destacar não apenas pela cor, mas por uma sombra que sugira importância (Z-index visual).
- **Mascote no Header**: Reposicionar o mascote para que ele pareça parte da marca ("DIVI."), e não um elemento flutuante aleatório.

### Alternatives Considered
- **Mudar para Side Navigation**: Rejeitado pois a aplicação é claramente Mobile-First e o design "family" se beneficia da proximidade do polegar na navegação inferior.

## Risk & Gap Analysis

### Requirement Ambiguities
- **Polidez Premium**: O termo é subjetivo. Interpretaremos como refinamento de detalhes (detailing), espaçamento (white space) e animações fluidas.
- **Navbar**: O usuário pode estar se referindo apenas à barra inferior ou ao conjunto de navegação (Header + Tab Bar). Abordaremos ambos para garantir completude.

### Edge Cases
- **Nomes de Casas Longos**: No Header, nomes de "Casas" muito longos podem quebrar o layout centralizado.
- **Dispositivos Mini (ex: iPhone SE)**: O espaçamento aumentado para o "look premium" não deve espremer o conteúdo útil da tela.

### Technical Risks
- **Performance de Animações**: O uso excessivo de `backdrop-blur` e sombras complexas pode pesar em dispositivos Android de entrada.
- **Tailwind 4 Utilities**: Garantir que as novas features do TW4 (como variáveis CSS nativas no theme) sejam usadas corretamente.

### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1 | Melhorar UI/UX da Navbar | Sim | Foco em BottomTabBar e DashboardHeader. |
| 2 | Trazer profissionalismo | Sim | Através de hierarquia e espaçamento. |
| 3 | Polidez Premium | Sim | Micro-interações e profundidade visual. |
| 4 | Manter design family | Sim | Mantendo mascot e paleta de cores original. |
