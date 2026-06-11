## Why

Atualmente, o fluxo de criação de cartões na tela de configurações causa distração visual, pois o formulário de cadastro divide espaço com informações de perfil do usuário e cabeçalhos fixos da tela, além de exibir botões de voltar sem o encaixe e polimento visual adequados. Adicionalmente, a tela de configurações era tratada como uma tela cheia, e unificá-la como um BottomSheet alinhado ao restante da aplicação trará mais consistência e fluidez para a experiência do usuário.

## What Changes

- **BottomSheet de Configurações**: A tela de configurações deixa de ser uma tela cheia e passa a ser exibida dentro de um BottomSheet deslizante, mantendo o usuário no contexto do Dashboard.
- **Modo Foco (Zen Mode) no Cadastro de Cartões**: Ao abrir o formulário de cadastrar ou editar cartão dentro das configurações, o cabeçalho do BottomSheet, as abas de navegação, o card de perfil e o rodapé do BottomSheet são ocultados elegantemente, permitindo foco total no formulário.
- **Botão de Voltar Premium**: O botão de voltar do formulário de cartões é atualizado para um design circular premium e polido, com sombras discretas e micro-animações interativas de escala e destaque de cor no hover e active.
- **Cores de Cartões Dinâmicas no Frontend**: Mapeamento inteligente de cores baseadas no nome do cartão inserido pelo usuário (ex: "nubank" -> roxo, "c6" -> preto, "inter" -> laranja) diretamente no frontend, provendo riqueza estética sem a necessidade de migração no banco de dados ou backend.
- **Modo Foco no Wizard de Lançamentos**: Ocultação dos cabeçalhos de progresso e rodapés do wizard principal quando o sub-fluxo inline de cadastro de cartão for ativado.

## Capabilities

### New Capabilities
<!-- Capabilities being introduced. Replace <name> with kebab-case identifier (e.g., user-auth, data-export, api-rate-limiting). Each creates specs/<name>/spec.md -->

### Modified Capabilities
- `perfil-usuario-cartoes`: Alterado o fluxo de apresentação do formulário de criação/edição de cartões para adotar o Modo Foco (Zen Mode) e botões de navegação circular polidos dentro do BottomSheet de Configurações.

## Impact

- **Frontend (Vue 3)**:
  - `src/App.vue`: Ajustar gerenciamento de estados se necessário para alinhar a rota de configurações ao BottomSheet.
  - `src/views/screens/ConfiguracoesMembros.vue`: Implementar suporte ao estado de foco (ocultando cabeçalho, abas de navegação, card de perfil e footer principal quando o componente de cartões solicitar).
  - `src/views/components/ledger/ConfiguracoesCartoes.vue`: Adicionar emissão de evento de foco (`focus-change`) ao alternar para o formulário, estilizar o botão de voltar circular premium com Tailwind e aplicar cores dinâmicas no frontend com base no nome do cartão.
  - `src/views/screens/NovoLancamentoWizard.vue`: Adicionar suporte a Modo Foco ocultando cabeçalho e rodapé do wizard principal quando o sub-fluxo inline de cartões for aberto.
- **APIs & Backend**: Nenhum impacto (as cores dos cartões serão resolvidas dinamicamente no frontend).
