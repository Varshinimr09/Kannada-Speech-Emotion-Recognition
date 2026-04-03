import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif']
      },
      colors: {
        primary: {
          DEFAULT: '#00d4ff',
          dark: '#00a8cc',
          light: '#5ce1ff'
        },
        secondary: {
          DEFAULT: '#8b5cf6',
          dark: '#7c3aed',
          light: '#a78bfa'
        },
        navy: {
          DEFAULT: '#1a1f36',
          dark: '#0f1419',
          light: '#2a3150'
        }
      }
    }
  },
  plugins: []
} satisfies Config;