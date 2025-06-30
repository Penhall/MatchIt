import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className = '' }) => (
  <div className={`loading-spinner ${className}`}>
    <div className="spinner"></div>
  </div>
);

export default LoadingSpinner;