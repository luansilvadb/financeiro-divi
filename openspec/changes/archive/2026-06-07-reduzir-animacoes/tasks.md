## 1. Estilos Globais CSS e Transições de Abas

- [x] 1.1 Reduzir a duração das transições de abas (`.tab-slide-left` e `.tab-slide-right`) de `0.4s` para `0.18s` e atenuar a translação horizontal (`translateX`) de `20px` para `4px` em `src/main.css`.
- [x] 1.2 Ajustar a animação `@keyframes float` no `src/main.css`, atenuando a oscilação vertical para `2px` e estendendo a duração do ciclo para `6s`.
- [x] 1.3 Ajustar a animação `@keyframes wobble` no `src/main.css`, reduzindo a oscilação de rotação para `0.5deg` (e removendo alteração de escala) com ciclo estendido para `8s`.

## 2. Ajustes de Mascote (IllustrationMascot.vue)

- [x] 2.1 Desativar os ciclos de animação nos braços e pernas (`.animate-arm-wave`, `.animate-leg-left`, `.animate-leg-right`) no componente `src/views/components/ui/IllustrationMascot.vue`, mantendo-os estáticos por padrão.
- [x] 2.2 Desacelerar o ciclo de respiração `.animate-breathe` de `4s` para `8s` e atenuar a deformação de escala no `@keyframes breathe` para oscilar entre `1.01` e `0.99`.
- [x] 2.3 Desacelerar o ciclo de piscada `.animate-blink` de `5s` para `8s` no CSS scoped do componente.

## 3. Otimização das Animações de Entrada de Telas

- [x] 3.1 Revisar os componentes e telas que utilizam animações de entrada `animate-in` (tais como `TenantSelectorScreen.vue`, `LoginScreen.vue`, etc.) e acelerar transições longas substituindo `duration-500` / `duration-700` por `duration-200` ou `duration-300`.
- [x] 3.2 Suavizar translações de subida verticais/laterais de elementos e modais, encurtando classes como `slide-in-from-bottom-4` para `slide-in-from-bottom-2` ou `slide-in-from-bottom-1`.

## 4. Testes e Validação

- [x] 4.1 Executar a suíte de testes unitários do frontend para garantir que nenhum ajuste de estilos ou de tags causou falha nas asserções dos componentes.
- [x] 4.2 Realizar validação visual da fluidez e agilidade das abas e redução visual dos mascotes no ambiente de desenvolvimento local.
