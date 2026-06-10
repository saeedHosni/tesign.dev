/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      fontFamily: {
        vazir: ['Vazirmatn', 'sans-serif'],
      },
      colors: {
        bg: {
          base:    '#1E1E1E',
          surface: '#252525',
          card:    '#2A2A2A',
          'card-hover': '#2F2F2F',
        },
        accent: {
          yellow: '#F5C518',
          orange: '#FF6B35',
        },
        text: {
          primary:   '#F0F0F0',
          secondary: '#A8A8A8',
          muted:     '#6A6A6A',
        },
      },
      borderColor: {
        DEFAULT: 'rgba(255,255,255,0.07)',
        accent:  'rgba(245,197,24,0.35)',
      },
      boxShadow: {
        card: '0 4px 32px rgba(0,0,0,0.45)',
        glow: '0 0 40px rgba(245,197,24,0.15)',
      },
      borderRadius: {
        sm: '8px',
        md: '14px',
        lg: '22px',
        xl: '32px',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(28px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':       { transform: 'translateY(-12px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245,197,24,0)' },
          '50%':       { boxShadow: '0 0 32px 8px rgba(245,197,24,0.18)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        gradientShift: {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        blob: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%':       { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
        spinSlow: {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-up':        'fadeUp 0.6s ease both',
        'fade-up-1':      'fadeUp 0.6s 0.1s ease both',
        'fade-up-2':      'fadeUp 0.6s 0.2s ease both',
        'fade-up-3':      'fadeUp 0.6s 0.3s ease both',
        'fade-up-4':      'fadeUp 0.6s 0.4s ease both',
        'fade-in':        'fadeIn 0.8s 0.2s ease both',
        'float':          'float 5s ease-in-out infinite',
        'float-delayed':  'float 4s 1s ease-in-out infinite',
        'float-delayed2': 'float 5s 2s ease-in-out infinite',
        'pulse-glow':     'pulseGlow 3s infinite',
        'pulse-glow-2':   'pulseGlow 2s infinite',
        'marquee':        'marquee 28s linear infinite',
        'gradient-shift': 'gradientShift 4s ease infinite',
        'blob':           'blob 8s ease-in-out infinite',
        'blob-delayed':   'blob 8s 4s ease-in-out infinite',
      },
      backgroundSize: {
        '200': '200% 200%',
      },
    },
  },
  plugins: [],
};
