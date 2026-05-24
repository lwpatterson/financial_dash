/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // CSS-variable-backed so light/dark themes just swap the vars
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        panel:   'rgb(var(--color-panel)   / <alpha-value>)',
        border:  'rgb(var(--color-border)  / <alpha-value>)',
        accent:  'rgb(var(--color-accent)  / <alpha-value>)',
        muted:   'rgb(var(--color-muted)   / <alpha-value>)',
        green:   '#22c55e',
        red:     '#ef4444',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
