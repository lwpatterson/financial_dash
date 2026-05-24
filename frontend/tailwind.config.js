/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0f1117',
        panel:   '#161b27',
        border:  '#1e2535',
        accent:  '#3b82f6',
        green:   '#22c55e',
        red:     '#ef4444',
        muted:   '#64748b',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
