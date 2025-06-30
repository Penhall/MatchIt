import React from 'react';
import logo from '@/assets/images/logo.svg';

interface BrandHeaderProps {
  className?: string;
}

const BrandHeader: React.FC<BrandHeaderProps> = ({ className = '' }) => {
  return (
    <div className="flex flex-col items-center mb-8">
      <img 
        src={logo} 
        alt="MatchIt Logo" 
        className="w-32 h-auto mb-2"
      />
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
        Conectando jogadores de tênis
      </h2>
    </div>
  );
};

export default BrandHeader;