## 1. Frontend - Modo Foco nas Configurações

- [x] 1.1 Modificar o componente `ConfiguracoesCartoes.vue` para declarar e emitir o evento `focus-change(active: boolean)` ao abrir ou fechar o formulário de cadastro de cartões.
- [x] 1.2 Atualizar `ConfiguracoesMembros.vue` para escutar o evento `@focus-change` de `<ConfiguracoesCartoes />` e armazenar o estado em uma ref reativa `isCartaoFocus`.
- [x] 1.3 Utilizar condicionais `v-if="!isCartaoFocus"` em `ConfiguracoesMembros.vue` para ocultar o cabeçalho ("Moradores & Cargos"), a barra de navegação por abas ("Meu Perfil" / "Controle de Acesso"), o card de perfil pessoal e o rodapé principal do bottom sheet de configurações.
- [x] 1.4 Refatorar o estilo do botão de voltar circular no formulário de `ConfiguracoesCartoes.vue` para usar TailwindCSS v4 de acordo com os estilos premium e transições do mockup.

## 2. Frontend - Cores Dinâmicas de Cartões

- [x] 2.1 Criar uma função utilitária em TypeScript `obterCorCartao(nome: string): string` para extrair e mapear o nome do cartão para cores baseadas na marca correspondente (ex: Nubank -> roxo, C6 -> preto, Inter -> laranja) ou retornar uma cor default elegante.
- [x] 2.2 Integrar a função utilitária de cores no componente de listagem de cartões de `ConfiguracoesCartoes.vue` para renderizar os ícones e elementos decorativos com a cor de marca mapeada.
- [x] 2.3 Atualizar os componentes de exibição de faturas e cartões (ex: no Dashboard ou listas de pagamento) para renderizarem as cores dinâmicas mapeadas correspondentes.

## 3. Frontend - Modo Foco no Wizard de Lançamentos (Removido sob Demanda)

- [x] 3.1 Remover opção de cadastro de cartões inline e Modo Foco do `NovoLancamentoWizard.vue` (Removido a pedido do usuário).

## 4. Testes e Validação

- [x] 4.1 Atualizar os testes unitários existentes em `ConfiguracoesMembros.test.ts` para cobrir o comportamento condicional do layout sob o estado `isCartaoFocus`.
- [x] 4.2 Executar a suíte de testes do frontend com `npm run test` e verificar que todas as asserções de componentes passam com sucesso.
- [x] 4.3 Testar manualmente no navegador todas as transições de Modo Foco e a renderização dinâmica de cores cadastrando cartões com nomes diferentes ("Nubank", "C6 Carbon", "Itaú", etc.).

## 5. Modo Foco para Novo Morador (Solicitação Extra)

- [x] 5.1 Refatorar `MembroFormBottomSheet.vue` para ser inline e aplicar o Modo Foco no `ConfiguracoesMembros.vue` ao cadastrar novo morador.
- [x] 5.2 Refatorar o formulário de edição de morador para ser inline e aplicar o Modo Foco no `ConfiguracoesMembros.vue` ao editar morador.
- [x] 5.3 Refatorar o formulário de cargos (Novo/Editar) para ser inline e aplicar o Modo Foco no `ConfiguracoesMembros.vue`.
- [x] 5.4 Suavizar a animação do switch de permissões do cargo no `CargoFormBottomSheet.vue` para ser fluido e idêntico ao de morador ativo.
