# Dashboard Mobile Redesign — DIVI

**Data:** 2026-05-17  
**Status:** Aprovado  
**Escopo:** Abordagem B — Bottom Tabs + Design System Completo

---

## Problema

O dashboard atual é uma página de scroll único com 9 seções. No mobile:

- Navegação linear sem orientação — o usuário não sabe onde está
- Inconsistência visual: metade das seções usa tokens do design system, metade usa hardcodes (`#f8f7f4`, `#343433`, `#848281`, etc.)
- Botões de ação abaixo do mínimo de toque: `h-8`/`h-9` (~32–36px) vs. mínimo recomendado de 44px
- Labels de 10–11px — abaixo da escala tipográfica do design system (`text-caption` = 12px)

---

## Solução

Redesign com três pilares:

1. **Bottom tab bar** com 3 abas (Hoje / Faturas / Histórico)
2. **Token sweep completo** — eliminar todos os hardcodes de cor, tipografia e espaçamento
3. **Mobile polish** — touch targets ≥ 44px, tipografia na escala do design system

---

## Estrutura de Navegação

### Bottom Tab Bar

Componente fixo no bottom, acima do FAB. Presente em todas as abas.

```
[ 🏠 Hoje ] [ 💳 Faturas ] [ 📋 Histórico ]
```

- Aba ativa: cor `text-ember`, ponto ember (4px) abaixo do label
- Abas inativas: `text-ash`
- Altura mínima da tab bar: 56px (incluindo safe area no iOS)
- FAB persiste em todas as abas, posicionado acima da tab bar (`bottom-[72px]`)
- `pb-28` no conteúdo substituído por padding dinâmico que considera a tab bar

### Header Mobile

No mobile (`< md`), o header é compacto:
- Título `DIVI.` em `text-heading` (23px Fraunces) — não `text-display` (68px)
- Subtítulo "Finanças Residenciais" em `text-caption text-ash`
- Mascotes SVG: mantidos apenas em `xl:block` (comportamento atual preservado)
- Botão de settings: `w-11 h-11` (44px) com `rounded-full bg-stone`

---

## Aba: Hoje

Seções em ordem de prioridade:

### 1. Saldo Unificado
- `SectionLabel` "Visão Geral" + título "Saldo **Unificado**" (span ember)
- Navegador de período: pill `bg-stone rounded-full` com chevrons `w-6 h-6` (≥ 44px de área de toque)
- Cards de membro: `bg-parchment-card rounded-cards p-3` com avatar 40px, nome em `text-[14px] font-semibold text-charcoal`, status em `text-caption text-ash`, valor em `font-display text-[18px]`
- Cores de valor: positivo `text-meadow`, negativo `text-coral-red`, neutro `text-ash`

### 2. Acertos Otimizados
- `SectionLabel` "Eficiência" + título "Acertos **Otimizados**"
- Card branco com `shadow-subtle rounded-cards p-4`
- Valor em `font-display text-[22px] text-ember`
- Botão "Confirmar Pix": `bg-midnight text-white rounded-buttons h-11 w-full` (44px)

### 3. Contas Fixas
- `SectionLabel` "Recorrência" + título "Contas **Fixas**"
- Cada conta: `bg-card shadow-subtle rounded-cards p-3` com ícone 36px, nome `text-[13px] font-semibold`, valor `text-caption text-ash`
- Status "✓ Lançada": `bg-meadow/10 text-meadow rounded-tags px-2.5 py-1 text-caption font-bold`
- Status "Lançar": `bg-ember/10 text-ember rounded-tags px-2.5 py-1 text-caption font-bold`

### 4. Feed de Lançamentos
- `SectionLabel` "Atividade" + título "Últimos **Lançamentos**"
- Itens compactos: dot colorido (8px) + descrição `text-[13px] text-charcoal` + valor `text-[13px] font-semibold`
- Sem botões de ação inline — apenas leitura rápida
- Separadores `border-b border-stone`

---

## Aba: Faturas

