/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        seed: {
          bg: 'var(--seed-bg)',
          fg: 'var(--seed-fg)',
          primary: 'var(--seed-primary)',
          accent: 'var(--seed-accent)',
          surface: 'var(--seed-surface)',
          muted: 'var(--seed-muted)',
          border: 'var(--seed-border)',
        },
        celadon: {
          50: '#e8f5ec',
          100: '#c8e6cf',
          200: '#a4d4ae',
          300: '#7fbf8b',
          400: '#5b8a72',
          500: '#4a7a62',
          600: '#3a6450',
          700: '#2a4e3e',
          800: '#1a382c',
          900: '#0f2a1f',
          950: '#091c14',
        },
        redorange: {
          50: '#fef2ee',
          100: '#fde0d6',
          200: '#fbc0ac',
          300: '#f69577',
          400: '#e85d3a',
          500: '#d44a28',
          600: '#b53a1e',
          700: '#8f2d18',
          800: '#6d2414',
          900: '#4a1a0e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        seed: 'var(--seed-radius)',
      },
      animation: {
        'breathe': 'breathe 2.4s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-up': 'slide-in-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'typing': 'typing 1.2s steps(3) infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.15)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        typing: {
          '0%': { content: '"."' },
          '33%': { content: '".."' },
          '66%': { content: '"..."' },
        },
      },
    },
  },
  plugins: [],
}
