// types/tournament.ts - Tipos para sistema de torneios
export type TournamentCategory = 'roupas' | 'tenis' | 'acessorios' | 'cores' | 'ambientes';

export interface TournamentImage {
  id: number;
  category: TournamentCategory;
  imageUrl: string;
  imageName: string;
  displayOrder: number;
  active: boolean;
  uploadedAt: string;
  fileSize?: number;
  imageWidth?: number;
  imageHeight?: number;
  tags: string[];
}

export interface TournamentBracket {
  round: number;
  matches: TournamentMatch[];
  winners: number[];
}

export interface TournamentMatch {
  id: string;
  image1: TournamentImage;
  image2: TournamentImage;
  winner?: number;
  choiceTimeMs?: number;
}

export interface TournamentSession {
  id: string;
  userId: string;
  category: TournamentCategory;
  status: 'active' | 'completed' | 'abandoned';
  currentRound: number;
  totalRounds: number;
  bracketData: TournamentBracket[];
  startedAt: string;
  completedAt?: string;
  lastActivity: string;
}

export interface TournamentResult {
  id: string;
  userId: string;
  sessionId: string;
  category: TournamentCategory;
  championImageId: number;
  finalistImageId?: number;
  topChoices: number[];
  eliminationOrder: number[];
  preferenceStrength: number;
  roundsPlayed: number;
  totalTimeSeconds: number;
  completedAt: string;
}

export interface TournamentChoice {
  id: string;
  sessionId: string;
  roundNumber: number;
  winnerImageId: number;
  loserImageId: number;
  choiceTimeMs: number;
  createdAt: string;
}

export interface TournamentStats {
  totalCompleted: number;
  averageTime: number;
  favoriteCategory: TournamentCategory;
  completionRate: number;
}

export interface VisualPreferences {
  [category: string]: {
    champion: number;
    finalist?: number;
    topChoices: number[];
    preferenceStrength: number;
    completedAt: string;
  };
}
