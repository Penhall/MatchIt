
import React, { useState, ChangeEvent, FocusEvent } from 'react';

interface FloatingLabelInputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  required?: boolean;
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  className = '',
  labelClassName = '',
  inputClassName = '',
  required = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && value.length > 0;

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => setIsFocused(true);
  const handleBlur = (e: FocusEvent<HTMLInputElement>) => setIsFocused(false);

  return (
    <div className={`relative ${className}`}>
      <label
        htmlFor={id}
        className={`absolute left-3 transition-all duration-200 ease-in-out pointer-events-none
          ${isFocused || hasValue ? 'top-1 text-xs text-neon-blue' : 'top-1/2 -translate-y-1/2 text-gray-400'}
          ${labelClassName}`}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        required={required}
        className={`w-full px-3 pt-5 pb-2 bg-dark-input text-gray-200 border border-gray-700 rounded-lg focus:border-neon-blue focus:ring-1 focus:ring-neon-blue outline-none transition-colors duration-200 ${inputClassName}`}
      />
    </div>
  );
};

export default FloatingLabelInput;
