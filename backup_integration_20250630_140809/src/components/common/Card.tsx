import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  glowColor?: 'blue' | 'green' | 'orange';
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, glowColor, className = '' }) => {
  const baseClasses = 'bg-dark-card rounded-xl p-4 sm:p-6 border border-gray-700';
  
  const glowClasses = glowColor ? {
    blue: 'border-neon-blue/50 shadow-glow-blue',
    green: 'border-neon-green/50 shadow-glow-green',
    orange: 'border-neon-orange/50 shadow-glow-orange'
  }[glowColor] : '';

  return (
    <div className={`${baseClasses} ${glowClasses} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
