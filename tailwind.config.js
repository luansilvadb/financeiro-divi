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
      },
      borderRadius: {
        'r-sm': '14px',
        'r-md': '20px',
        'r-lg': '26px',
        'r-xl': '32px',
      }
    },
  },
  plugins: [],
}
