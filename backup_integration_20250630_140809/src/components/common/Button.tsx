import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  glowEffect?: 'blue' | 'green' | 'orange';
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  glowEffect,
  className = '',
  ...props 
}) => {
  const baseClasses = 'font-semibold rounded-xl transition-all duration-200 active:scale-95';
  
  const variantClasses = {
    primary: 'bg-neon-blue text-black hover:shadow-glow-blue',
    secondary: 'bg-neon-green text-black hover:shadow-glow-green',
    outline: 'border-2 border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg'
  };
  
  const glowClasses = glowEffect ? {
    blue: 'hover:shadow-glow-blue',
    green: 'hover:shadow-glow-green', 
    orange: 'hover:shadow-glow-orange'
  }[glowEffect] : '';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${glowClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
