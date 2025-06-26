// services/config.js - Configuração da API
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api'  // Desenvolvimento
  : 'https://your-production-api.com/api';  // Produção

export const API_TIMEOUT = 10000; // 10 segundos

export const API_CONFIG = {
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
};
