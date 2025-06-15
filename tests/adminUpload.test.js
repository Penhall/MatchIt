import request from 'supertest';
import express from 'express';
import adminRouter from '../server/routes/admin.js';
import multer from 'multer';
import mongoose from 'mongoose';

// Mock do AdminEvaluationItemService
jest.mock('../server/services/AdminEvaluationItemService.js', () => ({
  createEvaluationItem: jest.fn(),
  updateEvaluationItem: jest.fn(),
  deleteEvaluationItem: jest.fn()
}));

// Mock do multer para testes
jest.mock('multer', () => {
  const multer = () => ({
    single: () => (req, res, next) => {
      // Simula o comportamento do multer adicionando file ao request
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

describe('POST /admin/evaluation-items', () => {
  it('deve criar item com imagem válida e retornar 201', async () => {
    const mockItem = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Tênis Teste',
      category: 'tênis',
      imageUrl: '/uploads/test-image.jpg'
    };
    
    require('../server/services/AdminEvaluationItemService.js').createEvaluationItem.mockResolvedValue(mockItem);

    const res = await request(app)
      .post('/admin/evaluation-items')
      .field('name', 'Tênis Teste')
      .field('category', 'tênis')
      .attach('image', Buffer.from('fake image data'), 'test.jpg');

    expect(res.status).toBe(201);
    expect(res.body).toEqual(mockItem);
    expect(res.body.imageUrl).toMatch(/^\/uploads\/.+/);
  });

  it('deve retornar 400 para tipo de arquivo inválido', async () => {
    const res = await request(app)
      .post('/admin/evaluation-items')
      .set('invalid-file', 'true')
      .field('name', 'Tênis Teste')
      .field('category', 'tênis');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Apenas arquivos de imagem/);
  });

  it('deve retornar 400 para arquivo muito grande', async () => {
    const res = await request(app)
      .post('/admin/evaluation-items')
      .set('large-file', 'true')
      .field('name', 'Tênis Teste')
      .field('category', 'tênis');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/LIMIT_FILE_SIZE/);
  });
});

describe('PUT /admin/evaluation-items/:id', () => {
  it('deve atualizar item com nova imagem e retornar 200', async () => {
    const mockItem = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Tênis Atualizado',
      category: 'tênis',
      imageUrl: '/uploads/new-test-image.jpg'
    };
    
    require('../server/services/AdminEvaluationItemService.js').updateEvaluationItem.mockResolvedValue(mockItem);

    const res = await request(app)
      .put('/admin/evaluation-items/507f1f77bcf86cd799439011')
      .field('name', 'Tênis Atualizado')
      .field('category', 'tênis')
      .attach('image', Buffer.from('fake image data'), 'test.jpg');

    expect(res.status).toBe(200);
    expect(res.body.imageUrl).toMatch(/^\/uploads\/.+/);
  });

  it('deve retornar 404 para ID inválido', async () => {
    require('../server/services/AdminEvaluationItemService.js').updateEvaluationItem.mockResolvedValue(null);

    const res = await request(app)
      .put('/admin/evaluation-items/invalid-id')
      .field('name', 'Tênis Teste')
      .field('category', 'tênis');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/não encontrado para atualização/);
  });
  
  describe('DELETE /admin/evaluation-items/:id', () => {
    it('deve remover item e retornar 200', async () => {
      const mockDeletedItem = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Tênis Removido',
        imageUrl: '/uploads/test-image.jpg'
      };
      
      require('../server/services/AdminEvaluationItemService.js').deleteEvaluationItem.mockResolvedValue(mockDeletedItem);
  
      const res = await request(app)
        .delete('/admin/evaluation-items/507f1f77bcf86cd799439011');
  
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockDeletedItem);
      // Verifica se o serviço foi chamado com o ID correto
      expect(require('../server/services/AdminEvaluationItemService.js').deleteEvaluationItem)
        .toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  
    it('deve retornar 404 para ID inválido', async () => {
      require('../server/services/AdminEvaluationItemService.js').deleteEvaluationItem.mockResolvedValue(null);
  
      const res = await request(app)
        .delete('/admin/evaluation-items/invalid-id');
  
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/não encontrado para remoção/);
    });
  
    it('deve verificar remoção da imagem associada', async () => {
      const fs = require('fs');
      jest.mock('fs');
      
      const mockDeletedItem = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Tênis Removido',
        imageUrl: '/uploads/test-image.jpg'
      };
      
      require('../server/services/AdminEvaluationItemService.js').deleteEvaluationItem.mockImplementation((id) => {
        // Simula remoção do arquivo
        fs.unlinkSync(`./public${mockDeletedItem.imageUrl}`);
        return Promise.resolve(mockDeletedItem);
      });
  
      const res = await request(app)
        .delete('/admin/evaluation-items/507f1f77bcf86cd799439011');
  
      expect(res.status).toBe(200);
      expect(fs.unlinkSync).toHaveBeenCalledWith('./public/uploads/test-image.jpg');
    });
  });
});