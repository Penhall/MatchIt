
import React from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { MOCK_PRODUCTS, MOCK_SPONSORED_BANNERS, NEON_COLORS } from '../constants';
import { Product } from '../types';
import { ShoppingBagIcon } from '../components/common/Icon';

interface ProductCardProps {
  product: Product;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-neon-orange group" glowColor="orange">
      <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-neon-orange truncate" title={product.name}>{product.name}</h3>
          <img src={product.brandLogoUrl} alt={`${product.name} brand`} className="w-8 h-8 rounded-full object-contain" />
        </div>
        <p className="text-xl font-bold text-neon-green mb-3">{product.price}</p>
        <Button variant="secondary" size="md" className="mt-auto w-full" onClick={() => alert(`Buy ${product.name}`)}>
          Buy Now
        </Button>
      </div>
    </Card>
  );
};

const VendorScreen: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 space-y-6 text-gray-200 animate-fadeIn">
      <div className="text-center">
        <ShoppingBagIcon className={`w-12 h-12 mx-auto ${NEON_COLORS.orange} mb-2`} />
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-orange to-yellow-400">
          Curated For You
        </h1>
        <p className="text-gray-400 mt-1">Exclusive drops and recommendations based on your style.</p>
      </div>

      {/* Sponsored Banners */}
      <div className="space-y-4">
        {MOCK_SPONSORED_BANNERS.map(banner => (
          <Card key={banner.id} className="p-0 overflow-hidden" glowColor={null}>
            <img src={banner.imageUrl} alt={banner.alt} className="w-full h-auto object-cover hover:opacity-90 transition-opacity" />
          </Card>
        ))}
      </div>

      {/* Product Recommendations */}
      <div>
        <h2 className="text-2xl font-semibold ${NEON_COLORS.green} mb-4">Recommended Products</h2>
        {MOCK_PRODUCTS.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {MOCK_PRODUCTS.map(product => (
              <ProductCardComponent key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-10">
            <p className="text-gray-400">No product recommendations available yet. Complete your style profile!</p>
          </Card>
        )}
      </div>
      
      <Card className="mt-8 text-center" glowColor="blue">
        <h2 className="text-xl font-semibold text-neon-blue mb-2">Explore More Brands</h2>
        <p className="text-gray-400 mb-4">Discover our partner stores and exclusive collections.</p>
        <Button variant="outline" glowEffect="blue">
            Visit Marketplace
        </Button>
      </Card>

    </div>
  );
};

export default VendorScreen;
