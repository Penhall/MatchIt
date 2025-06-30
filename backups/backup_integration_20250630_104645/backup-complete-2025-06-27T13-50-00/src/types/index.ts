// Main types for MatchIt application

export interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  city?: string;
  isVip?: boolean;
  bio?: string;
}

export interface StyleCategory {
  id: string;
  name: string;
  description?: string;
}

export interface IconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}
