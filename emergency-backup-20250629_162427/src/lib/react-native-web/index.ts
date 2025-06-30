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
