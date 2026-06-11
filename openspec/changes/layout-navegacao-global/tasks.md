## 1. UI Components (Frontend)

- [x] 1.1 Criar o componente `TenantSwitcherModal.vue` no diretório de `components/ui`, adaptando a interface de listagem de casas baseada no atual `TenantSelectorScreen.vue`.
- [x] 1.2 Atualizar o tipo `Tab` exportado pelo `BottomTabBar.vue` para incluir os novos valores: `'casas'` e `'perfil'`.
- [x] 1.3 Modificar o template do `BottomTabBar.vue` para exibir 5 slots: `[Casas] [Hoje] [Espaço Vazio do FAB] [Faturas] [Perfil]`, importando os ícones correspondentes da biblioteca Lucide.

## 2. Roteamento e Estado (App.vue)

- [x] 2.1 Adicionar `'tenantSwitcher'` à tipagem do ref `currentView` no `App.vue`.
- [x] 2.2 Importar o componente `TenantSwitcherModal.vue` e adicioná-lo dentro de um novo `BottomSheet` no template do `App.vue`.
- [x] 2.3 Interceptar a mudança de abas no evento `@update:modelValue` do `<BottomTabBar>`: se a aba selecionada for `'casas'` ou `'perfil'`, atualizar a variável `currentView` e manter o `activeTab` intacto; caso contrário, atualizar o `activeTab`.

## 3. Fluxos de Ação e Testes

- [x] 3.1 Conectar o evento de seleção de casa do `TenantSwitcherModal` à função `handleCasaSelecionada` já existente no `App.vue` para disparar a troca e re-fetch de dados.
- [x] 3.2 Garantir que ao clicar em "Perfil" o Bottom Sheet correto (`ConfiguracoesMembros`) seja aberto e funcione como esperado.
- [x] 3.3 Executar e adaptar os testes de componente unitários de `App.vue` e `BottomTabBar` (Vitest).
