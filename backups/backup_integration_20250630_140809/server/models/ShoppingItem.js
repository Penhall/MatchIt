// server/models/ShoppingItem.js - Modelo corrigido para itens de compras

class ShoppingItem {
  constructor(data = {}) {
    this.id = data.id || null;
    this.user_id = data.user_id;
    this.name = data.name;
    this.category = data.category;
    this.brand = data.brand || null;
    this.price = data.price || null;
    this.currency = data.currency || 'BRL';
    this.image_url = data.image_url || null;
    this.purchase_url = data.purchase_url || null;
    this.description = data.description || null;
    this.tags = Array.isArray(data.tags) ? data.tags : [];
    this.status = data.status || 'active';
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
  }

  validate() {
    const errors = [];
    if (!this.user_id) errors.push('user_id é obrigatório');
    if (!this.name?.trim()) errors.push('nome é obrigatório');
    if (!this.category?.trim()) errors.push('categoria é obrigatória');
    return { isValid: errors.length === 0, errors };
  }

  toDatabase() {
    return {
      id: this.id,
      user_id: this.user_id,
      name: this.name?.trim(),
      category: this.category?.trim(),
      brand: this.brand?.trim() || null,
      price: this.price ? parseFloat(this.price) : null,
      currency: this.currency,
      image_url: this.image_url?.trim() || null,
      purchase_url: this.purchase_url?.trim() || null,
      description: this.description?.trim() || null,
      tags: JSON.stringify(this.tags),
      status: this.status,
      updated_at: new Date().toISOString()
    };
  }

  static fromDatabase(dbRow) {
    if (!dbRow) return null;
    
    let tags = [];
    if (dbRow.tags) {
      try {
        tags = typeof dbRow.tags === 'string' ? JSON.parse(dbRow.tags) : dbRow.tags;
      } catch (e) {
        tags = [];
      }
    }

    return new ShoppingItem({
      ...dbRow,
      tags
    });
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.user_id,
      name: this.name,
      category: this.category,
      brand: this.brand,
      price: this.price,
      currency: this.currency,
      imageUrl: this.image_url,
      purchaseUrl: this.purchase_url,
      description: this.description,
      tags: this.tags,
      status: this.status,
      createdAt: this.created_at,
      updatedAt: this.updated_at
    };
  }
}

// Exports corrigidos
export default ShoppingItem;
export { ShoppingItem };

export const SHOPPING_CATEGORIES = [
  'clothing', 'shoes', 'accessories', 'bags', 'jewelry',
  'beauty', 'fragrances', 'watches', 'sunglasses', 'home',
  'electronics', 'books', 'sports', 'other'
];

export const SHOPPING_STATUSES = ['active', 'inactive', 'deleted'];
