// services/profileService.ts - Serviço de perfil com exports corretos
import api from './api';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  city?: string;
  isVip?: boolean;
  bio?: string;
  profilePicture?: string;
}

export interface StylePreferences {
  [category: string]: {
    [questionId: string]: {
      selectedOption: string;
      createdAt?: string;
      updatedAt?: string;
    };
  };
}

export interface ProfileUpdateData {
  name?: string;
  displayName?: string;
  city?: string;
  bio?: string;
  profilePicture?: string;
}

export class ProfileService {
  /**
   * Buscar perfil do usuário atual
   */
  async getCurrentProfile(): Promise<UserProfile> {
    try {
      const response = await api.get('/profile');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      throw error;
    }
  }

  /**
   * Atualizar perfil do usuário
   */
  async updateProfile(profileData: ProfileUpdateData): Promise<UserProfile> {
    try {
      const response = await api.put('/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  }

  /**
   * Buscar preferências de estilo
   */
  async getStylePreferences(): Promise<StylePreferences> {
    try {
      const response = await api.get('/profile/style-preferences');
      return response.data?.preferences || {};
    } catch (error) {
      console.error('Erro ao buscar preferências de estilo:', error);
      return {};
    }
  }

  /**
   * Atualizar preferências de estilo
   */
  async updateStylePreferences(preferences: StylePreferences): Promise<void> {
    try {
      await api.put('/profile/style-preferences', { preferences });
    } catch (error) {
      console.error('Erro ao atualizar preferências de estilo:', error);
      throw error;
    }
  }

  /**
   * Atualizar uma categoria específica de preferências
   */
  async updateStyleCategory(category: string, categoryData: any): Promise<void> {
    try {
      await api.patch(`/profile/style-preferences/${category}`, categoryData);
    } catch (error) {
      console.error(`Erro ao atualizar categoria ${category}:`, error);
      throw error;
    }
  }

  /**
   * Upload de foto de perfil
   */
  async uploadProfilePicture(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await api.post('/profile/upload-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.profilePictureUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      throw error;
    }
  }

  /**
   * Validar dados do perfil
   */
  validateProfileData(data: ProfileUpdateData): boolean {
    if (data.name && data.name.trim().length < 2) {
      throw new Error('Nome deve ter pelo menos 2 caracteres');
    }
    
    if (data.bio && data.bio.length > 500) {
      throw new Error('Bio deve ter no máximo 500 caracteres');
    }
    
    return true;
  }
}

// Criar instância singleton
const profileServiceInstance = new ProfileService();

// Exports múltiplos para compatibilidade
export { ProfileService as default };
export { profileServiceInstance };
export const profileService = profileServiceInstance;
