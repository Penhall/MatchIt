export interface User {
  id: string;
  displayName: string;
  city: string;
  gender: 'male' | 'female' | 'other';
  avatarUrl: string;
  bio?: string;
  isVip: boolean;
}

export interface StyleChoice {
  category: StyleCategory;
  value: number;
  preferenceImage?: string;
}

export enum StyleCategory {
  Sneakers = 'Sneakers',
  Clothing = 'Clothing',
  Colors = 'Colors',
  Hobbies = 'Hobbies',
  Feelings = 'Feelings',
}

export interface Match {
  id: string;
  user: User;
  compatibilityScore: number;
}

export interface IconProps {
  className?: string;
}
