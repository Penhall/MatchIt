// services/tournament/tournamentApi.js - Serviço de API para torneios
import { API_BASE_URL } from '../config';
import { getAuthToken } from '../auth/authService';

class TournamentApi {
  
  // Headers padrão com autenticação
  async getHeaders() {
    const token = await getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }
  
  // Buscar categorias disponíveis
  async getCategories() {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_BASE_URL}/tournament/categories`, {
        method: 'GET',
        headers
      });
      
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          categories: data.categories
        };
      } else {
        throw new Error(data.error || 'Erro ao buscar categorias');
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Buscar imagens de uma categoria
  async getImagesByCategory(category) {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_BASE_URL}/tournament/images/${category}`, {
        method: 'GET',
        headers
      });
      
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          images: data.images
        };
      } else {
        throw new Error(data.error || 'Erro ao buscar imagens');
      }
    } catch (error) {
      console.error('Erro ao buscar imagens:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Iniciar novo torneio
  async startTournament(category) {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_BASE_URL}/tournament/start`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ category })
      });
      
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          tournament: data.tournament
        };
      } else {
        throw new Error(data.error || 'Erro ao iniciar torneio');
      }
    } catch (error) {
      console.error('Erro ao iniciar torneio:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Processar escolha no torneio
  async processChoice(sessionId, winnerImageId, loserImageId, choiceTimeMs) {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_BASE_URL}/tournament/choice`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sessionId,
          winnerImageId,
          loserImageId,
          choiceTimeMs
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          result: data.result
        };
      } else {
        throw new Error(data.error || 'Erro ao processar escolha');
      }
    } catch (error) {
      console.error('Erro ao processar escolha:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Buscar resultados do usuário
  async getUserResults() {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_BASE_URL}/tournament/results`, {
        method: 'GET',
        headers
      });
      
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          results: data.results
        };
      } else {
        throw new Error(data.error || 'Erro ao buscar resultados');
      }
    } catch (error) {
      console.error('Erro ao buscar resultados:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new TournamentApi();
