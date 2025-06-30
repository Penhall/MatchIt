import React, { useState, useEffect } from 'react';
//import { Achievement } from './useStyleGameification';
import { SparklesIcon, XIcon } from '../common/Icon.tsx';
import { Achievement } from '../../types/gamification';

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onClose: () => void;
  duration?: number;
  position?: 'top' | 'center' | 'bottom';
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  onClose,
  duration = 4000,
  position = 'top'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Controlar visibilidade e animações
  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      setIsAnimating(true);
      
      // Auto-close após duração especificada
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [achievement, duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!achievement || !isVisible) {
    return null;
  }

  const positionClasses = {
    top: 'top-4',
    center: 'top-1/2 transform -translate-y-1/2',
    bottom: 'bottom-4'
  };

  const getAchievementColor = (type: Achievement['type']) => {
    switch (type) {
      case 'speed': return 'from-yellow-500 to-orange-500';
      case 'streak': return 'from-red-500 to-pink-500';
      case 'completion': return 'from-blue-500 to-cyan-500';
      case 'expertise': return 'from-purple-500 to-indigo-500';
      case 'social': return 'from-green-500 to-emerald-500';
      default: return 'from-neon-blue to-neon-green';
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex justify-center">
      <div 
        className={`
          ${positionClasses[position]} relative pointer-events-auto
          ${isAnimating ? 'animate-slideInDown' : 'animate-slideOutUp'}
        `}
      >
        {/* Glow effect background */}
        <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/20 to-neon-green/20 rounded-2xl blur-xl scale-110"></div>
        
        {/* Main notification */}
        <div className={`
          relative bg-gradient-to-r ${getAchievementColor(achievement.type)} 
          p-1 rounded-2xl shadow-2xl transform transition-all duration-300
          ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}>
          <div className="bg-dark-bg rounded-xl p-4 min-w-[320px] max-w-[400px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-neon-blue to-neon-green rounded-full flex items-center justify-center">
                  <SparklesIcon className="w-4 h-4 text-black" />
                </div>
                <span className="text-sm font-medium text-neon-blue">Achievement Unlocked!</span>
              </div>
              <button 
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors p-1"
                aria-label="Close notification"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Achievement content */}
            <div className="flex items-start space-x-3">
              {/* Icon */}
              <div className="text-3xl flex-shrink-0 animate-bounce">
                {achievement.icon}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white mb-1 break-words">
                  {achievement.title}
                </h3>
                <p className="text-sm text-gray-300 break-words">
                  {achievement.description}
                </p>
                
                {/* Achievement type badge */}
                <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-dark-input border border-gray-700">
                  <div className={`w-2 h-2 rounded-full mr-2 bg-gradient-to-r ${getAchievementColor(achievement.type)}`}></div>
                  {achievement.type.charAt(0).toUpperCase() + achievement.type.slice(1)}
                </div>
              </div>
            </div>

            {/* Progress bar animation */}
            <div className="mt-4 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${getAchievementColor(achievement.type)} transform transition-all duration-1000 ease-out`}
                style={{ 
                  width: isAnimating ? '100%' : '0%',
                  transitionDelay: '500ms'
                }}
              ></div>
            </div>

            {/* Unlock time */}
            <div className="mt-2 text-xs text-gray-500 text-center">
              Unlocked {achievement.unlockedAt.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Floating particles effect */}
        {isAnimating && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-neon-blue rounded-full animate-ping opacity-75"
                style={{
                  left: `${20 + (i * 10)}%`,
                  top: `${30 + (i % 3) * 20}%`,
                  animationDelay: `${i * 200}ms`,
                  animationDuration: '1.5s'
                }}
              ></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Hook para gerenciar múltiplas notificações em fila
export const useAchievementNotifications = () => {
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [current, setCurrent] = useState<Achievement | null>(null);

  const addAchievement = (achievement: Achievement) => {
    setQueue(prev => [...prev, achievement]);
  };

  const addMultipleAchievements = (achievements: Achievement[]) => {
    setQueue(prev => [...prev, ...achievements]);
  };

  const showNext = () => {
    if (queue.length > 0 && !current) {
      const [next, ...rest] = queue;
      setCurrent(next);
      setQueue(rest);
    }
  };

  const closeCurrent = () => {
    setCurrent(null);
    // Delay before showing next to avoid overwhelming user
    setTimeout(showNext, 500);
  };

  // Auto-show next achievement when queue changes
  useEffect(() => {
    if (!current && queue.length > 0) {
      const timer = setTimeout(showNext, 300);
      return () => clearTimeout(timer);
    }
  }, [queue, current]);

  const clearAll = () => {
    setQueue([]);
    setCurrent(null);
  };

  return {
    current,
    queueLength: queue.length,
    addAchievement,
    addMultipleAchievements,
    closeCurrent,
    clearAll,
    hasNotifications: current !== null || queue.length > 0
  };
};

// Componente wrapper para facilitar uso
interface AchievementSystemProps {
  achievements: Achievement[];
  onAchievementsCleared?: () => void;
  notificationDuration?: number;
  position?: 'top' | 'center' | 'bottom';
}

export const AchievementSystem: React.FC<AchievementSystemProps> = ({
  achievements,
  onAchievementsCleared,
  notificationDuration = 4000,
  position = 'top'
}) => {
  const {
    current,
    addMultipleAchievements,
    closeCurrent,
    queueLength
  } = useAchievementNotifications();

  // Adicionar novos achievements à fila
  useEffect(() => {
    if (achievements.length > 0) {
      addMultipleAchievements(achievements);
      onAchievementsCleared?.();
    }
  }, [achievements, addMultipleAchievements, onAchievementsCleared]);

  return (
    <>
      <AchievementNotification
        achievement={current}
        onClose={closeCurrent}
        duration={notificationDuration}
        position={position}
      />
      
      {/* Queue indicator (opcional) */}
      {queueLength > 0 && (
        <div className="fixed top-4 right-4 z-40 bg-dark-card border border-neon-blue/30 rounded-lg px-3 py-2">
          <span className="text-xs text-neon-blue">
            +{queueLength} more achievement{queueLength > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </>
  );
};

export default AchievementNotification;
