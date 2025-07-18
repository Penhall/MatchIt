// server/middleware/profile.js - Profile routes
import { Router } from 'express';
const router = Router();

// Basic profile routes
router.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Profile endpoint',
    timestamp: new Date().toISOString()
  });
});

router.get('/style-choices', (req, res) => {
  res.status(200).json({ 
    message: 'Style choices endpoint',
    timestamp: new Date().toISOString()
  });
});

export default router;
