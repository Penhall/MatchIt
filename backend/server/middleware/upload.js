import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Salvar uploads em uma pasta 'uploads' na raiz do servidor
    // Certifique-se de que esta pasta exista ou crie-a
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    // Gerar um nome de arquivo único para evitar sobrescrever arquivos existentes
    const randomName = crypto.randomBytes(16).toString('hex');
    cb(null, randomName + path.extname(file.originalname));
  }
});

// Filtro de tipo de arquivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Erro: Apenas arquivos de imagem (jpeg, jpg, png, gif) são permitidos!'));
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // Limite de 5MB por arquivo
  },
  fileFilter: fileFilter
});

export default upload;
