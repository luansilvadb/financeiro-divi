# Family — Style Reference
> Pixar storyboard on cream paper — playful illustrated characters inhabit a warm off-white world where fintech feels like an adventure game.

**Theme:** light

Family lands like a children's book dropped into a fintech dashboard — warm off-white canvas (#fbfaf9) with a subtle noise texture (grão) to simulate physical paper. The interface is inhabited by expressive flat-illustrated characters in vivid primary colors (ember orange, meadow green, sky blue, sunburst yellow) while the typography stays grounded and balanced. The identity system relies on a signature typographic wordmark "DIVI." and the wobbly blob creatures (mascots) with micro-animations. Navigation is elevated into a 'Floating Island' glassmorphism bar with backdrop blur, creating a distinct layer of depth over the tactile canvas.

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Canvas | `#fbfaf9` | `--color-canvas` | Page background with noise texture |
| Stone | `#f2f0ed` | `--color-stone` | Card inset border, secondary button background, subtle dividers |
| Card | `#ffffff` | `--color-card` | Primary card backgrounds |
| Graphite | `#474645` | `--color-graphite` | Body text, labels, secondary nav links |
| Charcoal | `#343433` | `--color-charcoal` | High-contrast text, headings |
| Midnight | `#121212` | `--color-midnight` | Primary actions, pill buttons |
| Obsidian | `#000000` | `--color-obsidian` | Pure black for dark mode cards or deep icons |
| Ash | `#848281` | `--color-ash` | Muted text, tertiary labels |
| Ember | `#ff3e00` | `--color-ember` | Brand primary — CTAs, wordmark point, mascots |
| Meadow | `#00a83d` | `--color-meadow` | Success indicators, positive balances (WCAG AA) |
| Sky | `#0090ff` | `--color-sky` | Information, secondary mascots |
| Parchment | `#f8f7f4` | `--color-parchment` | Recessed backgrounds, alternative cards |
| Flamingo | `#ff58ae` | `--color-flamingo` | Playful accents |
| Sunburst | `#ffbb26` | `--color-sunburst` | Highlights and coins |
| Coral | `#ff2b3a` | `--color-coral` | Error states, destructive actions |

## Tokens — Typography

### Display — Used for brand wordmark, massive headlines, and section/bottomsheet titles.
- **Font:** Fraunces (Weight 700)
- **Scale:** 68px / Line Height 1.05 / Tracking -0.04em
- **Feature:** text-wrap: balance

### UI Sans — All interface text.
- **Font:** Inter
- **Weights:** 400 (Regular), 600 (Semibold), 700 (Bold)
- **Hierarchy:** Reduced from Black (900) to Bold (700) for better balance and productivity.

### Type Scale

| Role | Size | Weight | Tracking | Token |
|------|------|--------|----------|-------|
| caption | 11px | 600-700 | 0.15em | `--text-caption` |
| body | 15px | 400 | -0.01em | `--text-body` |
| heading-sm | 19px | 700 | -0.01em | `--text-heading-sm` |
| heading | 24px | 700 | -0.02em | `--text-heading` |
| heading-lg | 44px | 700 | -0.03em | `--text-heading-lg` |
| display | 68px | 700 | -0.04em | `--text-display` |

## Navigation — Floating Island

The navigation is decoupled from the screen edges, floating as an 'Island' with:
- **Background:** `bg-white/90` with `backdrop-blur-xl`
- **Shape:** `rounded-pill` (32px+)
- **Border:** `border-stone` (1px)
- **Shadow:** `shadow-lg` for elevation depth.
- **Feedback:** 'Ember Glow' indicator for active tab and scale animations on tap.

## Components — Key Patterns

### Buttons (Tactile Pills)
- **Primary:** Midnight background, Bold white text, 0.3s ease-spring scale.
- **Secondary:** Stone background, Graphite text.
- **FAB:** w-16 h-16 Ember circle, rotated Plus icon, vivid glow shadow.

