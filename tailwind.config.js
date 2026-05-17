/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* DIVI Legacy Theme Mapped to Fluent Variables */
        'divi-bg': 'var(--bg)',
        'divi-s1': 'var(--s1)',
        'divi-s2': 'var(--s2)',
        'divi-s3': 'var(--s3)',
        'divi-border': 'var(--border)',
        'divi-border-hi': 'var(--border-hi)',
        'divi-primary': 'var(--primary)',
        'divi-primary-dim': 'var(--primary-dim)',
        'divi-primary-glow': 'var(--primary-glow)',
        'divi-emerald': 'var(--emerald)',
        'divi-emerald-dim': 'var(--emerald-dim)',
        'divi-emerald-glow': 'var(--emerald-glow)',
        'divi-rose': 'var(--rose)',
        'divi-rose-dim': 'var(--rose-dim)',
        'divi-amber': 'var(--amber)',
        'divi-amber-dim': 'var(--amber-dim)',
        'divi-blue': 'var(--blue)',
        'divi-blue-dim': 'var(--blue-dim)',
        'divi-violet': 'var(--violet)',
        'divi-t1': 'var(--t1)',
        'divi-t2': 'var(--t2)',
        'divi-t3': 'var(--t3)',
        'divi-t4': 'var(--t4)',

        /* Fluent 2 Brand Theme Variables */
        'fluent-bg': 'var(--fluent-bg)',
        'fluent-card-bg': 'var(--fluent-card-bg)',
        'fluent-card-hover': 'var(--fluent-card-hover)',
        'fluent-border': 'var(--fluent-border)',
        'fluent-border-hi': 'var(--fluent-border-hi)',
        'fluent-accent': 'var(--fluent-accent)',
        'fluent-accent-hover': 'var(--fluent-accent-hover)',
        'fluent-accent-active': 'var(--fluent-accent-active)',
        'fluent-emerald': 'var(--fluent-emerald)',
        'fluent-emerald-dim': 'var(--fluent-emerald-dim)',
        'fluent-rose': 'var(--fluent-rose)',
        'fluent-rose-dim': 'var(--fluent-rose-dim)',
        'fluent-text-p1': 'var(--fluent-text-p1)',
        'fluent-text-p2': 'var(--fluent-text-p2)',
        'fluent-text-p3': 'var(--fluent-text-p3)',
        'fluent-tint-blue': 'var(--fluent-tint-blue)',
      },
      borderRadius: {
        /* DIVI Legacy Radii */
        'r-sm': '14px',
        'r-md': '20px',
        'r-lg': '26px',
        'r-xl': '32px',

        /* Fluent 2 Radii */
        'f-sm': '4px',    // Para inputs, pequenos botões e badges
        'f-md': '8px',    // Para cartões e botões normais (Corner do Fluent 2)
        'f-lg': '12px',   // Para modais e envelopes maiores
      },
      transitionTimingFunction: {
        'fluent-ease': 'cubic-bezier(0.16, 1, 0.3, 1)', // Easing característico do Windows 11
      }
    },
  },
  plugins: [],
}
