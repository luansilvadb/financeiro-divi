## 1. Atualizar DESIGN.md

- [x] 1.1 Expandir descrição do Display font para incluir "section titles" no escopo de uso
- [x] 1.2 Adicionar seção `### BottomSheet (Overlay Sheet)` em "Components — Key Patterns" com specs de header (Fraunces 24px, accent ember), dimensões (90dvh, md:w-[480px]), padding (px-6 pb-8), e comportamento

## 2. Padronizar Bottom Sheets de Configurações (Headers)

- [x] 2.1 `ConfiguracoesMembros.vue` — BottomSheet Editar Membro: trocar header de `text-base font-bold` (Inter 16px) para `text-2xl font-display text-charcoal` com accent ember, remover layout de ícone+texto compacto
- [x] 2.2 `ConfiguracoesMembros.vue` — BottomSheet Novo Cargo: trocar header de `text-base font-bold` para `text-2xl font-display text-charcoal` com accent ember
- [x] 2.3 `ConfiguracoesMembros.vue` — BottomSheet Permissões do Cargo: trocar header de `text-base font-bold` para `text-2xl font-display text-charcoal` com accent ember
- [x] 2.4 `ConfiguracoesMembros.vue` — BottomSheet Novo Morador: trocar header de `text-base font-bold` para `text-2xl font-display text-charcoal` com accent ember
- [x] 2.5 `ConfiguracoesCartoes.vue` — BottomSheet Novo Cartão: trocar header de `text-base font-bold` para `text-2xl font-display text-charcoal` com accent ember

## 3. Padronizar Dimensões (widthClass)

- [x] 3.1 `ConfiguracoesMembros.vue` — 4 BottomSheets: trocar `width-class="md:w-[560px]"` para remover prop (usar default `md:w-[480px]`)
- [x] 3.2 `ConfiguracoesCartoes.vue` — BottomSheet Novo Cartão: trocar `width-class="md:w-[560px]"` para remover prop (usar default `md:w-[480px]`)

## 4. Padronizar Dimensões (maxHeight)

- [x] 4.1 `BottomSheetHistorico.vue` — remover `max-height="85dvh"` (usar default 90dvh)
- [x] 4.2 `BottomSheetNovoPeriodo.vue` — remover `max-height="95dvh"` (usar default 90dvh)
- [x] 4.3 `BottomSheetAjustarGasto.vue` — remover `max-height="95dvh"` (usar default 90dvh)

## 5. Padronizar contentClass

- [x] 5.1 `BottomSheetConfirmacaoEstorno.vue` — trocar `content-class="px-8 pb-10"` para remover prop (usar default `px-6 pb-8`)

## 6. Verificação Visual

- [x] 6.1 Abrir cada bottom sheet no browser e confirmar que o header usa Fraunces 24px com accent ember
- [x] 6.2 Verificar que todos os bottom sheets abrem com largura consistente em viewport desktop
- [x] 6.3 Confirmar que scroll funciona corretamente nos bottom sheets que tiveram maxHeight alterado

## 7. Padronizar Densidade Visual ("DPI" / Escala)

- [x] 7.1 Atualizar DESIGN.md com regras de densidade interna de BottomSheets (paddings, inputs, labels, botões h-12)
- [x] 7.2 `BottomSheetConfirmacaoEstorno.vue` — mover header para o slot `#header` com Fraunces 24px, reduzir Sad Blob para w-20 h-20, ajustar card de detalhes e altura de botões no rodapé para h-12
- [x] 7.3 `BottomSheetAjustarGasto.vue` — padronizar input de valor para text-sm/text-base e escalas dos seletores internos
- [x] 7.4 Verificar e garantir que os botões de rodapé usam h-12 em `ConfiguracoesMembros.vue` e `BottomSheetNovoPeriodo.vue`
- [x] 7.5 Realizar verificação visual no browser e atualizar walkthrough com novos screenshots
- [x] 7.6 `ConfiguracoesMembros.vue` — reduzir o tamanho do título principal do perfil de text-display 4xl/5xl para font-display text-2xl/3xl e compactar paddings/margens do sticky header

## 8. Alinhamento dos Filhos/Subordinados (Iteração 3)

- [x] 8.1 Atualizar DESIGN.md com especificações de DPI de grades de seleção e cards de controle de formulários
- [x] 8.2 `BottomSheetAjustarGasto.vue` — padronizar botões de seleção de comprador e rateio (paddings py-3, ícones w-4 h-4, fontes text-[11px] font-bold uppercase)
- [x] 8.3 `ConfiguracoesMembros.vue` — padronizar switch de ativação, preview do morador e botão de configurar permissões para p-3.5 e rounded-2xl
- [x] 8.4 Realizar verificação visual no browser e atualizar walkthrough com novos screenshots e carrossel completo

## 9. DPI Consistente e Alinhamento Global (Iteração 4)

- [ ] 9.1 `PopupLancarContaFixa.vue` — padronizar header (Fraunces + ember à esquerda), valor do input (text-sm + py-3.5 + wrapper R$), seletor de pagador e splits (py-3, text-[11px], w-4 h-4), card de resumo (p-4 rounded-2xl) e botões do footer (h-12 text-[10px])
- [ ] 9.2 `BottomSheetConfigurarContaFixa.vue` — alinhar header à esquerda com mt-1 na descrição, grade de divisão (py-3 text-[11px]) e botões do footer (h-12 text-[10px])
- [ ] 9.3 `BottomSheetAcertoCompensacao.vue` — alinhar header à esquerda com mt-1 na descrição, valor do input (text-sm font-bold), grade de método (text-[11px]) e botões do footer (h-12 text-[10px])
- [ ] 9.4 `BottomSheetCasas.vue` — padronizar mini-cabeçalhos de grupos (text-[10px] block ml-1), cards de casa (p-3.5 rounded-2xl), inputs de texto (py-3.5 text-sm font-bold), botões de criar/entrar (remover size="sm", usar h-12 default) e botão do footer (h-12 text-[10px])
- [ ] 9.5 `BottomSheetNovoPeriodo.vue` — padronizar todos os cards internos de resumo/avisos para rounded-2xl, mini-cabeçalho com block e botões do footer (h-12 text-[10px])
- [ ] 9.6 `BottomSheetHistorico.vue` — padronizar seletor do mês (py-3.5), cards de período arquivado e fallback (p-3.5 rounded-2xl) e botão do footer (h-12 text-[10px])
- [ ] 9.7 `ConfiguracoesMembros.vue` — padronizar cards de permissão do cargo (p-3.5 rounded-2xl) e botões de todos os footers (h-12 text-[10px])
- [ ] 9.8 Realizar verificação visual e atualizar walkthrough com novos screenshots e vídeos da Iteração 4
