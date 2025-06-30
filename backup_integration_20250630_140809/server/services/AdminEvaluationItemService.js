import EvaluationItem from '../models/EvaluationItem.js';

class AdminEvaluationItemService {
  static async createEvaluationItem(itemData) {
    try {
      const newItem = new EvaluationItem(itemData);
      await newItem.save();
      return newItem;
    } catch (error) {
      throw new Error(`Erro ao criar item de avaliação: ${error.message}`);
    }
  }

  static async getAllEvaluationItems(queryParams = {}) {
    try {
      const { page = 1, limit = 10, category, active } = queryParams;
      const query = {};

      if (category) {
        query.category = category;
      }
      if (active !== undefined) {
        query.active = active === 'true' || active === true;
      }

      const items = await EvaluationItem.find(query)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const count = await EvaluationItem.countDocuments(query);

      return {
        items,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalItems: count
      };
    } catch (error) {
      throw new Error(`Erro ao buscar itens de avaliação: ${error.message}`);
    }
  }

  static async getEvaluationItemById(id) {
    try {
      return await EvaluationItem.findById(id);
    } catch (error) {
      throw new Error(`Erro ao buscar item de avaliação: ${error.message}`);
    }
  }

  static async updateEvaluationItem(id, updateData) {
    try {
      updateData.updatedAt = new Date();
      return await EvaluationItem.findByIdAndUpdate(id, updateData, { new: true });
    } catch (error) {
      throw new Error(`Erro ao atualizar item de avaliação: ${error.message}`);
    }
  }

  static async deleteEvaluationItem(id) {
    try {
      return await EvaluationItem.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Erro ao deletar item de avaliação: ${error.message}`);
    }
  }
}

export default AdminEvaluationItemService;
