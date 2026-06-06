## Context

O componente `ConfiguracoesMembros.vue` e seus correlacionados (`MembroAvatar.vue`, `ConfiguracoesCartoes.vue`) foram desenvolvidos focando na funcionalidade, mas utilizam estilos genéricos ou versões desatualizadas da identidade visual Family. Existem inconsistências em tokens de cores (ex: uso de cores padrão do Tailwind v3 em vez dos tokens v4 definidos no `DESIGN.md`) e formas geométricas (ex: avatares retangulares/arredondados em vez de orgânicos).

## Goals / Non-Goals

**Goals:**
- Implementar o tema Family completo no perfil do usuário e gestão de membros.
- Padronizar o uso de cores, tipografia (Fraunces/Inter) e animações de mola.
- Transformar o `MembroAvatar` em uma forma orgânica e animada (blob).
- Adotar o padrão de navegação "Floating Island" para as abas de configuração.

**Non-Goals:**
- Não alterar a lógica de negócio de autenticação, permissões ou persistência de dados.
- Não modificar endpoints do backend ou esquema do banco de dados.
- Não refatorar componentes fora do escopo de perfil e configurações.

## Decisions

- **MembroAvatar com Morphing CSS**: Utilizaremos animações de `border-radius` complexas (ex: `rounded-[40%_60%_70%_30%_/_40%_50%_60%_50%]`) para simular o efeito de blob orgânico. Isso mantém a performance alta sem a necessidade de SVGs pesados ou bibliotecas externas.
- **Floating Island Glassmorphism**: A navegação de abas será refatorada para um container com `backdrop-blur-xl` e `bg-white/90`, flutuando sobre o canvas com `shadow-lg` e bordas `rounded-pill`.
- **Animações Táteis (Ease-Spring)**: Aplicaremos o `cubic-bezier(0.19, 1, 0.22, 1)` globalmente para feedbacks de clique e transições de interface, garantindo a sensação de "produto físico".
- **Typography Swap**: Forçar o uso de `font-display` (Fraunces) para os cabeçalhos das seções e `font-sans` (Inter) para o corpo de texto, respeitando a escala tipográfica definida.
- **Shadow-Subtle Inset**: Substituiremos todas as sombras externas por bordas inset (`shadow-subtle`) conforme o padrão de "profundidade tátil" do design.

## Risks / Trade-offs

- [Risco] Performance em animações de morphing simultâneas na lista de membros. → [Mitigação] Utilizar `will-change: border-radius` e garantir que as animações sejam simples e executadas na GPU.
- [Risco] Inconsistência de cores entre o CSS e o código Vue. → [Mitigação] Utilizar exclusivamente variáveis de tema do Tailwind v4 (`var(--color-*)`) nos templates.
- [Risco] Legibilidade da textura de ruído. → [Mitigação] Aplicar a textura via overlay de baixa opacidade (0.02) apenas no background `canvas`.
