// src/components/web/View.tsx - Equivalente web do View
import React from 'react';

interface ViewProps {
  style?: React.CSSProperties | React.CSSProperties[];
  children?: React.ReactNode;
  className?: string;
}

const View: React.FC<ViewProps> = ({ style, children, className = '' }) => {
  const combinedStyle = Array.isArray(style) 
    ? Object.assign({}, ...style)
    : style || {};

  return (
    <div className={className} style={combinedStyle}>
      {children}
    </div>
  );
};

export default View;
