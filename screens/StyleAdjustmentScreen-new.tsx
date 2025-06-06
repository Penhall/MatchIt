import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import StyleRadarChart from '../components/profile/StyleRadarChart';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ProgressBar from '../components/common/ProgressBar';
import { 
  MOCK_RADAR_CHART_DATA, 
  MOCK_POTENTIAL_MATCHES, 
  MOCK_STYLE_ADJUSTMENT_QUESTIONS, 
  NEON_COLORS 
} from '../constants';
import { StyleAdjustmentQuestion, StyleCategory, StyleCategoryOrder } from '../types';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  SparklesIcon,
  HeartIcon
} from '../components/common/Icon';

// Tipos básicos para gamificação (inline para evitar problemas de import)
interface SimpleGameStats {
  streak: number;
  points: number;
  level: number;
  achievements: string[];
}

const StyleAdjustmentScreen: React.FC = () => {
  const { t } = useTranslation();
  
  // Estados principais (mantendo a estrutura original)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [radarData, setRadarData] = useState(MOCK_RADAR_CHART_DATA);
  const [potentialMatches, setPotentialMatches] = useState(MOCK_POTENTIAL_MATCHES);
  
  // Estados de gamificação simplificados
  const [gameStats, setGameStats] = useState<SimpleGameStats>({
    streak: 0,
    points: 0,
    level: 1,
    achievements: []
  });
  
  // Estados de UX
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showPointsFeedback, setShowPointsFeedback] = useState(false);
  const [lastPointsEarned, setLastPointsEarned] = useState(0);

  const questions = MOCK_STYLE_ADJUSTMENT_QUESTIONS;
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const completedQuestions = Object.keys(answers).length;
  const completionPercentage = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;
  const isCompleted = completedQuestions === totalQuestions;

  // Atualizar radar data em tempo real (mantendo lógica original)
  useEffect(() => {
    if (completedQuestions === 0) return;

    const newRadarData = StyleCategoryOrder.map(category => {
      const categoryQuestions = questions.filter(q => q.category === category);
      const categoryAnswers = categoryQuestions.filter(q => answers[q.id]).length;
      const score = categoryQuestions.length > 0 ? 
        (categoryAnswers / categoryQuestions.length) * 100 : 
        Math.random() * 50 + 25;
      return { subject: category, A: Math.round(score), fullMark: 100 };
    });
    
    setRadarData(newRadarData);
    setPotentialMatches(MOCK_POTENTIAL_MATCHES + completedQuestions * 3);
  }, [answers, questions, completedQuestions]);

  // Função simplificada para selecionar opção com gamificação básica
  const handleOptionSelect = useCallback(async (questionId: string, optionId: string) => {
    if (isAnimating) return;
    
    console.log('Selecting option:', questionId, optionId); // Debug
    
    setIsAnimating(true);
    setSelectedOption(optionId);
    
    // Feedback háptico simples
    try {
      navigator.vibrate?.(50);
    } catch (e) {
      console.log('Vibration not supported');
    }
    
    // Calcular pontos simples
    const basePoints = 10;
    const streakBonus = gameStats.streak * 2;
    const totalPoints = basePoints + streakBonus;
    
    // Atualizar resposta
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    
    // Atualizar gamificação
    setGameStats(prev => {
      const newStreak = prev.streak + 1;
      const newPoints = prev.points + totalPoints;
      const newLevel = Math.floor(newPoints / 100) + 1;
      
      return {
        ...prev,
        streak: newStreak,
        points: newPoints,
        level: newLevel
      };
    });
    
    // Mostrar feedback de pontos
    setLastPointsEarned(totalPoints);
    setShowPointsFeedback(true);
    
    // Delay para animação, então avançar
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
      setSelectedOption(null);
      setIsAnimating(false);
      setShowPointsFeedback(false);
    }, 800);
    
  }, [isAnimating, gameStats.streak, currentQuestionIndex, questions.length]);

  // Navegação manual (mantendo lógica original)
  const navigateQuestion = useCallback((direction: 'next' | 'prev') => {
    if (isAnimating) return;
    
    if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      // Reset streak ao voltar
      setGameStats(prev => ({ ...prev, streak: 0 }));
    }
  }, [currentQuestionIndex, questions.length, isAnimating]);

  console.log('Current question:', currentQuestion); // Debug
  console.log('Game stats:', gameStats); // Debug

  return (
    <div className="p-4 sm:p-6 space-y-6 text-gray-200 animate-fadeIn">
      {/* Header com gamificação básica */}
      <div className="text-center relative">
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-green">
          {t('styleAdjustment.title')}
        </h1>
        <p className="text-center text-gray-400 text-sm mb-4">
          {t('styleAdjustment.subtitle')}
        </p>
        
        {/* Stats simples de gamificação */}
        <div className="flex justify-center items-center space-x-6 mb-4">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="w-5 h-5 text-neon-blue" />
            <span className="text-sm">Level {gameStats.level}</span>
          </div>
          <div className="flex items-center space-x-2">
            <HeartIcon className="w-5 h-5 text-neon-green" />
            <span className="text-sm">{gameStats.points} pts</span>
          </div>
          {gameStats.streak > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-neon-orange">🔥</span>
              <span className="text-sm">{gameStats.streak}x streak</span>
            </div>
          )}
        </div>

        {/* Feedback de pontos simples */}
        {showPointsFeedback && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8 animate-bounce">
            <div className="bg-neon-green text-black px-3 py-1 rounded-full text-sm font-bold">
              +{lastPointsEarned} Points!
            </div>
          </div>
        )}
      </div>

      {/* Questão atual */}
      {currentQuestion && !isCompleted && (
        <Card className="relative overflow-hidden" glowColor="blue">
          {/* Progress indicator */}
          <div className="absolute top-3 right-3 text-xs text-gray-500">
            {currentQuestionIndex + 1} / {questions.length}
          </div>
          
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-neon-blue mb-2">
              {currentQuestion.category}
            </h2>
            <p className="text-md text-gray-300">
              {currentQuestion.questionText}
            </p>
          </div>

          {/* Opções com animações básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[currentQuestion.option1, currentQuestion.option2].map((option, index) => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
                disabled={isAnimating}
                className={`
                  relative group p-4 rounded-xl border-2 transition-all duration-300 
                  transform hover:scale-105 active:scale-95 bg-dark-input
                  ${selectedOption === option.id 
                    ? 'border-neon-green shadow-glow-green scale-105' 
                    : answers[currentQuestion.id] === option.id
                      ? 'border-neon-blue shadow-glow-blue'
                      : 'border-gray-700 hover:border-neon-blue hover:shadow-glow-blue'
                  }
                  ${isAnimating ? 'pointer-events-none' : ''}
                `}
              >
                {/* Image container básico */}
                <div className="relative w-full h-32 sm:h-40 mb-3 rounded-lg overflow-hidden bg-gray-800">
                  <img 
                    src={option.imageUrl} 
                    alt={option.label}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      console.log('Image failed to load:', option.imageUrl);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  
                  {/* Selection overlay */}
                  {selectedOption === option.id && (
                    <div className="absolute inset-0 bg-neon-green/20 flex items-center justify-center">
                      <div className="w-12 h-12 bg-neon-green rounded-full flex items-center justify-center animate-ping">
                        <SparklesIcon className="w-6 h-6 text-black" />
                      </div>
                    </div>
                  )}
                </div>
                
                <p className="text-center font-medium text-gray-200 group-hover:text-neon-blue transition-colors">
                  {option.label}
                </p>
              </button>
            ))}
          </div>

          {/* Navegação */}
          <div className="flex justify-between items-center">
            <Button 
              onClick={() => navigateQuestion('prev')} 
              disabled={currentQuestionIndex === 0 || isAnimating}
              variant="outline"
              glowEffect="blue"
              size="sm"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" /> 
              {t('styleAdjustment.prevButton')}
            </Button>
            
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">
                Tap your preferred style
              </div>
              {gameStats.streak > 0 && (
                <div className="text-xs text-neon-orange">
                  🔥 {gameStats.streak} streak active!
                </div>
              )}
            </div>
            
            <Button 
              onClick={() => navigateQuestion('next')} 
              disabled={currentQuestionIndex === questions.length - 1 || isAnimating}
              variant="primary"
              size="sm"
            >
              {t('styleAdjustment.nextButton')} 
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* Conclusão */}
      {isCompleted && (
        <Card glowColor="green" className="text-center animate-fadeIn">
          <SparklesIcon className="w-16 h-16 mx-auto text-neon-green mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-neon-green mb-2">
            {t('styleAdjustment.completeTitle')}
          </h2>
          <p className="text-gray-300 mb-4">
            {t('styleAdjustment.completeMessage')}
          </p>
          
          {/* Final stats simples */}
          <div className="bg-dark-input rounded-lg p-4 mb-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-neon-blue">{gameStats.points}</div>
                <div className="text-xs text-gray-400">Total Points</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-neon-green">{gameStats.level}</div>
                <div className="text-xs text-gray-400">Level Reached</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-neon-orange">{potentialMatches}</div>
                <div className="text-xs text-gray-400">New Matches</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Radar Chart */}
      <Card glowColor="green">
        <h2 className={`text-lg font-semibold ${NEON_COLORS.green} mb-3`}>
          {t('styleAdjustment.styleDistribution')}
        </h2>
        <StyleRadarChart data={radarData} />
      </Card>

      {/* Progress Summary */}
      <Card glowColor="orange" className="text-center">
        <h2 className={`text-lg font-semibold ${NEON_COLORS.orange} mb-3`}>
          {t('styleAdjustment.profileStatus')}
        </h2>
        <ProgressBar progress={completionPercentage} glow />
        <p className="text-sm text-gray-400 mt-2">
          {t('styleAdjustment.completionMessage', {percent: completionPercentage})}
        </p>
        <p className="text-md font-semibold text-neon-blue mt-3">
          {t('styleAdjustment.potentialMatches', {count: potentialMatches})}
        </p>
      </Card>
    </div>
  );
};

export default StyleAdjustmentScreen;