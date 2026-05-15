# Design Spec: Novo Lançamento FAB

O objetivo é transformar o botão de "Novo Lançamento", que atualmente reside dentro do card de Saldos, em um **Floating Action Button (FAB)** fixo no canto inferior direito da tela. Isso melhora a acessibilidade (alcance do polegar) e garante que a ação principal esteja sempre disponível.

## Arquitetura e Componentes

1.  **DashboardSaldos.vue**:
    - Remover o botão "Novo" atual do cabeçalho do card de Saldos.
    - Limpar o `emit('novo-lancamento')` se não for mais usado por outros componentes internos (embora possa ser mantido se desejarmos manter a flexibilidade).

2.  **App.vue**:
    - Adicionar um novo botão FAB fixo.
    - Posicionamento: `fixed bottom-6 right-6`.
    - Estilo: Circular, `bg-blue-600`, sombra elevada (`shadow-lg`), ícone `PlusCircle` branco.
    - Visibilidade: Apenas quando `currentView === 'dashboard'`.
    - Ação: `@click="currentView = 'wizard'"`.

## Visual Design (Opção Escolhida)

- **Formato**: Círculo perfeito.
- **Tamanho**: ~56px (`w-14 h-14`).
- **Ícone**: `PlusCircle` da Lucide, centralizado.
- **Feedback Visual**:
    - Hover: Escurecer levemente (`hover:bg-blue-700`).
    - Active: Leve escala reduzida (`active:scale-95`).
    - Transição suave.

## Acessibilidade (A11y)

- `aria-label="Novo lançamento"` para leitores de tela.
- Garantir que o `z-index` seja alto o suficiente para flutuar sobre todos os elementos.
- Adicionar um `padding-bottom` extra no container principal do dashboard para que o FAB não cubra o último item da lista ao rolar até o fim.

## Plano de Testes

1.  **Visual**: Verificar se o botão aparece no canto inferior direito.
2.  **Comportamento**: Clicar no botão deve abrir o Wizard de lançamento.
3.  **Responsividade**: Verificar se o botão não atrapalha a leitura em telas pequenas.
4.  **Estado**: O botão deve sumir quando o Wizard estiver aberto.
