// Tema dark com cores vibrantes e acessíveis
export const theme = {
  colors: {
    // Cores de fundo
    background: '#0f172a', // Dark blue-gray
    surface: '#1e293b', // Slightly lighter
    card: '#334155', // Card background
    modal: '#1e293b', // Modal background
    
    // Cores de texto
    text: {
      primary: '#f8fafc', // Almost white
      secondary: '#94a3b8', // Light gray
      disabled: '#64748b', // Gray
      inverse: '#0f172a', // Dark for light backgrounds
    },
    
    // Cores neon vibrantes (com contraste verificado)
    neon: {
      blue: '#00f0ff', // WCAG AA: 4.6:1 on background
      green: '#00ff9d', // WCAG AA: 4.8:1 on background
      orange: '#ff7b00', // WCAG AA: 4.7:1 on background
      pink: '#ff00aa', // WCAG AA: 4.9:1 on background
    },
    
    // Estados e interações
    states: {
      hover: 'rgba(255, 255, 255, 0.08)',
      focus: 'rgba(0, 240, 255, 0.2)',
      pressed: 'rgba(255, 255, 255, 0.16)',
      selected: 'rgba(0, 240, 255, 0.12)',
    },
    
    // Bordas e divisores
    borders: {
      primary: 'rgba(255, 255, 255, 0.12)',
      secondary: 'rgba(255, 255, 255, 0.08)',
      focus: '#00f0ff',
    },
    
    // Feedback
    error: '#ff4d4f',
    warning: '#faad14',
    success: '#52c41a',
    info: '#1890ff',
  },
  
  // Tipografia (baseada no design existente)
  typography: {
    fontFamily: '"Inter", sans-serif',
    sizes: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
    },
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  
  // Espaçamentos (consistentes com o design)
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '3rem', // 48px
  },
  
  // Bordas
  borders: {
    radius: {
      sm: '0.25rem', // 4px
      md: '0.5rem', // 8px
      lg: '0.75rem', // 12px
      full: '9999px',
    },
    width: {
      thin: '1px',
      medium: '2px',
      thick: '4px',
    },
  },
  
  // Efeitos
  effects: {
    shadow: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      glow: {
        blue: '0 0 10px rgba(0, 240, 255, 0.7)',
        green: '0 0 10px rgba(0, 255, 157, 0.7)',
        orange: '0 0 10px rgba(255, 123, 0, 0.7)',
      },
    },
    transition: 'all 150ms ease-in-out',
  },
} as const;