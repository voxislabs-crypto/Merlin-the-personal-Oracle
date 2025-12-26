/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cosmic: {
          purple: '#682860',
          violet: '#8F00FF',
          indigo: '#4B0082',
          dark: '#9400D3',
          light: '#EE82EE',
        },
        cyber: {
          gold: '#FFD700',
          amber: '#FFA500',
          neon: '#00FFFF',
        },
        mystic: {
          deep: '#1a0933',
          darker: '#0d0419',
        }
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Work Sans', 'sans-serif'],
      },
      backgroundImage: {
        'cosmic-gradient': 'linear-gradient(135deg, #682860 0%, #4B0082 50%, #0d0419 100%)',
        'aurora': 'linear-gradient(135deg, #8F00FF 0%, #9400D3 50%, #682860 100%)',
        'cyber-glow': 'radial-gradient(circle at center, rgba(143, 0, 255, 0.3) 0%, transparent 70%)',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(143, 0, 255, 0.5), 0 0 40px rgba(143, 0, 255, 0.3)',
        'neon-lg': '0 0 30px rgba(143, 0, 255, 0.6), 0 0 60px rgba(143, 0, 255, 0.4)',
        'gold': '0 0 20px rgba(255, 215, 0, 0.4), 0 0 40px rgba(255, 215, 0, 0.2)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          'from': { textShadow: '0 0 10px #8F00FF, 0 0 20px #8F00FF, 0 0 30px #8F00FF' },
          'to': { textShadow: '0 0 20px #9400D3, 0 0 30px #9400D3, 0 0 40px #9400D3' },
        },
      },
    },
  },
  plugins: [],
}