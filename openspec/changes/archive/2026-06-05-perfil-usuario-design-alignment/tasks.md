## 1. Refatoração de Componentes Base

- [x] 1.1 Atualizar `MembroAvatar.vue` para implementar o morphing orgânico (blob) com animação CSS e paleta de cores Family.
- [x] 1.2 Ajustar `Button.vue` para garantir o estilo "Tactile Pill" com animação de escala `ease-spring`.
- [x] 1.3 Ajustar `Card.vue` para garantir o uso de `shadow-subtle` (profundidade inset).

## 2. Refatoração de ConfiguracoesMembros.vue

- [x] 2.1 Aplicar o canvas `#fbfaf9` e textura de ruído ao background principal da tela.
- [x] 2.2 Atualizar o cabeçalho "Perfil do Usuário" para usar a fonte `Fraunces` (`text-display`).
- [x] 2.3 Implementar a barra de navegação "Floating Island" (Meu Perfil / Controle de Acesso) com glassmorphism e animações suaves.
- [x] 2.4 Padronizar todas as cores, bordas e sombras internas utilizando os tokens v4 definidos no `DESIGN.md`.

## 3. Alinhamento de Sub-componentes e Detalhes

- [x] 3.1 Atualizar `ConfiguracoesCartoes.vue` para utilizar os novos padrões de cards táteis e botões pills.
- [x] 3.2 Refinar os BottomSheets e modais internos para manter a consistência visual.
- [x] 3.3 Revisar micro-interações e transições entre abas para usar a curva `ease-spring`.
- [x] 3.4 Mover formulário de 'Novo Cartão' para um BottomSheet para manter a consistência visual.

## 4. Validação e Testes

- [x] 4.1 Verificar a responsividade da nova interface em diferentes tamanhos de tela.
- [x] 4.2 Rodar os testes existentes (`ConfiguracoesMembros.test.ts`) e ajustar se as mudanças de estrutura de DOM afetarem as asserções.
