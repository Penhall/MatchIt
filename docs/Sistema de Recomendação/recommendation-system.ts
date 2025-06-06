// types/recommendation.ts
export interface UserProfile {
  id: string;
  age: number;
  gender: string;
  location: {
    lat: number;
    lng: number;
    city: string;
  };
  stylePreferences: {
    tenis: number[];      // IDs das escolhas de tênis
    roupas: number[];     // IDs das escolhas de roupas  
    cores: number[];      // IDs das escolhas de cores
    hobbies: number[];    // IDs das escolhas de hobbies
    sentimentos: number[]; // IDs das escolhas de sentimentos
  };
  personalityVector: number[]; // Vetor de personalidade calculado
  activityLevel: number;       // 0-10 baseado em hobbies ativos
  emotionalProfile: number[];  // Vetor emocional baseado em sentimentos
  vipStatus: boolean;
  preferences: {
    ageRange: [number, number];
    maxDistance: number;
    genderPreference: string[];
  };
}

export interface MatchScore {
  userId: string;
  totalScore: number;
  breakdown: {
    styleCompatibility: number;
    emotionalCompatibility: number;
    hobbyCompatibility: number;
    locationScore: number;
    personalityMatch: number;
  };
  explanation: string[];
}

export interface RecommendationResult {
  matches: MatchScore[];
  totalCandidates: number;
  executionTime: number;
  algorithm: string;
}

// services/RecommendationEngine.ts
class RecommendationEngine {
  private weights = {
    style: 0.25,
    emotional: 0.20,
    hobby: 0.20,
    location: 0.15,
    personality: 0.20
  };

  // Algoritmo principal de recomendação
  async generateRecommendations(
    currentUser: UserProfile,
    candidates: UserProfile[],
    options: {
      limit?: number;
      minScore?: number;
      algorithm?: 'hybrid' | 'collaborative' | 'content';
    } = {}
  ): Promise<RecommendationResult> {
    const startTime = Date.now();
    const { limit = 20, minScore = 0.3, algorithm = 'hybrid' } = options;

    // Filtrar candidatos básicos
    const filteredCandidates = this.applyBasicFilters(currentUser, candidates);
    
    let matches: MatchScore[] = [];

    switch (algorithm) {
      case 'hybrid':
        matches = await this.hybridRecommendation(currentUser, filteredCandidates);
        break;
      case 'collaborative':
        matches = await this.collaborativeFiltering(currentUser, filteredCandidates);
        break;
      case 'content':
        matches = this.contentBasedFiltering(currentUser, filteredCandidates);
        break;
    }

    // Filtrar por score mínimo e limitar resultados
    const finalMatches = matches
      .filter(match => match.totalScore >= minScore)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);

