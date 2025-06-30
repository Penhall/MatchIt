// src/components/web/TouchableOpacity.tsx - Equivalente web do TouchableOpacity
import React from 'react';

interface TouchableOpacityProps {
  onPress?: () => void;
  style?: React.CSSProperties | React.CSSProperties[];
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const TouchableOpacity: React.FC<TouchableOpacityProps> = ({
  onPress,
  style,
  children,
  disabled = false,
  className = ''
}) => {
  const handleClick = () => {
    if (!disabled && onPress) {
      onPress();
    }
  };

  const combinedStyle = Array.isArray(style) 
    ? Object.assign({}, ...style)
    : style || {};

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={className}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...combinedStyle
      }}
    >
      {children}
    </button>
  );
};

export default TouchableOpacity;
