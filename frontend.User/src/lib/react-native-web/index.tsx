// src/lib/react-native-web/index.tsx - Componentes web compatíveis com React Native
import React from 'react';
import { useNavigate } from 'react-router-dom';

// =====================================================
// COMPONENTES BÁSICOS
// =====================================================

export const View: React.FC<any> = ({ style, children, ...props }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
);

export const Text: React.FC<any> = ({ style, children, ...props }) => (
  <span style={style} {...props}>
    {children}
  </span>
);

export const TouchableOpacity: React.FC<any> = ({ 
  style, 
  onPress, 
  children, 
  disabled = false,
  activeOpacity = 0.7,
  ...props 
}) => (
  <button 
    style={{ 
      border: 'none', 
      background: 'transparent',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      ...style
    }} 
    onClick={disabled ? undefined : onPress}
    disabled={disabled}
    onMouseDown={(e) => {
      if (!disabled) {
        e.currentTarget.style.opacity = String(activeOpacity);
      }
    }}
    onMouseUp={(e) => {
      if (!disabled) {
        e.currentTarget.style.opacity = '1';
      }
    }}
    onMouseLeave={(e) => {
      if (!disabled) {
        e.currentTarget.style.opacity = '1';
      }
    }}
    {...props}
  >
    {children}
  </button>
);

export const ScrollView: React.FC<any> = ({ 
  style, 
  children, 
  horizontal = false,
  showsVerticalScrollIndicator = true,
  showsHorizontalScrollIndicator = true,
  refreshControl,
  ...props 
}) => (
  <div 
    style={{ 
      overflow: 'auto',
      scrollbarWidth: showsVerticalScrollIndicator || showsHorizontalScrollIndicator ? 'auto' : 'none',
      msOverflowStyle: showsVerticalScrollIndicator || showsHorizontalScrollIndicator ? 'auto' : 'none',
      flexDirection: horizontal ? 'row' : 'column',
      display: 'flex',
      ...style
    }} 
    {...props}
  >
    {children}
  </div>
);

export const Image: React.FC<any> = ({ 
  source, 
  style, 
  resizeMode = 'cover',
  onLoad,
  onError,
  ...props 
}) => (
  <img 
    src={typeof source === 'string' ? source : source?.uri} 
    style={{
      objectFit: resizeMode,
      ...style
    }}
    onLoad={onLoad}
    onError={onError}
    {...props} 
  />
);

export const ActivityIndicator: React.FC<any> = ({ 
  size = 20, 
  color = '#666',
  style,
  ...props 
}) => (
  <div 
    style={{
      width: typeof size === 'number' ? size : 20,
      height: typeof size === 'number' ? size : 20,
      border: `2px solid ${color}`,
      borderTop: '2px solid transparent',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      ...style
    }}
    {...props}
  />
);

export const TextInput: React.FC<any> = ({ 
  style, 
  onChangeText,
  value,
  placeholder,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  ...props 
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (onChangeText) {
      onChangeText(e.target.value);
    }
  };

  const baseStyle = {
    border: '1px solid #ccc',
    borderRadius: 4,
    padding: '8px 12px',
    fontSize: 16,
    outline: 'none',
    backgroundColor: editable ? 'white' : '#f5f5f5',
    ...style
  };

  if (multiline) {
    return (
      <textarea
        style={{
          ...baseStyle,
          resize: 'vertical',
          minHeight: numberOfLines * 20
        }}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={!editable}
        {...props}
      />
    );
  }

  return (
    <input
      type={secureTextEntry ? 'password' : 'text'}
      style={baseStyle}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={!editable}
      {...props}
    />
  );
};

export const Switch: React.FC<any> = ({ 
  value, 
  onValueChange, 
  style,
  disabled = false,
  ...props 
}) => (
  <input
    type="checkbox"
    checked={value}
    onChange={(e) => onValueChange && onValueChange(e.target.checked)}
    disabled={disabled}
    style={{
      width: 50,
      height: 25,
      ...style
    }}
    {...props}
  />
);

export const Modal: React.FC<any> = ({ 
  visible, 
  onRequestClose, 
  children, 
  transparent = false,
  animationType = 'fade',
  ...props 
}) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: transparent ? 'transparent' : 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onRequestClose}
      {...props}
    >
      <div onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export const FlatList: React.FC<any> = ({ 
  data, 
  renderItem, 
  keyExtractor,
  style,
  horizontal = false,
  numColumns = 1,
  ListEmptyComponent,
  refreshControl,
  ...props 
}) => {
  if (!data || data.length === 0) {
    return ListEmptyComponent ? <ListEmptyComponent /> : null;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: horizontal ? 'row' : 'column',
        flexWrap: numColumns > 1 ? 'wrap' : 'nowrap',
        ...style
      }}
      {...props}
    >
      {data.map((item: any, index: number) => (
        <div
          key={keyExtractor ? keyExtractor(item, index) : index}
          style={{
            width: numColumns > 1 ? `${100 / numColumns}%` : 'auto'
          }}
        >
          {renderItem({ item, index })}
        </div>
      ))}
    </div>
  );
};

// =====================================================
// UTILITÁRIOS
// =====================================================

export const RefreshControl: React.FC<any> = () => null;

export const Dimensions = {
  get: (dim: 'window' | 'screen' = 'window') => ({
    width: window.innerWidth,
    height: window.innerHeight
  }),
  addEventListener: (type: string, handler: () => void) => {
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }
};

export const StyleSheet = {
  create: <T extends Record<string, any>>(styles: T): T => styles,
  flatten: (style: any) => style,
  hairlineWidth: 1,
  absoluteFill: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  }
};

export const Alert = {
  alert: (title: string, message?: string, buttons?: any[]) => {
    if (buttons && buttons.length > 1) {
      const result = window.confirm(`${title}${message ? '\n' + message : ''}`);
      const button = result ? buttons.find(b => b.style !== 'cancel') : buttons.find(b => b.style === 'cancel');
      if (button && button.onPress) {
        button.onPress();
      }
    } else {
      window.alert(`${title}${message ? '\n' + message : ''}`);
      if (buttons && buttons[0] && buttons[0].onPress) {
        buttons[0].onPress();
      }
    }
  }
};

// =====================================================
// NAVEGAÇÃO
// =====================================================

export const useNavigation = () => {
  const navigate = useNavigate();
  
  return {
    navigate: (routeName: string, params?: any) => {
      if (params) {
        navigate(routeName, { state: params });
      } else {
        navigate(routeName);
      }
    },
    goBack: () => navigate(-1),
    canGoBack: () => window.history.length > 1,
    replace: (routeName: string, params?: any) => {
      if (params) {
        navigate(routeName, { replace: true, state: params });
      } else {
        navigate(routeName, { replace: true });
      }
    }
  };
};

export const useFocusEffect = (callback: () => void | (() => void)) => {
  React.useEffect(() => {
    const cleanup = callback();
    return cleanup;
  }, []);
};

// =====================================================
// SAFE AREA
// =====================================================

export const SafeAreaView: React.FC<any> = ({ children, style, ...props }) => (
  <div 
    style={{ 
      paddingTop: 'env(safe-area-inset-top, 20px)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      paddingLeft: 'env(safe-area-inset-left, 0px)',
      paddingRight: 'env(safe-area-inset-right, 0px)',
      minHeight: '100vh',
      ...style 
    }} 
    {...props}
  >
    {children}
  </div>
);
