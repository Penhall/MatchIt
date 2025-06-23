import request from 'supertest';
import express from 'express';
import adminRouter from '../server/routes/admin.js';
import multer from 'multer';
import mongoose from 'mongoose';

// Mock do AdminShoppingItemService
jest.mock('../server/services/AdminShoppingItemService.js', () => ({
  createShoppingItem: jest.fn(),
  updateShoppingItem: jest.fn(),
  deleteShoppingItem: jest.fn()
}));

// Mock do multer para testes (mesmo do adminUpload.test.js)
jest.mock('multer', () => {
  const multer = () => ({
    single: () => (req, res, next) => {
      if (req.headers['invalid-file']) {
        return next(new Error('Apenas arquivos de imagem são permitidos!'));
      }
      if (req.headers['large-file']) {
        const err = new multer.MulterError('LIMIT_FILE_SIZE');
        err.code = 'LIMIT_FILE_SIZE';
        return next(err);
      }
      req.file = {
        filename: 'test-image.jpg',
        originalname: 'test-image.jpg',
        mimetype: 'image/jpeg',
        size: 1024
      };
      next();
    }
  });
  multer.MulterError = class MulterError extends Error {
    constructor(code) {
      super();
      this.code = code;
    }
  };
  return multer;
});

// Configurar app de teste
const app = express();
app.use(express.json());
app.use('/admin', adminRouter);

// Banco de dados em memória para testes
beforeAll(async () => {
  await mongoose.connect('mongodb://localhost:27017/testDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('POST /admin/shopping-items', () => {
  it('deve criar item com imagem válida e retornar 201', async () => {
    const mockItem = {
      _id: '607f1f77bcf86cd799439011',
      name: 'Camiseta Teste',
      price: 99.90,
      category: 'camisetas',
      imageUrl: '/uploads/test-image.jpg'
    };
    
    require('../server/services/AdminShoppingItemService.js').createShoppingItem.mockResolvedValue(mockItem);

    const res = await request(app)
      .post('/admin/shopping-items')
      .field('name', 'Camiseta Teste')
      .field('price', '99.90')
      .field('category', 'camisetas')
      .attach('image', Buffer.from('fake image data'), 'test.jpg');

    expect(res.status).toBe(201);
    expect(res.body).toEqual(mockItem);
    expect(res.body.imageUrl).toMatch(/^\/uploads\/.+/);
  });

  it('deve retornar 400 para tipo de arquivo inválido', async () => {
    const res = await request(app)
      .post('/admin/shopping-items')
      .set('invalid-file', 'true')
      .field('name', 'Camiseta Teste')
      .field('price', '99.90')
      .field('category', 'camisetas');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Apenas arquivos de imagem/);
  });

  it('deve retornar 400 para preço inválido', async () => {
    const res = await request(app)
      .post('/admin/shopping-items')
      .field('name', 'Camiseta Teste')
      .field('price', 'invalid-price')
      .field('category', 'camisetas');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Preço inválido/);
  });
});

describe('PUT /admin/shopping-items/:id', () => {
  it('deve atualizar item com nova imagem e retornar 200', async () => {
    const mockItem = {
      _id: '607f1f77bcf86cd799439011',
      name: 'Camiseta Atualizada',
      price: 109.90,
      category: 'camisetas',
      imageUrl: '/uploads/new-test-image.jpg'
    };
    
    require('../server/services/AdminShoppingItemService.js').updateShoppingItem.mockResolvedValue(mockItem);

    const res = await request(app)
      .put('/admin/shopping-items/607f1f77bcf86cd799439011')
      .field('name', 'Camiseta Atualizada')
      .field('price', '109.90')
      .field('category', 'camisetas')
      .attach('image', Buffer.from('fake image data'), 'test.jpg');

    expect(res.status).toBe(200);
    expect(res.body.imageUrl).toMatch(/^\/uploads\/.+/);
  });

  it('deve retornar 404 para ID inválido', async () => {
    require('../server/services/AdminShoppingItemService.js').updateShoppingItem.mockResolvedValue(null);

    const res = await request(app)
      .put('/admin/shopping-items/invalid-id')
      .field('name', 'Camiseta Teste')
      .field('price', '99.90')
      .field('category', 'camisetas');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/não encontrado para atualização/);
  });
});

describe('DELETE /admin/shopping-items/:id', () => {
  it('deve remover item e retornar 200', async () => {
    const mockDeletedItem = {
      _id: '607f1f77bcf86cd799439011',
      name: 'Camiseta Removida',
      imageUrl: '/uploads/test-image.jpg'
    };
    
    require('../server/services/AdminShoppingItemService.js').deleteShoppingItem.mockResolvedValue(mockDeletedItem);

    const res = await request(app)
      .delete('/admin/shopping-items/607f1f77bcf86cd799439011');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockDeletedItem);
  });

  it('deve verificar remoção da imagem associada', async () => {
    const fs = require('fs');
    jest.mock('fs');
    
    const mockDeletedItem = {
      _id: '607f1f77bcf86cd799439011',
      name: 'Camiseta Removida',
      imageUrl: '/uploads/test-image.jpg'
    };
    
    require('../server/services/AdminShoppingItemService.js').deleteShoppingItem.mockImplementation((id) => {
      fs.unlinkSync(`./public${mockDeletedItem.imageUrl}`);
      return Promise.resolve(mockDeletedItem);
    });

    const res = await request(app)
      .delete('/admin/shopping-items/607f1f77bcf86cd799439011');

    expect(res.status).toBe(200);
    expect(fs.unlinkSync).toHaveBeenCalledWith('./public/uploads/test-image.jpg');
  });

  it('deve retornar 404 para ID inválido', async () => {
    require('../server/services/AdminShoppingItemService.js').deleteShoppingItem.mockResolvedValue(null);

    const res = await request(app)
      .delete('/admin/shopping-items/invalid-id');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/não encontrado para remoção/);
  });
});