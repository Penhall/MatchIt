// src/lib/react-native-web/AsyncStorage.ts - AsyncStorage para web
export default {
  getItem: async (key: string): Promise<string | null> => {
    return localStorage.getItem(key);
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    localStorage.setItem(key, value);
  },
  
  removeItem: async (key: string): Promise<void> => {
    localStorage.removeItem(key);
  },
  
  clear: async (): Promise<void> => {
    localStorage.clear();
  },
  
  getAllKeys: async (): Promise<string[]> => {
    return Object.keys(localStorage);
  }
};

// src/lib/react-native-web/LinearGradient.ts - Gradiente linear
import React from 'react';

export const LinearGradient: React.FC<any> = ({ 
  colors, 
  start, 
  end, 
  children, 
  style, 
  ...props 
}) => {
  const gradientStyle = {
    background: `linear-gradient(${colors.join(', ')})`,
    ...style
  };

  return (
    <div style={gradientStyle} {...props}>
      {children}
    </div>
  );
};

// src/lib/react-native-web/Icons.ts - Ícones
export const Ionicons: React.FC<any> = ({ name, size = 24, color = '#000', style }) => (
  <span 
    style={{ 
      fontSize: size, 
      color, 
      fontFamily: 'Arial', 
      ...style 
    }}
  >
    {getIconChar(name)}
  </span>
);

export const MaterialIcons: React.FC<any> = ({ name, size = 24, color = '#000', style }) => (
  <span 
    style={{ 
      fontSize: size, 
      color, 
      fontFamily: 'Arial', 
      ...style 
    }}
  >
    {getIconChar(name)}
  </span>
);

// Função para mapear nomes de ícones para caracteres
const getIconChar = (name: string): string => {
  const iconMap: { [key: string]: string } = {
    'chevron-back': '←',
    'chevron-forward': '→',
    'chevron-up': '↑',
    'chevron-down': '↓',
    'close': '×',
    'checkmark': '✓',
    'add': '+',
    'remove': '−',
    'heart': '♥',
    'star': '★',
    'search': '🔍',
    'settings': '⚙',
    'person': '👤',
    'home': '🏠',
    'menu': '☰',
    'refresh': '↻',
    'camera': '📷',
    'image': '🖼',
    'play': '▶',
    'pause': '⏸',
    'stop': '⏹',
    'lock': '🔒',
    'unlock': '🔓',
    'eye': '👁',
    'eye-off': '🙈',
    'mail': '✉',
    'phone': '📞',
    'location': '📍',
    'calendar': '📅',
    'time': '🕐',
    'warning': '⚠',
    'information': 'ℹ',
    'help': '?',
    'edit': '✏',
    'trash': '🗑',
    'share': '📤',
    'download': '📥',
    'upload': '📤',
    'copy': '📋',
    'cut': '✂',
    'paste': '📌'
  };
  
  return iconMap[name] || '●';
};

// src/lib/react-native-web/Haptics.ts - Feedback háptico (simulado)
export const impact = (style: 'light' | 'medium' | 'heavy' = 'medium') => {
  // No navegador, podemos tentar usar a Vibration API se disponível
  if ('vibrate' in navigator) {
    const duration = style === 'light' ? 10 : style === 'medium' ? 20 : 40;
    navigator.vibrate(duration);
  }
};

export const notification = (type: 'success' | 'warning' | 'error' = 'success') => {
  if ('vibrate' in navigator) {
    const pattern = type === 'success' ? [100] : type === 'warning' ? [100, 50, 100] : [100, 50, 100, 50, 100];
    navigator.vibrate(pattern);
  }
};

export const selection = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
};

export const ImpactFeedbackStyle = {
  Light: 'light' as const,
  Medium: 'medium' as const,
  Heavy: 'heavy' as const
};

export const NotificationFeedbackType = {
  Success: 'success' as const,
  Warning: 'warning' as const,
  Error: 'error' as const
};

// Expo Haptics compatibility
export default {
  impact,
  notification,
  selection,
  ImpactFeedbackStyle,
  NotificationFeedbackType
};