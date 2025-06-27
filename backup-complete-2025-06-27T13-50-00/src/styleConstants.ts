// Cores principais
export const COLORS = {
  // Cores neon
  NEON_BLUE: '#00f0ff',
  NEON_GREEN: '#00ff9d',
  NEON_ORANGE: '#ff7b00',

  // Tons de cinza
  GRAY_300: '#d1d5db',
  GRAY_400: '#9ca3af',
  GRAY_700: '#374151',
  
  // Cores escuras
  DARK_BG: '#0f172a',
  DARK_CARD: '#1e293b',
  
  // Cores básicas
  BLACK: '#000000',
  WHITE: '#ffffff',
  WHITE_10: 'rgba(255, 255, 255, 0.1)',
  BLACK_70: 'rgba(0, 0, 0, 0.7)'
};

// Espaçamentos
export const SPACING = {
  SMALL: '0.375rem', // px-3 / py-1.5
  MEDIUM: '0.625rem', // px-5 / py-2.5
  LARGE: '0.75rem', // py-3
  XLARGE: '2rem', // px-8
  CARD_PADDING: '1rem', // p-4
  CARD_PADDING_LG: '1.5rem', // sm:p-6
  MODAL_PADDING: '1.5rem' // p-6
};

// Bordas
export const BORDERS = {
  RADIUS_SM: '0.5rem', // rounded-lg
  RADIUS_MD: '0.75rem', // rounded-xl
  WIDTH: '2px', // border-2
  COLOR: 'rgba(0, 240, 255, 0.5)' // border-neon-blue/50
};

// Efeitos visuais
export const EFFECTS = {
  SHADOW: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // shadow-md
  GLOW_BLUE: '0 0 10px rgba(0, 240, 255, 0.7)',
  GLOW_GREEN: '0 0 10px rgba(0, 255, 157, 0.7)',
  GLOW_ORANGE: '0 0 10px rgba(255, 123, 0, 0.7)',
  TRANSITION: 'all 150ms ease-in-out', // transition-all duration-150
  TRANSITION_COLORS: 'color 150ms ease-in-out', // transition-colors
  TRANSITION_SLOW: 'all 300ms ease-in-out', // duration-300
  BACKDROP_BLUR: 'blur(4px)', // backdrop-blur-sm
  SCALE: 'scale(0.95)' // active:scale-95
};

// Animações
export const ANIMATIONS = {
  FADE_IN: `@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }`
};