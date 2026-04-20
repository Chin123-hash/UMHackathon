/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: 'hsl(211, 87%, 40%)',
          50: 'hsl(211, 87%, 97%)',
          100: 'hsl(211, 87%, 93%)',
          200: 'hsl(211, 87%, 85%)',
          500: 'hsl(211, 87%, 55%)',
          600: 'hsl(211, 87%, 40%)',
          700: 'hsl(211, 87%, 32%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        accent: {
          DEFAULT: 'hsl(25, 95%, 53%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        border: 'hsl(214, 20%, 88%)',
        background: 'hsl(210, 20%, 97%)',
        card: 'hsl(0, 0%, 100%)',
        muted: {
          DEFAULT: 'hsl(214, 15%, 94%)',
          foreground: 'hsl(214, 15%, 50%)',
        },
        foreground: 'hsl(214, 30%, 12%)',
      },
      borderRadius: {
        card: '12px',
        badge: '6px',
        btn: '8px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.05)',
        modal: '0 20px 60px -10px rgba(0,0,0,0.18)',
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease forwards',
        'slide-up': 'slide-up 0.25s ease forwards',
      },
    },
  },
  plugins: [],
};