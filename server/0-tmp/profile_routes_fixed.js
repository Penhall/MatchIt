// server/routes/profile.js - Rotas de perfil do usuário
import { Router } from 'express';
import { validateRequired } from '../middleware/validation.js';
import { ProfileService } from '../services/profileService.js';

const router = Router();
const profileService = new ProfileService();

// GET /api/profile - Obter perfil completo
router.get('/', async (req, res) => {
  try {
    const profile = await profileService.getUserProfile(req.user.userId);
    
    if (!profile) {
      return res.status(404).json({ 
        error: 'Profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'PROFILE_FETCH_ERROR'
    });
  }
});

// PUT /api/profile - Atualizar perfil
router.put('/', async (req, res) => {
  try {
    const { displayName, city, bio, avatarUrl, age, gender } = req.body;
    
    const updatedProfile = await profileService.updateUserProfile(req.user.userId, {
      displayName,
      city,
      bio,
      avatarUrl,
      age,
      gender
    });
    
    res.json({ 
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ 
        error: 'Profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'PROFILE_UPDATE_ERROR'
    });
  }
});

// POST /api/style-choices - Salvar escolhas de estilo
router.post('/style-choices', validateRequired(['choices']), async (req, res) => {
  try {
    const { choices } = req.body;
    
    if (!Array.isArray(choices)) {
      return res.status(400).json({ 
        error: 'Choices must be an array',
        code: 'VALIDATION_ERROR'
      });
    }
    
    const result = await profileService.saveStyleChoices(req.user.userId, choices);
    res.json(result);
    
  } catch (error) {
    console.error('Error saving style choices:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'STYLE_CHOICES_ERROR'
    });
  }
});

// GET /api/style-choices - Obter escolhas de estilo
router.get('/style-choices', async (req, res) => {
  try {
    const choices = await profileService.getUserStyleChoices(req.user.userId);
    res.json(choices);
  } catch (error) {
    console.error('Error fetching style choices:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'STYLE_CHOICES_ERROR'
    });
  }
});

export default router;