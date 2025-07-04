// server/middleware/subscription.js - Subscription routes
import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Subscription endpoint',
    timestamp: new Date().toISOString()
  });
});

export default router;
