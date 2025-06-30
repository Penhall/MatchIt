/**
 * Representa uma preferência de estilo do usuário
 */
export type StylePreference = {
  category: 'Sneakers' | 'Clothing' | 'Colors' | 'Hobbies' | 'Feelings' | 'Interests';
  questionId: string;
  selectedOption: string;
};

/**
 * Tipo estendido do perfil do usuário incluindo preferências de estilo
 */
export type UserProfileWithStyle = {
  userId: string;
  email: string;
  name: string;
  // ... outros campos do perfil ...
  stylePreferences: StylePreference[];
};
