// server/routes/products.js - Rotas de produtos (APENAS PRODUCTS)
import express from 'express';

const router = express.Router();

// GET / - Listar produtos
router.get('/', async (req, res) => {
  try {
    const { category, limit = 20 } = req.query;
    
    // Resposta mockada por enquanto
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
    let filteredProducts = mockProducts;
    if (category) {
      filteredProducts = mockProducts.filter(p => p.category === category);
    }
    
    // Limitar resultados
    const limitedProducts = filteredProducts.slice(0, parseInt(limit));
    
    res.json(limitedProducts);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
});

// GET /recommended - Produtos recomendados
router.get('/recommended', async (req, res) => {
  try {
    const mockRecommendedProducts = [
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
      }
    ];

    res.json(mockRecommendedProducts);
  } catch (error) {
    console.error('Erro ao buscar produtos recomendados:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar produtos' 
    });
  }
});

// GET /:productId - Obter produto específico
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Resposta mockada
    const mockProduct = {
      id: productId,
      name: 'Produto Exemplo',
      brand_name: 'Brand',
      image_url: 'https://picsum.photos/200/200',
      price_display: 'R$ 99,99',
      description: 'Produto de exemplo'
    };
    
    res.json(mockProduct);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
});

export default router;