// src/screens/TournamentScreen.tsx - Interface de torneio 2x2 gamificada completa
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { useTournament } from '../hooks/useTournament';
import './TournamentScreen.css';

// =====================================================
// TYPES AND INTERFACES
// =====================================================

interface TournamentImage {
  id: number;
  category: string;
  imageUrl: string;
  thumbnailUrl?: string;
  title: string;
  description?: string;
  tags: string[];
}

interface TournamentMatchup {
  id: string;
  round: number;
  position: number;
  image1: TournamentImage;
  image2: TournamentImage;
  winner?: number;
  sessionId: string;
}

interface TournamentSession {
  id: string;
  userId: number;
  category: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  currentRound: number;
  totalRounds: number;
  progressPercentage: number;
  startedAt: string;
  currentMatchup?: TournamentMatchup;
  stats: {
    totalChoices: number;
    averageChoiceTime: number;
    favoriteImage?: TournamentImage;
  };
}

// =====================================================
// COMPONENT
// =====================================================

const TournamentScreen: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const api = useApi();
  const { currentSession, startTournament, loading } = useTournament();

  // Estados locais
  const [session, setSession] = useState<TournamentSession | null>(null);
  const [currentMatchup, setCurrentMatchup] = useState<TournamentMatchup | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [choiceAnimation, setChoiceAnimation] = useState<'left' | 'right' | null>(null);
  const [roundTransition, setRoundTransition] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [choiceStartTime, setChoiceStartTime] = useState<number>(Date.now());

  // Stats da sessão atual
  const [sessionStats, setSessionStats] = useState({
    totalChoices: 0,
    averageChoiceTime: 0,
    fastestChoice: Infinity,
    slowestChoice: 0
  });

  // =====================================================
  // EFFECTS
  // =====================================================

  // Inicializar ou carregar torneio
  useEffect(() => {
    if (!category || !user) return;

    const initializeTournament = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Verificar se já existe sessão ativa para esta categoria
        const activeSessionResponse = await api.get(`/tournament/active/${category}`);
        
        if (activeSessionResponse?.data?.session) {
          // Continuar sessão existente
          const existingSession = activeSessionResponse.data.session;
          setSession(existingSession);
          
          if (existingSession.status === 'completed') {
            // Sessão já completada, ir para resultados
            navigate(`/tournament/result/${existingSession.id}`);
            return;
          }
          
          // Carregar matchup atual
          await loadCurrentMatchup(existingSession.id);
        } else {
          // Iniciar nova sessão
          const newSession = await startTournament(category);
          if (newSession) {
            setSession(newSession);
            await loadCurrentMatchup(newSession.id);
          } else {
            setError('Falha ao iniciar torneio');
          }
        }
      } catch (err: any) {
        console.error('Erro ao inicializar torneio:', err);
        setError(err.message || 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    };

    initializeTournament();
  }, [category, user, api, startTournament, navigate]);

  // Atualizar tempo de início quando novo matchup carrega
  useEffect(() => {
    if (currentMatchup) {
      setChoiceStartTime(Date.now());
    }
  }, [currentMatchup]);

  // =====================================================
  // FUNCTIONS
  // =====================================================

  const loadCurrentMatchup = async (sessionId: string) => {
    try {
      const response = await api.get(`/tournament/current-matchup/${sessionId}`);
      
      if (response?.data?.matchup) {
        setCurrentMatchup(response.data.matchup);
      } else {
        // Não há mais matchups, torneio concluído
        navigate(`/tournament/result/${sessionId}`);
      }
    } catch (err: any) {
      console.error('Erro ao carregar matchup:', err);
      setError('Falha ao carregar confronto');
    }
  };

  const handleChoice = async (selectedImageId: number, position: 'left' | 'right') => {
    if (!currentMatchup || !session || choiceAnimation) return;

    try {
      // Calcular tempo de escolha
      const choiceTime = Date.now() - choiceStartTime;
      
      // Animação de escolha
      setChoiceAnimation(position);
      
      // Aguardar animação
      await new Promise(resolve => setTimeout(resolve, 600));

      // Enviar escolha para backend
      const response = await api.post('/tournament/choice', {
        sessionId: session.id,
        matchupId: currentMatchup.id,
        selectedImageId,
        choiceTimeMs: choiceTime
      });

      if (response?.data?.success) {
        // Atualizar estatísticas locais
        updateSessionStats(choiceTime);
        
        // Verificar se torneio foi concluído
        if (response.data.completed) {
          navigate(`/tournament/result/${session.id}`);
          return;
        }
        
        // Verificar se mudou de rodada
        if (response.data.newRound) {
          setRoundTransition(true);
          await new Promise(resolve => setTimeout(resolve, 1500));
          setRoundTransition(false);
        }
        
        // Carregar próximo matchup
        await loadCurrentMatchup(session.id);
        
        // Atualizar sessão
        const updatedSession = response.data.session;
        if (updatedSession) {
          setSession(updatedSession);
        }
      } else {
        setError('Falha ao processar escolha');
      }
    } catch (err: any) {
      console.error('Erro ao processar escolha:', err);
      setError('Erro ao processar escolha');
    } finally {
      setChoiceAnimation(null);
    }
  };

  const updateSessionStats = (choiceTime: number) => {
    setSessionStats(prev => {
      const newTotalChoices = prev.totalChoices + 1;
      const newAverageTime = ((prev.averageChoiceTime * prev.totalChoices) + choiceTime) / newTotalChoices;
      
      return {
        totalChoices: newTotalChoices,
        averageChoiceTime: newAverageTime,
        fastestChoice: Math.min(prev.fastestChoice, choiceTime),
        slowestChoice: Math.max(prev.slowestChoice, choiceTime)
      };
    });
  };

  const formatTime = (ms: number): string => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const handlePause = async () => {
    if (!session) return;
    
    try {
      await api.post(`/tournament/pause/${session.id}`);
      navigate('/tournament');
    } catch (err) {
      console.error('Erro ao pausar torneio:', err);
    }
  };

  const handleRestart = async () => {
    if (!category) return;
    
    try {
      const newSession = await startTournament(category);
      if (newSession) {
        setSession(newSession);
        await loadCurrentMatchup(newSession.id);
        setSessionStats({
          totalChoices: 0,
          averageChoiceTime: 0,
          fastestChoice: Infinity,
          slowestChoice: 0
        });
      }
    } catch (err) {
      console.error('Erro ao reiniciar torneio:', err);
    }
  };

  // =====================================================
  // RENDER CONDITIONS
  // =====================================================

  if (isLoading || loading) {
    return (
      <div className="tournament-screen loading">
        <div className="loading-container">
          <div className="tournament-spinner" />
          <h2>{t('tournament.loading')}</h2>
          <p>{t('tournament.preparingImages')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tournament-screen error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>{t('tournament.error')}</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={() => navigate('/tournament')} className="btn-secondary">
              {t('common.back')}
            </button>
            <button onClick={handleRestart} className="btn-primary">
              {t('tournament.tryAgain')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session || !currentMatchup) {
    return (
      <div className="tournament-screen error">
        <div className="error-container">
          <h2>{t('tournament.noMatchup')}</h2>
          <p>{t('tournament.noMatchupDescription')}</p>
          <button onClick={() => navigate('/tournament')} className="btn-primary">
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <div className={`tournament-screen ${choiceAnimation ? 'choice-animation' : ''}`}>
      {/* Header com progresso */}
      <div className="tournament-header">
        <div className="tournament-nav">
          <button onClick={() => navigate('/tournament')} className="btn-back">
            ← {t('common.back')}
          </button>
          <button onClick={handlePause} className="btn-pause">
            ⏸️ {t('tournament.pause')}
          </button>
        </div>
        
        <div className="tournament-info">
          <h1 className="category-title">
            {t(`tournament.categories.${category}`, category)}
          </h1>
          <div className="round-info">
            <span className="round-label">
              {t('tournament.round')} {session.currentRound} / {session.totalRounds}
            </span>
          </div>
        </div>
        
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${session.progressPercentage}%` }}
            />
          </div>
          <span className="progress-text">
            {Math.round(session.progressPercentage)}% {t('tournament.complete')}
          </span>
        </div>
      </div>

      {/* Round Transition */}
      {roundTransition && (
        <div className="round-transition">
          <div className="transition-content">
            <h2>{t('tournament.nextRound')}</h2>
            <p>{t('tournament.round')} {session.currentRound}</p>
          </div>
        </div>
      )}

      {/* Confronto principal */}
      <div className="tournament-matchup">
        <div className="matchup-instructions">
          <h2>{t('tournament.choosePreferred')}</h2>
          <p>{t('tournament.instructionsDescription')}</p>
        </div>

        <div className="images-container">
          {/* Imagem da esquerda */}
          <div 
            className={`image-option left ${choiceAnimation === 'left' ? 'selected' : ''} ${choiceAnimation === 'right' ? 'rejected' : ''}`}
            onClick={() => handleChoice(currentMatchup.image1.id, 'left')}
          >
            <div className="image-wrapper">
              <img 
                src={currentMatchup.image1.imageUrl} 
                alt={currentMatchup.image1.title}
                loading="lazy"
              />
              <div className="image-overlay">
                <h3>{currentMatchup.image1.title}</h3>
                {currentMatchup.image1.description && (
                  <p>{currentMatchup.image1.description}</p>
                )}
              </div>
              <div className="choice-indicator">
                <div className="choice-icon">👍</div>
              </div>
            </div>
          </div>

          {/* VS Indicator */}
          <div className="vs-indicator">
            <div className="vs-text">VS</div>
            <div className="vs-lightning">⚡</div>
          </div>

          {/* Imagem da direita */}
          <div 
            className={`image-option right ${choiceAnimation === 'right' ? 'selected' : ''} ${choiceAnimation === 'left' ? 'rejected' : ''}`}
            onClick={() => handleChoice(currentMatchup.image2.id, 'right')}
          >
            <div className="image-wrapper">
              <img 
                src={currentMatchup.image2.imageUrl} 
                alt={currentMatchup.image2.title}
                loading="lazy"
              />
              <div className="image-overlay">
                <h3>{currentMatchup.image2.title}</h3>
                {currentMatchup.image2.description && (
                  <p>{currentMatchup.image2.description}</p>
                )}
              </div>
              <div className="choice-indicator">
                <div className="choice-icon">👍</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats da sessão */}
      <div className="session-stats">
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">{t('tournament.choices')}</span>
            <span className="stat-value">{sessionStats.totalChoices}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t('tournament.avgTime')}</span>
            <span className="stat-value">
              {sessionStats.totalChoices > 0 ? formatTime(sessionStats.averageChoiceTime) : '0s'}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t('tournament.fastest')}</span>
            <span className="stat-value">
              {sessionStats.fastestChoice < Infinity ? formatTime(sessionStats.fastestChoice) : '0s'}
            </span>
          </div>
        </div>
      </div>

      {/* Hotkeys hint */}
      <div className="hotkeys-hint">
        <p>
          💡 {t('tournament.hotkeysHint')}: <strong>← / →</strong> {t('tournament.hotkeysArrows')}
        </p>
      </div>
    </div>
  );
};

export default TournamentScreen;