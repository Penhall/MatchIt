const mongoose = require('mongoose');

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

module.exports = mongoose.model('EvaluationItem', EvaluationItemSchema);
