/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
