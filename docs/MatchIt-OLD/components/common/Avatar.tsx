
import React from 'react';

interface AvatarProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isVip?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ src, alt, size = 'md', className = '', isVip = false }) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 ${isVip ? 'border-neon-orange' : 'border-neon-blue/50'} shadow-lg`}
      />
      {isVip && (
        <div className="absolute -bottom-1 -right-1 bg-neon-orange text-black text-xs font-bold px-1.5 py-0.5 rounded-full shadow-md transform rotate-12">
          VIP
        </div>
      )}
    </div>
  );
};

export default Avatar;
