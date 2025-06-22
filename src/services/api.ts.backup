// src/services/api.ts - API service corrigido para porta 3001
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

// ✅ CORREÇÃO: Backend está rodando na porta 3001
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

console.log('🔧 API configurada para:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
    console.log('🎯 Full URL:', `${config.baseURL}${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error: AxiosError) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      fullUrl: error.config ? `${error.config.baseURL}${error.config.url}` : 'N/A'
    });
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔴 CONEXÃO RECUSADA - Verifique se backend está rodando na porta 3001');
    } else if (error.response?.status === 401) {
      console.warn('🔐 Token expirado - fazendo logout');
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

const apiService = {
  get: <T>(endpoint: string) => api.get<T>(endpoint),
  post: <T>(endpoint: string, body: any) => api.post<T>(endpoint, body),
  put: <T>(endpoint: string, body: any) => api.put<T>(endpoint, body),
  delete: <T>(endpoint: string) => api.delete<T>(endpoint),
  
  testConnection: async () => {
    try {
      const response = await api.get('/health');
      console.log('✅ Teste de conectividade OK:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Teste de conectividade falhou:', error);
      return { success: false, error };
    }
  }
};

export default apiService;
export { API_BASE_URL };
