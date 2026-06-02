# Skeleton Loading Premium Design

## Objetivo

Evoluir o `SkeletonMimic.vue` existente para representar com alta fidelidade a estrutura real do dashboard enquanto os dados estão sendo carregados. O skeleton deve melhorar a percepção de continuidade sem adicionar espera artificial, sem aparecer em trocas de aba locais e sem alterar o tema global atual do Divi.

## Escopo

### Incluído

- Criar uma primitiva reutilizável `SkeletonBlock.vue`.
- Refatorar `SkeletonMimic.vue` para compor variantes fiéis para as abas `hoje` e `faturas`.
- Preservar a identidade visual light atual do Divi.
- Preparar tokens encapsulados para futura ativação por ancestral `.dark`.
- Respeitar `prefers-reduced-motion`.
- Exibir o skeleton apenas durante espera real de dados.
- Remover o skeleton cenográfico acionado por troca de aba.
- Remover atrasos mínimos artificiais usados somente para prolongar a visualização do skeleton.
- Adicionar testes focados em semântica, variantes e ativação.

### Fora do escopo

- Ativar dark mode global no Divi.
- Alterar layouts finais do dashboard.
- Adicionar biblioteca de animação.
- Substituir os indicadores de carregamento de ações pontuais, como botões de login.
- Criar um schema genérico de renderização dinâmica.

## Direção visual

O skeleton mantém o vocabulário tátil do Divi: canvas claro, superfícies brancas, rebaixos em parchment e blocos stone com contraste discreto. Ele não deve parecer uma camada genérica sobre a tela. Cada bloco ocupa a posição, o ritmo e a proporção aproximada do conteúdo final.

O shimmer usa uma faixa luminosa larga e de baixo contraste. A faixa atravessa cada bloco com `transform: translate3d(...)`, sem animar dimensões ou propriedades de layout. A velocidade e a intensidade são controladas por custom properties. Pequenos atrasos escalonados entre blocos dão continuidade visual sem transformar o carregamento em coreografia.

Em `prefers-reduced-motion: reduce`, a faixa deixa de percorrer os blocos. O skeleton permanece estático com contraste suficiente para comunicar o estado sem movimento contínuo.

## Arquitetura

### `SkeletonBlock.vue`

Primitiva visual sem significado semântico próprio. Recebe propriedades pequenas e previsíveis:

- `shape`: `text`, `rect` ou `circle`.
- `width` e `height`: valores CSS opcionais.
- `radius`: valor CSS opcional para ajustes locais.
- `delay`: atraso opcional da animação.
- `tone`: `soft`, `base` ou `strong`.

O componente aplica as variáveis CSS no próprio elemento e renderiza um único bloco. O shimmer é implementado no pseudo-elemento, com `overflow: hidden`, `will-change: transform` apenas na faixa animada e tokens locais para cor, duração e easing.

### `SkeletonMimic.vue`

Composição do dashboard. Continua aceitando `variant: 'hoje' | 'faturas'` e passa a aceitar contagens opcionais para manter fidelidade sem depender de dados ainda indisponíveis:

- `memberRows`, default `3`.
- `fixedBillRows`, default `3`.
- `activityRows`, default `3`.
- `nettingRows`, default `0`.

As contagens permitem adaptar o mimic em recarregamentos futuros quando dados prévios estiverem disponíveis. Durante a carga inicial, os defaults mantêm uma estrutura representativa e estável.

O componente não reutiliza `Card.vue`, porque o card interativo inclui estados de hover e transições desnecessárias para um elemento inerte. Em vez disso, usa shells visuais locais com as mesmas superfícies, bordas, raios e paddings percebidos no dashboard final.

## Composição fiel

### Estrutura comum

- Header tripartido equivalente a `DashboardHeader.vue`.
- Bloco esquerdo com ano e mês.
- Marca central compacta.
- Ação quadrada à direita.
- Espaçamentos equivalentes ao conteúdo final.

### Variante `hoje`

