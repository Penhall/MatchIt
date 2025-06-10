// server/routes/subscription.js - Subscription routes
import express from 'express';
import { validateRequired } from '../middleware/validation.js';
import { SubscriptionService } from '../services/subscriptionService.js';

const router = express.Router();
const subscriptionService = new SubscriptionService();

// POST / - Create subscription
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

// GET / - Get subscription status
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

// DELETE / - Cancel subscription
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

// GET /plans - Get available plans
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

export default router;
