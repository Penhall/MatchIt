
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

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg',
  };

  const variantStyles = {
    primary: `bg-gradient-to-r from-neon-blue/80 to-neon-green/80 hover:from-neon-blue hover:to-neon-green text-black shadow-md ${glowEffect === 'blue' ? 'hover:shadow-neon-blue' : glowEffect === 'green' ? 'hover:shadow-neon-green' : glowEffect === 'orange' ? 'hover:shadow-neon-orange' : ''}`,
    secondary: `bg-neon-orange/80 hover:bg-neon-orange text-black shadow-md ${glowEffect === 'orange' ? 'hover:shadow-neon-orange' : ''}`,
    outline: `border-2 bg-transparent hover:bg-white/10 ${glowEffect === 'blue' ? 'border-neon-blue text-neon-blue hover:shadow-glow-blue' : glowEffect === 'green' ? 'border-neon-green text-neon-green hover:shadow-glow-green' : 'border-neon-orange text-neon-orange hover:shadow-glow-orange'}`,
    ghost: `bg-transparent text-gray-300 hover:bg-white/10 hover:text-neon-blue`,
  };
  
  const glowClasses = {
    blue: 'focus:ring-neon-blue',
    green: 'focus:ring-neon-green',
    orange: 'focus:ring-neon-orange',
    none: ''
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${glowClasses[glowEffect]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
