/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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

        // ===== FLUENT 2 / WINDOWS 11 TOKENS =====
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
        'r-sm': '14px',
        'r-md': '20px',
        'r-lg': '26px',
        'r-xl': '32px',
        // ===== FLUENT 2 CORNER RADIUS =====
        'f-sm': '4px',
        'f-md': '8px',
        'f-lg': '12px',
      },
      transitionTimingFunction: {
        // Easing característico do Windows 11 / Fluent Motion
        'fluent-ease': 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}
