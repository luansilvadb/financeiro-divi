## Why

O perfil do usuário e as telas de configurações de membros não refletem consistentemente a identidade visual "Family" definida no `DESIGN.md`. A experiência de usuário precisa ser humanizada e tátil para reduzir o atrito emocional na gestão financeira, alinhando-se à estética de "livro infantil" e "jogo de aventura" do projeto.

## What Changes

- **Refatoração Visual de ConfiguracoesMembros**: Atualização da tela principal de configurações para usar o canvas `#fbfaf9` com textura de ruído e tipografia `Fraunces` para cabeçalhos.
- **Componentes Táteis**: Padronização de botões para o estilo "Tactile Pills" com feedback de escala e cards com profundidade "Inset" (`shadow-subtle`).
- **MembroAvatar Orgânico**: Reformulação do avatar dos membros para usar formas de "blob" orgânicas e cores vibrantes da paleta Family (ember, meadow, sky, sunburst, flamingo).
- **Floating Island Navigation**: Ajuste da navegação de abas (Meu Perfil vs Controle de Acesso) para o padrão de ilha flutuante com glassmorphism.
- **Micro-interações**: Implementação de animações de mola (`ease-spring`) e transições suaves entre estados de visualização.

## Capabilities

### New Capabilities
- `alinhamento-design-perfil`: Define os requisitos de UI/UX específicos para o perfil e gestão de membros seguindo as diretrizes do `DESIGN.md`.

### Modified Capabilities
- `perfil-usuario-cartoes`: Atualização dos requisitos visuais para a gestão de cartões dentro do perfil do usuário para manter a consistência estética.

## Impact

- **Frontend**: 
    - `src/views/screens/ConfiguracoesMembros.vue` (Estrutura e layout principal)
    - `src/views/components/ui/MembroAvatar.vue` (Visual do avatar)
    - `src/views/components/ledger/ConfiguracoesCartoes.vue` (Estética da lista de cartões)
    - `src/views/components/ui/Button.vue` e `Card.vue` (Refinamento de estilos base se necessário)
- **Design System**: Alinhamento rigoroso com `DESIGN.md` e tokens Tailwind v4.
