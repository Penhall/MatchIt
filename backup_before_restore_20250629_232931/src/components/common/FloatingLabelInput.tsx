import React from 'react';
import { useTheme } from '../../src/context/ThemeContext';

interface FloatingLabelInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  multiline?: boolean;
  className?: string;
  required?: boolean;
  darkMode?: boolean;
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  multiline = false,
  className = '',
  required = false,
  darkMode // Mantido para compatibilidade, mas não recomendado
}) => {
  const { isDarkMode, theme } = useTheme();
  const effectiveDarkMode = darkMode !== undefined ? darkMode : isDarkMode;
  
  const baseClasses = `block w-full px-3 py-3 h-12 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
    effectiveDarkMode
      ? `border-${theme.colors.borders.primary} bg-${theme.colors.surface} text-${theme.colors.text.primary}`
      : 'border-gray-300 bg-white text-gray-900'
  }`;
  
  return (
    <div className={`relative ${className}`}>
      {/* Label com espaçamento mínimo de 8px do input e margem inferior */}
      <label className={`absolute -top-3 left-2 px-1 text-xs mb-1 ${
        effectiveDarkMode
          ? `bg-${theme.colors.surface} text-${theme.colors.text.secondary}`
          : 'bg-white text-gray-500'
      }`}>
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseClasses} min-h-[120px]`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClasses}
          required={required}
        />
      )}
    </div>
  );
};

export default FloatingLabelInput;
