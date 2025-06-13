import React from 'react';

interface FloatingLabelInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  multiline?: boolean;
  className?: string;
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({ 
  label, 
  value, 
  onChange,
  type = 'text',
  multiline = false,
  className = ''
}) => {
  const baseClasses = 'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500';
  
  return (
    <div className={`relative ${className}`}>
      <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseClasses} min-h-[100px]`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClasses}
        />
      )}
    </div>
  );
};

export default FloatingLabelInput;
