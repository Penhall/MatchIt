// components/profile/FeedbackTracker.tsx

import React, { useRef, useEffect, useState } from 'react';
import { Heart, X, Star, MessageCircle, Eye, Clock } from 'lucide-react';

interface FeedbackTrackerProps {
  userId: string;
  targetUserId: string;
  screenType?: string;
  profileData?: {
    matchScore?: number;
    styleCompatibility?: number;
    emotionalCompatibility?: number;
    reasonsForRecommendation?: string[];
  };
  onFeedbackRecorded?: (feedback: any) => void;
}

interface UserMoodState {
  happiness: number;
  stress: number;
  energy: number;
  social: number;
  romantic: number;
}

const FeedbackTracker: React.FC<FeedbackTrackerProps> = ({
  userId,
  targetUserId,
  screenType = 'discovery',
  profileData = {},
  onFeedbackRecorded
}) => {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [viewStartTime] = useState(Date.now());
  const [isVisible, setIsVisible] = useState(false);
  const [profilePosition, setProfilePosition] = useState(0);
  const [totalProfilesShown, setTotalProfilesShown] = useState(1);
  const [userMood, setUserMood] = useState<UserMoodState | null>(null);
  
  const viewTimeRef = useRef(0);
  const lastViewTimeUpdate = useRef(Date.now());
  const trackedEvents = useRef(new Set<string>());

  useEffect(() => {
    // Carregar estado emocional atual do usuário
    loadUserMood();
    
    // Marcar perfil como visualizado
    recordProfileView();

    // Configurar observer para tempo de visualização
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
          
          if (entry.isIntersecting) {
            lastViewTimeUpdate.current = Date.now();
          } else {
            updateViewTime();
          }
        });
      },
      { threshold: 0.5 }
    );

    const element = document.getElementById(`profile-${targetUserId}`);
    if (element) {
      observer.observe(element);
    }

    // Configurar interval para atualizar tempo de visualização
    const interval = setInterval(() => {
      if (isVisible) {
        updateViewTime();
      }
    }, 1000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
      
      // Gravar tempo final de visualização
      updateViewTime();
      if (viewTimeRef.current > 3) { // Apenas se visualizou por mais de 3 segundos
        recordExtendedView();
      }
    };
  }, [targetUserId, isVisible]);

  const loadUserMood = async () => {
    try {
      const response = await fetch('/api/profile/emotional-profile');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.currentState) {
          setUserMood(data.data.currentState);
        }
      }
    } catch (error) {
      console.error('Error loading user mood:', error);
    }
  };

  const updateViewTime = () => {
    const now = Date.now();
    const deltaTime = (now - lastViewTimeUpdate.current) / 1000;
    viewTimeRef.current += deltaTime;
    lastViewTimeUpdate.current = now;
  };

  const recordFeedbackEvent = async (eventType: string, additionalData: any = {}) => {
    try {
      updateViewTime(); // Atualizar tempo antes de gravar
      
      const eventData = {
        eventType,
        targetUserId,
        sessionId,
        screenType,
        timeSpentViewing: Math.round(viewTimeRef.current),
        profilePosition,
        totalProfilesShown,
        userMood,
        ...profileData,
        ...additionalData
      };

      const response = await fetch('/api/profile/weight-adjustment/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        const result = await response.json();
        onFeedbackRecorded?.(result.data);
        
        // Marcar evento como registrado
        trackedEvents.current.add(`${eventType}-${targetUserId}`);
      }
    } catch (error) {
      console.error('Error recording feedback:', error);
    }
  };

  const recordProfileView = () => {
    if (!trackedEvents.current.has(`profile_view-${targetUserId}`)) {
      recordFeedbackEvent('profile_view');
    }
  };

  const recordExtendedView = () => {
    if (viewTimeRef.current > 10 && !trackedEvents.current.has(`profile_view_extended-${targetUserId}`)) {
      recordFeedbackEvent('profile_view_extended', {
        engagementLevel: calculateEngagementLevel()
      });
    }
  };

  const calculateEngagementLevel = () => {
    const viewTime = viewTimeRef.current;
    if (viewTime > 30) return 'high';
    if (viewTime > 10) return 'medium';
    return 'low';
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  };

  // Handlers para ações do usuário
  const handleSwipeRight = () => {
    recordFeedbackEvent('swipe_right', {
      swipeSpeed: calculateSwipeSpeed(),
      hesitationTime: calculateHesitation()
    });
  };

  const handleSwipeLeft = () => {
    recordFeedbackEvent('swipe_left', {
      swipeSpeed: calculateSwipeSpeed(),
      rejectionReason: inferRejectionReason()
    });
  };

  const handleSuperLike = () => {
    recordFeedbackEvent('super_like', {
      enthusiasmLevel: 'high',
      timeToDecision: Date.now() - viewStartTime
    });
  };

  const handleMessageSent = (messageData: any) => {
    recordFeedbackEvent('message_sent', {
      messageLength: messageData.text?.length || 0,
      messageType: messageData.type || 'text',
      timeToFirstMessage: Date.now() - viewStartTime
    });
  };

  const handleMatchCreated = () => {
    recordFeedbackEvent('match_created', {
      mutualInterest: true,
      timeToMatch: Date.now() - viewStartTime
    });
  };

  const calculateSwipeSpeed = () => {
    const decisionTime = Date.now() - viewStartTime;
    if (decisionTime < 2000) return 'fast';
    if (decisionTime < 5000) return 'medium';
    return 'slow';
  };

  const calculateHesitation = () => {
    return Math.max(0, Date.now() - viewStartTime - 1000);
  };

  const inferRejectionReason = () => {
    const viewTime = viewTimeRef.current;
    if (viewTime < 1) return 'immediate_rejection';
    if (viewTime < 3) return 'quick_decision';
    if (viewTime > 10) return 'considered_rejection';
    return 'standard_rejection';
  };

  // Componente de debug (apenas em desenvolvimento)
  const DebugPanel = () => {
    if (process.env.NODE_ENV !== 'development') return null;

    return (
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-xs">
        <h4 className="font-bold mb-2">Feedback Tracker Debug</h4>
        <div className="space-y-1">
          <div>Session: {sessionId.slice(0, 8)}...</div>
          <div>View Time: {viewTimeRef.current.toFixed(1)}s</div>
          <div>Visible: {isVisible ? 'Yes' : 'No'}</div>
          <div>Position: {profilePosition}</div>
          <div>Mood: {userMood ? 'Loaded' : 'None'}</div>
          <div>Events: {trackedEvents.current.size}</div>
        </div>
      </div>
    );
  };

  // Componente de ações rápidas para testes
  const QuickActions = () => {
    if (process.env.NODE_ENV !== 'development') return null;

    return (
      <div className="fixed bottom-20 right-4 bg-white shadow-lg rounded-lg p-2 flex space-x-2">
        <button
          onClick={handleSwipeRight}
          className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600"
          title="Simulate Swipe Right"
        >
          <Heart className="w-4 h-4" />
        </button>
        <button
          onClick={handleSwipeLeft}
          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
          title="Simulate Swipe Left"
        >
          <X className="w-4 h-4" />
        </button>
        <button
          onClick={handleSuperLike}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
          title="Simulate Super Like"
        >
          <Star className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleMessageSent({ text: 'Test message', type: 'text' })}
          className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600"
          title="Simulate Message"
        >
          <MessageCircle className="w-4 h-4" />
        </button>
      </div>
    );
  };

  // Hook para expor métodos públicos
  React.useImperativeHandle(React.forwardRef((props, ref) => ref), () => ({
    recordSwipeRight: handleSwipeRight,
    recordSwipeLeft: handleSwipeLeft,
    recordSuperLike: handleSuperLike,
    recordMessageSent: handleMessageSent,
    recordMatchCreated: handleMatchCreated,
    setProfilePosition: (position: number) => setProfilePosition(position),
    setTotalProfilesShown: (total: number) => setTotalProfilesShown(total),
    getCurrentViewTime: () => viewTimeRef.current,
    getSessionId: () => sessionId
  }));

  return (
    <>
      {/* Elemento invisível para tracking */}
      <div 
        id={`profile-${targetUserId}`}
        className="absolute inset-0 pointer-events-none"
        data-feedback-tracker="true"
      />
      
      {/* Indicador visual de tracking ativo */}
      {isVisible && (
        <div className="absolute top-2 right-2 z-10">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        </div>
      )}

      {/* Métricas em tempo real */}
      <ViewTimeIndicator viewTime={viewTimeRef.current} />
      
      {/* Componentes de debug */}
      <DebugPanel />
      <QuickActions />
    </>
  );
};

