// src/lib/react-native-web/index.ts - Substitutos web para React Native
import React from 'react';

// Componentes básicos
export const View: React.FC<{
  style?: React.CSSProperties | React.CSSProperties[];
  children?: React.ReactNode;
}> = ({ style, children }) => {
  const combinedStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;
  return React.createElement('div', { style: combinedStyle }, children);
};

export const Text: React.FC<{
  style?: React.CSSProperties | React.CSSProperties[];
  children?: React.ReactNode;
  numberOfLines?: number;
}> = ({ style, children, numberOfLines }) => {
  const combinedStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;
  if (numberOfLines) {
    Object.assign(combinedStyle || {}, {
      display: '-webkit-box',
      WebkitLineClamp: numberOfLines,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden'
    });
  }
  return React.createElement('span', { style: combinedStyle }, children);
};

export const TouchableOpacity: React.FC<{
  onPress?: () => void;
  style?: React.CSSProperties | React.CSSProperties[];
  children?: React.ReactNode;
  disabled?: boolean;
}> = ({ onPress, style, children, disabled }) => {
  const combinedStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;
  return React.createElement('button', {
    onClick: onPress,
    disabled,
    style: {
      background: 'none',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      ...combinedStyle
    }
  }, children);
};

export const ScrollView: React.FC<{
  style?: React.CSSProperties;
  children?: React.ReactNode;
  refreshControl?: any;
}> = ({ style, children }) => {
  return React.createElement('div', {
    style: {
      overflow: 'auto',
      ...style
    }
  }, children);
};

export const TextInput: React.FC<{
  style?: React.CSSProperties;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  editable?: boolean;
}> = ({ style, value, onChangeText, placeholder, secureTextEntry, editable = true }) => {
  return React.createElement('input', {
    type: secureTextEntry ? 'password' : 'text',
    value,
    onChange: (e: any) => onChangeText?.(e.target.value),
    placeholder,
    disabled: !editable,
    style
  });
};

export const Switch: React.FC<{
  value: boolean;
  onValueChange: (value: boolean) => void;
  trackColor?: { false: string; true: string };
  thumbColor?: string;
  style?: React.CSSProperties;
}> = ({ value, onValueChange, trackColor, thumbColor, style }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange(event.target.checked);
  };

  // Estilos simples para se assemelhar a um switch nativo
  const switchStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    width: '34px',
    height: '20px',
    ...style
  };

  const sliderStyle: React.CSSProperties = {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: value ? trackColor?.true || '#2196F3' : trackColor?.false || '#ccc',
    borderRadius: '34px',
    transition: '0.4s'
  };

  const thumbStyle: React.CSSProperties = {
    position: 'absolute',
    height: '12px',
    width: '12px',
    left: value ? '18px' : '4px',
    bottom: '4px',
    backgroundColor: thumbColor || 'white',
    borderRadius: '50%',
    transition: '0.4s'
  };
  
  return React.createElement('label', { style: switchStyle },
    React.createElement('input', {
      type: 'checkbox',
      checked: value,
      onChange: handleChange,
      style: { opacity: 0, width: 0, height: 0 }
    }),
    React.createElement('span', { style: sliderStyle }, 
      React.createElement('span', { style: thumbStyle })
    )
  );
};


export const StyleSheet = {
  create: (styles: any) => styles
};

export const Dimensions = {
  get: () => ({
    width: window.innerWidth,
    height: window.innerHeight
  })
};

export const Alert = {
  alert: (title: string, message?: string) => {
    alert(`${title}${message ? '\n' + message : ''}`);
  }
};

export const RefreshControl: React.FC<any> = () => null;

// Placeholder para outros componentes
export const SafeAreaView = View;
export const FlatList = View;
export const Image = View;

// Placeholders para react-native-chart-kit
export const LineChart: React.FC<any> = ({ data, width, height, chartConfig, style }) => {
  console.warn('LineChart is not implemented for web yet.');
  return React.createElement('div', { style: { width, height, ...style, border: '1px solid #ccc', padding: '10px' } }, 'LineChart Placeholder');
};

export const BarChart: React.FC<any> = ({ data, width, height, chartConfig, style }) => {
  console.warn('BarChart is not implemented for web yet.');
  return React.createElement('div', { style: { width, height, ...style, border: '1px solid #ccc', padding: '10px' } }, 'BarChart Placeholder');
};

// Placeholder para @react-native-community/slider
const Slider: React.FC<any> = ({ style, value, onSlidingComplete }) => {
  console.warn('Slider is not implemented for web yet.');
  return React.createElement('input', { type: 'range', style, defaultValue: value, onMouseUp: (e: any) => onSlidingComplete(e.target.value) });
};

export default Slider;
