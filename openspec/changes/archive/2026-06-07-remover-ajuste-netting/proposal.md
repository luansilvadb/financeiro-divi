## Why

O método de baixa "Ajuste" (representado internamente pela opção `mutual`) adiciona complexidade desnecessária e carga cognitiva para os moradores no acerto de contas. Na rotina real do aplicativo Divi, os acertos e compensações de netting entre membros são majoritariamente realizados via Pix ou Dinheiro. A opção de Ajuste Mútuo confunde o usuário e polui a interface de baixa.

## What Changes

* **Remoção Visual**: Ocultação e remoção completa do botão de escolha "Ajuste" e seu ícone no modal de acerto de compensação (`BottomSheetAcertoCompensacao.vue`).
* **Simplificação de Tipos**: Remoção do tipo `'mutual'` nos locais onde o método de acerto/repasse é tipado e aceito nas classes de domínio (`Gasto.ts`, `GastoService.ts` no frontend).
* **Refatoração de Testes**: Ajuste nas suites de teste que eventualmente simulem o acerto contábil com o método `mutual` para usar os métodos ativos (`pix` ou `cash`).
* **Segurança Contábil**: O banco de dados e os resolvedores continuarão suportando registros passados salvos como `mutual` (para compatibilidade histórica, evitando quebras), mas novas transações serão restritas a `pix` e `cash` na interface e na tipagem ativa do frontend.

## Capabilities

### New Capabilities
<!-- Nenhuma nova funcionalidade está sendo introduzida. -->

### Modified Capabilities
<!-- Nenhuma especificação de requisito existente está sendo alterada diretamente, apenas a limpeza de uma opção na interface e nos tipos. -->

## Impact

* **Frontend (UI/UX)**: O modal `BottomSheetAcertoCompensacao.vue` passa a ter 2 opções de baixa em vez de 3: "Pix" e "Dinheiro".
* **Tipagem do Frontend**: Atualização de tipos nas entidades `Gasto.ts` e serviços associados como `GastoService.ts` e `useDashboardViewModel.ts`.
* **Testes**: Atualização de mocks e validações nos testes unitários e de integração do frontend.
