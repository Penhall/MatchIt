import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  glowEffect?: string;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  glowEffect,
  className = '',
  children,
  ...props
}) => {
  const baseClasses = 'rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2';
  const variantClasses = {
    primary: 'bg-neon-blue text-white hover:bg-neon-blue/90',
    secondary: 'bg-gray-800 text-white hover:bg-gray-700',
    outline: 'border border-gray-600 text-gray-200 hover:bg-gray-800/50'
  };
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;