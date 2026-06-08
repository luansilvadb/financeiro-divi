## Context

O estilo visual "Family" do Divi faz uso de animações dinâmicas de mascotes e transições com deslocamento no dashboard. Contudo, esses movimentos constantes, embora amigáveis, geram desconforto visual e fadiga após uso prolongado, além de criarem uma percepção de lentidão devido a transições de aba longas (400ms). Este design detalha as mudanças necessárias para reduzir as animações do app a um patamar minimalista e de alta produtividade, sem remover a identidade base do produto.

## Goals / Non-Goals

**Goals:**
* Reduzir os tempos de transição de abas e telas para torná-los quase instantâneos.
* Tornar os mascotes ilustrados estáticos nas pernas/braços e desacelerar a respiração para evitar distrações periféricas na tela.
* Atenuar drasticamente a amplitude de balanço de cards e ilustrações flutuantes globais.
* Garantir que as mudanças de animações respeitem as durações rápidas (limite de 200ms) para as transições de entrada.

**Non-Goals:**
* Não iremos remover os mascotes ou os elementos visuais ilustrativos, mantendo a identidade gráfica e os esquemas de cores.
* Não serão criadas configurações em banco de dados ou preferências do usuário; a mudança será o novo padrão simplificado de animação do aplicativo.

## Decisions

### 1. Suavização de Animações Globais no CSS (`src/main.css`)
* **Transição de Abas (`tab-slide`)**: A duração de `0.4s` com spring e deslocamento de `20px` gera atraso visual. Reduziremos para `0.18s` de duração com `ease-out`, e encolheremos o deslocamento de `20px` para `4px`.
* **Flutuação (`.animate-float`)**: A oscilação vertical contínua de `10px` em `3s` será atenuada. O deslocamento no `@keyframes float` passará a ser de no máximo `2px` com ciclo expandido para `6s`.
* **Giro (`.animate-wobble`)**: O balanço de `3deg` e escala de `1.05` em `4s` será atenuado. O deslocamento no `@keyframes wobble` será reduzido para rotação de no máximo `0.5deg` (sem alteração de escala) com ciclo de `8s`.

### 2. Estabilização e Suavização de Mascotes (`IllustrationMascot.vue`)
* **Membros Estáticos**: Desativaremos as animações `.animate-arm-wave` (braço) e `.animate-leg-left` / `.animate-leg-right` (pernas) para mantê-las em posições estáticas fixas.
* **Respiração Lenta (`.animate-breathe`)**: O ciclo de respiração contínua passará de `4s` para `8s`. O `@keyframes breathe` terá sua oscilação reduzida de `1.03` / `0.97` para `1.01` / `0.99`.
* **Ciclo de Piscada (`.animate-blink`)**: O tempo do ciclo de piscadas de olho passará de `5s` para `8s`.

### 3. Aceleração de Elementos de Entrada (`animate-in` / `duration-X`)
* **Duração de Transição**: Ajustar elementos que possuem a classe `animate-in` combinada com durações de `500` ou `700` (`duration-500` / `duration-700`) para usarem durações de `200` ou `300` (`duration-200` / `duration-300`).
* **Deslocamento de Entrada**: Reduzir classes de deslocamento como `slide-in-from-bottom-4` para `slide-in-from-bottom-1` ou `slide-in-from-bottom-2` para uma entrada mais elegante e discreta.

## Risks / Trade-offs

* **[Risco] Perda da sensação de "diversão" da marca**: Mascotes estáticos podem deixar o app ligeiramente menos lúdico.
  * **Mitigação**: Os mascotes ainda possuem cores vibrantes, expressões faciais divertidas e piscam de olhos de forma lenta e natural. A piscada mantém a sensação de "vida" sem o estresse de movimentos cíclicos mais intensos.
