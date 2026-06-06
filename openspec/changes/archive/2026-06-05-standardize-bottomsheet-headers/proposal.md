## Why

Os bottom sheets do Divi apresentam 3 padrões visuais diferentes coexistindo: os do Dashboard usam Fraunces 24px com accent ember, os de Configurações usam Inter 16px com ícone lateral, e o de Estorno usa tokens corretos (`text-heading`). Essa fragmentação quebra a consistência visual e enfraquece a identidade do produto. O DESIGN.md atual não documenta regras para bottom sheets, permitindo que cada implementação siga um estilo próprio.

## What Changes

- **Atualizar DESIGN.md** com seção dedicada a BottomSheet, expandindo o escopo do Fraunces para "section titles" (não apenas wordmark)
- **Padronizar headers de 5 bottom sheets de Configurações** (Editar Membro, Novo Cargo, Permissões do Cargo, Novo Morador, Novo Cartão) para usar Fraunces 24px com palavra-chave em ember, alinhando ao padrão dos bottom sheets de Dashboard
- **Padronizar `maxHeight`** de 2 bottom sheets que usam 85dvh/95dvh para o padrão 90dvh
- **Padronizar `widthClass`** de 5 bottom sheets que usam `md:w-[560px]` para o padrão `md:w-[480px]`
- **Padronizar `contentClass`** do ConfirmacaoEstorno de `px-8 pb-10` para o padrão `px-6 pb-8`

## Capabilities

### New Capabilities

_(nenhuma nova capability — esta mudança é de padronização visual)_

### Modified Capabilities

- `padronizacao-visual-bottom-sheets`: Atualizar o requirement de cabeçalho para especificar Fraunces (font-display) como fonte dos títulos, padronizar maxHeight em 90dvh, widthClass em md:w-[480px], e documentar o padrão de "palavra-chave em ember"

## Impact

- **Frontend (views):**
  - `src/views/screens/ConfiguracoesMembros.vue` — 4 bottom sheets internos (headers + widthClass)
  - `src/views/components/ledger/ConfiguracoesCartoes.vue` — 1 bottom sheet (header + widthClass)
  - `src/views/components/ledger/dashboard/BottomSheetHistorico.vue` — maxHeight
  - `src/views/components/ledger/dashboard/BottomSheetNovoPeriodo.vue` — maxHeight
  - `src/views/components/ledger/BottomSheetAjustarGasto.vue` — maxHeight
  - `src/views/components/ledger/BottomSheetConfirmacaoEstorno.vue` — contentClass
- **Design System:**
  - `DESIGN.md` — nova seção "BottomSheet" + expansão do escopo do Display font
- **Backend:** nenhum impacto
- **Prisma/DB:** nenhum impacto
- **WebSocket:** nenhum impacto
