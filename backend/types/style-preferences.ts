// types/style-preferences.ts - Tipagens para sistema de preferências de estilo

// ==============================================
// INTERFACES PRINCIPAIS
// ==============================================

/**
 * Estrutura base das preferências de estilo
 */
export interface StylePreferences {
  tenis: number[];
  roupas: number[];
  cores: number[];
  hobbies: number[];
  sentimentos: number[];
}

/**
 * Metadados de completude do perfil
 */
export interface CompletionStatus {
  completed: boolean;
  totalCategories: number;
  completedCategories: number;
  completionPercentage: number;
  totalChoices?: number;
  averageChoicesPerCategory?: number;
}

/**
 * Metadados do perfil
 */
export interface ProfileMetadata {
  profileId: number;
  createdAt: string;
  updatedAt: string;
  isNew?: boolean;
  isNewProfile?: boolean;
  totalUpdates?: number;
  cleared?: boolean;
}

/**
 * Dados do usuário básicos
 */
export interface UserData {
  id: string;
  email: string;
  phone?: string;
  created_at: string;
}

// ==============================================
// RESPONSES DA API
// ==============================================

/**
 * Response padrão da API
 */
export interface BaseApiResponse {
  success: boolean;
  processingTime: number;
  message?: string;
}

/**
 * Response de erro da API
 */
export interface ApiErrorResponse extends BaseApiResponse {
  success: false;
  error: string;
  code: string;
}

/**
 * Response de busca de preferências
 */
export interface StylePreferencesGetResponse extends BaseApiResponse {
  success: true;
  data: {
    userId: string;
    preferences: StylePreferences;
    completionStatus: CompletionStatus;
    metadata: ProfileMetadata;
  };
}

/**
 * Response de atualização de preferências
 */
export interface StylePreferencesUpdateResponse extends BaseApiResponse {
  success: true;
  data: {
    userId: string;
    preferences: StylePreferences;
    completionStatus: CompletionStatus;
    metadata: ProfileMetadata;
  };
  message: string;
}

/**
 * Response de atualização de categoria específica
 */
export interface CategoryUpdateResponse extends BaseApiResponse {
  success: true;
  data: {
    userId: string;
    category: keyof StylePreferences;
    choices: number[];
    allPreferences: StylePreferences;
    metadata: ProfileMetadata;
  };
  message: string;
}

/**
 * Response de remoção de preferências
 */
export interface StylePreferencesDeleteResponse extends BaseApiResponse {
  success: true;
  data: {
    userId: string;
    preferences: StylePreferences;
    metadata: ProfileMetadata;
  };
  message: string;
}

// ==============================================
// REQUESTS DA API
// ==============================================

/**
 * Request para atualização completa de preferências
 */
export interface StylePreferencesUpdateRequest {
  preferences: StylePreferences;
}

/**
 * Request para atualização de categoria específica
 */
export interface CategoryUpdateRequest {
  choices: number[];
}

// ==============================================
// DADOS DE QUESTIONÁRIO
// ==============================================

/**
 * Opção de uma questão de estilo
 */
export interface StyleOption {
  id: string;
  value: number;
  label: string;
  imageUrl?: string;
  description?: string;
}

/**
 * Questão de estilo
 */
export interface StyleQuestion {
  id: string;
  category: keyof StylePreferences;
  question: string;
  description?: string;
  options: StyleOption[];
  multiple?: boolean;
  required?: boolean;
}

/**
 * Grupo de questões por categoria
 */
export interface StyleQuestionGroup {
  category: keyof StylePreferences;
  title: string;
  description?: string;
  questions: StyleQuestion[];
}

// ==============================================
// ESTADO DA APLICAÇÃO
// ==============================================

/**
 * Estados de carregamento
 */
export interface LoadingState {
  fetching: boolean;
  saving: boolean;
  updating: boolean;
  deleting?: boolean;
}

/**
 * Estados de erro
 */
export interface ErrorState {
  fetch: string | null;
  save: string | null;
  update: string | null;
  delete?: string | null;
}

/**
 * Estado das opções selecionadas na UI
 */
export interface SelectedOptionsState {
  [key: string]: number | number[]; // key: "category_questionId"
}

/**
 * Estatísticas de progresso
 */
export interface ProgressStats {
  totalQuestions: number;
  answeredQuestions: number;
  completionPercentage: number;
  categoriesCompleted: string[];
  categoriesPending: string[];
}

// ==============================================
// HOOKS E UTILITÁRIOS
// ==============================================

/**
 * Return type do hook useStylePreferences
 */
export interface UseStylePreferencesReturn {
  preferences: StylePreferences;
  loading: LoadingState;
  errors: ErrorState;
  completionStats: CompletionStatus;
  
  // Funções
  fetchPreferences: () => Promise<void>;
  updatePreferences: (prefs: StylePreferences) => Promise<void>;
  updateCategory: (category: keyof StylePreferences, choices: number[]) => Promise<void>;
  clearPreferences: () => Promise<void>;
  
