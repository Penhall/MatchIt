
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glowEffect?: 'blue' | 'green' | 'orange' | 'none';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  glowEffect = 'blue',
  className = '',
  ...props
}) => {
  const baseStyles = 'font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg transition-all duration-150 ease-in-out transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg',
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-neon-blue/80 to-neon-green/80 hover:from-neon-blue hover:to-neon-green text-black shadow-md',
    secondary: 'bg-neon-orange/80 hover:bg-neon-orange text-black shadow-md',
    outline: 'border-2 bg-transparent hover:bg-white/10',
    ghost: 'bg-transparent text-gray-300 hover:bg-white/10 hover:text-neon-blue',
  };

  const glowStyles = {
    primary: {
      blue: 'hover:shadow-neon-blue',
      green: 'hover:shadow-neon-green',
      orange: 'hover:shadow-neon-orange',
      none: ''
    },
    secondary: {
      orange: 'hover:shadow-neon-orange',
      none: ''
    },
    outline: {
      blue: 'border-neon-blue text-neon-blue hover:shadow-neon-blue',
      green: 'border-neon-green text-neon-green hover:shadow-neon-green',
      orange: 'border-neon-orange text-neon-orange hover:shadow-neon-orange',
      none: 'border-gray-700/50 text-gray-300'
    }
  };

  const focusRingClasses = {
    blue: 'focus:ring-neon-blue',
    green: 'focus:ring-neon-green',
    orange: 'focus:ring-neon-orange',
    none: ''
  };

  const getGlowStyle = (): string => {
    if (variant === 'ghost') return '';
    if (!glowEffect) return '';
    
    const variantGlow = glowStyles[variant as keyof typeof glowStyles];
    return variantGlow[glowEffect as keyof typeof variantGlow] || '';
  };

  return (
    <button
      className={`${baseStyles} ${sizeClasses[size]} ${variantStyles[variant]} ${getGlowStyle()} ${focusRingClasses[glowEffect]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
