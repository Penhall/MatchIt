const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...options.headers
  });

  const token = localStorage.getItem('token');
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return { success: false };
    }

    const data = await response.json();
    return { success: response.ok, data, error: !response.ok ? data.error : undefined };
  } catch (error) {
    console.error('API Error:', error);
    return { 
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to server'
      }
    };
  }
}

export default {
  get: <T>(endpoint: string) => apiFetch<T>(endpoint),
  post: <T>(endpoint: string, body: any) => apiFetch<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body)
  }),
  put: <T>(endpoint: string, body: any) => apiFetch<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body)
  }),
  delete: <T>(endpoint: string) => apiFetch<T>(endpoint, {
    method: 'DELETE'
  })
};
