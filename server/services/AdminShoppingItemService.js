const ShoppingItem = require('../models/ShoppingItem');

class AdminShoppingItemService {
  static async createShoppingItem(itemData) {
    try {
      const newItem = new ShoppingItem(itemData);
      await newItem.save();
      return newItem;
    } catch (error) {
      throw new Error(`Erro ao criar item do shopping: ${error.message}`);
    }
  }

  static async getAllShoppingItems(queryParams = {}) {
    try {
      const { page = 1, limit = 10, category, brand, active } = queryParams;
      const query = {};

      if (category) {
        query.category = category;
      }
      if (brand) {
        query.brand = brand;
      }
      if (active !== undefined) {
        query.active = active === 'true' || active === true;
      }

      const items = await ShoppingItem.find(query)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const count = await ShoppingItem.countDocuments(query);

      return {
        items,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalItems: count
      };
    } catch (error) {
      throw new Error(`Erro ao buscar itens do shopping: ${error.message}`);
    }
  }

  static async getShoppingItemById(id) {
    try {
      return await ShoppingItem.findById(id);
    } catch (error) {
      throw new Error(`Erro ao buscar item do shopping: ${error.message}`);
    }
  }

  static async updateShoppingItem(id, updateData) {
    try {
      updateData.updatedAt = new Date();
      return await ShoppingItem.findByIdAndUpdate(id, updateData, { new: true });
    } catch (error) {
      throw new Error(`Erro ao atualizar item do shopping: ${error.message}`);
    }
  }

  static async deleteShoppingItem(id) {
    try {
      return await ShoppingItem.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Erro ao deletar item do shopping: ${error.message}`);
    }
  }

  static async getItemsByTargetCriteria(criteria) {
    try {
      return await ShoppingItem.find({
        targetProfileCriteria: { $elemMatch: criteria }
      });
    } catch (error) {
      throw new Error(`Erro ao buscar itens por critérios: ${error.message}`);
    }
  }
}

module.exports = AdminShoppingItemService;
