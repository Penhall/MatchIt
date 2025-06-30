import api from './api';
import { UserProfile } from '../types';
import { StylePreference } from '../types/stylePreferences';

export const ProfileService = {
  // Método existente para buscar perfil básico
  getProfile: async (userId: string): Promise<UserProfile> => {
    const response = await api.get(`/api/profile/${userId}`);
    return response.data;
  },

  // Método existente para atualizar perfil básico
  updateProfile: async (userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await api.put(`/api/profile`, profileData);
    return response.data;
  },

  // NOVO: Buscar preferências de estilo
  getStylePreferences: async (userId: string): Promise<StylePreference[]> => {
    const response = await api.get('/api/profile/style-preferences');
    return response.data;
  },

  // NOVO: Atualizar preferência de estilo
  updateStylePreference: async (
    userId: string,
    preference: StylePreference
  ): Promise<StylePreference> => {
    const response = await api.put('/api/profile/style-preferences', preference);
    return response.data;
  },

  // NOVO: Buscar perfil completo com preferências
  getFullProfile: async (userId: string): Promise<UserProfile> => {
    const response = await api.get(`/api/profile/${userId}`);
    return response.data;
  },
};
