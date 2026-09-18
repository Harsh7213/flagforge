/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  'hsl(258, 100%, 95%)',
          100: 'hsl(258, 95%, 88%)',
          200: 'hsl(258, 90%, 80%)',
          300: 'hsl(258, 85%, 72%)',
          400: 'hsl(258, 82%, 62%)',
          500: 'hsl(258, 78%, 52%)',
          600: 'hsl(258, 74%, 44%)',
          700: 'hsl(258, 70%, 36%)',
          800: 'hsl(258, 68%, 26%)',
          900: 'hsl(258, 65%, 18%)',
        },
        surface: {
          base:     'var(--bg-base)',
          card:     'var(--bg-card)',
          elevated: 'var(--bg-elevated)',
          overlay:  'var(--bg-overlay)',
        },
        border: {
          subtle:  'var(--border-subtle)',
          DEFAULT: 'var(--border-main)',
          strong:  'var(--border-strong)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, hsl(258,78%,52%), hsl(187,92%,58%))',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px hsl(258,78%,52%,0.3)' },
          '50%': { boxShadow: '0 0 40px hsl(258,78%,52%,0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'brand': '0 0 24px hsl(258,78%,52%,0.35)',
        'brand-lg': '0 0 48px hsl(258,78%,52%,0.5)',
        'green': '0 0 20px hsl(143,72%,52%,0.3)',
        'red': '0 0 20px hsl(4,85%,62%,0.3)',
        'glass': '0 8px 32px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
};
