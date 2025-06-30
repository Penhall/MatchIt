/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores corrigidas para match com a versão v2
        'dark-bg': '#10101a',     // Very dark, slightly desaturated blue
        'dark-card': '#181824',   // Darker card background  
        'dark-input': '#202030',  // Dark input field background
        'neon-blue': '#00FFFF',   // Cyan puro
        'neon-green': '#39FF14',  // Bright green vibrante
        'neon-orange': '#FF8C00', // Dark Orange
        'neon-pink': '#ff00aa',
        'gray-300': '#d1d5db',
        'gray-700': '#374151',
      },
      boxShadow: {
        // Efeitos neon com glow interno
        'neon-blue': '0 0 15px #00FFFF, 0 0 5px #00FFFF inset',
        'neon-green': '0 0 15px #39FF14, 0 0 5px #39FF14 inset', 
        'neon-orange': '0 0 15px #FF8C00, 0 0 5px #FF8C00 inset',
        // Efeitos de glow externos
        'glow-blue': '0 0 20px rgba(0, 255, 255, 0.7)',
        'glow-green': '0 0 20px rgba(57, 255, 20, 0.7)',
        'glow-orange': '0 0 20px rgba(255, 140, 0, 0.7)',
        // Shadow upwards para chat
        'upwards': '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      animation: {
        // Animações essenciais
        'fadeIn': 'fadeIn 0.5s ease-in-out',
        'pulseGlow': 'pulseGlow 1.5s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { 
            opacity: '0', 
            transform: 'translateY(10px)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateY(0)' 
          },
        },
        pulseGlow: {
          '0%, 100%': { 
            filter: 'drop-shadow(0 0 2px currentColor)' 
          },
          '50%': { 
            filter: 'drop-shadow(0 0 8px currentColor) drop-shadow(0 0 10px currentColor)' 
          },
        }
      },
      transitionDuration: {
        'slow': '300ms',
      },
      borderRadius: {
        'md': '0.75rem',
      },
      backgroundImage: {
        'gradient-neon': 'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(57, 255, 20, 0.1) 50%, rgba(255, 140, 0, 0.1) 100%)',
      }
    },
  },
  plugins: [],
}