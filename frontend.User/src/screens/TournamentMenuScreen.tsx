// src/screens/TournamentMenuScreen.tsx - Menu de seleção de categorias de torneio (React Web)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useTournament } from '../hooks/useTournament';
import './TournamentMenuScreen.css';

// =====================================================
// TYPES AND INTERFACES
// =====================================================

interface TournamentCategory {
  id: string;
  name: string;
  displayName: string;
  description: string;
  imageCount: number;
  available: boolean;
  color: string;
  icon: string;
  approvedCount?: number;
}

// =====================================================
// MAIN COMPONENT
// =====================================================

const TournamentMenuScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { categories, loading, error, loadCategories, startTournament } = useTournament();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // =====================================================
  // LIFECYCLE
  // =====================================================

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // =====================================================
  // ACTIONS
  // =====================================================

  const handleStartTournament = async (categoryId: string) => {
    if (isStarting) return;

    try {
      setIsStarting(true);
      setSelectedCategory(categoryId);
      
      const session = await startTournament(categoryId);
      if (session) {
        navigate(`/tournament/${categoryId}`);
      }
    } catch (error) {
      console.error('Erro ao iniciar torneio:', error);
      alert('Erro ao iniciar torneio. Tente novamente.');
    } finally {
      setIsStarting(false);
      setSelectedCategory(null);
    }
  };

  const handleBackHome = () => {
    navigate('/');
  };

  // =====================================================
  // RENDER CONDITIONS
  // =====================================================

  if (loading) {
    return (
      <div className="tournament-menu-screen loading">
        <div className="loading-container">
          <div className="tournament-spinner" />
          <h2>{t('tournament.loadingCategories', 'Carregando categorias...')}</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tournament-menu-screen error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>{t('tournament.error', 'Erro')}</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={handleBackHome} className="btn-secondary">
              {t('common.back', 'Voltar')}
            </button>
            <button onClick={() => loadCategories()} className="btn-primary">
              {t('common.tryAgain', 'Tentar Novamente')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <div className="tournament-menu-screen">
      {/* Header */}
      <div className="tournament-menu-header">
        <button onClick={handleBackHome} className="btn-back">
          ← {t('common.back', 'Voltar')}
        </button>
        
        <div className="header-content">
          <h1 className="menu-title">
            🏆 {t('tournament.menu.title', 'Escolha um Torneio')}
          </h1>
          <p className="menu-subtitle">
            {t('tournament.menu.subtitle', 'Descubra suas preferências através de torneios visuais')}
          </p>
        </div>

        {user?.isAdmin && (
          <button className="btn-admin" onClick={() => navigate('/admin/tournament')}>
            ⚙️ Admin
          </button>
        )}
      </div>

      {/* Welcome Message */}
      <div className="welcome-section">
        <div className="welcome-card">
          <h2>👋 {t('tournament.welcome', 'Olá')}, {user?.name || 'Usuário'}!</h2>
          <p>{t('tournament.menu.description', 'Pronto para descobrir suas preferências? Escolha uma categoria abaixo e comece seu torneio visual!')}</p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="categories-section">
        <h2 className="section-title">
          {t('tournament.categories.title', 'Categorias Disponíveis')}
        </h2>
        
        <div className="categories-grid">
          {categories.map((category) => (
            <div 
              key={category.id}
              className={`category-card ${!category.available ? 'disabled' : ''} ${selectedCategory === category.id ? 'loading' : ''}`}
              onClick={() => category.available && handleStartTournament(category.id)}
              style={{ '--category-color': category.color } as React.CSSProperties}
            >
              {/* Card Content */}
              <div className="card-content">
                {/* Icon */}
                <div className="category-icon">
                  {category.icon}
                </div>

                {/* Info */}
                <div className="category-info">
                  <h3 className="category-name">{category.displayName}</h3>
                  <p className="category-description">{category.description}</p>
                </div>

                {/* Stats */}
                <div className="category-stats">
                  <div className="stat-item">
                    <span className="stat-icon">🖼️</span>
                    <span className="stat-value">{category.imageCount}</span>
                    <span className="stat-label">{t('tournament.images', 'imagens')}</span>
                  </div>
                </div>

                {/* Status */}
                <div className="category-status">
                  {category.available ? (
                    <span className="status-available">
                      ✅ {t('tournament.available', 'Disponível')}
                    </span>
                  ) : (
                    <span className="status-unavailable">
                      🔒 {t('tournament.unavailable', 'Em breve')}
                    </span>
                  )}
                </div>

                {/* Loading overlay */}
                {selectedCategory === category.id && isStarting && (
                  <div className="loading-overlay">
                    <div className="loading-spinner" />
                    <span>{t('tournament.starting', 'Iniciando...')}</span>
                  </div>
                )}
              </div>

              {/* Hover effect */}
              <div className="card-hover-effect" />
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="instructions-section">
        <div className="instructions-card">
          <h3>💡 {t('tournament.instructions.title', 'Como Funciona')}</h3>
          <ul>
            <li>{t('tournament.instructions.step1', '1. Escolha uma categoria de sua preferência')}</li>
            <li>{t('tournament.instructions.step2', '2. Compare duas imagens e escolha sua favorita')}</li>
            <li>{t('tournament.instructions.step3', '3. Continue até encontrar a imagem campeã')}</li>
            <li>{t('tournament.instructions.step4', '4. Descubra insights sobre suas preferências')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TournamentMenuScreen;