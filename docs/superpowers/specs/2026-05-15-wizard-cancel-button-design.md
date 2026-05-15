# Design Spec: Botão Cancelar no Wizard

O objetivo é permitir que o usuário saia do fluxo de Novo Lançamento em qualquer etapa do Wizard, retornando ao Dashboard sem ser obrigado a finalizar a transação ou recarregar a página.

## Arquitetura e Componentes

1.  **NovoLancamentoWizard.vue**:
    - Adicionar o ícone `X` da Lucide no canto superior direito.
    - Estilizar como um botão discreto (`text-gray-400 hover:text-gray-600`).
    - Ao clicar, emitir o evento `@cancelar`.

## Visual Design

- **Posicionamento**: `absolute top-4 right-4`.
- **Ícone**: `X` da Lucide.
- **Interação**: Clique simples para abortar.
- **Transição**: O Wizard já possui uma transição de saída que será aproveitada.

## Plano de Testes

1.  **Funcional**: Clicar no "X" em qualquer passo (1, 2 ou 3) deve retornar o usuário ao Dashboard.
2.  **Estado**: O rascunho salvo no `localStorage` deve ser mantido? (Sim, o Wizard já possui lógica de rascunho, o "X" apenas fecha a visualização).
