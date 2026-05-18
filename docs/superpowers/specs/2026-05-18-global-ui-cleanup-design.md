# Spec: Global UI Cleanup & Token Sync

**Date:** 2026-05-18
**Topic:** UI Cleanup
**Status:** Draft

## 1. Overview
Replace all legacy UI classes and hardcoded hex values with semantic tokens in the `src/` directory to ensure consistency with the new Family design system.

## 2. Goals
- Eliminate hardcoded hex values in Tailwind classes.
- Standardize border-radius and spacing tokens.
- Ensure all components use the theme tokens defined in `src/main.css`.

## 3. Token Mapping

| Type | Old Value | New Token |
| :--- | :--- | :--- |
| Radius | `rounded-cards` | `rounded-card` |
| Radius | `rounded-cardslarge` | `rounded-card-lg` |
| Color | `stone-surface` | `stone` |
| Color | `ember-orange` | `ember` |
| Color | `meadow-green` | `meadow` |
| Color | `charcoal-primary` | `charcoal` |
| Background | `bg-[#fbfaf9]` | `bg-canvas` |
| Text | `text-[#343433]` | `text-charcoal` |
| Background | `bg-[#f8f7f4]` | `bg-parchment` |
| Shadow | `shadow-[inset_0_0_0_1px_#f2f0ed]` | `shadow-subtle` |
| Border | `border-[#f2f0ed]` | `border-stone` |
| Divide | `divide-[#f2f0ed]` | `divide-stone` |
| Background | `bg-[#f2f0ed]` | `bg-stone` |
| Text | `text-[#474645]` | `text-graphite` |
| Text | `text-[#848281]` | `text-ash` |
| Background | `bg-[#121212]` | `bg-midnight` |
| Text | `text-[#121212]` | `text-midnight` |
| Hover BG | `hover:bg-[#f2f0ed]` | `hover:bg-stone` |
| Hover BG | `hover:bg-[#343433]` | `hover:bg-charcoal` |

## 4. Impacted Files
- `src/App.vue`
- `src/components/ledger/ConfiguracoesMembros.vue`
- `src/components/ledger/DashboardSaldos.vue`
- `src/components/ledger/NovoLancamentoWizard.vue`
- `src/components/ledger/shared/SeletorMembros.vue`
- `src/components/ui/BottomTabBar.vue`
- `src/components/ui/InvertedSection.vue`

## 5. Verification Plan
- Run `npm run lint` or equivalent.
- Run `tsc --noEmit` to check for type errors.
- Visual confirmation of key components (Dashboard and Wizard).
