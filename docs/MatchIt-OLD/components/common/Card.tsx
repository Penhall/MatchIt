
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'blue' | 'green' | 'orange' | null;
}

const Card: React.FC<CardProps> = ({ children, className = '', glowColor = 'blue' }) => {
  const glowClasses = {
    blue: 'hover:shadow-glow-blue border-neon-blue/30',
    green: 'hover:shadow-glow-green border-neon-green/30',
    orange: 'hover:shadow-glow-orange border-neon-orange/30',
    null: 'border-gray-700/50'
  };
  return (
    <div
      className={`bg-dark-card p-4 sm:p-6 rounded-xl border transition-all duration-300 ${glowColor ? glowClasses[glowColor] : glowClasses.null} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