// Componente para mostrar tempo de visualização
const ViewTimeIndicator: React.FC<{ viewTime: number }> = ({ viewTime }) => {
  if (process.env.NODE_ENV !== 'development' || viewTime < 1) return null;

  return (
    <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
      <Eye className="w-3 h-3" />
      <span>{viewTime.toFixed(0)}s</span>
    </div>
  );
};

// Hook personalizado para usar o FeedbackTracker
export const useFeedbackTracker = (userId: string, targetUserId: string) => {
  const trackerRef = useRef<any>();
  const [analytics, setAnalytics] = useState<any>(null);

  const recordSwipeRight = () => trackerRef.current?.recordSwipeRight();
  const recordSwipeLeft = () => trackerRef.current?.recordSwipeLeft();
  const recordSuperLike = () => trackerRef.current?.recordSuperLike();
  const recordMessageSent = (data: any) => trackerRef.current?.recordMessageSent(data);
  const recordMatchCreated = () => trackerRef.current?.recordMatchCreated();

  const updatePosition = (position: number, total: number) => {
    trackerRef.current?.setProfilePosition(position);
    trackerRef.current?.setTotalProfilesShown(total);
  };

  const getCurrentMetrics = () => ({
    viewTime: trackerRef.current?.getCurrentViewTime() || 0,
    sessionId: trackerRef.current?.getSessionId()
  });

  // Carregar analytics em tempo real
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await fetch('/api/profile/weight-adjustment/analytics?period=daily&days=1');
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data.data.realTime);
        }
      } catch (error) {
        console.error('Error loading analytics:', error);
      }
    };

    loadAnalytics();
    const interval = setInterval(loadAnalytics, 30000); // Atualizar a cada 30s
    
    return () => clearInterval(interval);
  }, []);

  return {
    trackerRef,
    recordSwipeRight,
    recordSwipeLeft,
    recordSuperLike,
    recordMessageSent,
    recordMatchCreated,
    updatePosition,
    getCurrentMetrics,
    analytics
  };
};

// Componente de contexto para prover feedback tracking globalmente
export const FeedbackTrackingContext = React.createContext<{
  recordEvent: (eventType: string, data: any) => void;
  analytics: any;
} | null>(null);

export const FeedbackTrackingProvider: React.FC<{ 
  children: React.ReactNode;
  userId: string;
}> = ({ children, userId }) => {
  const [analytics, setAnalytics] = useState<any>(null);

  const recordEvent = async (eventType: string, data: any) => {
    try {
      const response = await fetch('/api/profile/weight-adjustment/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, ...data })
      });
      
      if (response.ok) {
        // Atualizar analytics locais
        const result = await response.json();
        console.log('Event recorded:', result);
      }
    } catch (error) {
      console.error('Error recording global event:', error);
    }
  };

  return (
    <FeedbackTrackingContext.Provider value={{ recordEvent, analytics }}>
      {children}
    </FeedbackTrackingContext.Provider>
  );
};

export const useFeedbackTracking = () => {
  const context = React.useContext(FeedbackTrackingContext);
  if (!context) {
    throw new Error('useFeedbackTracking must be used within FeedbackTrackingProvider');
  }
  return context;
};

export default FeedbackTracker;