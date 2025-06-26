// hooks/tournament/useTournament.js - Hook para gerenciar estado do torneio
import { useState, useEffect, useCallback } from 'react';
import tournamentApi from '../../services/tournament/tournamentApi';

export const useTournament = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTournament, setCurrentTournament] = useState(null);
  const [tournamentResults, setTournamentResults] = useState([]);

  // Carregar categorias
  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await tournamentApi.getCategories();
      if (result.success) {
        setCategories(result.categories);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  }, []);

  // Iniciar torneio
  const startTournament = useCallback(async (category) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await tournamentApi.startTournament(category);
      if (result.success) {
        setCurrentTournament(result.tournament);
        return result.tournament;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError('Erro ao iniciar torneio');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Processar escolha
  const processChoice = useCallback(async (winnerImageId, loserImageId, choiceTimeMs) => {
    if (!currentTournament) {
      setError('Nenhum torneio ativo');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await tournamentApi.processChoice(
        currentTournament.sessionId,
        winnerImageId,
        loserImageId,
        choiceTimeMs
      );
      
      if (result.success) {
        if (result.result.isComplete) {
          // Torneio completado
          setCurrentTournament(null);
          loadUserResults(); // Recarregar resultados
        } else {
          // Atualizar torneio em andamento
          setCurrentTournament(prev => ({
            ...prev,
            currentRound: result.result.currentRound,
            currentMatches: result.result.currentMatches
          }));
        }
        return result.result;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError('Erro ao processar escolha');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentTournament]);

  // Carregar resultados do usuário
  const loadUserResults = useCallback(async () => {
    try {
      const result = await tournamentApi.getUserResults();
      if (result.success) {
        setTournamentResults(result.results);
      }
    } catch (err) {
      console.error('Erro ao carregar resultados:', err);
    }
  }, []);

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Abandonar torneio atual
  const abandonTournament = useCallback(() => {
    setCurrentTournament(null);
    setError(null);
  }, []);

  // Carregar categorias ao montar o hook
  useEffect(() => {
    loadCategories();
    loadUserResults();
  }, [loadCategories, loadUserResults]);

  return {
    // Estado
    categories,
    loading,
    error,
    currentTournament,
    tournamentResults,
    
    // Ações
    loadCategories,
    startTournament,
    processChoice,
    loadUserResults,
    clearError,
    abandonTournament,
    
    // Estados computados
    isInTournament: !!currentTournament,
    hasCompletedTournaments: tournamentResults.length > 0
  };
};
