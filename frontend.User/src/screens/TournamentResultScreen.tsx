// src/screens/TournamentResultScreen.tsx - Tela de resultados do torneio
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTournament } from '../hooks/useTournament';
import { useApi } from '../hooks/useApi';
import './TournamentResultScreen.css';

interface Participant {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  seed?: number;
}

interface Match {
  id: string;
  round: number;
  participant1: Participant;
  participant2: Participant;
  winner?: Participant;
  score1?: number;
  score2?: number;
  playedAt: string;
  status: 'pending' | 'ongoing' | 'completed';
}

interface TournamentResult {
  id: string;
  name: string;
  description?: string;
  format: 'single-elimination' | 'double-elimination' | 'round-robin';
  status: 'completed';
  startDate: string;
  endDate: string;
  participantsCount: number;
  totalMatches: number;
  winner: Participant;
  runnerUp: Participant;
  thirdPlace?: Participant;
  ranking: Participant[];
  matches: Match[];
  statistics: {
    longestMatch: Match;
    shortestMatch: Match;
    mostScoredMatch: Match;
    averageMatchDuration: string;
    totalPlayTime: string;
  };
  createdBy: Participant;
}

type ViewMode = 'overview' | 'bracket' | 'matches' | 'statistics';

const TournamentResultScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { user, isAuthenticated } = useAuth();
  const { api } = useApi();
  
  const [tournament, setTournament] = useState<TournamentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  useEffect(() => {
    if (tournamentId) {
      fetchTournamentResults();
    }
  }, [tournamentId]);

  const fetchTournamentResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/tournaments/${tournamentId}/results`);
      setTournament(response.data);
      
      // Definir rodada padrão para visualização do bracket
      if (response.data.matches.length > 0) {
        const maxRound = Math.max(...response.data.matches.map((m: Match) => m.round));
        setSelectedRound(maxRound);
      }
    } catch (err: any) {
      setError(err.message || t('common.error.loadData'));
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (platform: 'whatsapp' | 'twitter' | 'facebook' | 'copy') => {
    if (!tournament) return;

    const shareText = t('tournament.share.text', {
      tournamentName: tournament.name,
      winner: tournament.winner.name
    }, `🏆 ${tournament.winner.name} venceu o torneio "${tournament.name}"! Veja os resultados:`);
    
    const shareUrl = window.location.href;
    const fullText = `${shareText} ${shareUrl}`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
        break;
      case 'copy':
        navigator.clipboard.writeText(fullText);
        // TODO: Mostrar toast de sucesso
        break;
    }
    
    setShareModalOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (duration: string) => {
    // Assumindo que duration vem em formato "HH:MM:SS" ou similar
    return duration;
  };

  const getRankingPosition = (participantId: string): number => {
    if (!tournament) return 0;
    return tournament.ranking.findIndex(p => p.id === participantId) + 1;
  };

  const getMatchesByRound = (round: number): Match[] => {
    if (!tournament) return [];
    return tournament.matches.filter(m => m.round === round);
  };

  const getAllRounds = (): number[] => {
    if (!tournament) return [];
    const rounds = [...new Set(tournament.matches.map(m => m.round))];
    return rounds.sort((a, b) => a - b);
  };

  const getRoundName = (round: number): string => {
    const totalRounds = getAllRounds().length;
    const roundFromEnd = totalRounds - round + 1;
    
    switch (roundFromEnd) {
      case 1:
        return t('tournament.rounds.final', 'Final');
      case 2:
        return t('tournament.rounds.semifinal', 'Semifinal');
      case 3:
        return t('tournament.rounds.quarterfinal', 'Quartas de Final');
      default:
        return t('tournament.rounds.round', { number: round }, `Rodada ${round}`);
    }
  };

  if (loading) {
    return (
      <div className="tournament-result-screen">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="tournament-result-screen">
        <div className="error-container">
          <h2>{t('common.error.title', 'Erro')}</h2>
          <p>{error || t('tournament.error.notFound', 'Torneio não encontrado')}</p>
          <button onClick={() => navigate('/tournaments')} className="btn btn-primary">
            {t('common.goBack', 'Voltar')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tournament-result-screen">
      {/* Header */}
      <div className="tournament-header">
        <div className="container">
          <div className="header-content">
            <div className="tournament-info">
              <div className="breadcrumb">
                <button onClick={() => navigate('/tournaments')} className="breadcrumb-link">
                  {t('navigation.tournaments', 'Torneios')}
                </button>
                <span className="breadcrumb-separator">›</span>
                <span className="breadcrumb-current">{tournament.name}</span>
              </div>
              
              <h1 className="tournament-title">{tournament.name}</h1>
              {tournament.description && (
                <p className="tournament-description">{tournament.description}</p>
              )}
              
              <div className="tournament-meta">
                <span className="meta-item">
                  <span className="meta-icon">📅</span>
                  {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                </span>
                <span className="meta-item">
                  <span className="meta-icon">👥</span>
                  {tournament.participantsCount} {t('tournament.participants', 'participantes')}
                </span>
                <span className="meta-item">
                  <span className="meta-icon">🎮</span>
                  {tournament.totalMatches} {t('tournament.matches', 'partidas')}
                </span>
                <span className="meta-item">
                  <span className="meta-icon">⏱️</span>
                  {tournament.statistics.totalPlayTime}
                </span>
              </div>
            </div>
            
            <div className="header-actions">
              <button 
                onClick={() => setShareModalOpen(true)}
                className="btn btn-secondary"
              >
                <span className="btn-icon">📤</span>
                {t('common.share', 'Compartilhar')}
              </button>
              
              {isAuthenticated && user?.id === tournament.createdBy.id && (
                <button 
                  onClick={() => navigate(`/tournament/${tournament.id}/manage`)}
                  className="btn btn-outline"
                >
                  {t('tournament.manage', 'Gerenciar')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="view-navigation">
        <div className="container">
          <div className="nav-tabs">
            {(['overview', 'bracket', 'matches', 'statistics'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`nav-tab ${viewMode === mode ? 'active' : ''}`}
              >
                {t(`tournament.views.${mode}`, mode)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="tournament-content">
        <div className="container">
          {viewMode === 'overview' && (
            <div className="overview-content">
              {/* Podium */}
              <section className="podium-section">
                <h2 className="section-title">{t('tournament.podium', 'Pódio')}</h2>
                <div className="podium">
                  {tournament.thirdPlace && (
                    <div className="podium-position third">
                      <div className="position-number">3</div>
                      <div className="participant-avatar">
                        {tournament.thirdPlace.avatar ? (
                          <img src={tournament.thirdPlace.avatar} alt={tournament.thirdPlace.name} />
                        ) : (
                          <div className="avatar-placeholder">
                            {tournament.thirdPlace.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="participant-name">{tournament.thirdPlace.name}</div>
                      <div className="position-medal">🥉</div>
                    </div>
                  )}
                  
                  <div className="podium-position first">
                    <div className="position-number">1</div>
                    <div className="participant-avatar">
                      {tournament.winner.avatar ? (
                        <img src={tournament.winner.avatar} alt={tournament.winner.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {tournament.winner.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="participant-name">{tournament.winner.name}</div>
                    <div className="position-medal">🏆</div>
                  </div>
                  
                  <div className="podium-position second">
                    <div className="position-number">2</div>
                    <div className="participant-avatar">
                      {tournament.runnerUp.avatar ? (
                        <img src={tournament.runnerUp.avatar} alt={tournament.runnerUp.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {tournament.runnerUp.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="participant-name">{tournament.runnerUp.name}</div>
                    <div className="position-medal">🥈</div>
                  </div>
                </div>
              </section>

              {/* Full Ranking */}
              <section className="ranking-section">
                <h2 className="section-title">{t('tournament.fullRanking', 'Classificação Completa')}</h2>
                <div className="ranking-list">
                  {tournament.ranking.map((participant, index) => (
                    <div key={participant.id} className={`ranking-item ${index < 3 ? 'top-three' : ''}`}>
                      <div className="ranking-position">
                        {index + 1}
                        {index === 0 && <span className="position-icon">🏆</span>}
                        {index === 1 && <span className="position-icon">🥈</span>}
                        {index === 2 && <span className="position-icon">🥉</span>}
                      </div>
                      <div className="participant-info">
                        <div className="participant-avatar">
                          {participant.avatar ? (
                            <img src={participant.avatar} alt={participant.name} />
                          ) : (
                            <div className="avatar-placeholder">
                              {participant.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="participant-details">
                          <div className="participant-name">{participant.name}</div>
                          {participant.seed && (
                            <div className="participant-seed">
                              {t('tournament.seed', 'Seed')}: {participant.seed}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {viewMode === 'bracket' && (
            <div className="bracket-content">
              <div className="bracket-controls">
                <h2 className="section-title">{t('tournament.bracket', 'Chaveamento')}</h2>
                <div className="round-selector">
                  {getAllRounds().map(round => (
                    <button
                      key={round}
                      onClick={() => setSelectedRound(round)}
                      className={`round-btn ${selectedRound === round ? 'active' : ''}`}
                    >
                      {getRoundName(round)}
                    </button>
                  ))}
                </div>
              </div>
              
              {selectedRound && (
                <div className="bracket-round">
                  <h3 className="round-title">{getRoundName(selectedRound)}</h3>
                  <div className="matches-grid">
                    {getMatchesByRound(selectedRound).map(match => (
                      <div key={match.id} className="match-card completed">
                        <div className="match-header">
                          <span className="match-date">{formatDate(match.playedAt)}</span>
                        </div>
                        <div className="match-participants">
                          <div className={`participant ${match.winner?.id === match.participant1.id ? 'winner' : 'loser'}`}>
                            <span className="participant-name">{match.participant1.name}</span>
                            <span className="participant-score">{match.score1 || 0}</span>
                          </div>
                          <div className="match-vs">VS</div>
                          <div className={`participant ${match.winner?.id === match.participant2.id ? 'winner' : 'loser'}`}>
                            <span className="participant-name">{match.participant2.name}</span>
                            <span className="participant-score">{match.score2 || 0}</span>
                          </div>
                        </div>
                        {match.winner && (
                          <div className="match-winner">
                            🏆 {match.winner.name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {viewMode === 'matches' && (
            <div className="matches-content">
              <h2 className="section-title">{t('tournament.allMatches', 'Todas as Partidas')}</h2>
              <div className="matches-list">
                {tournament.matches.map(match => (
                  <div key={match.id} className="match-item">
                    <div className="match-info">
                      <div className="match-round">{getRoundName(match.round)}</div>
                      <div className="match-date">{formatDate(match.playedAt)}</div>
                    </div>
                    <div className="match-result">
                      <div className={`participant ${match.winner?.id === match.participant1.id ? 'winner' : ''}`}>
                        <span className="name">{match.participant1.name}</span>
                        <span className="score">{match.score1 || 0}</span>
                      </div>
                      <div className="vs">VS</div>
                      <div className={`participant ${match.winner?.id === match.participant2.id ? 'winner' : ''}`}>
                        <span className="name">{match.participant2.name}</span>
                        <span className="score">{match.score2 || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'statistics' && (
            <div className="statistics-content">
              <h2 className="section-title">{t('tournament.statistics', 'Estatísticas')}</h2>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>{t('tournament.stats.longestMatch', 'Partida Mais Longa')}</h3>
                  <div className="stat-content">
                    <div className="match-preview">
                      <span>{tournament.statistics.longestMatch.participant1.name}</span>
                      <span>VS</span>
                      <span>{tournament.statistics.longestMatch.participant2.name}</span>
                    </div>
                    <div className="stat-value">
                      {formatDuration(tournament.statistics.averageMatchDuration)}
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <h3>{t('tournament.stats.shortestMatch', 'Partida Mais Rápida')}</h3>
                  <div className="stat-content">
                    <div className="match-preview">
                      <span>{tournament.statistics.shortestMatch.participant1.name}</span>
                      <span>VS</span>
                      <span>{tournament.statistics.shortestMatch.participant2.name}</span>
                    </div>
                    <div className="stat-value">
                      {formatDuration(tournament.statistics.averageMatchDuration)}
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <h3>{t('tournament.stats.mostScored', 'Partida com Mais Pontos')}</h3>
                  <div className="stat-content">
                    <div className="match-preview">
                      <span>{tournament.statistics.mostScoredMatch.participant1.name}</span>
                      <span className="score">
                        {tournament.statistics.mostScoredMatch.score1} - {tournament.statistics.mostScoredMatch.score2}
                      </span>
                      <span>{tournament.statistics.mostScoredMatch.participant2.name}</span>
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <h3>{t('tournament.stats.averageDuration', 'Duração Média das Partidas')}</h3>
                  <div className="stat-content">
                    <div className="stat-value large">
                      {formatDuration(tournament.statistics.averageMatchDuration)}
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <h3>{t('tournament.stats.totalPlayTime', 'Tempo Total de Jogo')}</h3>
                  <div className="stat-content">
                    <div className="stat-value large">
                      {tournament.statistics.totalPlayTime}
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <h3>{t('tournament.stats.tournamentInfo', 'Informações do Torneio')}</h3>
                  <div className="stat-content">
                    <div className="info-list">
                      <div className="info-item">
                        <span className="label">{t('tournament.format', 'Formato')}:</span>
                        <span className="value">{tournament.format}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">{t('tournament.createdBy', 'Criado por')}:</span>
                        <span className="value">{tournament.createdBy.name}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">{t('tournament.participants', 'Participantes')}:</span>
                        <span className="value">{tournament.participantsCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {shareModalOpen && (
        <div className="modal-overlay" onClick={() => setShareModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('tournament.share.title', 'Compartilhar Resultados')}</h3>
              <button 
                onClick={() => setShareModalOpen(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <p>{t('tournament.share.description', 'Compartilhe os resultados deste torneio:')}</p>
              
              <div className="share-options">
                <button 
                  onClick={() => handleShare('whatsapp')}
                  className="share-btn whatsapp"
                >
                  <span className="share-icon">📱</span>
                  WhatsApp
                </button>
                
                <button 
                  onClick={() => handleShare('twitter')}
                  className="share-btn twitter"
                >
                  <span className="share-icon">🐦</span>
                  Twitter
                </button>
                
                <button 
                  onClick={() => handleShare('facebook')}
                  className="share-btn facebook"
                >
                  <span className="share-icon">📘</span>
                  Facebook
                </button>
                
                <button 
                  onClick={() => handleShare('copy')}
                  className="share-btn copy"
                >
                  <span className="share-icon">📋</span>
                  {t('common.copyLink', 'Copiar Link')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentResultScreen;