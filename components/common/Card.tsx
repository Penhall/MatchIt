import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'blue' | 'green' | 'orange' | null;
}

const GLOW_CLASSES = {
  blue: 'hover:shadow-neon-blue border-neon-blue/30',
  green: 'hover:shadow-neon-green border-neon-green/30',
  orange: 'hover:shadow-neon-orange border-neon-orange/30',
  none: 'border-gray-700/50'
};

const Card: React.FC<CardProps> = ({ children, className = '', glowColor = 'blue' }) => {
  const baseClasses = 'bg-dark-card p-4 sm:p-6 rounded-xl border transition-all duration-300';
  const glowClass = glowColor ? GLOW_CLASSES[glowColor] : GLOW_CLASSES.none;
  
  return (
    <div className={`${baseClasses} ${glowClass} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
