/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bgDark: '#08080a',
        cardBg: '#0e0f14',
        cardFooter: '#090a0d',
        borderDark: '#17181c',
        borderCard: '#1a1c24',
        borderHover: '#2b2e3b',
        gold: '#e5b860',
        goldHover: '#d4a347',
        emerald: '#34d399',
        rose: '#e05252',
        textMuted: '#7a7f8d',
      },
      fontFamily: {
        headline: ['"Bebas Neue"', '"Oswald"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
