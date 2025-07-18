// src/screens/HomeScreen.tsx - Tela inicial do MatchIt
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTournament } from '../hooks/useTournament';
import './HomeScreen.css';

interface Tournament {
  id: string;
  name: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  participantsCount: number;
  startDate: string;
  description?: string;
}

const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { tournaments, loading, error, fetchTournaments } = useTournament();
  
  const [featuredTournaments, setFeaturedTournaments] = useState<Tournament[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);

  useEffect(() => {
    // Carregar torneios em destaque
    fetchTournaments();
  }, [fetchTournaments]);

  useEffect(() => {
    // Filtrar torneios em destaque (próximos e em andamento)
    if (tournaments) {
      const featured = tournaments
        .filter(t => t.status === 'upcoming' || t.status === 'ongoing')
        .slice(0, 3);
      setFeaturedTournaments(featured);
    }
  }, [tournaments]);

  const handleJoinTournament = (tournamentId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/tournament/${tournamentId}`);
  };

  const handleCreateTournament = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/create-tournament');
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

  const getStatusLabel = (status: Tournament['status']) => {
    switch (status) {
      case 'upcoming':
        return t('tournament.status.upcoming');
      case 'ongoing':
        return t('tournament.status.ongoing');
      case 'completed':
        return t('tournament.status.completed');
      default:
        return status;
    }
  };

  const getStatusClass = (status: Tournament['status']) => {
    switch (status) {
      case 'upcoming':
        return 'status-upcoming';
      case 'ongoing':
        return 'status-ongoing';
      case 'completed':
        return 'status-completed';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="home-screen">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-screen">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            {t('home.hero.title', 'Bem-vindo ao MatchIt')}
          </h1>
          <p className="hero-subtitle">
            {t('home.hero.subtitle', 'Organize e participe de torneios de forma simples e eficiente')}
          </p>
          
          <div className="hero-actions">
            <button 
              className="btn btn-primary btn-large"
              onClick={handleCreateTournament}
            >
              {t('home.hero.createTournament', 'Criar Torneio')}
            </button>
            
            <button 
              className="btn btn-secondary btn-large"
              onClick={() => navigate('/tournaments')}
            >
              {t('home.hero.browseTournaments', 'Explorar Torneios')}
            </button>
          </div>
        </div>
        
        <div className="hero-image">
          <div className="tournament-preview-card">
            <div className="preview-header">
              <span className="preview-title">{t('home.hero.previewTitle', 'Torneio Demo')}</span>
              <span className="preview-status status-ongoing">
                {t('tournament.status.ongoing', 'Em andamento')}
              </span>
            </div>
            <div className="preview-content">
              <p>{t('home.hero.previewParticipants', '16 participantes')}</p>
              <div className="preview-bracket">
                <div className="bracket-round">
                  <div className="match-preview"></div>
                  <div className="match-preview"></div>
                </div>
                <div className="bracket-round">
                  <div className="match-preview"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tournaments */}
      <section className="featured-section">
        <div className="container">
          <h2 className="section-title">
            {t('home.featured.title', 'Torneios em Destaque')}
          </h2>
          
          {error && (
            <div className="error-message">
              <p>{t('common.error.loadTournaments', 'Erro ao carregar torneios')}</p>
              <button onClick={fetchTournaments} className="btn btn-link">
                {t('common.tryAgain', 'Tentar novamente')}
              </button>
            </div>
          )}
          
          <div className="tournaments-grid">
            {featuredTournaments.length > 0 ? (
              featuredTournaments.map(tournament => (
                <div key={tournament.id} className="tournament-card">
                  <div className="tournament-header">
                    <h3 className="tournament-name">{tournament.name}</h3>
                    <span className={`tournament-status ${getStatusClass(tournament.status)}`}>
                      {getStatusLabel(tournament.status)}
                    </span>
                  </div>
                  
                  <div className="tournament-info">
                    <p className="tournament-description">
                      {tournament.description || t('tournament.noDescription', 'Sem descrição')}
                    </p>
                    
                    <div className="tournament-meta">
                      <div className="meta-item">
                        <span className="meta-label">{t('tournament.participants', 'Participantes')}:</span>
                        <span className="meta-value">{tournament.participantsCount}</span>
                      </div>
                      
                      <div className="meta-item">
                        <span className="meta-label">{t('tournament.startDate', 'Início')}:</span>
                        <span className="meta-value">{formatDate(tournament.startDate)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="tournament-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleJoinTournament(tournament.id)}
                    >
                      {tournament.status === 'upcoming' 
                        ? t('tournament.join', 'Participar')
                        : t('tournament.view', 'Visualizar')
                      }
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🏆</div>
                <h3>{t('home.featured.empty.title', 'Nenhum torneio em destaque')}</h3>
                <p>{t('home.featured.empty.description', 'Seja o primeiro a criar um torneio!')}</p>
                <button 
                  className="btn btn-primary"
                  onClick={handleCreateTournament}
                >
                  {t('home.featured.empty.action', 'Criar Primeiro Torneio')}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions-section">
        <div className="container">
          <h2 className="section-title">
            {t('home.quickActions.title', 'Ações Rápidas')}
          </h2>
          
          <div className="quick-actions-grid">
            <div className="quick-action-card" onClick={handleCreateTournament}>
              <div className="action-icon">🏆</div>
              <h3>{t('home.quickActions.create.title', 'Criar Torneio')}</h3>
              <p>{t('home.quickActions.create.description', 'Configure um novo torneio em minutos')}</p>
            </div>
            
            <div className="quick-action-card" onClick={() => navigate('/tournaments')}>
              <div className="action-icon">🔍</div>
              <h3>{t('home.quickActions.browse.title', 'Explorar Torneios')}</h3>
              <p>{t('home.quickActions.browse.description', 'Encontre torneios para participar')}</p>
            </div>
            
            <div className="quick-action-card" onClick={() => navigate('/my-tournaments')}>
              <div className="action-icon">📊</div>
              <h3>{t('home.quickActions.manage.title', 'Meus Torneios')}</h3>
              <p>{t('home.quickActions.manage.description', 'Gerencie seus torneios e participações')}</p>
            </div>
            
            {isAuthenticated && (
              <div className="quick-action-card" onClick={() => navigate('/profile')}>
                <div className="action-icon">👤</div>
                <h3>{t('home.quickActions.profile.title', 'Perfil')}</h3>
                <p>{t('home.quickActions.profile.description', 'Veja suas estatísticas e histórico')}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* User Welcome */}
      {isAuthenticated && user && (
        <section className="user-welcome-section">
          <div className="container">
            <div className="welcome-card">
              <h2>
                {t('home.welcome.title', { name: user.name }, `Olá, ${user.name}!`)}
              </h2>
              <p>
                {t('home.welcome.message', 'Pronto para sua próxima vitória?')}
              </p>
              
              <div className="user-stats">
                <div className="stat-item">
                  <span className="stat-value">{user.tournamentsCreated || 0}</span>
                  <span className="stat-label">{t('stats.tournamentsCreated', 'Torneios Criados')}</span>
                </div>
                
                <div className="stat-item">
                  <span className="stat-value">{user.tournamentsJoined || 0}</span>
                  <span className="stat-label">{t('stats.tournamentsJoined', 'Participações')}</span>
                </div>
                
                <div className="stat-item">
                  <span className="stat-value">{user.wins || 0}</span>
                  <span className="stat-label">{t('stats.wins', 'Vitórias')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomeScreen;