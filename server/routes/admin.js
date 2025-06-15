import express from 'express';
const router = express.Router();
import AdminEvaluationItemService from '../services/AdminEvaluationItemService.js';
import AdminShoppingItemService from '../services/AdminShoppingItemService.js';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/admin.js';
import upload from '../middleware/upload.js'; // Importar o middleware de upload

// Rotas para EvaluationItem
router.post('/evaluation-items', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const itemData = { ...req.body };
    if (req.file) {
      itemData.imageUrl = `/uploads/${req.file.filename}`; // Salvar o caminho relativo da imagem
    }
    const item = await AdminEvaluationItemService.createEvaluationItem(itemData);
    res.status(201).json(item);
  } catch (error) {
    // Se houver erro do multer (ex: tipo de arquivo inválido), ele será capturado aqui
    if (error instanceof multer.MulterError) {
        return res.status(400).json({ error: error.message });
    } else if (error.message.includes('Apenas arquivos de imagem')) { // Erro do nosso filtro customizado
        return res.status(400).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

router.get('/evaluation-items', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page, limit, category, active } = req.query;
    const items = await AdminEvaluationItemService.getAllEvaluationItems({ page, limit, category, active });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/evaluation-items/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const item = await AdminEvaluationItemService.getEvaluationItemById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item de avaliação não encontrado' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/evaluation-items/:id', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const itemData = { ...req.body };
    if (req.file) {
      itemData.imageUrl = `/uploads/${req.file.filename}`;
      // Aqui você pode adicionar lógica para deletar a imagem antiga se necessário
    }
    const item = await AdminEvaluationItemService.updateEvaluationItem(req.params.id, itemData);
    if (!item) {
      return res.status(404).json({ error: 'Item de avaliação não encontrado para atualização' });
    }
    res.json(item);
  } catch (error) {
    if (error instanceof multer.MulterError) {
        return res.status(400).json({ error: error.message });
    } else if (error.message.includes('Apenas arquivos de imagem')) {
        return res.status(400).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

router.delete('/evaluation-items/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const item = await AdminEvaluationItemService.deleteEvaluationItem(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item de avaliação não encontrado para deletar' });
    }
    res.json({ message: 'Item de avaliação deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rotas para ShoppingItem
router.post('/shopping-items', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const itemData = { ...req.body };
    if (req.file) {
      itemData.imageUrl = `/uploads/${req.file.filename}`;
    }
    const item = await AdminShoppingItemService.createShoppingItem(itemData);
    res.status(201).json(item);
  } catch (error) {
    if (error instanceof multer.MulterError) {
        return res.status(400).json({ error: error.message });
    } else if (error.message.includes('Apenas arquivos de imagem')) {
        return res.status(400).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

router.get('/shopping-items', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page, limit, category, brand, active } = req.query;
    const items = await AdminShoppingItemService.getAllShoppingItems({ page, limit, category, brand, active });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/shopping-items/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const item = await AdminShoppingItemService.getShoppingItemById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item do shopping não encontrado' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/shopping-items/:id', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const itemData = { ...req.body };
    if (req.file) {
      itemData.imageUrl = `/uploads/${req.file.filename}`;
      // Aqui você pode adicionar lógica para deletar a imagem antiga se necessário
    }
    const item = await AdminShoppingItemService.updateShoppingItem(req.params.id, itemData);
    if (!item) {
      return res.status(404).json({ error: 'Item do shopping não encontrado para atualização' });
    }
    res.json(item);
  } catch (error) {
    if (error instanceof multer.MulterError) {
        return res.status(400).json({ error: error.message });
    } else if (error.message.includes('Apenas arquivos de imagem')) {
        return res.status(400).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

router.delete('/shopping-items/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const item = await AdminShoppingItemService.deleteShoppingItem(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item do shopping não encontrado para deletar' });
    }
    res.json({ message: 'Item do shopping deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
