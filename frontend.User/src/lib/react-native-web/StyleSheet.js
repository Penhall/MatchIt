// src/lib/react-native-web/StyleSheet.js - Correção definitiva do StyleSheet
import React from 'react';

/**
 * StyleSheet compatível com React Native Web que evita erros de indexed properties
 */
export const StyleSheet = {
  create: (styles) => {
    // Função para limpar estilos problemáticos
    const cleanStyle = (style) => {
      if (!style || typeof style !== 'object') return style;
      
      const cleaned = {};
      
      for (const [key, value] of Object.entries(style)) {
        // ❌ Evitar propriedades indexadas numéricas que causam o erro
        if (typeof key === 'number' || /^\d+$/.test(key)) {
          console.warn(`StyleSheet: Ignorando propriedade indexada "${key}" (causa erro CSS)`);
          continue;
        }
        
        // 🔧 Processar arrays de estilos (flat last)
        if (Array.isArray(value)) {
          cleaned[key] = value[value.length - 1]; // Usar último valor
        } 
        // 🔧 Processar objetos aninhados
        else if (typeof value === 'object' && value !== null) {
          cleaned[key] = cleanStyle(value);
        } 
        // ✅ Manter valores primitivos
        else {
          cleaned[key] = value;
        }
      }
      
      return cleaned;
    };
    
    const cleanedStyles = {};
    for (const [styleName, style] of Object.entries(styles)) {
      cleanedStyles[styleName] = cleanStyle(style);
    }
    
    return cleanedStyles;
  },
  
  flatten: (style) => {
    if (!style) return {};
    
    // Se for array, fazer flatten
    if (Array.isArray(style)) {
      const flattened = {};
      
      for (const styleItem of style) {
        if (styleItem && typeof styleItem === 'object') {
          Object.assign(flattened, StyleSheet.flatten(styleItem));
        }
      }
      
      return flattened;
    }
    
    // Se for objeto, limpar propriedades indexadas
    if (typeof style === 'object') {
      const flattened = {};
      
      for (const [key, value] of Object.entries(style)) {
        // Ignorar propriedades indexadas
        if (typeof key !== 'number' && !/^\d+$/.test(key)) {
          flattened[key] = value;
        }
      }
      
      return flattened;
    }
    
    return style;
  },
  
  compose: (...styles) => {
    const flatStyles = styles.map(style => StyleSheet.flatten(style));
    return Object.assign({}, ...flatStyles);
  },
  
  hairlineWidth: 1,
  
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  
  absoluteFillObject: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  }
};

/**
 * Hook para usar estilos seguros
 */
export const useSafeStyle = (style) => {
  return React.useMemo(() => {
    if (!style) return {};
    
    // Se for array de estilos, fazer flatten seguro
    if (Array.isArray(style)) {
      return StyleSheet.flatten(style);
    }
    
    // Se for objeto, limpar propriedades problemáticas
    if (typeof style === 'object') {
      return StyleSheet.flatten(style);
    }
    
    return style;
  }, [style]);
};

/**
 * Função para corrigir estilos em tempo real
 */
export const fixWebStyle = (style) => {
  if (!style) return {};
  
  const fixed = {};
  
  for (const [key, value] of Object.entries(style)) {
    // Ignorar propriedades indexadas
    if (typeof key === 'number' || /^\d+$/.test(key)) {
      continue;
    }
    
    // Corrigir transforms (comum causa de erro)
    if (key === 'transform' && Array.isArray(value)) {
      // Converter array de transforms para string CSS
      fixed[key] = value.map(transform => {
        if (typeof transform === 'object') {
          return Object.entries(transform)
            .map(([prop, val]) => `${prop}(${val})`)
            .join(' ');
        }
        return transform;
      }).join(' ');
    }
    // Corrigir shadow properties para CSS box-shadow
    else if (key === 'shadowColor' || key === 'shadowOffset' || key === 'shadowOpacity' || key === 'shadowRadius') {
      if (!fixed.boxShadow) {
        const shadowColor = style.shadowColor || '#000';
        const shadowOffset = style.shadowOffset || { width: 0, height: 0 };
        const shadowOpacity = style.shadowOpacity || 0;
        const shadowRadius = style.shadowRadius || 0;
        
        fixed.boxShadow = `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px rgba(0,0,0,${shadowOpacity})`;
      }
    }
    // Manter outras propriedades
    else {
      fixed[key] = value;
    }
  }
  
  return fixed;
};

/**
 * Componente wrapper que aplica estilos seguros
 */
export const SafeStyleView = ({ style, children, ...props }) => {
  const safeStyle = useSafeStyle(style);
  
  return (
    <div style={safeStyle} {...props}>
      {children}
    </div>
  );
};

export default StyleSheet;