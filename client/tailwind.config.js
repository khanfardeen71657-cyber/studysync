/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: '#0a0a0f',
        surface: '#131320',
        'surface-2': '#1a1a2e',
        accent: '#7c5cff',
        'accent-2': '#a78bfa',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'slide-in': 'slideIn 0.4s ease-out',
        'pulse-live': 'pulseLive 2s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(8px, -6px)' },
        },
        slideIn: {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        pulseLive: {
          '0%, 100%': { boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)' },
          '50%': { boxShadow: '0 0 0 6px rgba(16, 185, 129, 0.05)' },
        },
      },
    },
  },
  plugins: [],
}