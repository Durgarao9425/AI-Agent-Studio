/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Design system — deep slate + violet + cyan
        background: '#0a0f1e',
        surface: '#0f1629',
        'surface-2': '#151d35',
        border: '#1e2a4a',
        'border-subtle': '#141e36',
        
        // Accent colors
        violet: {
          DEFAULT: '#7c3aed',
          light: '#a78bfa',
          dark: '#5b21b6',
          glow: 'rgba(124, 58, 237, 0.3)',
        },
        cyan: {
          DEFAULT: '#06b6d4',
          light: '#67e8f9',
          dark: '#0e7490',
          glow: 'rgba(6, 182, 212, 0.3)',
        },
        emerald: {
          DEFAULT: '#10b981',
          light: '#6ee7b7',
          glow: 'rgba(16, 185, 129, 0.3)',
        },
        amber: {
          DEFAULT: '#f59e0b',
          light: '#fcd34d',
        },
        rose: {
          DEFAULT: '#f43f5e',
          light: '#fda4af',
        },
        
        // Text colors
        'text-primary': '#f0f4ff',
        'text-secondary': '#8899cc',
        'text-muted': '#4a5a8a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-hero': 'linear-gradient(135deg, #0a0f1e 0%, #0f1629 50%, #0a0f1e 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        'gradient-violet': 'linear-gradient(135deg, #7c3aed, #5b21b6)',
        'gradient-cyan': 'linear-gradient(135deg, #06b6d4, #0e7490)',
        'glow-violet': 'radial-gradient(ellipse at center, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
        'glow-cyan': 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'violet-glow': '0 0 30px rgba(124, 58, 237, 0.4)',
        'cyan-glow': '0 0 30px rgba(6, 182, 212, 0.4)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.3)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'typing': {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-in-right': 'slide-in-right 0.4s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