### 1. Próximas Faturas
- `SectionLabel` "Gastos Ativos" + título "Próximas **Faturas**"
- Card por fatura: header com nome do cartão `text-heading-sm font-semibold` + badge de período `bg-stone rounded-tags`
- Linhas de membro: `bg-parchment-card rounded-[8px] p-2` com dot colorido (responsável = `bg-sunburst`, outros = `bg-fog`)
- Botão "Fechar fatura": `bg-midnight text-white rounded-buttons h-11 w-full`
- Toggle "Ver detalhes": `h-11` (44px), `text-[12px] font-semibold text-graphite`

### 2. Faturas Fechadas
- `SectionLabel` "Liquidação" + título "Faturas **Fechadas**"
- Estado "Em Revisão": botão "Revisar e Ratear" em `bg-ember text-white rounded-buttons h-11 w-full`
- Estado "Acertos Ativos": lista de acertos com barra de progresso `h-1.5 bg-stone rounded-full`
- Botão "Registrar Pix": `h-11` mínimo
- Detalhamento de Saldos: colapsado por padrão, toggle `h-11`

### 3. Parcelas Futuras
- `SectionLabel` "Projeção" + título "Parcelas **Futuras**" (span em `text-deep-amber`)
- Itens: `bg-card shadow-subtle rounded-cards p-3`, valor total em `font-display text-[15px] text-deep-amber`

---

## Aba: Histórico

### Histórico de Faturas
- `SectionLabel` "Arquivo" + título "Histórico de **Faturas**"
- Itens: `bg-card shadow-subtle rounded-cards p-3` com ícone 36px, período `text-[14px] font-semibold`, valor `font-display text-[15px]`
- Badge "QUITADA": `bg-meadow/10 text-meadow rounded-tags`
- Itens clicáveis para expandir (sem ações inline)

---

## Token Sweep — Hardcodes a Substituir

| Hardcode | Token |
|----------|-------|
| `#fbfaf9` | `bg-canvas` |
| `#f8f7f4` | `bg-parchment-card` |
| `#f2f0ed` | `bg-stone` / `border-stone-surface` |
| `#ffffff` | `bg-card` |
| `#343433` | `text-charcoal` |
| `#474645` | `text-graphite` |
| `#848281` | `text-ash` |
| `#121212` | `bg-midnight` |
| `#ff3e00` | `text-ember` / `bg-ember` |
| `#00ca48` | `text-meadow` |
| `#ff2b3a` | `text-coral-red` |
| `#ffbb26` | `bg-sunburst` |
| `#c6c6c6` | `bg-fog` |
| `shadow-[inset_0_0_0_1px_#f2f0ed]` | `shadow-subtle` |
| `rounded-[10px]` | `rounded-cards` |
| `rounded-full` (botões pill) | `rounded-buttons` |
| `text-[10px]` / `text-[11px]` (labels) | `text-caption` (12px) |
| `h-8` / `h-9` (botões) | `h-11` (44px) |

---

## Componentes Afetados

- `src/App.vue` — header mobile, tab bar, FAB position, padding
- `src/components/ledger/DashboardSaldos.vue` — estrutura de abas, todas as seções
- `src/components/ledger/dashboard/DetalhamentoSaldosCard.vue` — token sweep
- `src/components/ledger/dashboard/HistoricoFaturas.vue` — token sweep
- `src/components/ledger/dashboard/PreviaAcertos.vue` — token sweep + touch targets
- `src/components/ledger/ContasFixasPanel.vue` — token sweep + status badges
- `src/components/ledger/ActivityFeed.vue` — layout compacto

### Novo componente
- `src/components/ui/BottomTabBar.vue` — tab bar com 3 abas, ponto ativo, safe area

---

## Fora de Escopo

- Animações de transição entre abas
- Redesign dos modais (BottomSheet, ModalFecharFatura, etc.)
- Alterações na lógica de negócio ou composables
- Novos componentes além do `BottomTabBar`

---

## Critérios de Aceitação

- [ ] Bottom tab bar visível no mobile, oculta em `md:hidden`
- [ ] No desktop (`md+`), layout atual preservado (scroll único, sem tabs)
- [ ] Todos os hardcodes de cor substituídos por tokens
- [ ] Nenhum botão de ação com altura < 44px
- [ ] Nenhum label de texto com tamanho < 12px
- [ ] FAB posicionado acima da tab bar no mobile
- [ ] Build sem erros TypeScript
