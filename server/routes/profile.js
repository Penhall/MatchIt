import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { ProfileService } from '../services/profileService.js';
import { logger } from '../utils/helpers.js';

const router = express.Router();
const profileService = new ProfileService();

const profileController = {
  getProfile: async (req, res) => {
    try {
      const userIdToFetch = req.params.userId || req.user?.id;
      if (!userIdToFetch) {
        return res.status(401).json({ message: 'Usuário não autenticado ou ID do perfil não especificado.' });
      }
      
      logger.info(`Buscando perfil para userId: ${userIdToFetch}`);
      const profile = await profileService.getProfileByUserId(userIdToFetch);

      if (!profile) {
        return res.status(404).json({ message: 'Perfil não encontrado.' });
      }
      
      // Agora o perfil já inclui stylePreferences no objeto principal
      res.json(profile);
    } catch (error) {
      logger.error(`Erro na rota getProfile: ${error.message}`);
      res.status(500).json({ message: 'Erro ao buscar perfil.', error: error.message });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
      }

      logger.info(`Atualizando perfil para userId: ${userId}`);
      const updatedProfile = await profileService.updateUserProfile(userId, req.body);
      
      if (!updatedProfile) {
        return res.status(404).json({ message: 'Perfil não encontrado após tentativa de atualização.' });
      }
      res.json({ message: 'Perfil atualizado com sucesso.', data: updatedProfile });
    } catch (error) {
      logger.error(`Erro na rota updateProfile: ${error.message}`);
      res.status(500).json({ message: 'Erro ao atualizar perfil.', error: error.message });
    }
  },

  // Novo endpoint para buscar preferências de estilo
  getStylePreferences: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
      }

      logger.info(`Buscando preferências de estilo para userId: ${userId}`);
      const stylePreferences = await profileService.getStyleChoicesByUserId(userId);
      
      res.json(stylePreferences);
    } catch (error) {
      logger.error(`Erro ao buscar preferências de estilo: ${error.message}`);
      res.status(500).json({ message: 'Erro ao buscar preferências de estilo.', error: error.message });
    }
  },

  // Novo endpoint para atualizar uma preferência de estilo
  updateStylePreference: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
      }

      const { category, questionId, selectedOption } = req.body;
      if (!category || !questionId || selectedOption === undefined) {
        return res.status(400).json({ message: 'Dados incompletos: category, questionId e selectedOption são obrigatórios.' });
      }

      logger.info(`Atualizando preferência de estilo para userId: ${userId}`, { category, questionId, selectedOption });
      const updatedPreference = await profileService.updateStyleChoice(userId, { category, questionId, selectedOption });
      
      res.json({ message: 'Preferência de estilo atualizada com sucesso.', data: updatedPreference });
    } catch (error) {
      logger.error(`Erro ao atualizar preferência de estilo: ${error.message}`);
      res.status(500).json({ message: 'Erro ao atualizar preferência de estilo.', error: error.message });
    }
  },

  // Funções existentes para upload e delete de fotos
  uploadPhotos: async (req, res) => {
    // Implementação existente
  },

  deletePhoto: async (req, res) => {
    // Implementação existente
  }
};

// Rotas existentes
router.get('/:userId?', authenticateToken, profileController.getProfile);
router.put('/', authenticateToken, profileController.updateProfile);

// Novas rotas para preferências de estilo
router.get('/style-preferences', authenticateToken, profileController.getStylePreferences);
router.put('/style-preferences', authenticateToken, profileController.updateStylePreference);

// Rotas de fotos
router.post('/photos', authenticateToken, profileController.uploadPhotos);
router.delete('/photos/:photoId', authenticateToken, profileController.deletePhoto);

export default router;
