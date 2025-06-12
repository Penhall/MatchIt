import React, { useState, useEffect, ChangeEvent } from 'react';
import FloatingLabelInput from '@/components/common/FloatingLabelInput';
import Button from '@/components/common/Button';
import PhotoUploader from '@/components/profile/PhotoUploader'; // Importado
import LocationPicker from '@/components/profile/LocationPicker'; // Importado
import { ExtendedUserProfile } from '@/types/recommendation/extended-user';
import { User } from '@/types.ts'; 
import { GeographicLocation } from '@/types/recommendation/base';

// Interface para as fotos no estado do PhotoUploader
interface PhotoFile {
  id: string;
  url: string;
  file?: File;
}

// Mock de dados do usuário - substituir pela API real
const MOCK_USER_PROFILE: ExtendedUserProfile = {
  id: '123',
  displayName: 'Usuário Teste',
  city: 'São Paulo', // Será atualizado pelo LocationPicker
  gender: 'male', 
  avatarUrl: 'https://via.placeholder.com/150', // Poderia ser a primeira foto da lista
  bio: 'Esta é uma bio de teste.',
  isVip: false,
  interests: ['dating', 'friendship'],
  location: { latitude: -23.55052, longitude: -46.633308, city: 'São Paulo', region: 'SP', country: 'Brasil', accuracy: 1, source: 'manual' },
  stylePreferences: { sneakers: [], clothing: [], colors: [], hobbies: [], feelings: [], music: [], art: [], travel: [], food: [], lifestyle: [], dominantCategories: [], stylePersonality: 'classic', trendinessScore: 0.5, uniquenessScore: 0.5 },
  styleConfidence: 0.8,
  styleEvolution: [],
  personalityProfile: { openness: 0.7, conscientiousness: 0.8, extraversion: 0.6, agreeableness: 0.7, neuroticism: 0.3, adventurousness: 0.7, romanticism: 0.6, intellectuality: 0.8, socialness: 0.7, confidence: 0.8, source: 'quiz', lastUpdated: new Date() },
  emotionalProfile: { primaryEmotions: [], emotionalStability: 0.7, emotionalIntelligence: 0.6, emotionalPatterns: [], triggers: [], preferredEmotionalTypes: [], emotionalNeeds: [], moodHistory: [], emotionalTrends: [] },
  lifestyleProfile: { activityLevel: 7, fitnessInterests: [], sportsPreferences: [], socialLevel: 0.8, partyFrequency: 0.5, preferredGroupSize: 'medium', workLifeBalance: 0.6, careerAmbition: 0.7, familyOrientation: 0.5, sleepSchedule: { typical: {start: 23, end: 7}, flexibility: 0.5, consistency: 0.7 }, workSchedule: { typical: {start: 9, end: 18}, flexibility: 0.3, consistency: 0.9 }, weekendPreferences: [], lifeGoals: [], values: [], dealBreakers: [] },
  activityProfile: { 
    isOnline: true, 
    lastSeenAt: new Date(), 
    currentStatus: 'active', 
    sessionDuration: 3600000, 
    averageSessionDuration: 7200000, 
    peakActivityHours: [20, 21], 
    weeklyActivity: [10,20,30,40,50,60,70], 
    profilesViewedInSession: 10, 
    interactionsInSession: 5, 
    averageViewTimeToday: 60000 
  },
  engagementMetrics: { totalSessions: 50, averageSessionDuration: 600000, totalTimeSpent: 30000000, peakUsageHours: [20, 21], usageFrequency: 0.8, lastActiveDate: new Date(), profilesViewed: 200, profilesLiked: 50, conversationsStarted: 10, messagesExchanged: 100, averageViewTime: 30000, likeToViewRatio: 0.25, responseRate: 0.7, engagementTrend: 'stable', retentionProbability: 0.8 },
  profileQuality: { 
    userId: '123', 
    overallScore: 0.85, 
    completeness: 0.9, 
    photoQuality: 0.8, 
    bioQuality: 0.7, 
    authenticity: 0.9, 
    activity: 0.75, 
    hasVerifiedPhotos: true, 
    hasCompleteBio: true, 
    hasRecentActivity: true, 
    hasGoodResponseRate: true, 
    qualityIssues: [], 
    lastAnalyzed: new Date(), 
    analysisVersion: '1.0' 
  },
  verificationStatus: { isVerified: true, verifiedPhotos: true, verifiedPhone: true, verifiedEmail: true, verifiedSocial: false, authenticityScore: 0.9, photoAuthenticityScore: 0.85, profileAuthenticityScore: 0.9, verificationDate: new Date(), verificationMethod: 'manual' },
  matchingPreferences: { ageRange: [25, 35], genderPreferences: ['female'], locationPreferences: { maxDistance: 50, preferLocalMatches: true, allowTravelMatches: false, locationImportance: 0.8, willingToRelocate: false, travelFrequency: 0.2 }, styleCompatibilityImportance: 0.7, acceptableStyleDifference: 0.3, personalityCompatibilityImportance: 0.8, preferredPersonalityTraits: ['openness', 'agreeableness'], lifestyleCompatibilityImportance: 0.6, activityLevelTolerance: 0.3, requireVerifiedProfiles: true, minProfileQuality: 0.7, diversityPreference: 0.5, allowSecondChances: true, showOnlineStatusImportance: 0.5 },
  interactionHistory: { totalInteractions: 100, likeRate: 0.3, matchRate: 0.1, conversationRate: 0.05, mostActiveHours: [20, 21], mostActiveDays: [5,6], averageResponseTime: 3600000, preferredAgeRange: [28,32], preferredDistance: 30, mostLikedCategories: [], averageInteractionQuality: 0.7, ghostingRate: 0.1, reportRate: 0.01},
  learningProfile: { 
    totalLearningEvents: 50, 
    lastLearningUpdate: new Date(), 
    learningVelocity: 0.6, 
    learningConfidence: 0.7, 
    dataQuality: 0.8, 
    sampleSize: 100, 
    identifiedPatterns: [], 
    predictions: [], 
    personalizedWeights: { style: 0.4, emotional: 0.2, hobby: 0.1, location: 0.1, personality: 0.2, lifestyle: 0.0, values: 0.0, communication: 0.0 },
    algorithmPerformance: 0.75, 
    participatingExperiments: [], 
    testGroupAssignments: {} 
  },
  temporalPreferences: { preferredMatchingTimes: [], preferredChatTimes: [], weekdayActivity: [], hourlyActivity: [], seasonalPreferences: [], holidayBehavior: { holidayActivityLevel: 0.5, holidayMoodChange: 0.1, socialPreferencesChange: 0.2 }, typicalResponseTime: 1800000, responseTimeVariability: 0.4 },
  privacySettings: { profileVisibility: 'public', showOnlineStatus: true, showLastSeen: true, showDistance: true, shareLocationData: true, shareActivityData: true, shareStylePreferences: true, allowDataAnalysis: true, allowPersonalization: true, allowMachineLearning: true, allowExperiments: false, allowMessagesFromNonMatches: false, requireMutualLikeForContact: true, blockSettings: { blockedUsers: [], autoBlockReported: true, autoBlockInactive: false, temporaryBlockDuration: 7 } },
  systemMetadata: { 
    profileVersion: '1.0', 
    lastProfileUpdate: new Date(), 
    dataSourceVersions: {}, 
    dataIntegrityChecks: [], 
    lastIntegrityCheck: new Date(), 
    algorithmPerformanceHistory: [], 
    systemUsageStats: { totalApiCalls: 1000, averageResponseTime: 200, errorRate: 0.01, cacheHitRate: 0.6, lastApiCall: new Date() },
    debugFlags: {},
    supportTickets: [],
    specialFlags: []
  },
};