### Cards (Inset Depth)
- All cards avoid external drop shadows in favor of `shadow-subtle` (inset 1px stone border).
- **Featured Card:** Subtle ring-4 in ember/5 for focal point.
- **Membro Avatar:** Morphing organic blob shapes with randomized brand colors.

### Illustration System (Mascots)
- **Blobs:** Animated SVG creatures with `animate-breathe`, `animate-blink`, and `arm-wave`.
- **Vocabulary:** Stick limbs, dot eyes, primary brand colors. Used to humanize financial data.

### BottomSheet (Overlay Sheet)
- **Header:** Uses `font-display text-2xl text-charcoal` (Fraunces 24px 700) with a context keyword highlighted in `text-ember`.
- **Subtitle:** Optional description below header using `text-xs text-graphite font-medium` (Inter 12px) with `mt-1`.
- **Close Button:** A 40px circle (`w-10 h-10`) with an X icon in `text-ash` transitioning to `bg-stone text-charcoal` on hover.
- **Dimensions:** Default height limit of `90dvh` (scroll internally) and desktop width fixed to `md:w-[480px]`.
- **Padding:** Default content padding of `px-6 pb-8`.
- **Internal Density & Scale (DPI consistency):**
  - **Footer Buttons:** All action buttons inside the bottom sheet footer MUST use a uniform height of `48px` (`h-12`) and `text-xs` (or `text-[10px]`) font-bold uppercase tracking-widest.
  - **Inputs:** Text/number/dropdown fields must use `px-4 py-3.5 rounded-xl border border-stone bg-canvas text-sm font-bold`. Do not use large styles like `text-lg` inside sheet forms.
  - **Field Labels:** All field labels must use a consistent typography of `text-[10px] font-bold uppercase tracking-widest text-graphite ml-1 block`.
  - **Recessed Cards:** Inner detail panels must use compact padding `p-4` with `rounded-2xl` corners to keep information dense.
  - **Button Selection Grids:** Inner selection grid options (e.g., payment methods, buyers, splits) must use uniform padding `py-3` (or `py-3.5`) and `rounded-xl`. Icons inside selection grids must be restricted to `w-4 h-4` (e.g. `Wallet`, `CreditCard`, `Users`), and text must use a uniform size of `text-[11px] font-bold uppercase tracking-wider` (or `text-xs font-bold`).
  - **Interactive Cards / Controls:** Clickable custom selector rows, settings switches, and item previews inside sheet forms must use a uniform padding of `p-3.5` and `rounded-2xl` to ensure consistent physical spacing (DPI).

## Motion & Transitions

- **Productivity First:** Transition durations reduced to 0.2s - 0.3s.
- **Easing:** `cubic-bezier(0.19, 1, 0.22, 1)` (ease-spring) for physical response.
- **Tab Slide:** Horizontal carousel effect between Dashboard views.

## Do's and Don'ts

### Do
- Use `text-wrap: balance` on all headings.
- Maintain the 6px unificated scrollbar width.
- Use `font-bold` (700) for emphasis, avoiding `font-black` (900).
- Ensure all members have the `MembroAvatar` blob component.
- Apply the noise texture to all full-page canvas backgrounds.

### Don't
- Don't use the legacy `DiviLogo` component; use typography + mascots.
- Don't use external shadows on cards (unless dark phone mockups).
- Don't use pure white backgrounds for pages; always use `--color-canvas`.
- Don't use linear transitions; always prefer spring or ease-out.

## Implementation — Tailwind v4

```css
@theme {
  --color-canvas: #fbfaf9;
  --color-stone: #f2f0ed;
  --color-ember: #ff3e00;
  --shadow-subtle: var(--color-stone) 0px 0px 0px 1px inset;
  --radius-pill: 32px;
  --ease-spring: cubic-bezier(0.19, 1, 0.22, 1);
}
```
