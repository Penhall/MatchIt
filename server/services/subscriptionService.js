// server/services/subscriptionService.js - Subscription service
import { pool } from '../config/database.js';

class SubscriptionService {
  async createSubscription({ userId, planType, paymentMethod, stripeSubscriptionId }) {
    const query = `
      INSERT INTO subscriptions (user_id, plan_type, payment_method, stripe_subscription_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    return (await pool.query(query, [userId, planType, paymentMethod, stripeSubscriptionId])).rows[0];
  }

  async getUserSubscription(userId) {
    const query = `
      SELECT * FROM subscriptions
      WHERE user_id = $1 AND status = 'active'
      LIMIT 1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  async cancelSubscription(userId) {
    const query = `
      UPDATE subscriptions
      SET status = 'canceled', canceled_at = NOW()
      WHERE user_id = $1 AND status = 'active'
      RETURNING *
    `;
    const result = await pool.query(query, [userId]);
    if (result.rowCount === 0) {
      throw new Error('Active subscription not found');
    }
    return result.rows[0];
  }

  async getAvailablePlans() {
    return [
      {
        id: 'monthly',
        name: 'Monthly VIP',
        price: 19.99,
        features: ['Unlimited matches', 'Priority support', 'Advanced filters']
      },
      {
        id: 'yearly',
        name: 'Yearly VIP',
        price: 199.99,
        features: ['All monthly features', '50% discount', 'Exclusive badges']
      }
    ];
  }
}

export { SubscriptionService };
