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
