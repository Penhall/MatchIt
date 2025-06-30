// server/routes/subscription.js - Rotas de assinatura VIP
import express from 'express';
import { validateRequired } from '../middleware/validation.js';
import { SubscriptionService } from '../services/subscriptionService.js';

const router = express.Router();
const subscriptionService = new SubscriptionService();

// POST /api/subscription - Criar assinatura
router.post('/', validateRequired(['planType']), async (req, res) => {
  try {
    const { planType, paymentMethod, stripeSubscriptionId } = req.body;
    
    if (!['monthly', 'yearly'].includes(planType)) {
      return res.status(400).json({ 
        error: 'Invalid plan type',
        code: 'INVALID_PLAN_TYPE',
        validPlans: ['monthly', 'yearly']
      });
    }
    
    const result = await subscriptionService.createSubscription({
      userId: req.user.userId,
      planType,
      paymentMethod,
      stripeSubscriptionId
    });
    
    res.status(201).json(result);
    
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'SUBSCRIPTION_ERROR'
    });
  }
});

// GET /api/subscription - Obter status da assinatura
router.get('/', async (req, res) => {
  try {
    const subscription = await subscriptionService.getUserSubscription(req.user.userId);
    
    if (!subscription) {
      return res.json({ 
        hasActiveSubscription: false,
        subscription: null
      });
    }
    
    res.json({ 
      hasActiveSubscription: true,
      subscription
    });
    
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'SUBSCRIPTION_FETCH_ERROR'
    });
  }
});

// DELETE /api/subscription - Cancelar assinatura
router.delete('/', async (req, res) => {
  try {
    const result = await subscriptionService.cancelSubscription(req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error canceling subscription:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ 
        error: 'Active subscription not found',
        code: 'SUBSCRIPTION_NOT_FOUND'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'SUBSCRIPTION_CANCEL_ERROR'
    });
  }
});

// GET /api/subscription/plans - Obter planos disponíveis
router.get('/plans', async (req, res) => {
  try {
    const plans = await subscriptionService.getAvailablePlans();
    res.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'PLANS_FETCH_ERROR'
    });
  }
});

// PUT /api/subscription - Atualizar assinatura
router.put('/', validateRequired(['planType']), async (req, res) => {
  try {
    const { planType } = req.body;
    
    if (!['monthly', 'yearly'].includes(planType)) {
      return res.status(400).json({ 
        error: 'Invalid plan type',
        code: 'INVALID_PLAN_TYPE'
      });
    }
    
    // Cancelar assinatura atual e criar nova
    await subscriptionService.cancelSubscription(req.user.userId);
    
    const result = await subscriptionService.createSubscription({
      userId: req.user.userId,
      planType,
      paymentMethod: 'stripe' // Default
    });
    
    res.json({ 
      message: 'Subscription updated successfully',
      ...result
    });
    
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'SUBSCRIPTION_UPDATE_ERROR'
    });
  }
});

export default router;