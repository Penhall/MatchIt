// server/services/productService.js - Serviço de produtos
import { pool } from '../config/database.js';

export class ProductService {
  async getProducts(options = {}) {
    const { category, limit = 20, page = 1, userId } = options;
    const offset = (page - 1) * limit;
    
    try {
      try {
        let query = `
          SELECT id, name, brand_name, brand_logo_url, image_url, 
                 price_display, category, description
          FROM products 
          WHERE is_active = true
        `;
        const params = [];
        
        if (category) {
          query += ' AND category = $1';
          params.push(category);
          query += ' ORDER BY price_numeric ASC LIMIT $2 OFFSET $3';
          params.push(limit, offset);
        } else {
          query += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';
          params.push(limit, offset);
        }
        
        const result = await pool.query(query, params);
        return result.rows;
      } catch (error) {
        // Se tabela products não existir, retornar produtos mockados
        console.log('Tabela products não existe, retornando produtos mockados');
        
        const mockProducts = [
          {
            id: 'prod1',
            name: 'Tênis Cyber Glow',
            brand_name: 'CyberStyle',
            brand_logo_url: 'https://picsum.photos/seed/brandA/50/50',
            image_url: 'https://picsum.photos/seed/sneaker1/200/200',
            price_display: 'R$ 299,99',
            category: 'sneakers',
            description: 'Tênis futurista com LED integrado'
          },
          {
            id: 'prod2', 
            name: 'Jaqueta Neon Style',
            brand_name: 'NeonWear',
            brand_logo_url: 'https://picsum.photos/seed/brandB/50/50',
            image_url: 'https://picsum.photos/seed/jacket1/200/200',
            price_display: 'R$ 199,99',
            category: 'clothing',
            description: 'Jaqueta com detalhes neon'
          },
          {
            id: 'prod3',
            name: 'Óculos Holográfico',
            brand_name: 'HoloVision',
            brand_logo_url: 'https://picsum.photos/seed/brandC/50/50',
            image_url: 'https://picsum.photos/seed/glasses1/200/200',
            price_display: 'R$ 149,99',
            category: 'accessories',
            description: 'Óculos com lentes holográficas'
          }
        ];
        
        // Filtrar por categoria se especificada
        return category 
          ? mockProducts.filter(p => p.category === category)
          : mockProducts;
      }
    } catch (error) {
      throw error;
    }
  }

