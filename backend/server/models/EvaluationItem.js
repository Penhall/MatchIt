import mongoose from 'mongoose';

/**
 * @typedef {Object} EvaluationItem
 * @property {string} name - Nome do item de avaliação
 * @property {string} [description] - Descrição opcional do item
 * @property {'tênis'|'roupa'|'hobby'} category - Categoria do item
 * @property {string} imageUrl - URL da imagem do item
 * @property {string[]} [tags] - Tags associadas ao item
 * @property {boolean} [active=true] - Status de ativação do item
 * @property {Date} [createdAt] - Data de criação
 * @property {Date} [updatedAt] - Data de atualização
 */
const EvaluationItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  category: {
    type: String,
    enum: ['tênis', 'roupa', 'hobby'],
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  tags: {
    type: [String],
    default: []
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('EvaluationItem', EvaluationItemSchema);
