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

// Tipos de gamificação simplificados (inline para evitar problemas)
interface SimpleGameStats {
  streak: number;
  points: number;
  level: number;
  achievements: string[];
  fastAnswers: number;
  totalQuestions: number;
}

interface SimpleMetrics {
  averageResponseTime: number;
  consistencyScore: number;
  fastAnswerPercentage: number;
}

interface FeedbackState {
  show: boolean;
  type: 'points' | 'speed' | 'streak';
  value: number;
}

const StyleAdjustmentScreen: React.FC = () => {
  const { t } = useTranslation();
  
  // Estados principais
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [radarData, setRadarData] = useState(MOCK_RADAR_CHART_DATA);
  const [potentialMatches, setPotentialMatches] = useState(MOCK_POTENTIAL_MATCHES);
  
  // Estados de gamificação implementados localmente
  const [gameStats, setGameStats] = useState<SimpleGameStats>({
    streak: 0,
    points: 0,
    level: 1,
    achievements: [],
    fastAnswers: 0,
    totalQuestions: 0
  });

  const [metrics, setMetrics] = useState<SimpleMetrics>({
    averageResponseTime: 0,
    consistencyScore: 0,
    fastAnswerPercentage: 0
  });

  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  
  // Estados de UX
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState<FeedbackState>({ 
    show: false, 
    type: 'points', 
    value: 0 
  });

  const questions = MOCK_STYLE_ADJUSTMENT_QUESTIONS;
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const completedQuestions = Object.keys(answers).length;
  const completionPercentage = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;
  const isCompleted = completedQuestions === totalQuestions;

  // Calcular métricas quando response times mudam
  useEffect(() => {
    if (responseTimes.length > 0) {
      const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const fastAnswers = responseTimes.filter(time => time < 3000).length;
      const fastPercentage = (fastAnswers / responseTimes.length) * 100;
      
      // Calcular consistency score baseado na variação
      const variance = responseTimes.reduce((acc, time) => 
        acc + Math.pow(time - avgTime, 2), 0) / responseTimes.length;
      const consistencyScore = Math.max(0, 100 - (Math.sqrt(variance) / 100));

      setMetrics({
        averageResponseTime: avgTime,
        consistencyScore: Math.round(consistencyScore),
        fastAnswerPercentage: Math.round(fastPercentage)
      });
    }
  }, [responseTimes]);

  // Atualizar radar data e matches em tempo real
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

  // Inicializar timing da primeira pergunta
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, []);

  // Função para processar resposta com gamificação
  const processAnswer = useCallback((questionId: string, optionId: string) => {
    const responseTime = Date.now() - questionStartTime;
    const isFastAnswer = responseTime < 3000; // Resposta rápida < 3s
    
    // Calcular pontos
    const basePoints = 10;
    const speedBonus = isFastAnswer ? 5 : 0;
    const streakBonus = gameStats.streak * 2;
    const totalPoints = basePoints + speedBonus + streakBonus;

    // Atualizar response times
    setResponseTimes(prev => [...prev, responseTime]);

    // Atualizar game stats
    setGameStats(prev => {
      const newStreak = prev.streak + 1;
      const newPoints = prev.points + totalPoints;
      const newLevel = Math.floor(newPoints / 100) + 1;
      const newFastAnswers = isFastAnswer ? prev.fastAnswers + 1 : prev.fastAnswers;

      return {
        ...prev,
        streak: newStreak,
        points: newPoints,
        level: newLevel,
        fastAnswers: newFastAnswers,
        totalQuestions: prev.totalQuestions + 1
      };
    });

    // Feedback háptico
    try {
      navigator.vibrate?.(isFastAnswer ? [50, 30, 50] : 50);
    } catch (e) {
      // Ignore vibration errors
    }

    return {
      pointsEarned: totalPoints,
      isFastAnswer,
      speedBonus,
      streakBonus
    };
  }, [questionStartTime, gameStats.streak]);

  // Função otimizada para selecionar opção
  const handleOptionSelect = useCallback(async (questionId: string, optionId: string) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setSelectedOption(optionId);
    
    // Processar resposta com gamificação
    const result = processAnswer(questionId, optionId);
    
    // Atualizar resposta
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    
    // Mostrar feedback de pontos
    setShowFeedback({
      show: true,
      type: result.isFastAnswer ? 'speed' : 'points',
      value: result.pointsEarned
    });
    
    // Delay para animação, então avançar
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setQuestionStartTime(Date.now()); // Reset timer para próxima pergunta
      }
      setSelectedOption(null);
      setIsAnimating(false);
      setShowFeedback({ show: false, type: 'points', value: 0 });
    }, 800);
    
  }, [isAnimating, currentQuestionIndex, questions.length, processAnswer]);

  // Navegação manual
  const navigateQuestion = useCallback((direction: 'next' | 'prev') => {
    if (isAnimating) return;
    
    if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setQuestionStartTime(Date.now());
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setGameStats(prev => ({ ...prev, streak: 0 })); // Reset streak ao voltar
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestionIndex, questions.length, isAnimating]);

  // Formatação de tempo
  const formatTime = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Calcular progresso do nível
  const levelProgress = () => {
    const currentLevelThreshold = (gameStats.level - 1) * 100;
    const nextLevelThreshold = gameStats.level * 100;
    const progress = ((gameStats.points - currentLevelThreshold) / (nextLevelThreshold - currentLevelThreshold)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  // Log de debug
  console.log('Game Stats:', gameStats);
  console.log('Metrics:', metrics);
  console.log('Current Question:', currentQuestion);

  return (
    <div className="p-4 sm:p-6 space-y-6 text-gray-200 animate-fadeIn">
      {/* Header com gamificação */}
      <div className="text-center relative">
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-green">
          {t('styleAdjustment.title')}
        </h1>
        <p className="text-center text-gray-400 text-sm mb-4">
          {t('styleAdjustment.subtitle')}
        </p>
        
        {/* Stats de gamificação modernos */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-dark-input rounded-lg p-3 border border-neon-blue/30">
            <div className="flex items-center justify-center mb-1">
              <SparklesIcon className="w-4 h-4 text-neon-blue mr-1" />
              <span className="text-sm font-bold text-neon-blue">LV.{gameStats.level}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-neon-blue h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${levelProgress()}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-dark-input rounded-lg p-3 border border-neon-green/30">
            <div className="flex items-center justify-center mb-1">
              <HeartIcon className="w-4 h-4 text-neon-green mr-1" />
              <span className="text-sm font-bold text-neon-green">{gameStats.points}</span>
            </div>
            <div className="text-xs text-gray-400">{t('points')}</div>
          </div>
          
          {gameStats.streak > 0 && (
            <div className="bg-dark-input rounded-lg p-3 border border-neon-orange/30">
              <div className="flex items-center justify-center mb-1">
                <span className="text-neon-orange mr-1">🔥</span>
                <span className="text-sm font-bold text-neon-orange">{gameStats.streak}x</span>
              </div>
              <div className="text-xs text-gray-400">{t('streak')}</div>
            </div>
          )}
          
          <div className="bg-dark-input rounded-lg p-3 border border-purple-400/30">
            <div className="flex items-center justify-center mb-1">
              <span className="text-purple-400 mr-1">⚡</span>
              <span className="text-sm font-bold text-purple-400">{gameStats.fastAnswers}</span>
            </div>
            <div className="text-xs text-gray-400">{t('fast')}</div>
          </div>
        </div>

        {/* Feedback de pontos flutuante */}
        {showFeedback.show && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8 animate-bounce z-10">
            <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2 ${
              showFeedback.type === 'speed' ? 'bg-yellow-500 text-black' :
              showFeedback.type === 'streak' ? 'bg-neon-orange text-black' :
              'bg-neon-green text-black'
            }`}>
              <SparklesIcon className="w-4 h-4" />
              <span>
                +{showFeedback.value} {showFeedback.type === 'speed' ? t('speedBonus') : 
                                      showFeedback.type === 'streak' ? t('streakBonus') : t('pointsEarned')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Questão atual */}
      {currentQuestion && !isCompleted && (
        <Card className="relative overflow-hidden" glowColor="blue">
          {/* Progress indicator melhorado */}
          <div className="absolute top-3 right-3 flex items-center space-x-2 text-xs text-gray-500">
            <span>{currentQuestionIndex + 1} / {questions.length}</span>
            {metrics.averageResponseTime > 0 && (
              <span className="text-neon-blue">
                ⚡ {formatTime(Date.now() - questionStartTime)}
              </span>
            )}
          </div>
          
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-neon-blue mb-2">
              {currentQuestion.category}
            </h2>
            <p className="text-md text-gray-300">
              {currentQuestion.questionText}
            </p>
          </div>

          {/* Opções com animações melhoradas */}
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
                    ? 'border-neon-green shadow-glow-green scale-105 animate-pulse' 
                    : answers[currentQuestion.id] === option.id
                      ? 'border-neon-blue shadow-glow-blue'
                      : 'border-gray-700 hover:border-neon-blue hover:shadow-glow-blue'
                  }
                  ${isAnimating ? 'pointer-events-none' : ''}
                `}
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                {/* Image container */}
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
                  
                  {/* Selection overlay melhorado */}
                  {selectedOption === option.id && (
                    <div className="absolute inset-0 bg-neon-green/20 flex items-center justify-center">
                      <div className="w-16 h-16 bg-neon-green rounded-full flex items-center justify-center animate-ping">
                        <SparklesIcon className="w-8 h-8 text-black" />
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

          {/* Navegação melhorada */}
          <div className="flex justify-between items-center">
            <Button 
              onClick={() => navigateQuestion('prev')} 
              disabled={currentQuestionIndex === 0 || isAnimating}
              variant="outline"
              glowEffect="blue"
              size="sm"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" /> 
              {t('styleAdjustment.backButton')}
            </Button>
            
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">
                {t('styleAdjustment.tapPreferredStyle')}
              </div>
              {gameStats.streak > 0 && (
                <div className="text-xs text-neon-orange">
                  🔥 {gameStats.streak} {t('streakActive')}!
                </div>
              )}
            </div>
            
            <Button 
              onClick={() => navigateQuestion('next')} 
              disabled={currentQuestionIndex === questions.length - 1 || isAnimating}
              variant="primary"
              size="sm"
            >
              {t('styleAdjustment.skipButton')} <ChevronRightIcon className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* Conclusão com estatísticas */}
      {isCompleted && (
        <Card glowColor="green" className="text-center animate-fadeIn">
          <SparklesIcon className="w-16 h-16 mx-auto text-neon-green mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-neon-green mb-2">
            {t('styleAdjustment.styleProfileComplete')}
          </h2>
          <p className="text-gray-300 mb-6">
            {t('styleAdjustment.unlockedStyleDNA')}
          </p>
          
          {/* Final stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-dark-input rounded-lg p-4">
              <div className="text-2xl font-bold text-neon-blue">{gameStats.points}</div>
              <div className="text-xs text-gray-400">{t('totalPoints')}</div>
            </div>
            <div className="bg-dark-input rounded-lg p-4">
              <div className="text-2xl font-bold text-neon-green">{gameStats.level}</div>
              <div className="text-xs text-gray-400">{t('levelReached')}</div>
            </div>
            <div className="bg-dark-input rounded-lg p-4">
              <div className="text-2xl font-bold text-neon-orange">{gameStats.fastAnswers}</div>
              <div className="text-xs text-gray-400">{t('fastAnswers')}</div>
            </div>
            <div className="bg-dark-input rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-400">{potentialMatches}</div>
              <div className="text-xs text-gray-400">{t('newMatches')}</div>
            </div>
          </div>

          {/* Performance insights */}
          {metrics.averageResponseTime > 0 && (
            <div className="bg-dark-input rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-neon-blue mb-2">{t('yourStyleInsights')}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">{t('avgResponseTime')}:</span>
                  <span className="text-white ml-2">{formatTime(metrics.averageResponseTime)}</span>
                </div>
                <div>
                  <span className="text-gray-400">{t('consistencyScore')}:</span>
                  <span className="text-white ml-2">{metrics.consistencyScore}%</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Radar Chart */}
      <Card glowColor="green">
        <h2 className={`text-lg font-semibold ${NEON_COLORS.green} mb-3`}>
          {t('styleAdjustment.yourStyleDistribution')}
        </h2>
        <StyleRadarChart data={radarData} />
      </Card>

      {/* Progress Summary */}
      <Card glowColor="orange" className="text-center">
        <h2 className={`text-lg font-semibold ${NEON_COLORS.orange} mb-3`}>
          {t('styleAdjustment.profileCompletion')}
        </h2>
        <ProgressBar progress={completionPercentage} glow />
        <p className="text-sm text-gray-400 mt-2">
          {completionPercentage}% {t('ofYourStyleProfileCompleted')}
        </p>
        <p className="text-md font-semibold text-neon-blue mt-3">
          {potentialMatches} {t('styleAdjustment.potentialMatchesFound')}
        </p>
      </Card>

      {/* Performance tips se há dados suficientes */}
      {metrics.averageResponseTime > 0 && gameStats.totalQuestions > 2 && (
        <Card glowColor="blue" className="text-center">
          <h3 className="text-lg font-semibold text-neon-blue mb-3">{t('styleAdjustment.styleTips')}</h3>
          <div className="space-y-2 text-sm">
            {metrics.averageResponseTime > 5000 && (
              <div className="bg-dark-input rounded-lg p-3 text-left text-gray-300">
                {t('answerMoreQuickly')}
              </div>
            )}
            {gameStats.streak === 0 && gameStats.points > 50 && (
              <div className="bg-dark-input rounded-lg p-3 text-left text-gray-300">
                {t('buildStreakMultiplier')}
              </div>
            )}
            {metrics.consistencyScore < 50 && gameStats.totalQuestions > 3 && (
              <div className="bg-dark-input rounded-lg p-3 text-left text-gray-300">
                {t('improveConsistencyScores')}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default StyleAdjustmentScreen;
