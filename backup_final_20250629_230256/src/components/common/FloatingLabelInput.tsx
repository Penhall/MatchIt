import React, { useState, useRef, useEffect } from 'react';

interface FloatingLabelInputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  required = false,
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const shouldFloat = value !== '' || isFocused;

  return (
    <div className={`relative ${className}`}>
      <label
        className={`absolute left-3 transition-all duration-200 ${
          shouldFloat 
            ? 'top-1 text-xs text-neon-blue' 
            : 'top-3 text-gray-400'
        }`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full pt-5 pb-2 px-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:border-neon-blue focus:outline-none"
      />
    </div>
  );
};

export default FloatingLabelInput;