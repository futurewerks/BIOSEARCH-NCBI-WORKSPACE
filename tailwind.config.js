/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Semantic surface tokens (CSS-var backed, light/dark aware) ──
        bg:      'var(--color-bg)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          raised:  'var(--color-surface-raised)',
          high:    'var(--color-surface-high)',
          highest: 'var(--color-surface-highest)',
        },
        'on-surface': {
          DEFAULT: 'var(--color-on-surface)',
          2:       'var(--color-on-surface-2)',
          3:       'var(--color-on-surface-3)',
        },
        outline: {
          DEFAULT: 'var(--color-outline)',
          dim:     'var(--color-outline-dim)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          cta:     'var(--color-primary-cta)',
        },
        'on-primary': 'var(--color-on-primary-cta)',
        accent: {
          DEFAULT: 'var(--color-accent)',
          on:      'var(--color-on-accent)',
        },
        danger:  'var(--color-error)',
        caution: 'var(--color-warn)',
      },
      fontFamily: {
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        'glow-primary': '0 0 0 3px var(--color-primary-cta-20)',
        'card': 'var(--shadow-card)',
      },
    },
  },
  plugins: [],
};
