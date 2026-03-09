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
        linear: {
          bg: '#0f1115',
          surface: '#1a1d29',
          surfaceHover: '#252a3c',
          border: '#2d3348',
          primary: '#5e6ad2',
          primaryHover: '#6872e3',
          text: '#f7f8f8',
          textMuted: '#8a8f98',
          textSecondary: '#5a5f6a',
          accent: '#f2c94c',
          success: '#4ade80',
          warning: '#fb923c',
          danger: '#f87171',
          tooltip: '#1e2230',
          tooltipText: '#e8e9eb',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
