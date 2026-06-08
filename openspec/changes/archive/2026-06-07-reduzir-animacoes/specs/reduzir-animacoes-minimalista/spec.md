## ADDED Requirements

### Requirement: Redução das Animações da UI
O sistema SHALL limitar, suavizar ou desativar animações contínuas e transições demoradas em toda a interface do usuário, priorizando a agilidade, produtividade e redução de fadiga visual (carga cognitiva).

#### Scenario: Transição de Abas no Dashboard
- **WHEN** o usuário seleciona ou alterna entre as abas do dashboard principal
- **THEN** o sistema SHALL realizar a transição com duração máxima de 200ms, utilizando apenas opacidade e deslocamento horizontal imperceptível (máximo de 4px).

#### Scenario: Mascotes Ilustrados Estáticos ou Suavizados
- **WHEN** o sistema renderiza as ilustrações de mascotes animados (blobs)
- **THEN** os membros (braços e pernas) SHALL permanecer em posições fixas, e o ciclo de respiração contínuo SHALL ser configurado para pelo menos 8 segundos de duração com deformação imperceptível (máximo de 1% de escala).

#### Scenario: Efeitos de Flutuação e Rotação Globais
- **WHEN** elementos visuais utilizam as classes de animação cíclica global (como float e wobble)
- **THEN** a amplitude máxima de movimento vertical SHALL ser limitada a 3px e a rotação SHALL ser limitada a 1 grau, com durações longas de ciclo para atenuar o dinamismo visual.

#### Scenario: Transições de Entrada Rápidas
- **WHEN** novos elementos, telas ou modais (bottomsheets) são exibidos
- **THEN** as transições de entrada SHALL concluir o efeito de surgimento em no máximo 200ms com deslocamento vertical reduzido (máximo de 4px).
