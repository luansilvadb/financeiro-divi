# Wizard Utilitario Family

## Objetivo

Redesenhar `NovoLancamentoWizard.vue` para seguir `DESIGN.md` com uma interface utilitaria, clara e rapida, sem mudar fluxo, composable, payloads ou numero de passos.

## Direcao Aprovada

- Remover a sensacao de card pesado dentro do bottomsheet.
- Usar superficie branca direta, borda inset warm-stone e raio de 10px.
- Header compacto com `Passo X de Y`, titulo e barra de progresso fina.
- Opcoes em paineis creme `#f8f7f4`, iconografia circular e texto curto.
- Valor em painel creme com `R$` e input grande.
- Seletores de membros/divisao em tiles ou pills creme/brancos com estado selecionado discreto.
- Footer com botoes pill: claro para voltar/cancelar e escuro para avancar/confirmar.

## Fora de Escopo

- Mudar as etapas do wizard.
- Mudar regras de validacao ou persistencia.
- Mudar `useNovoLancamentoWizard`.
- Mudar o container `BottomSheet` em `App.vue`.
