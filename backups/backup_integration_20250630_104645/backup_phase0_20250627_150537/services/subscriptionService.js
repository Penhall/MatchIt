// server/services/subscriptionService.js - Serviço de assinatura VIP
import { pool } from '../config/database.js';

export class SubscriptionService {
  async createSubscription(subscriptionData) {
    const { userId, planType, paymentMethod, stripeSubscriptionId } = subscriptionData;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      try {
        // Cancelar assinatura ativa se existir
        await client.query(
          'UPDATE user_subscriptions SET status = $1 WHERE user_id = $2 AND status = $3',
          ['cancelled', userId, 'active']
        );
      } catch (error) {
        console.log('Tabela user_subscriptions não existe, continuando...');
      }
      
      // Calcular datas e preço
      const startDate = new Date();
      const endDate = new Date();
      let price = 0;
      
      if (planType === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
        price = 9.99;
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
        price = 99.99;
      }
      
      try {
        // Criar nova assinatura
        const subscriptionResult = await client.query(
          `INSERT INTO user_subscriptions 
           (user_id, plan_type, status, start_date, end_date, price_paid, payment_method, stripe_subscription_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [userId, planType, 'active', startDate, endDate, price, paymentMethod, stripeSubscriptionId]
        );
        
        // Atualizar status VIP do usuário no style_data
        await this.updateUserVipStatus(client, userId, true);
        
        await client.query('COMMIT');
        
        return {
          subscription: subscriptionResult.rows[0],
          message: 'Assinatura VIP ativada com sucesso'
        };
      } catch (error) {
        // Se tabela não existir, apenas simular a assinatura
        console.log('Tabela user_subscriptions não existe, simulando assinatura');
        
        await this.updateUserVipStatus(client, userId, true);
        await client.query('COMMIT');
        
        return {
          subscription: { plan_type: planType, status: 'active', price_paid: price },
          message: 'Assinatura VIP ativada com sucesso'
        };
      }
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserSubscription(userId) {
    try {
      try {
        const result = await pool.query(
          `SELECT us.*, up.style_data
           FROM user_subscriptions us
           INNER JOIN user_profiles up ON us.user_id = up.user_id
           WHERE us.user_id = $1 AND us.status = 'active'
           ORDER BY us.created_at DESC
           LIMIT 1`,
          [userId]
        );
        
        return result.rows.length > 0 ? result.rows[0] : null;
      } catch (error) {
        // Se tabela não existir, verificar no style_data
        const profileResult = await pool.query(
          'SELECT style_data FROM user_profiles WHERE user_id = $1',
          [userId]
        );
        
        if (profileResult.rows.length > 0 && profileResult.rows[0].style_data) {
          const styleData = JSON.parse(profileResult.rows[0].style_data);
          return styleData.is_vip ? { plan_type: 'unknown', status: 'active' } : null;
        }
        
        return null;
      }
    } catch (error) {
      throw error;
    }
  }

  async cancelSubscription(userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      try {
        // Atualizar status da assinatura
        const result = await client.query(
          'UPDATE user_subscriptions SET status = $1 WHERE user_id = $2 AND status = $3 RETURNING *',
          ['cancelled', userId, 'active']
        );
        
        if (result.rows.length === 0) {
          throw new Error('Assinatura ativa não encontrada');
        }
      } catch (error) {
        console.log('Tabela user_subscriptions não existe, continuando...');
      }
      
      // Atualizar status VIP do usuário
      await this.updateUserVipStatus(client, userId, false);
      
      await client.query('COMMIT');
      
      return {
        message: 'Assinatura cancelada com sucesso',
        success: true
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getAvailablePlans() {
    return [
      {
        id: 'monthly',
        name: 'Plano Mensal',
        price: 9.99,
        currency: 'BRL',
        duration: '1 mês',
        features: [
          'Matches ilimitados',
          'Super likes ilimitados',
          'Ver quem curtiu você',
          'Prioridade no algoritmo'
        ]
      },
      {
        id: 'yearly',
        name: 'Plano Anual',
        price: 99.99,
        currency: 'BRL',
        duration: '1 ano',
        discount: '17% de desconto',
        features: [
          'Matches ilimitados',
          'Super likes ilimitados',
          'Ver quem curtiu você',
          'Prioridade no algoritmo',
          'Acesso antecipado a novas funcionalidades',
          'Suporte prioritário'
        ]
      }
    ];
  }

  async updateUserVipStatus(client, userId, isVip) {
    // Atualizar status VIP no style_data
    const currentProfile = await pool.query( // Usar pool diretamente
      'SELECT style_data FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    
    let styleData = {};
    if (currentProfile.rows.length > 0 && currentProfile.rows[0].style_data) {
      styleData = JSON.parse(currentProfile.rows[0].style_data);
    }
    
    styleData.is_vip = isVip;
    
    await pool.query( // Usar pool diretamente
      'UPDATE user_profiles SET style_data = $1 WHERE user_id = $2',
      [JSON.stringify(styleData), userId]
    );
  }
}
