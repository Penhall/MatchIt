/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0f172a',
        'dark-card': '#1e293b',
        'neon-blue': '#00f0ff',
        'neon-green': '#00ff9d',
        'neon-orange': '#ff7b00',
        'neon-pink': '#ff00aa',
        'gray-300': '#d1d5db',
        'gray-700': '#374151',
      },
      boxShadow: {
        'neon-blue': '0 0 10px rgba(0, 240, 255, 0.7)',
        'neon-green': '0 0 10px rgba(0, 255, 157, 0.7)',
        'neon-orange': '0 0 10px rgba(255, 123, 0, 0.7)',
      },
      transitionDuration: {
        'slow': '300ms',
      },
      borderRadius: {
        'md': '0.75rem',
      }
    },
  },
  plugins: [],
}
