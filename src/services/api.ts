import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor para injetar token
api.interceptors.request.use((config: AxiosRequestConfig) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor para tratamento de erros
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default {
  get: <T>(endpoint: string) => api.get<T>(endpoint),
  post: <T>(endpoint: string, body: any) => api.post<T>(endpoint, body),
  put: <T>(endpoint: string, body: any) => api.put<T>(endpoint, body),
  delete: <T>(endpoint: string) => api.delete<T>(endpoint)
};
