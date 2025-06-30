import { useState } from 'react';

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const request = async (url: string, options: RequestInit = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Request Interceptor
      const token = localStorage.getItem('token');
      const headers = new Headers(options.headers || {});
      
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      
      // Configuração padrão com timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Response Interceptor
      if (!response.ok) {
        if (response.status === 401) {
          // Lógica de logout
          localStorage.removeItem('token');
          window.location.reload();
        }
        
        const errorData = await response.json().catch(() => ({
          message: `Request failed with status ${response.status}`
        }));
        
        throw new Error(errorData.message || 'Request failed');
      }

      return response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(new Error(message));
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Métodos utilitários para GET e POST
  const get = (url: string, options: RequestInit = {}) => {
    return request(url, { ...options, method: 'GET' });
  };

  const post = (url: string, body: any, options: RequestInit = {}) => {
    return request(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      body: JSON.stringify(body)
    });
  };

  return { request, get, post, loading, error };
};

export default useApi;
