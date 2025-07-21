// server.js - Servidor simples para desenvolvimento do frontend
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const PORT = 8080;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.jsx': 'text/javascript',
  '.ts': 'text/javascript',
  '.tsx': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

const server = createServer((req, res) => {
  let filePath = join(__dirname, req.url === '/' ? 'index.html' : req.url);
  
  // Se não existir, tentar servir index.html (SPA routing)
  if (!existsSync(filePath)) {
    filePath = join(__dirname, 'index.html');
  }
  
  // Se ainda não existir, tentar na pasta src
  if (!existsSync(filePath) && req.url !== '/') {
    filePath = join(__dirname, 'src', req.url);
  }
  
  // Se ainda não existir, tentar na pasta public
  if (!existsSync(filePath) && req.url !== '/') {
    filePath = join(__dirname, 'public', req.url);
  }
  
  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end('Arquivo não encontrado');
    return;
  }
  
  try {
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      filePath = join(filePath, 'index.html');
    }
    
    const ext = extname(filePath);
    const contentType = mimeTypes[ext] || 'text/plain';
    
    const content = readFileSync(filePath);
    
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(content);
    
  } catch (error) {
    res.writeHead(500);
    res.end('Erro interno do servidor');
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Frontend servidor rodando em http://localhost:${PORT}`);
  console.log('📁 Servindo arquivos do diretório:', __dirname);
});