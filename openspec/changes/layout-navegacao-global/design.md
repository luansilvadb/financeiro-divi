## Context

Atualmente, o aplicativo possui uma navegação fragmentada. A `BottomTabBar` só tem opções para "Hoje" e "Faturas", enquanto a troca de Casa (Tenant) só ocorre em momentos de inicialização e o "Perfil" está oculto. Com o objetivo de tornar o modelo mental mais claro, decidimos implementar uma navegação global `[Casas] [Hoje] [FAB] [Faturas] [Perfil]`.

O sistema já utiliza o paradigma de `BottomSheet` para o `NovoLancamentoWizard` e para `ConfiguracoesMembros`. A troca de Tenant também pode utilizar este paradigma.

## Goals / Non-Goals

**Goals:**
- Implementar as opções "Casas" e "Perfil" no `BottomTabBar.vue` preservando a estrutura visual de pill e animações atuais.
- Permitir a troca de Tenant abrindo um Bottom Sheet que não cause reload total da página ou perda da aba de fundo.
- Expor as configurações do Perfil diretamente pela navegação inferior.

**Non-Goals:**
- Não migrar o roteamento para `vue-router`. Manteremos a gerência de views por estado local no `App.vue` como é hoje, para minimizar riscos.
- Não alterar as telas de Faturas e Dashboard além de seu roteamento de exibição.

## Decisions

1. **Expansão do Tipo Tab:**
   O tipo exportado no `BottomTabBar.vue` não será expandido para ser o estado da view principal, mas sim os itens clicáveis. Quando o usuário clica em `casas` ou `perfil`, o `BottomTabBar` emitirá o clique, mas o `App.vue` **não** mudará a aba de fundo (ex: não sairá de "Hoje"), apenas abrirá o respectivo Bottom Sheet sobrepondo a tela.

2. **Criação do TenantSwitcherModal.vue:**
   Criaremos um componente dedicado para o Bottom Sheet de Casas (reutilizando estilos do `TenantSelectorScreen.vue`), pois a tela atual de seletor é feita para ocupar a tela inteira quando o usuário não tem tenant.

3. **Gerência de Estado no App.vue:**
   O `App.vue` vai escutar os cliques na TabBar.
   - `onClick(casas)` -> `currentView.value = 'tenantSwitcher'`
   - `onClick(perfil)` -> `currentView.value = 'settings'`
   - `onClick(hoje | faturas)` -> `activeTab.value = id` (mantém o comportamento atual)

## Risks / Trade-offs

- **[Risk] Abertura de múltiplos Bottom Sheets:** O usuário poderia teoricamente tentar abrir o perfil enquanto o seletor de casas está aberto.
  **Mitigação:** O componente `BottomSheet` ou o gerenciamento de estado no `App.vue` deve fechar o modal anterior ao abrir o novo (o que já é o comportamento padrão ao sobrescrever o `currentView`).
- **[Risk] Recarregamento de Dados:** Ao trocar de Tenant via Bottom Sheet, precisamos garantir que todos os subscriptions do WebSocket e fetchs da nova casa sejam feitos silenciosamente.
  **Mitigação:** Reutilizar a função já existente `handleCasaSelecionada` do `App.vue` que limpa o cache e reinicializa os repositórios para o novo TenantId.
