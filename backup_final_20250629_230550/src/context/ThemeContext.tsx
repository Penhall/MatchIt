// src/context/ThemeContext.tsx - Context completo para gerenciamento de tema
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Tipos do tema
type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
  actualTheme: 'light' | 'dark'; // Tema real aplicado (resolve 'system')
}

// Criar o contexto
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'light' 
}) => {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  // Função para detectar preferência do sistema
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Carregar tema do localStorage na inicialização
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme);
    } else {
      // Se não há tema salvo, usar preferência do sistema
      const systemTheme = getSystemTheme();
      setTheme('system');
      setActualTheme(systemTheme);
    }
  }, []);

  // Calcular tema real baseado na configuração
  useEffect(() => {
    let realTheme: 'light' | 'dark';

    if (theme === 'system') {
      realTheme = getSystemTheme();
    } else {
      realTheme = theme as 'light' | 'dark';
    }

    setActualTheme(realTheme);
  }, [theme]);

  // Aplicar tema ao documento e salvar no localStorage
  useEffect(() => {
    // Remover classes anteriores
    document.documentElement.classList.remove('light', 'dark');
    
    // Adicionar classe do tema atual
    document.documentElement.classList.add(actualTheme);
    
    // Salvar no localStorage
    localStorage.setItem('theme', theme);
    
    // Log para debug
    console.log(`🎨 Tema aplicado: ${theme} (real: ${actualTheme})`);
  }, [theme, actualTheme]);

  // Escutar mudanças na preferência do sistema
  useEffect(() => {
    if (theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        setActualTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, [theme]);

  // Função para alternar entre temas
  const toggleTheme = () => {
    const themeOrder: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };

  // Função simplificada para alternar apenas light/dark
  const toggleDarkMode = () => {
    setTheme(actualTheme === 'dark' ? 'light' : 'dark');
  };

  // Valor do contexto
  const contextValue: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    isDarkMode: actualTheme === 'dark',
    actualTheme
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook para usar o contexto de tema
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  
  return context;
};

// Hook simplificado para apenas dark mode
export const useDarkMode = () => {
  const { isDarkMode, actualTheme, setTheme } = useTheme();
  
  const toggle = () => {
    setTheme(actualTheme === 'dark' ? 'light' : 'dark');
  };

  return {
    isDarkMode,
    toggle
  };
};

// Utilitários para trabalhar com temas
export const themeUtils = {
  // Aplicar tema manualmente (sem React)
  applyTheme: (theme: 'light' | 'dark') => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  },

  // Detectar tema atual do sistema
  getSystemTheme: () => {
    return getSystemTheme();
  },

  // Obter tema salvo no localStorage
  getSavedTheme: (): Theme => {
    const saved = localStorage.getItem('theme') as Theme;
    return ['light', 'dark', 'system'].includes(saved) ? saved : 'system';
  }
};

// Export do contexto para casos especiais
export { ThemeContext };
export default ThemeContext;