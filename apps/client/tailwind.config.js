/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'hogwarts-bg': '#121013',
        'hogwarts-gold': '#c5a059',
        'hogwarts-goldDark': '#8b6f3a',
        'hogwarts-paper': '#f5e6c4',
        parchment: {
          DEFAULT: '#f5e6c4',
          dark: '#121013',
          card: 'rgba(0,0,0,0.5)',
        },
        gold: {
          DEFAULT: '#c5a059',
          light: '#d4b06a',
          dark: '#8b6f3a',
        },
        gryffindor: '#ae0001',
        slytherin: '#2a623d',
        ravenclaw: '#0e1a40',
        hufflepuff: '#ffdb00',
      },
      fontFamily: {
        display: ['MedievalSharp', 'cursive'],
        body: ['IM Fell English', 'serif'],
        magical: ['Cinzel', 'Ma Shan Zheng', 'serif'],
        serif: ['Crimson Text', 'IM Fell English', 'serif'],
        pixel: ['Press Start 2P', 'monospace'],
      },
      animation: {
        'glow': 'glow 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px #c5a059' },
          '50%': { boxShadow: '0 0 20px #c5a059' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