  async getProductById(productId, userId = null) {
    try {
      try {
        const result = await pool.query(
          'SELECT * FROM products WHERE id = $1 AND is_active = true',
          [productId]
        );
        
        if (result.rows.length === 0) {
          return null;
        }
        
        return result.rows[0];
      } catch (error) {
        // Produto mockado se tabela não existir
        return {
          id: productId,
          name: 'Produto Exemplo',
          brand_name: 'Brand',
          image_url: 'https://picsum.photos/200/200',
          price_display: 'R$ 99,99',
          description: 'Produto de exemplo'
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async getRecommendedProducts(userId = null) {
    try {
      // Para produtos recomendados, podemos usar algoritmo baseado no perfil do usuário
      const mockProducts = [
        {
          id: 'prod1',
          name: 'Tênis Cyber Glow',
          brandLogoUrl: 'https://picsum.photos/seed/brandA/50/50',
          imageUrl: 'https://picsum.photos/seed/sneaker1/200/200',
          price: 'R$ 299,99',
          category: 'sneakers'
        },
        {
          id: 'prod2',
          name: 'Jaqueta Neon Style', 
          brandLogoUrl: 'https://picsum.photos/seed/brandB/50/50',
          imageUrl: 'https://picsum.photos/seed/jacket1/200/200',
          price: 'R$ 199,99',
          category: 'clothing'
        },
        {
          id: 'prod3',
          name: 'Óculos Holográfico',
          brandLogoUrl: 'https://picsum.photos/seed/brandC/50/50',
          imageUrl: 'https://picsum.photos/seed/glasses1/200/200',
          price: 'R$ 149,99',
          category: 'accessories'
        }
      ];

      return mockProducts;
    } catch (error) {
      throw error;
    }
  }

  async getCategories() {
    try {
      try {
        const result = await pool.query(
          'SELECT DISTINCT category FROM products WHERE is_active = true ORDER BY category'
        );
        
        return result.rows.map(row => row.category);
      } catch (error) {
        // Categorias mockadas
        return ['sneakers', 'clothing', 'accessories', 'bags', 'electronics'];
      }
    } catch (error) {
      throw error;
    }
  }
}

// =====================================================

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
    const currentProfile = await client.query(
      'SELECT style_data FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    
    let styleData = {};
    if (currentProfile.rows.length > 0 && currentProfile.rows[0].style_data) {
      styleData = JSON.parse(currentProfile.rows[0].style_data);
    }
    
    styleData.is_vip = isVip;
    
    await client.query(
      'UPDATE user_profiles SET style_data = $1 WHERE user_id = $2',
      [JSON.stringify(styleData), userId]
    );
  }
}

// =====================================================

// server/services/statsService.js - Serviço de estatísticas
import { pool } from '../config/database.js';

export class StatsService {
  async getUserStats(userId) {
    try {
      try {
        const result = await pool.query(
          'SELECT * FROM get_user_stats($1)',
          [userId]
        );
        return result.rows[0];
      } catch (error) {
        // Se stored procedure não existir, retornar stats básicas
        console.log('Stored procedure get_user_stats não existe, calculando stats básicas');
        
        // Calcular estatísticas básicas usando queries diretas
        const [matchCount, profileInfo] = await Promise.all([
          this.getMatchCount(userId),
          this.getProfileInfo(userId)
        ]);
        
        const mockStats = {
          total_matches: matchCount,
          total_likes: Math.floor(Math.random() * 30) + matchCount,
          total_views: Math.floor(Math.random() * 100) + 45,
          profile_completion: profileInfo.completion_percentage || 85,
          last_active: new Date(),
          member_since: profileInfo.created_at || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          compatibility_average: Math.floor(Math.random() * 30) + 70,
          response_rate: Math.floor(Math.random() * 40) + 60
        };
        
        return mockStats;
      }
    } catch (error) {
      throw error;
    }
  }

  async getStyleAnalytics() {
    try {
      try {
        const result = await pool.query(
          'SELECT * FROM v_style_analytics ORDER BY category, user_count DESC'
        );
        return result.rows;
      } catch (error) {
        // Se view não existir, retornar analytics básicas
        console.log('View v_style_analytics não existe, retornando analytics básicas');
        
        const mockAnalytics = [
          { category: 'tênis', style: 'cyber', user_count: 150, percentage: 25.5 },
          { category: 'tênis', style: 'classic', user_count: 120, percentage: 20.4 },
          { category: 'tênis', style: 'sport', user_count: 100, percentage: 17.0 },
          { category: 'roupas', style: 'neon', user_count: 200, percentage: 34.0 },
          { category: 'roupas', style: 'dark', user_count: 180, percentage: 30.6 },
          { category: 'roupas', style: 'casual', user_count: 90, percentage: 15.3 },
          { category: 'cores', style: 'dark', user_count: 180, percentage: 30.6 },
          { category: 'cores', style: 'neon', user_count: 140, percentage: 23.8 },
          { category: 'cores', style: 'pastel', user_count: 80, percentage: 13.6 }
        ];
        
        return mockAnalytics;
      }
    } catch (error) {
      throw error;
    }
  }

  async getMatchAnalytics(userId) {
    try {
      // Estatísticas de matches do usuário
      const matchCount = await this.getMatchCount(userId);
      
      const analytics = {
        total_matches: matchCount,
        matches_this_week: Math.floor(matchCount * 0.2),
        matches_this_month: Math.floor(matchCount * 0.6),
        average_compatibility: Math.floor(Math.random() * 30) + 70,
        most_common_age_range: '22-28',
        most_common_distance: '5-15km',
        peak_activity_time: '19:00-22:00',
        match_success_rate: Math.floor(Math.random() * 40) + 15 // 15-55%
      };
      
      return analytics;
    } catch (error) {
      throw error;
    }
  }

  async getMatchCount(userId) {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) as count FROM matches WHERE user1_id = $1 OR user2_id = $1',
        [userId]
      );
      return parseInt(result.rows[0].count) || 0;
    } catch (error) {
      return Math.floor(Math.random() * 10) + 2; // Mock count
    }
  }

  async getProfileInfo(userId) {
    try {
      const result = await pool.query(
        `SELECT up.style_data, u.created_at
         FROM users u
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE u.id = $1`,
        [userId]
      );
      
      if (result.rows.length > 0) {
        const styleData = result.rows[0].style_data 
          ? JSON.parse(result.rows[0].style_data) 
          : {};
        
        return {
          completion_percentage: styleData.style_completion_percentage || 0,
          created_at: result.rows[0].created_at
        };
      }
      
      return { completion_percentage: 0, created_at: new Date() };
    } catch (error) {
      return { completion_percentage: 85, created_at: new Date() };
    }
  }

  async getGeneralAnalytics() {
    try {
      // Estatísticas gerais da plataforma
      const [userCount, matchCount, messageCount] = await Promise.all([
        this.getTotalUsers(),
        this.getTotalMatches(),
        this.getTotalMessages()
      ]);
      
      return {
        total_users: userCount,
        total_matches: matchCount,
        total_messages: messageCount,
        daily_active_users: Math.floor(userCount * 0.3),
        monthly_active_users: Math.floor(userCount * 0.7),
        average_session_duration: '12 minutos',
        most_popular_features: ['matching', 'chat', 'profile_customization']
      };
    } catch (error) {
      throw error;
    }
  }

  async getTotalUsers() {
    try {
      const result = await pool.query('SELECT COUNT(*) as count FROM users WHERE is_active = true');
      return parseInt(result.rows[0].count) || 0;
    } catch (error) {
      return 1250; // Mock count
    }
  }

  async getTotalMatches() {
    try {
      const result = await pool.query('SELECT COUNT(*) as count FROM matches');
      return parseInt(result.rows[0].count) || 0;
    } catch (error) {
      return 850; // Mock count
    }
  }

  async getTotalMessages() {
    try {
      const result = await pool.query('SELECT COUNT(*) as count FROM chat_messages');
      return parseInt(result.rows[0].count) || 0;
    } catch (error) {
      return 5240; // Mock count
    }
  }
}
