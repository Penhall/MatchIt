
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import StyleRadarChart from '../components/profile/StyleRadarChart';
import Button from '../components/common/Button';
import { MOCK_RADAR_CHART_DATA, MOCK_POTENTIAL_MATCHES, MOCK_STYLE_ADJUSTMENT_QUESTIONS, NEON_COLORS } from '../constants';
import { StyleAdjustmentQuestion, StyleCategory, StyleCategoryOrder } from '../types';
import Card from '../components/common/Card';
import ProgressBar from '../components/common/ProgressBar';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/common/Icon';

const StyleAdjustmentScreen: React.FC = () => {
  const { t } = useTranslation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [radarData, setRadarData] = useState(MOCK_RADAR_CHART_DATA);
  const [potentialMatches, setPotentialMatches] = useState(MOCK_POTENTIAL_MATCHES);

  const questions = MOCK_STYLE_ADJUSTMENT_QUESTIONS;
  const currentQuestion = questions[currentQuestionIndex];

  const totalQuestions = questions.length;
  const completedQuestions = Object.keys(answers).length;
  const completionPercentage = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;

  useEffect(() => {
    // Simulate radar data update based on answers
    const newRadarData = StyleCategoryOrder.map(category => {
      const categoryQuestions = questions.filter(q => q.category === category);
      const categoryAnswers = categoryQuestions.filter(q => answers[q.id]).length;
      const score = categoryQuestions.length > 0 ? (categoryAnswers / categoryQuestions.length) * 100 : Math.random() * 50 + 25; // Default random if no questions for category
      return { subject: category, A: Math.round(score), fullMark: 100 };
    });
    setRadarData(newRadarData);

    // Simulate potential matches update
    setPotentialMatches(MOCK_POTENTIAL_MATCHES + completedQuestions * 3);

  }, [answers, questions]);

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    // Mock sound effect feedback
    // new Audio('/path/to/choice-sound.mp3').play(); 
    // For a real app, ensure audio assets are available and managed.
    console.log(`Selected option ${optionId} for question ${questionId}`);
    if (currentQuestionIndex < questions.length - 1) {
      // setTimeout(() => setCurrentQuestionIndex(currentQuestionIndex + 1), 300); // Auto-advance with delay
    }
  };

  const navigateQuestion = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  return (
    <div className="p-4 sm:p-6 space-y-6 text-gray-200 animate-fadeIn">
      <h1 className="text-3xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-green">
        {t('styleAdjustment.title')}
      </h1>
      <p className="text-center text-gray-400 text-sm mb-6">
        {t('styleAdjustment.subtitle')}
      </p>

      {currentQuestion && (
        <Card className="relative" glowColor="blue">
          <div className="absolute top-3 right-3 text-xs text-gray-500">{currentQuestionIndex + 1} / {questions.length}</div>
          <h2 className="text-xl font-semibold text-neon-blue mb-1 text-center">{currentQuestion.category}</h2>
          <p className="text-md text-gray-300 mb-4 text-center">{currentQuestion.questionText}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[currentQuestion.option1, currentQuestion.option2].map(option => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 transform hover:scale-105 
                            ${answers[currentQuestion.id] === option.id ? 'border-neon-green shadow-neon-green' : 'border-gray-700 hover:border-neon-blue'} 
                            bg-dark-input`}
              >
                <img src={option.imageUrl} alt={option.label} className="w-full h-32 sm:h-40 object-cover rounded-md mb-2" />
                <p className="text-center font-medium text-gray-200">{option.label}</p>
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-6">
            <Button 
              onClick={() => navigateQuestion('prev')} 
              disabled={currentQuestionIndex === 0}
              variant="outline"
              glowEffect="blue"
            >
              <ChevronLeftIcon className="w-5 h-5 mr-1" /> {t('styleAdjustment.prevButton')}
            </Button>
            <Button 
              onClick={() => navigateQuestion('next')} 
              disabled={currentQuestionIndex === questions.length - 1}
              variant="primary"
            >
              {t('styleAdjustment.nextButton')} <ChevronRightIcon className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </Card>
      )}
      
      {!currentQuestion && completedQuestions === totalQuestions && (
        <Card glowColor="green" className="text-center">
            <h2 className="text-2xl font-bold text-neon-green mb-2">{t('styleAdjustment.completeTitle')}</h2>
            <p className="text-gray-300">{t('styleAdjustment.completeMessage')}</p>
        </Card>
      )}


      <Card glowColor="green">
        <h2 className="text-lg font-semibold ${NEON_COLORS.green} mb-2">{t('styleAdjustment.styleDistribution')}</h2>
        <StyleRadarChart data={radarData} />
      </Card>

      <Card glowColor="orange" className="text-center">
        <h2 className="text-lg font-semibold ${NEON_COLORS.orange} mb-2">{t('styleAdjustment.profileStatus')}</h2>
        <ProgressBar progress={completionPercentage} glow />
        <p className="text-sm text-gray-400 mt-2">{t('styleAdjustment.completionMessage', {percent: completionPercentage})}</p>
        <p className="text-md font-semibold text-neon-blue mt-3">{t('styleAdjustment.potentialMatches', {count: potentialMatches})}</p>
      </Card>
    </div>
  );
};

export default StyleAdjustmentScreen;