    return {
      matches: finalMatches,
      totalCandidates: filteredCandidates.length,
      executionTime: Date.now() - startTime,
      algorithm
    };
  }

  // Filtros básicos (idade, localização, preferências)
  private applyBasicFilters(user: UserProfile, candidates: UserProfile[]): UserProfile[] {
    return candidates.filter(candidate => {
      // Filtro de idade
      const ageValid = candidate.age >= user.preferences.ageRange[0] && 
                      candidate.age <= user.preferences.ageRange[1];
      
      // Filtro de gênero
      const genderValid = user.preferences.genderPreference.length === 0 ||
                         user.preferences.genderPreference.includes(candidate.gender);
      
      // Filtro de distância
      const distance = this.calculateDistance(user.location, candidate.location);
      const distanceValid = distance <= user.preferences.maxDistance;

      return ageValid && genderValid && distanceValid && candidate.id !== user.id;
    });
  }

  // Algoritmo híbrido (recomendado)
  private async hybridRecommendation(
    user: UserProfile, 
    candidates: UserProfile[]
  ): Promise<MatchScore[]> {
    const matches: MatchScore[] = [];

    for (const candidate of candidates) {
      const styleScore = this.calculateStyleCompatibility(user, candidate);
      const emotionalScore = this.calculateEmotionalCompatibility(user, candidate);
      const hobbyScore = this.calculateHobbyCompatibility(user, candidate);
      const locationScore = this.calculateLocationScore(user, candidate);
      const personalityScore = this.calculatePersonalityMatch(user, candidate);

      const totalScore = 
        styleScore * this.weights.style +
        emotionalScore * this.weights.emotional +
        hobbyScore * this.weights.hobby +
        locationScore * this.weights.location +
        personalityScore * this.weights.personality;

      const explanation = this.generateExplanation({
        styleScore,
        emotionalScore,
        hobbyScore,
        locationScore,
        personalityScore
      });

      matches.push({
        userId: candidate.id,
        totalScore: Math.round(totalScore * 100) / 100,
        breakdown: {
          styleCompatibility: styleScore,
          emotionalCompatibility: emotionalScore,
          hobbyCompatibility: hobbyScore,
          locationScore,
          personalityMatch: personalityScore
        },
        explanation
      });
    }

    return matches;
  }

  // Cálculo de compatibilidade de estilo
  private calculateStyleCompatibility(user: UserProfile, candidate: UserProfile): number {
    const categories = ['tenis', 'roupas', 'cores'] as const;
    let totalScore = 0;

    for (const category of categories) {
      const userChoices = user.stylePreferences[category];
      const candidateChoices = candidate.stylePreferences[category];
      
      // Cálculo de Jaccard Similarity
      const intersection = userChoices.filter(choice => candidateChoices.includes(choice));
      const union = [...new Set([...userChoices, ...candidateChoices])];
      
      const jaccardScore = intersection.length / union.length;
      totalScore += jaccardScore;
    }

    return totalScore / categories.length;
  }

  // Cálculo de compatibilidade emocional
  private calculateEmotionalCompatibility(user: UserProfile, candidate: UserProfile): number {
    // Usa o vetor emocional para calcular similaridade cosseno
    return this.cosineSimilarity(user.emotionalProfile, candidate.emotionalProfile);
  }

  // Cálculo de compatibilidade de hobbies
  private calculateHobbyCompatibility(user: UserProfile, candidate: UserProfile): number {
    const userHobbies = user.stylePreferences.hobbies;
    const candidateHobbies = candidate.stylePreferences.hobbies;
    
    const commonHobbies = userHobbies.filter(hobby => candidateHobbies.includes(hobby));
    const totalUniqueHobbies = new Set([...userHobbies, ...candidateHobbies]).size;
    
    // Pontuação extra para hobbies em comum
    const commonScore = commonHobbies.length / Math.max(userHobbies.length, candidateHobbies.length);
    
    // Pontuação para compatibilidade de nível de atividade
    const activityDiff = Math.abs(user.activityLevel - candidate.activityLevel) / 10;
    const activityScore = 1 - activityDiff;
    
    return (commonScore * 0.7) + (activityScore * 0.3);
  }

  // Cálculo de score de localização
  private calculateLocationScore(user: UserProfile, candidate: UserProfile): number {
    const distance = this.calculateDistance(user.location, candidate.location);
    const maxDistance = user.preferences.maxDistance;
    
    // Score decresce exponencialmente com a distância
    return Math.exp(-distance / (maxDistance * 0.5));
  }

  // Cálculo de compatibilidade de personalidade
  private calculatePersonalityMatch(user: UserProfile, candidate: UserProfile): number {
    return this.cosineSimilarity(user.personalityVector, candidate.personalityVector);
  }

  // Utilitários matemáticos
  private cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) return 0;
    
    const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
    const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private calculateDistance(loc1: {lat: number, lng: number}, loc2: {lat: number, lng: number}): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.deg2rad(loc2.lat - loc1.lat);
    const dLon = this.deg2rad(loc2.lng - loc1.lng);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(loc1.lat)) * Math.cos(this.deg2rad(loc2.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Geração de explicações para o usuário
  private generateExplanation(scores: {
    styleScore: number;
    emotionalScore: number;
    hobbyScore: number;
    locationScore: number;
    personalityScore: number;
  }): string[] {
    const explanations: string[] = [];
    
    if (scores.styleScore > 0.7) {
      explanations.push("Vocês têm gostos muito similares em moda e estilo");
    } else if (scores.styleScore > 0.5) {
      explanations.push("Alguns pontos em comum no estilo de vestir");
    }
    
    if (scores.emotionalScore > 0.6) {
      explanations.push("Perfil emocional compatível");
    }
    
    if (scores.hobbyScore > 0.6) {
      explanations.push("Hobbies e interesses em comum");
    }
    
    if (scores.locationScore > 0.8) {
      explanations.push("Vocês moram bem próximos");
    } else if (scores.locationScore > 0.5) {
      explanations.push("Localização na mesma região");
    }
    
    if (scores.personalityScore > 0.7) {
      explanations.push("Personalidades muito compatíveis");
    }
    
    return explanations;
  }

  // Filtragem colaborativa (baseada em comportamento de usuários similares)
  private async collaborativeFiltering(
    user: UserProfile, 
    candidates: UserProfile[]
  ): Promise<MatchScore[]> {
    // Implementação simplificada - em produção, usar dados de interações
    // (curtidas, matches, tempo de visualização, etc.)
    
    const userSimilarity = await this.findSimilarUsers(user);
    const matches: MatchScore[] = [];
    
    for (const candidate of candidates) {
      // Score baseado em como usuários similares interagiram com este candidato
      let score = 0;
      
      // Simulação: pontuação baseada em características compartilhadas
      const styleMatch = this.calculateStyleCompatibility(user, candidate);
      const emotionalMatch = this.calculateEmotionalCompatibility(user, candidate);
      
      score = (styleMatch * 0.6) + (emotionalMatch * 0.4);
      
      matches.push({
        userId: candidate.id,
        totalScore: score,
        breakdown: {
          styleCompatibility: styleMatch,
          emotionalCompatibility: emotionalMatch,
          hobbyCompatibility: 0,
          locationScore: 0,
          personalityMatch: 0
        },
        explanation: ["Baseado em usuários com perfil similar ao seu"]
      });
    }
    
    return matches;
  }

  // Filtragem baseada em conteúdo
  private contentBasedFiltering(
    user: UserProfile, 
    candidates: UserProfile[]
  ): Promise<MatchScore[]> {
    // Foca apenas nas características do perfil do usuário
    const matches: MatchScore[] = [];
    
    for (const candidate of candidates) {
      const styleScore = this.calculateStyleCompatibility(user, candidate);
      const hobbyScore = this.calculateHobbyCompatibility(user, candidate);
      
      const totalScore = (styleScore * 0.7) + (hobbyScore * 0.3);
      
      matches.push({
        userId: candidate.id,
        totalScore,
        breakdown: {
          styleCompatibility: styleScore,
          emotionalCompatibility: 0,
          hobbyCompatibility: hobbyScore,
          locationScore: 0,
          personalityMatch: 0
        },
        explanation: ["Baseado nas suas preferências de estilo"]
      });
    }
    
    return Promise.resolve(matches);
  }

  private async findSimilarUsers(user: UserProfile): Promise<string[]> {
    // Em produção, implementar busca por usuários com perfis similares
    // usando clustering ou other ML techniques
    return [];
  }
}

export default RecommendationEngine;