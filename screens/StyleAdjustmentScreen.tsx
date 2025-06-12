import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useApi from '../hooks/useApi';
import StyleRadarChart from '../components/profile/StyleRadarChart';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ProgressBar from '../components/common/ProgressBar';
import { 
  NEON_COLORS 
} from '../constants';
import { StyleAdjustmentQuestion, StyleCategory, StyleCategoryOrder } from '../types';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  SparklesIcon,
  HeartIcon
} from '../components/common/Icon';

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
  const api = useApi();
  
  // Estados principais
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<StyleAdjustmentQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de gamificação
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

  // Carregar perguntas da API
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/style-adjustment/questions', {
          params: {
            category: StyleCategory.Clothing, // Pode ser dinâmico no futuro
            limit: 10
          }
        });
        setQuestions(response.data);
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar perguntas:', err);
        setError(t('styleAdjustment.loadError'));
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [api, t]);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const completedQuestions = Object.keys(answers).length;
  const completionPercentage = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;
  const isCompleted = completedQuestions === totalQuestions;

  // Enviar feedback para a API
  const sendFeedback = useCallback(async (questionId: string, chosenItemId: string, rejectedItemId: string) => {
    try {
      await api.post('/recommendations/feedback', {
        action: 'style_preference_chosen',
        context: {
          category: currentQuestion.category,
          chosenItemId,
          rejectedItemId
        }
      });
    } catch (err) {
      console.error('Erro ao enviar feedback:', err);
    }
  }, [api, currentQuestion?.category]);

  // Processar resposta com gamificação
  const processAnswer = useCallback((questionId: string, optionId: string, rejectedId: string) => {
    const responseTime = Date.now() - questionStartTime;
    const isFastAnswer = responseTime < 3000;
    
    const basePoints = 10;
    const speedBonus = isFastAnswer ? 5 : 0;
    const streakBonus = gameStats.streak * 2;
    const totalPoints = basePoints + speedBonus + streakBonus;

    setResponseTimes(prev => [...prev, responseTime]);

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

    // Enviar feedback para o backend
    sendFeedback(questionId, optionId, rejectedId);

    return {
      pointsEarned: totalPoints,
      isFastAnswer,
      speedBonus,
      streakBonus
    };
  }, [questionStartTime, gameStats.streak, sendFeedback]);

  // Função otimizada para selecionar opção
  const handleOptionSelect = useCallback(async (questionId: string, optionId: string, rejectedId: string) => {
    if (isAnimating || !currentQuestion) return;
    
    setIsAnimating(true);
    setSelectedOption(optionId);
    
    const result = processAnswer(questionId, optionId, rejectedId);
    
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    
    setShowFeedback({
      show: true,
      type: result.isFastAnswer ? 'speed' : 'points',
      value: result.pointsEarned
    });
    
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setQuestionStartTime(Date.now());
      }
      setSelectedOption(null);
      setIsAnimating(false);
      setShowFeedback({ show: false, type: 'points', value: 0 });
    }, 800);
  }, [isAnimating, currentQuestionIndex, questions.length, processAnswer, currentQuestion]);

  // Navegação manual
  const navigateQuestion = useCallback((direction: 'next' | 'prev') => {
    if (isAnimating) return;
    
    if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setQuestionStartTime(Date.now());
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setGameStats(prev => ({ ...prev, streak: 0 }));
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestionIndex, questions.length, isAnimating]);

  // Renderização condicional para loading/error
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-neon-blue animate-pulse">
          {t('loading')}...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-neon-red">
          {error}
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">
          {t('styleAdjustment.noQuestions')}
        </div>
      </div>
    );
  }

  // Restante do componente permanece igual...
  // [O restante do código de renderização permanece inalterado]
};

export default StyleAdjustmentScreen;
