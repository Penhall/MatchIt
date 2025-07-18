import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import mongoose from 'mongoose';
import EvaluationItem from '../../../server/models/EvaluationItem';

before(async () => {
  await mongoose.connect('mongodb://localhost:27017/testdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

describe('BaseModel Unit Tests', () => {
  it('should initialize with default values', () => {
    const model = new EvaluationItem({
      name: 'Test Item',
      category: 'tênis',
      imageUrl: 'http://example.com/image.jpg'
    });
    expect(model).to.have.property('name', 'Test Item');
    expect(model).to.have.property('category', 'tênis');
    expect(model).to.have.property('imageUrl', 'http://example.com/image.jpg');
    expect(model).to.have.property('active', true);
    expect(model).to.have.property('createdAt').that.is.instanceOf(Date);
    expect(model).to.have.property('updatedAt').that.is.instanceOf(Date);
  });

  it('should validate required fields', async () => {
    const model = new EvaluationItem({});
    try {
      await model.validate();
      throw new Error('Validation should have failed');
    } catch (err) {
      expect(err.errors.name).to.exist;
      expect(err.errors.category).to.exist;
      expect(err.errors.imageUrl).to.exist;
    }
  });
});
