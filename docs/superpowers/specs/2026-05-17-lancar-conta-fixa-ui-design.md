# Lançar Conta Fixa UI

## Objetivo

Evoluir `PopupLancarContaFixa.vue` para um bottomsheet rapido e utilitario alinhado ao `DESIGN.md`, sem alterar payloads, eventos ou regras de divisao.

## Direcao Aprovada

- Manter `BottomSheet` existente.
- Usar cabecalho compacto com icone da conta, nome e texto auxiliar curto.
- Dar foco visual ao valor em um painel creme `#f8f7f4`, com prefixo `R$` e input grande.
- Trocar botoes de selecao por pills claras, com estado selecionado discreto em preto/verde.
- Exibir resumo em painel creme com texto direto de divisao por pessoa.
- Usar acoes em pills: cancelar claro e lancar escuro `#121212`.

## Fora de Escopo

- Alterar regra de valor padrao.
- Alterar comprador padrao.
- Alterar split padrao.
- Alterar `BottomSheet.vue`.