- Rótulo de seção `Status de Hoje`.
- Painel equivalente a `UnifiedBalancePanel.vue`, com cabeçalho e linhas de membros contendo avatar, nome, legenda e valor.
- Se `nettingRows > 0`, rótulo `Acertos Sugeridos` e painel equivalente a `NettingPanel.vue`.
- Rótulo `Rotina da Casa`.
- Painel equivalente a `ContasFixasPanel.vue`, com cabeçalho, contas recorrentes e linha pontilhada de adicionar conta.
- Rótulo `Linha do Tempo`.
- Painel equivalente a `ActivityFeed.vue`, com cabeçalho e cards de atividade contendo título, metadados, valor e área inferior de ações.

### Variante `faturas`

- Card equivalente ao status do período, com ícone, título, descrição e botão responsivo.
- Rótulo `Análise de Fluxo`.
- Painel equivalente a `DetalhamentoSaldosCard.vue`.
- Para cada membro, cabeçalho com avatar, nome e pill de saldo.
- Grade responsiva equivalente à grade financeira de `DetalhamentoMembroCard.vue`: uma coluna no mobile e três colunas a partir de `md`, com os resumos de PIX, faturas e empréstimos.
- Controle central equivalente a `Ver Extrato do Membro`.

## Tematização

Os tokens ficam encapsulados no skeleton:

```css
.skeleton-theme {
  --skeleton-base: rgba(242, 240, 237, 0.88);
  --skeleton-soft: rgba(242, 240, 237, 0.56);
  --skeleton-strong: rgba(226, 223, 219, 0.96);
  --skeleton-highlight: rgba(255, 255, 255, 0.72);
  --skeleton-duration: 1.8s;
  --skeleton-ease: cubic-bezier(0.4, 0, 0.2, 1);
}

:global(.dark) .skeleton-theme {
  --skeleton-base: rgba(71, 70, 69, 0.88);
  --skeleton-soft: rgba(71, 70, 69, 0.56);
  --skeleton-strong: rgba(92, 90, 88, 0.96);
  --skeleton-highlight: rgba(255, 255, 255, 0.10);
}
```

O app continua light. A classe `.dark` apenas prepara o componente para uma ativação futura.

## Acessibilidade

O wrapper de carregamento usa `aria-busy="true"` e inclui uma mensagem curta com `role="status"` para leitores de tela: `Carregando dados do dashboard`.

A árvore visual do skeleton usa `aria-hidden="true"` para evitar que blocos decorativos sejam anunciados. Esses atributos ficam em elementos separados para que a mensagem de status continue acessível.

O skeleton não recebe foco, não responde a ponteiro e não simula controles interativos para tecnologias assistivas.

## Integração

`DashboardSaldos.vue` mantém a decisão de renderizar `SkeletonMimic` quando `props.isLoading` for verdadeiro. O estado local `isSwitching`, seu `watch` e o timeout de `600 ms` são removidos.

`App.vue` mantém `isLoading` conectado às requisições reais:

- Inicialização da sessão autenticada.
- Carga após autenticação.
- Carga após seleção de casa.

Na inicialização, splash e carga de dados podem coexistir enquanto necessários, mas nenhum timeout prolonga o skeleton depois que os dados estiverem prontos. O splash também não deve atrasar artificialmente a entrada no dashboard.

## Testes

### `SkeletonBlock.test.ts`

- Renderiza forma, tom e custom properties.
- Mantém o bloco visual oculto de leitores de tela.

### `SkeletonMimic.test.ts`

- Expõe `aria-busy="true"` e mensagem acessível.
- Renderiza a variante `hoje` com as seções de saldos, contas fixas e atividades.
- Renderiza netting apenas quando `nettingRows > 0`.
- Renderiza a variante `faturas` com status do período e grade detalhada.
- Respeita contagens configuráveis.

### `DashboardSaldos.test.ts`

- Renderiza skeleton quando `isLoading` é verdadeiro.
- Não renderiza skeleton apenas porque a aba mudou.

## Critérios de aceite

- O skeleton aparece somente durante espera real de dados.
- Não há timeout mínimo para prolongar seu tempo de tela.
- A composição reflete as seções reais das duas abas.
- A animação usa apenas HTML e CSS, sem biblioteca externa.
- Light mode preserva o visual atual do Divi.
- Um ancestral `.dark` altera os tokens do skeleton sem ativar dark mode global.
- Movimento reduzido desativa o deslocamento contínuo do shimmer.
- Leitores de tela recebem um único status útil e ignoram os blocos decorativos.
