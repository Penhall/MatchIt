export interface User {
  id: string;
  displayName: string;
  city: string;
  gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | 'other'; // Atualizado para incluir mais opções
  avatarUrl: string;
  bio?: string;
  isVip: boolean;
}

export interface StyleChoice {
  category: StyleCategory;
  value: number; // e.g., 0-100 for radar chart
  preferenceImage?: string; // URL of preferred image
}

export enum StyleCategory {
  Sneakers = 'Sneakers',
  Clothing = 'Clothing',
  Colors = 'Colors',
  Hobbies = 'Hobbies',
  Feelings = 'Feelings',
}

export const StyleCategoryOrder: StyleCategory[] = [
  StyleCategory.Sneakers,
  StyleCategory.Clothing,
  StyleCategory.Colors,
  StyleCategory.Hobbies,
  StyleCategory.Feelings,
];


export interface StyleAdjustmentQuestion {
  id: string;
  category: StyleCategory;
  questionText: string;
  option1: { id: string, imageUrl: string, label: string };
  option2: { id: string, imageUrl: string, label: string };
}

export interface Match {
  id: string;
  user: User;
  compatibilityScore: number; // Percentage
}

export interface ChatMessage {
  id: string;
  senderId: string; // 'currentUser' or other user's ID
  text: string;
  timestamp: Date;
  isCurrentUser?: boolean; // Added for easier rendering
}

export interface Product {
  id: string;
  name: string;
  brandLogoUrl: string;
  imageUrl: string;
  price: string;
}

export interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

export interface GeographicLocation {
  latitude: number;
  longitude: number;
  city: string;
  country?: string;
}
