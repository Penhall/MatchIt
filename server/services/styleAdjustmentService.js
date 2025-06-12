// server/services/styleAdjustmentService.js
const AdminEvaluationItemService = require('./AdminEvaluationItemService'); // Usar o serviço existente para buscar itens
const { StyleCategory } = require('../../types'); // Supondo que types.ts seja compilado para JS e acessível

class StyleAdjustmentService {
  /**
   * Busca EvaluationItems de uma categoria e os formata como StyleAdjustmentQuestions (pares de itens).
   * @param {object} queryParams - Parâmetros da query.
   * @param {string} queryParams.category - A StyleCategory para buscar perguntas.
   * @param {number} [queryParams.limit=10] - O número de perguntas (pares) a retornar.
   * @returns {Promise<Array<StyleAdjustmentQuestion>>}
   */
  static async getStyleAdjustmentQuestions(queryParams) {
    const { category, limit = 10 } = queryParams;

    if (!category || !Object.values(StyleCategory).includes(category)) {
      throw new Error(`Categoria inválida ou não fornecida: ${category}`);
    }

    // Buscar um número suficiente de EvaluationItems para formar os pares.
    // Precisamos de 2 * limit itens para formar 'limit' perguntas.
    // Adicionamos uma margem caso alguns itens não possam ser pareados ou para variedade.
    const itemsToFetch = limit * 2 + 5; // Um pouco mais para garantir variedade e evitar falta de pares

    try {
      const evaluationItemsResult = await AdminEvaluationItemService.getAllEvaluationItems({
        category: category,
        active: true, // Apenas itens ativos
        limit: itemsToFetch, // Buscar um número maior para ter flexibilidade no pareamento
        page: 1 // Começar da primeira página, podemos adicionar aleatoriedade depois
      });

      let availableItems = evaluationItemsResult.items;

      // Embaralhar os itens para aleatoriedade nos pares
      availableItems.sort(() => 0.5 - Math.random());

      const questions = [];
      const usedItemIds = new Set(); // Para garantir que um item não seja usado em mais de uma opção na mesma pergunta (embora o pareamento já evite isso)

      for (let i = 0; i < availableItems.length - 1 && questions.length < limit; i += 2) {
        const item1 = availableItems[i];
        const item2 = availableItems[i + 1];

        // Garantir que temos dois itens distintos
        if (item1 && item2 && item1.id !== item2.id) {
          // O questionText pode ser padronizado ou vir de algum lugar
          const questionText = `Qual destes representa melhor seu estilo em ${category}?`;
          
          // O ID da pergunta pode ser gerado ou ser uma combinação dos IDs dos itens
          const questionId = `q_${category}_${item1.id}_vs_${item2.id}`;

          questions.push({
            id: questionId,
            category: category, // A categoria da pergunta
            questionText: questionText,
            option1: {
              id: item1.id, // ID do EvaluationItem
              imageUrl: item1.imageUrl,
              label: item1.name 
            },
            option2: {
              id: item2.id, // ID do EvaluationItem
              imageUrl: item2.imageUrl,
              label: item2.name
            }
          });
          usedItemIds.add(item1.id);
          usedItemIds.add(item2.id);
        }
      }
      
      if (questions.length === 0 && availableItems.length > 0) {
        // Caso especial: não foi possível formar pares mas há itens.
        // Poderia retornar um erro ou uma pergunta com uma única opção (não ideal para o formato atual)
        console.warn(`Não foi possível formar pares suficientes para a categoria ${category}. Itens disponíveis: ${availableItems.length}`);
      }

      return questions;
    } catch (error) {
      console.error(`Erro ao buscar perguntas de ajuste de estilo para ${category}:`, error);
      throw new Error(`Erro ao buscar perguntas de ajuste de estilo: ${error.message}`);
    }
  }
}

module.exports = StyleAdjustmentService;
