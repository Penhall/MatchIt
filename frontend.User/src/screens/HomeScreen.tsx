// src/screens/HomeScreen.tsx - Tela inicial do MatchIt
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTournament } from '../hooks/useTournament';
import './HomeScreen.css';

const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { categories, loading, error, loadCategories } = useTournament();

  useEffect(() => {
    // Carregar categorias de torneio
    loadCategories();
  }, [loadCategories]);

  const handleStartTournament = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/tournament');
  };

  const handleJoinTournament = (categoryId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/tournament/${categoryId}`);
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
              onClick={handleStartTournament}
            >
              {t('home.hero.startTournament', 'Iniciar Torneio')}
            </button>
            
            <button 
              className="btn btn-secondary btn-large"
              onClick={() => navigate('/tournament')}
            >
              {t('home.hero.browseTournaments', 'Explorar Categorias')}
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

      {/* Featured Categories */}
      <section className="featured-section">
        <div className="container">
          <h2 className="section-title">
            {t('home.featured.title', 'Categorias em Destaque')}
          </h2>
          
          {error && (
            <div className="error-message">
              <p>{t('common.error.loadCategories', 'Erro ao carregar categorias')}</p>
              <button onClick={() => loadCategories()} className="btn btn-link">
                {t('common.tryAgain', 'Tentar novamente')}
              </button>
            </div>
          )}
          
          <div className="categories-grid">
            {categories && categories.length > 0 ? (
              categories.slice(0, 3).map(category => (
                <div key={category.id} className="category-card">
                  <div className="category-header">
                    <div className="category-icon" style={{ color: category.color }}>
                      {category.icon}
                    </div>
                    <h3 className="category-name">{category.displayName}</h3>
                    <span className={`category-status ${category.available ? 'status-available' : 'status-unavailable'}`}>
                      {category.available ? '✅ Disponível' : '🔒 Em breve'}
                    </span>
                  </div>
                  
                  <div className="category-info">
                    <p className="category-description">
                      {category.description}
                    </p>
                    
                    <div className="category-meta">
                      <div className="meta-item">
                        <span className="meta-label">{t('tournament.images', 'Imagens')}:</span>
                        <span className="meta-value">{category.imageCount}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="category-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => category.available ? handleJoinTournament(category.id) : navigate('/tournament')}
                      disabled={!category.available}
                    >
                      {category.available 
                        ? t('tournament.start', 'Iniciar')
                        : t('tournament.comingSoon', 'Em breve')
                      }
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🏆</div>
                <h3>{t('home.featured.empty.title', 'Carregando categorias...')}</h3>
                <p>{t('home.featured.empty.description', 'Descubra suas preferências através de torneios visuais!')}</p>
                <button 
                  className="btn btn-primary"
                  onClick={handleStartTournament}
                >
                  {t('home.featured.empty.action', 'Explorar Torneios')}
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
            <div className="quick-action-card" onClick={handleStartTournament}>
              <div className="action-icon">🏆</div>
              <h3>{t('home.quickActions.start.title', 'Iniciar Torneio')}</h3>
              <p>{t('home.quickActions.start.description', 'Descubra suas preferências em minutos')}</p>
            </div>
            
            <div className="quick-action-card" onClick={() => navigate('/tournament')}>
              <div className="action-icon">🔍</div>
              <h3>{t('home.quickActions.browse.title', 'Explorar Categorias')}</h3>
              <p>{t('home.quickActions.browse.description', 'Veja todas as categorias disponíveis')}</p>
            </div>
            
            <div className="quick-action-card" onClick={() => navigate('/match-area')}>
              <div className="action-icon">💕</div>
              <h3>{t('home.quickActions.matches.title', 'Ver Matches')}</h3>
              <p>{t('home.quickActions.matches.description', 'Conecte-se com pessoas compatíveis')}</p>
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