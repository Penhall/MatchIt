import axiosLib from 'axios'; // Renomeado para axiosLib para clareza
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'; // Importando apenas tipos
import { useAuth } from '../context/AuthContext';

// Determina qual objeto axios usar (padrão ou exportação direta)
const axios = axiosLib.default || axiosLib;

const useApi = (): AxiosInstance => {
  const { isAuthenticated } = useAuth();
  const token = isAuthenticated ? localStorage.getItem('matchit_token') : null;

  const instance: AxiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || '/api',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  instance.interceptors.request.use((config: AxiosRequestConfig) => {
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('matchit_token');
        localStorage.removeItem('matchit_auth');
        window.location.reload();
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export default useApi;
