
import React from 'react';

interface SwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  srLabel?: string; // Screen reader label
}

const Switch: React.FC<SwitchProps> = ({ id, checked, onChange, label, srLabel }) => {
  return (
    <label htmlFor={id} className="flex items-center cursor-pointer select-none">
      {label && <span className="mr-3 text-gray-300 text-sm">{label}</span>}
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`block w-12 h-6 rounded-full transition-colors ${checked ? 'bg-neon-blue' : 'bg-gray-600'}`}></div>
        <div
          className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${
            checked ? 'transform translate-x-6' : ''
          }`}
        ></div>
      </div>
      {srLabel && <span className="sr-only">{srLabel}</span>}
    </label>
  );
};

export default Switch;
