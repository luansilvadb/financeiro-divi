## Context

A tela de configurações da aplicação `Divi` (moradores e cargos) é exibida em um BottomSheet a partir do `App.vue`. Atualmente, a criação e edição de cartões pessoais no componente `ConfiguracoesCartoes.vue` divide espaço com outras seções da tela (como dados do perfil do morador e cabeçalho/footer geral), o que causa poluição visual e distração.

As alterações sugeridas visam otimizar a experiência introduzindo o **Modo Foco** no cadastro de cartões, tanto na tela de configurações quanto no assistente de lançamentos, além de polir a estética de controle de navegação e as cores dos cartões baseadas na marca diretamente no frontend.

## Goals / Non-Goals

**Goals:**
- Implementar o Modo Foco ao cadastrar/editar cartões no painel de configurações e no assistente de novos lançamentos.
- Ajustar os estilos dos botões de voltar nos formulários de cartões para utilizar o design circular premium e micro-animações validadas.
- Mapear dinamicamente marcas de cartões conhecidas no frontend para suas cores institucionais correspondentes.

**Non-Goals:**
- Modificar o esquema do banco de dados PostgreSQL ou adicionar novos campos (como `cor`) na entidade de domínio `Cartao`.
- Criar novos endpoints de backend no NestJS ou alterar as APIs REST.

## Decisions

### Decisão 1: Comunicação por Eventos para Ativar o Modo Foco no Vue 3
* **Escolha**: O componente filho `ConfiguracoesCartoes.vue` emitirá um evento personalizado `focus-change(active: boolean)` ao alternar para o formulário. O pai `ConfiguracoesMembros.vue` escutará o evento e atualizará uma variável reativa local (`isCartaoFocus`) que ocultará condicionalmente o header, abas e rodapé.
* **Alternativa considerada**: Gerenciar o estado global no `useMembros` ou na store do Pinia. Descartado porque o Modo Foco é puramente um estado de layout de visualização específico deste painel e não precisa poluir o estado de negócio global.

### Decisão 2: Mapeamento de Cores Dinâmicas no Frontend
* **Escolha**: Adicionar uma função utilitária pura `obterCorCartao(nome: string): string` no frontend que analisa o nome do cartão de forma case-insensitive e retorna a cor correspondente (ex: roxo para "Nubank", azul para "Itaú", laranja para "Inter", preto para "C6", etc.).
* **Alternativa considerada**: Fazer migração no banco de dados (Prisma) para persistir o campo `cor` em `Cartao`. Descartado para manter a entrega simples, sem riscos de quebra de banco de dados e mantendo a agilidade do desenvolvimento.

### Decisão 3: Estilização do Botão de Voltar com Tailwind CSS v4
* **Escolha**: Refatorar o botão de voltar circular utilizando Tailwind para aplicar: círculo perfeito (`w-10 h-10 rounded-full`), fundo branco puro (`bg-white`), bordas cinzas suaves (`border border-stone-200`), transição de transformação suave e aumento de escala no hover com destaque da cor da marca (`hover:scale-105 hover:text-ember`).
* **Alternativa considerada**: Reutilizar o componente global `<Button>` para o voltar. Descartado porque o botão de voltar circular tem proporções específicas e interações muito finas que são mais facilmente declaradas localmente ou com classes utilitárias diretas.

## Risks / Trade-offs

- **[Risco]** Nomes de cartões escritos de forma atípica (ex: "meu cartão roxinho" em vez de "Nubank") não serão identificados pelo mapeamento de cores dinâmico.
  * *Mitigação*: A função utilitária retornará uma cor padrão elegante (como o cinza/grafite da marca) caso o nome não combine com as marcas cadastradas.
- **[Risco]** Ocultar o rodapé e o header principal do BottomSheet de Configurações pode deixar o usuário sem um botão "fechar" global ativo se o Modo Foco falhar.
  * *Mitigação*: O botão de voltar circular do formulário atua como um botão de saída seguro, garantindo que o usuário sempre possa restaurar o estado da tela.
