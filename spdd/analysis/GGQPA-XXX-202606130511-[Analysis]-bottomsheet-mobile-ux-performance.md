# SPDD Analysis: Otimização de Performance e Fluidez do BottomSheet no Mobile

## Original Business Requirement
quero melhorar a experiencia do bottomsheet no mobile está com baixo desempenho e suavidade

## Domain Concept Identification

### Existing Concepts (from codebase)
- **BottomSheet.vue**: Componente base de interface do usuário (`src/views/components/ui/BottomSheet.vue`) que fornece o layout, a animação de entrada e saída e o suporte a gestos de arrasto para fechar no mobile e desktop.
- **useBottomSheetState**: Composable de gerenciamento de estado global de visibilidade e bloqueio de scroll dos bottom sheets ativos no ecossistema da aplicação (`src/viewmodels/useBottomSheetState.ts`).
- **DashboardModalsManager.vue**: Gerenciador de diálogos e modais na tela de saldos que utiliza instâncias de BottomSheet para auditoria de logs, casas, histórico e outras ações do usuário.

### New Concepts Required
- **Zero-Jitter Gesture Engine**: Motor de detecção e processamento de gestos de toque (touch gestures) desacoplado da thread de renderização principal, operando via `requestAnimationFrame` (RAF).
- **Interactive Backdrop Fade**: Mecânica de ajuste de opacidade em tempo real do overlay escuro (backdrop) proporcional ao progresso da translação vertical do arrasto.
- **Scroll-to-Drag Seamless Transition**: Mecanismo de transição suave que aciona o arraste do painel a partir do momento em que o scroll do conteúdo atinge o topo (`scrollTop = 0`), sem exigir que o usuário solte o dedo e inicie um novo gesto.

### Key Business Rules
- **Ergonomia Tátil**: O arrasto para fechar deve responder instantaneamente ao movimento do dedo (latência próxima de zero), simulando o comportamento nativo de folhas de ação do iOS/Android.
- **Transição Não Conflitante**: Mutações JS nas propriedades de transformação (`translateY`) e opacidades não podem concorrer com transições CSS (`transition-all`) sob o mesmo elemento durante o movimento ativo do usuário.

---

## Strategic Approach

### Solution Direction
O foco da otimização é a eliminação da latência física e do lag visual causados pela concorrência entre o motor de interpolação CSS do navegador e os eventos frequentes de toque capturados na main thread. Modificaremos o componente base [BottomSheet.vue](file:///d:/projetos/financeiro-divi/src/views/components/ui/BottomSheet.vue) para implementar um manipulador de gestos de alta performance rodando na GPU (compositor thread) com throttle de frames.

### Key Design Decisions
- **Eliminação do `transition-all` durante o toque**: Removemos temporária e cirurgicamente qualquer classe de transição do elemento raiz do BottomSheet no momento em que o usuário inicia o toque (`touchstart`). A transição é restabelecida apenas na animação de retorno/fechamento (`touchend`), evitando que o navegador tente interpolar o movimento a cada frame do dedo.
- **Gestão de Toque por RAF (Zero-Jitter)**: Introduziremos o padrão de atualização imperativa via `requestAnimationFrame` (RAF) no `touchmove` e `mousemove`. As atualizações na propriedade `transform: translateY(...)` e na opacidade do backdrop serão agendadas para o próximo frame de atualização da tela (60Hz/120Hz), evitando perda de frames (*frame dropping*).
- **Contra-Opacidade do Backdrop**: Acoplaremos o elemento de backdrop ao gesto, reduzindo a opacidade de `bg-black/40` linearmente conforme o `translateY` do painel se aproxima de `100%` da altura da tela, fornecendo feedback tátil premium de fechamento.
- **Interpolação Elástica de Mola (Spring Physics)**: Substituiremos o fechamento por transições de Material Design com spring physics (curvas cúbicas com desaceleração suave) para que o retorno ao topo e a descida de fechamento pareçam orgânicos e responsivos.

### Alternatives Considered
- **Uso de biblioteca externa (ex: VueUse ou Swiper)**: Rejeitado para manter o componente leve e livre de dependências extras, visto que podemos otimizar o manipulador de toque nativo de forma cirúrgica e limpa.

---

## Risk & Gap Analysis

### Requirement Ambiguities
- **Limite de Fechamento**: Qual a distância exata de arrasto para consolidar o fechamento? Definiremos um limiar padrão de `100px` ou `25%` da altura do painel para evitar fechamentos acidentais em micro-scrolls.

### Edge Cases
- **Concorrência com Scroll de Inputs/Textareas**: Usuários rolando o conteúdo do BottomSheet que contém inputs podem disparar o gesto de fechar involuntariamente.
  *Mitigação*: Refinar a detecção do `shouldStartDrag` para ignorar o gesto quando a interação iniciar sobre elementos de formulário focados ou áreas marcadas com classe `.no-drag`.
- **Momentum Scrolling Interno**: Se o usuário rolar o conteúdo interno rapidamente para cima, o scroll atinge o topo (`scrollTop = 0`) com velocidade. Se o arrasto for ativado imediatamente, pode causar um tranco (*jerk*) visual.
  *Mitigação*: Ativar a transição para arrasto apenas em gestos de toque de velocidade controlada ou quando o scroll já estiver repousando no topo antes do início do gesto.

### Technical Risks
- **Layout Shifts e Garbage Collection**: O acúmulo de variáveis de evento de toque na main thread pode disparar ciclos de garbage collection freqüentes, provocando micro-travamentos (*stuttering*).
  *Mitigação*: Armazenar os estados do gesto em variáveis locais simples (`let` plano) em vez de propriedades reativas do Vue (`ref`, `reactive`), mantendo o hot-path de toque livre de sobrecarga de reatividade.

### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1   | Arrasto com latência zero no mobile | Sim | Será obtido com a remoção de `transition-all` do contêiner durante o toque. |
| 2   | Backdrop overlay interativo no fechamento | Sim | A opacidade do backdrop será calculada de forma imperativa e síncrona com o scroll. |
| 3   | Transição fluida de scroll para arraste | Sim | Lógica de monitoramento do scroll interno e transição de eventos. |
