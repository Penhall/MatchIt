// src/components/web/Text.tsx - Equivalente web do Text
import React from 'react';

interface TextProps {
  style?: React.CSSProperties | React.CSSProperties[];
  children?: React.ReactNode;
  className?: string;
  numberOfLines?: number;
}

const Text: React.FC<TextProps> = ({ 
  style, 
  children, 
  className = '',
  numberOfLines 
}) => {
  const combinedStyle = Array.isArray(style) 
    ? Object.assign({}, ...style)
    : style || {};

  if (numberOfLines) {
    combinedStyle.display = '-webkit-box';
    combinedStyle.WebkitLineClamp = numberOfLines;
    combinedStyle.WebkitBoxOrient = 'vertical';
    combinedStyle.overflow = 'hidden';
  }

  return (
    <span className={className} style={combinedStyle}>
      {children}
    </span>
  );
};

export default Text;
