// hooks/recommendation/useStyleGameification.ts
import { useState } from 'react';

const useStyleGameification = (initialPoints = 0) => {
  const [points, setPoints] = useState(initialPoints);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [badges, setBadges] = useState<string[]>([]);

  const addPoints = (amount: number) => {
    setPoints(prev => prev + amount);
  };

  const unlockAchievement = (achievement: string) => {
    if (!achievements.includes(achievement)) {
      setAchievements(prev => [...prev, achievement]);
    }
  };

  const awardBadge = (badge: string) => {
    if (!badges.includes(badge)) {
      setBadges(prev => [...prev, badge]);
    }
  };

  return {
    points,
    achievements,
    badges,
    addPoints,
    unlockAchievement,
    awardBadge
  };
};

export default useStyleGameification;