type GenderOptions = User['gender'];
type InterestOptions = ExtendedUserProfile['interests'][number];

const EditProfileScreen: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  // const [city, setCity] = useState(''); // Removido, será gerenciado por selectedLocation
  const [gender, setGender] = useState<GenderOptions>('prefer-not-to-say');
  const [interests, setInterests] = useState<InterestOptions[]>([]);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<GeographicLocation | null>(null);


  useEffect(() => {
    setDisplayName(MOCK_USER_PROFILE.displayName);
    setBio(MOCK_USER_PROFILE.bio || '');
    setSelectedLocation(MOCK_USER_PROFILE.location); // Define a localização inicial
    // setCity(MOCK_USER_PROFILE.city); // Removido
    setGender(MOCK_USER_PROFILE.gender);
    setInterests(MOCK_USER_PROFILE.interests);
    // Mock de fotos iniciais (em um app real, viria da API)
    if (MOCK_USER_PROFILE.avatarUrl) {
      setPhotos([{ id: 'avatar', url: MOCK_USER_PROFILE.avatarUrl }]);
    }
  }, []);

  const handleSave = () => {
    const updatedProfileData = {
      ...MOCK_USER_PROFILE, 
      displayName,
      bio,
      gender,
      interests,
      location: selectedLocation, // Adiciona a localização selecionada
      // city: selectedLocation ? selectedLocation.city : '', // Atualiza a cidade se necessário
      // avatarUrl: photos.length > 0 ? photos[0].url : '', // Atualiza avatarUrl
      // Aqui você também enviaria os arquivos de 'photos' para o backend
    };
    console.log('Perfil salvo:', updatedProfileData);
    console.log('Fotos para upload:', photos.filter(p => p.file));
    alert('Perfil Salvo: Suas informações foram atualizadas com sucesso!');
  };

  const interestOptions: { label: string; value: InterestOptions }[] = [
    { label: 'Namoro', value: 'dating' },
    { label: 'Amizade', value: 'friendship' },
    { label: 'Casual', value: 'casual' },
    { label: 'Outros', value: 'other' },
    { label: 'Coaching', value: 'coaching' },
  ];

  const genderOptions: { label: string; value: GenderOptions }[] = [
    { label: 'Masculino', value: 'male' },
    { label: 'Feminino', value: 'female' },
    { label: 'Não-binário', value: 'non-binary' },
    { label: 'Prefiro não dizer', value: 'prefer-not-to-say' },
    { label: 'Outro', value: 'other'},
  ];

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: 'auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 20 }}>Editar Perfil</h1>

      <div style={{ marginBottom: 30 }}>
        <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Informações Básicas</h2>
        <FloatingLabelInput
          id="displayName"
          label="Nome de Exibição"
          value={displayName}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
        />
        <div style={{marginTop: 15}} />
        <FloatingLabelInput
          id="bio"
          label="Bio"
          value={bio}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setBio(e.target.value)}
          // Para web, um <textarea> seria melhor para bio. O componente atual é <input>.
          // Poderia adaptar FloatingLabelInput para aceitar 'as="textarea"' ou criar um FloatingLabelTextarea
        />
        <div style={{marginTop: 15}} />
        <p style={{ marginBottom: 5 }}>Localização</p>
        <LocationPicker
          initialLocation={MOCK_USER_PROFILE.location}
          onLocationChange={setSelectedLocation}
        />
        
        <p style={{ marginTop: 15, marginBottom: 5 }}>Sexo</p>
        <select value={gender} onChange={(e: ChangeEvent<HTMLSelectElement>) => setGender(e.target.value as GenderOptions)} style={{padding: 8, width: '100%', marginBottom:10, borderRadius: '0.375rem', backgroundColor: '#374151', color: '#E5E7EB', borderColor: '#4B5563'}}>
          {genderOptions.map(opt => <option key={opt.value} value={opt.value} style={{backgroundColor: '#374151'}}>{opt.label}</option>)}
        </select>

        <p style={{ marginTop: 10, marginBottom: 5 }}>Interesses</p>
        <div>
          {interestOptions.map(opt => (
            <label key={opt.value} style={{ marginRight: 15, color: '#E5E7EB' }}>
              <input 
                type="checkbox" 
                value={opt.value} 
                checked={interests.includes(opt.value)}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const { value, checked } = e.target;
                  setInterests(prev => 
                    checked ? [...prev, value as InterestOptions] : prev.filter(i => i !== value)
                  );
                }}
                style={{marginRight: 5}}
              /> {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 30 }}>
        <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Fotos</h2>
        <PhotoUploader
          initialPhotos={photos}
          onPhotosChange={setPhotos}
          maxPhotos={9}
        />
      </div>

      <div style={{ marginBottom: 30 }}>
        <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Preferências de Match</h2>
        <p style={{ marginTop: 10, marginBottom: 5 }}>Preferência de Gênero para Match</p>
         {/* TODO: Adicionar seletor para genderPreferences (similar ao de 'gender', mas pode ser multi-select) */}
         <p className="text-gray-400">(Preferências de match a serem implementadas)</p>
      </div>

      <Button onClick={handleSave}>Salvar Alterações</Button>
    </div>
  );
};

export default EditProfileScreen;
