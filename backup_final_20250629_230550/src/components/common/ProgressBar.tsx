
import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
  barClassName?: string;
  glow?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = 'h-3 bg-gray-700 rounded-full overflow-hidden',
  barClassName = 'bg-gradient-to-r from-neon-blue to-neon-green',
  glow = true,
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`${className} relative`}>
      <div
        className={`h-full ${barClassName} transition-all duration-500 ease-out ${glow ? 'shadow-glow-blue' : ''}`}
        style={{ width: `${clampedProgress}%` }}
      ></div>
      {/* Optional: add a subtle background glow for the bar itself */}
      {glow && clampedProgress > 0 && (
         <div 
           className="absolute top-0 left-0 h-full opacity-50 blur-sm"
           style={{ width: `${clampedProgress}%`, background: 'radial-gradient(circle, rgba(0,255,255,0.5) 0%, rgba(0,255,255,0) 70%)' }}
         ></div>
      )}
    </div>
  );
};

export default ProgressBar;
