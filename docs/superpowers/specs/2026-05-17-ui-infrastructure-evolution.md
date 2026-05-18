# Design Spec: UI Infrastructure Evolution (Family System)

**Date:** 2026-05-17
**Status:** Draft
**Topic:** Rebuilding the UI foundation to strictly adhere to the `DESIGN.md` guidelines using Tailwind v4.

## 1. Goal
Align the project's visual identity with the "Family" design system by creating a robust token infrastructure and refactoring base components to eliminate hardcoded values and visual inconsistencies.

## 2. Token Architecture (Tailwind v4)

### 2.1 Color Palette
Mapping semantic names from `DESIGN.md` to CSS variables in `@theme`:
- `--color-canvas`: `#fbfaf9` (Warm Canvas)
- `--color-stone`: `#f2f0ed` (Stone Surface)
- `--color-card`: `#ffffff` (Card Face)
- `--color-graphite`: `#474645` (Body Text)
- `--color-charcoal`: `#343433` (Headings/Primary)
- `--color-midnight`: `#121212` (Primary CTAs)
- `--color-ember`: `#ff3e00` (Ember Orange - Accent)
- `--color-meadow`: `#00ca48` (Success)
- `--color-sky`: `#0090ff` (Info/Ethereum)
- `--color-parchment`: `#f8f7f4` (Recessed Panels)

### 2.2 Typography Bundles
Instead of utility-first fragmentation, we will use bundled classes in `@layer components` to ensure perfect execution of tracking and leading for each size:
- `.text-display`: 68px, 500 weight, 1.09 leading, -2.11px tracking (Fraunces).
- `.text-heading-lg`: 44px, 600 weight, 1.09 leading, -1.14px tracking (Inter).
- `.text-heading`: 23px, 600 weight, 1.2 leading, -0.44px tracking (Inter).
- `.text-heading-sm`: 19px, 600 weight, 1.38 leading, -0.25px tracking (Inter).
- `.text-body`: 15px, 400 weight, 1.47 leading, -0.2px tracking (Inter).
- `.text-caption`: 12px, 400 weight, 1.58 leading, -0.14px tracking (Inter).

### 2.3 Shapes & Elevation
- `--radius-pill`: `32px` (Buttons/Pills)
- `--radius-card`: `10px` (Default Cards)
- `--radius-card-lg`: `24px` (Large Cards/BottomSheets)
- `--shadow-subtle`: `var(--color-stone) 0px 0px 0px 1px inset` (The "Hand-placed" effect)

## 3. Base Components Refactoring

### 3.1 Button.vue
- **Primary:** Midnight bg, White text, 32px radius.
- **Secondary:** Stone bg, Charcoal text, 32px radius.
- **Ghost:** Transparent bg, Ember Orange text, no border.
- **Outline:** Transparent bg, Graphite text, 1px Graphite border, 12px radius.
- **Inverted:** White bg, Midnight text, shadow-subtle, 32px radius.

### 3.2 Card.vue
- **Default/White:** Card bg, shadow-subtle, 10px radius.
- **Recessed/Parchment:** Parchment bg, no shadow, 24px radius.
- **Dark/Obsidian:** Obsidian bg, drop shadow (shadow-lg), 24px radius.

### 3.3 BottomSheet.vue
- Use `--radius-card-lg` (24px) for mobile top corners.
- Use `text-heading` for titles.
- Implement standard 0.4s cubic-bezier(0.4, 0, 0.2, 1) transition.

## 4. Success Criteria
1. No hardcoded hex values in component files.
2. Typography matches the density and spacing of the `DESIGN.md` specimens.
3. Components respond correctly to the defined `@theme` changes.

## 5. Self-Review
- [x] Placeholder scan: All tokens and specs are defined.
- [x] Internal consistency: Component refactorings match token definitions.
- [x] Scope check: Focused on foundation and base components.
- [x] Ambiguity check: Sizes and weights are explicit.
