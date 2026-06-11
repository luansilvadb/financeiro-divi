## Why

O modelo mental de navegação do app estava ocultando funções importantes (como o Perfil/Configurações dentro de menus) e utilizando a tela inicial para forçar a escolha da Casa (Tenant), o que quebrava o fluxo se o usuário quisesse apenas verificar configurações globais ou trocar de contexto rapidamente. A implementação de uma Barra de Navegação Inferior (Bottom Navigation Bar) com acesso direto a todas as áreas chaves resolve esses problemas de usabilidade, deixando claro onde encontrar cada coisa (Casas, Hoje, FAB, Faturas, Perfil).

## What Changes

- O `BottomTabBar.vue` passará de 2 itens para 4 itens e 1 FAB centralizado.
- **Aba "Casas"**: Adicionada à navegação inferior. Atuará como um gatilho para abrir um Bottom Sheet de troca de contexto (seleção de Tenant), permitindo trocar de Casa sem sair da tela atual.
- **Aba "Perfil"**: Adicionada à navegação inferior. Substitui o antigo botão escondido de "Configurações", elevando o acesso à Identidade Global do usuário.
- **FAB Central**: Mantido com a mesma funcionalidade de Nova Despesa (NovoLancamentoWizard), mas agora integrando visualmente uma barra de navegação completa.
- Refatoração do `App.vue` para gerenciar as novas opções de view atreladas à TabBar.

## Capabilities

### New Capabilities
- `navegacao-global`: Define a estrutura da Barra de Navegação Inferior e como o usuário interage e transita entre os grandes blocos de informação (Casas, Dashboard, Faturas e Perfil).

### Modified Capabilities
- `perfil-identidade-global`: O acesso aos requisitos de Perfil e Configurações de Membros muda para ser parte da navegação principal de primeiro nível (Bottom Navigation Bar), em vez de um sub-menu.

## Impact

- **Frontend**: `App.vue`, `BottomTabBar.vue`. Criação de um novo componente de Bottom Sheet para troca rápida de Tenant (ex: `TenantSwitcherModal.vue`), reaproveitando a lógica do `TenantSelectorScreen.vue`.
- **Backend**: Nenhum impacto. A mudança é puramente de UI/UX e roteamento no cliente.
- **Banco de Dados**: Nenhum impacto no esquema Prisma.
- O isolamento multi-tenant está mantido. A troca de tenant continuará acionando a recarga dos viewmodels da nova Casa conectada.