  // Estado derivado
  isLoading: boolean;
  hasErrors: boolean;
  isCompleted: boolean;
}

/**
 * Parâmetros para validação de preferências
 */
export interface ValidationParams {
  preferences: StylePreferences;
  strict?: boolean;
  requiredCategories?: (keyof StylePreferences)[];
}

/**
 * Resultado de validação
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingCategories: (keyof StylePreferences)[];
}

// ==============================================
// CONFIGURAÇÕES
// ==============================================

/**
 * Configurações do sistema de preferências
 */
export interface StylePreferencesConfig {
  maxChoicesPerCategory: number;
  minChoicesPerCategory: number;
  requireAllCategories: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
  validationStrict: boolean;
}

/**
 * Constantes do sistema
 */
export const STYLE_CATEGORIES = ['tenis', 'roupas', 'cores', 'hobbies', 'sentimentos'] as const;

export const DEFAULT_STYLE_PREFERENCES: StylePreferences = {
  tenis: [],
  roupas: [],
  cores: [],
  hobbies: [],
  sentimentos: []
};

export const DEFAULT_COMPLETION_STATUS: CompletionStatus = {
  completed: false,
  totalCategories: 5,
  completedCategories: 0,
  completionPercentage: 0
};

// ==============================================
// TYPE GUARDS E VALIDADORES
// ==============================================

/**
 * Type guard para verificar se é uma resposta de sucesso
 */
export function isStylePreferencesSuccess(
  response: StylePreferencesGetResponse | ApiErrorResponse
): response is StylePreferencesGetResponse {
  return response.success === true;
}

/**
 * Type guard para verificar se é uma categoria válida
 */
export function isValidStyleCategory(category: string): category is keyof StylePreferences {
  return STYLE_CATEGORIES.includes(category as keyof StylePreferences);
}

/**
 * Type guard para verificar se preferências são válidas
 */
export function isValidStylePreferences(data: any): data is StylePreferences {
  if (!data || typeof data !== 'object') return false;
  
  return STYLE_CATEGORIES.every(category => 
    data[category] && 
    Array.isArray(data[category]) &&
    data[category].every((item: any) => typeof item === 'number')
  );
}

// ==============================================
// UTILITÁRIOS DE TRANSFORMAÇÃO
// ==============================================

/**
 * Converte preferências do formato backend para frontend
 */
export function transformBackendPreferences(backendData: any): StylePreferences {
  const transformed: StylePreferences = { ...DEFAULT_STYLE_PREFERENCES };
  
  STYLE_CATEGORIES.forEach(category => {
    if (backendData[category] && Array.isArray(backendData[category])) {
      transformed[category] = backendData[category].filter(
        (item: any) => typeof item === 'number' && item > 0
      );
    }
  });
  
  return transformed;
}

/**
 * Calcula estatísticas de completude
 */
export function calculateCompletionStats(preferences: StylePreferences): CompletionStatus {
  const completedCategories = STYLE_CATEGORIES.filter(
    category => preferences[category] && preferences[category].length > 0
  );
  
  const totalChoices = STYLE_CATEGORIES.reduce(
    (sum, category) => sum + (preferences[category]?.length || 0), 
    0
  );
  
  return {
    completed: completedCategories.length === STYLE_CATEGORIES.length,
    totalCategories: STYLE_CATEGORIES.length,
    completedCategories: completedCategories.length,
    completionPercentage: Math.round((completedCategories.length / STYLE_CATEGORIES.length) * 100),
    totalChoices,
    averageChoicesPerCategory: Math.round(totalChoices / STYLE_CATEGORIES.length)
  };
}

/**
 * Sanitiza preferências removendo valores inválidos
 */
export function sanitizeStylePreferences(preferences: Partial<StylePreferences>): StylePreferences {
  const sanitized: StylePreferences = { ...DEFAULT_STYLE_PREFERENCES };
  
  STYLE_CATEGORIES.forEach(category => {
    if (preferences[category] && Array.isArray(preferences[category])) {
      sanitized[category] = [...new Set(
        preferences[category]!.filter(
          item => typeof item === 'number' && item > 0 && item <= 100
        )
      )];
    }
  });
  
  return sanitized;
}

// ==============================================
// EXTENSÕES PARA TIPOS EXISTENTES
// ==============================================

/**
 * Extensão do UserProfile existente para incluir preferências de estilo
 */
declare module '../types/recommendation' {
  interface UserProfile {
    stylePreferences?: StylePreferences;
  }
}

/**
 * Extensão da resposta da API de perfil
 */
export interface ExtendedProfileResponse {
  userId: string;
  email: string;
  stylePreferences: StylePreferences;
  completionStatus: CompletionStatus;
  metadata: ProfileMetadata & {
    lastStyleUpdate?: string;
    styleCompletionHistory?: Array<{
      date: string;
      percentage: number;
    }>;
  };
}