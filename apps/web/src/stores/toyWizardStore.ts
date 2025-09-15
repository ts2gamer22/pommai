import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Toy creation wizard steps
 */
export type WizardStep = 
  | 'welcome'
  | 'toyProfile'
  | 'forKidsToggle'
  | 'personality'
  | 'voice'
  | 'knowledge'
  | 'safety'
  | 'assignChild'
  | 'device'
  | 'review'
  | 'completion';

/**
 * Personality traits configuration
 */
interface PersonalityTraits {
  traits: string[]; // max 3
  speakingStyle: {
    vocabulary: 'simple' | 'moderate' | 'advanced';
    sentenceLength: 'short' | 'medium' | 'long';
    usesSoundEffects: boolean;
    catchPhrases: string[];
  };
  interests: string[];
  favoriteTopics: string[];
  avoidTopics: string[];
  behavior: {
    encouragesQuestions: boolean;
    tellsStories: boolean;
    playsGames: boolean;
    educationalFocus: number; // 0-10
    imaginationLevel: number; // 0-10
  };
}

/**
 * Knowledge base configuration
 */
interface KnowledgeBase {
  toyBackstory: {
    origin: string;
    personality: string;
    specialAbilities: string[];
    favoriteThings: string[];
  };
  familyInfo?: {
    members: Array<{
      name: string;
      relationship: string;
      facts: string[];
    }>;
    pets: Array<{
      name: string;
      type: string;
      facts: string[];
    }>;
    importantDates: Array<{
      date: string;
      event: string;
    }>;
  };
  customFacts: Array<{
    category: string;
    fact: string;
    importance: 'high' | 'medium' | 'low';
  }>;
}

/**
 * Safety settings for Guardian Mode
 */
interface SafetySettings {
  safetyLevel: 'strict' | 'moderate' | 'relaxed';
  contentFilters: {
    enabledCategories: string[];
    customBlockedTopics: string[];
  };
}

/**
 * Complete toy configuration
 */
interface ToyConfig {
  // Basic info
  name: string;
  type: string;
  isForKids: boolean;
  ageGroup?: '3-5' | '6-8' | '9-12';
  
  // Assignment (optional)
  assignedChildId?: string;
  
  // Voice
  voiceId: string;
  voiceName?: string;
  
  // Personality
  personalityPrompt: string;
  personalityTraits: PersonalityTraits;
  
  // Knowledge
  knowledgeBase?: KnowledgeBase;
  
  // Safety (for Kids mode)
  safetySettings?: SafetySettings;
  
  // Meta
  isPublic: boolean;
  tags: string[];
}

/**
 * Wizard store state
 */
interface ToyWizardState {
  // Current step
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  
  // Toy configuration
  toyConfig: ToyConfig;
  
  // Validation errors
  errors: Record<string, string>;
  
  // Loading states
  isCreating: boolean;
  
  // Actions
  setCurrentStep: (step: WizardStep) => void;
  markStepCompleted: (step: WizardStep) => void;
  setToyConfig: (config: Partial<ToyConfig>) => void;
  updateToyConfig: <K extends keyof ToyConfig>(key: K, value: ToyConfig[K]) => void;
  updatePersonalityTraits: (traits: Partial<PersonalityTraits>) => void;
  updateKnowledgeBase: (kb: Partial<KnowledgeBase>) => void;
  updateSafetySettings: (settings: Partial<SafetySettings>) => void;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
  setIsCreating: (isCreating: boolean) => void;
  resetWizard: () => void;
  canProceedToStep: (step: WizardStep) => boolean;
}

/**
 * Default toy configuration
 */
const defaultToyConfig: ToyConfig = {
  name: '',
  type: '',
  isForKids: false,
  voiceId: '',
  personalityPrompt: '',
  personalityTraits: {
    traits: [],
    speakingStyle: {
      vocabulary: 'moderate',
      sentenceLength: 'medium',
      usesSoundEffects: false,
      catchPhrases: [],
    },
    interests: [],
    favoriteTopics: [],
    avoidTopics: [],
    behavior: {
      encouragesQuestions: true,
      tellsStories: true,
      playsGames: true,
      educationalFocus: 5,
      imaginationLevel: 5,
    },
  },
  isPublic: false,
  tags: [],
};

/**
 * Step dependencies for validation
 */
const stepDependencies: Record<WizardStep, WizardStep[]> = {
  welcome: [],
  toyProfile: ['welcome'],
  forKidsToggle: ['toyProfile'],
  personality: ['forKidsToggle'],
  voice: ['personality'],
  knowledge: ['voice'],
  safety: ['knowledge'],
  assignChild: ['safety'],
  device: ['assignChild'],
  review: ['device'],
  completion: ['review'],
};

/**
 * Create the toy wizard store
 */
export const useToyWizardStore = create<ToyWizardState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStep: 'welcome',
      completedSteps: [],
      toyConfig: defaultToyConfig,
      errors: {},
      isCreating: false,

      // Actions
      setCurrentStep: (step) => {
        const state = get();
        if (state.canProceedToStep(step)) {
          set({ currentStep: step });
        }
      },

      markStepCompleted: (step) => {
        set((state) => ({
          completedSteps: [...new Set([...state.completedSteps, step])],
        }));
      },

      setToyConfig: (config) => {
        set((state) => ({
          toyConfig: {
            ...defaultToyConfig,
            ...config,
            personalityTraits: config.personalityTraits ? {
              ...defaultToyConfig.personalityTraits,
              ...config.personalityTraits,
            } : state.toyConfig.personalityTraits,
            safetySettings: config.safetySettings ? {
              ...state.toyConfig.safetySettings,
              ...config.safetySettings,
            } : state.toyConfig.safetySettings,
            knowledgeBase: config.knowledgeBase ? {
              ...state.toyConfig.knowledgeBase,
              ...config.knowledgeBase,
            } : state.toyConfig.knowledgeBase,
          },
        }));
      },

      updateToyConfig: (key, value) => {
        set((state) => ({
          toyConfig: {
            ...state.toyConfig,
            [key]: value,
          },
        }));
      },

      updatePersonalityTraits: (traits) => {
        set((state) => ({
          toyConfig: {
            ...state.toyConfig,
            personalityTraits: {
              ...state.toyConfig.personalityTraits,
              ...traits,
              speakingStyle: traits.speakingStyle
                ? { ...state.toyConfig.personalityTraits.speakingStyle, ...traits.speakingStyle }
                : state.toyConfig.personalityTraits.speakingStyle,
              behavior: traits.behavior
                ? { ...state.toyConfig.personalityTraits.behavior, ...traits.behavior }
                : state.toyConfig.personalityTraits.behavior,
            },
          },
        }));
      },

      updateKnowledgeBase: (kb) => {
        set((state) => ({
          toyConfig: {
            ...state.toyConfig,
            knowledgeBase: state.toyConfig.knowledgeBase
              ? {
                  ...state.toyConfig.knowledgeBase,
                  ...kb,
                  toyBackstory: kb.toyBackstory
                    ? { ...state.toyConfig.knowledgeBase.toyBackstory, ...kb.toyBackstory }
                    : state.toyConfig.knowledgeBase.toyBackstory,
                  familyInfo: kb.familyInfo
                    ? { ...state.toyConfig.knowledgeBase.familyInfo, ...kb.familyInfo }
                    : state.toyConfig.knowledgeBase.familyInfo,
                }
              : {
                  toyBackstory: {
                    origin: '',
                    personality: '',
                    specialAbilities: [],
                    favoriteThings: [],
                  },
                  customFacts: [],
                  ...kb,
                },
          },
        }));
      },

      updateSafetySettings: (settings) => {
        set((state) => ({
          toyConfig: {
            ...state.toyConfig,
            safetySettings: state.toyConfig.safetySettings
              ? {
                  ...state.toyConfig.safetySettings,
                  ...settings,
                  contentFilters: settings.contentFilters
                    ? {
                        ...state.toyConfig.safetySettings.contentFilters,
                        ...settings.contentFilters,
                      }
                    : state.toyConfig.safetySettings.contentFilters,
                }
              : {
                  safetyLevel: 'moderate',
                  contentFilters: {
                    enabledCategories: [],
                    customBlockedTopics: [],
                  },
                  ...settings,
                },
          },
        }));
      },

      setError: (field, error) => {
        set((state) => ({
          errors: {
            ...state.errors,
            [field]: error,
          },
        }));
      },

      clearError: (field) => {
        set((state) => {
          const { [field]: _, ...rest } = state.errors;
          return { errors: rest };
        });
      },

      clearAllErrors: () => {
        set({ errors: {} });
      },

      setIsCreating: (isCreating) => {
        set({ isCreating });
      },

      resetWizard: () => {
        set({
          currentStep: 'welcome',
          completedSteps: [],
          toyConfig: defaultToyConfig,
          errors: {},
          isCreating: false,
        });
      },

      canProceedToStep: (step) => {
        const state = get();
        const requiredSteps = stepDependencies[step];
        return requiredSteps.every((s) => state.completedSteps.includes(s));
      },
    }),
    {
      name: 'toy-wizard-storage',
      partialize: (state) => ({
        toyConfig: state.toyConfig,
        completedSteps: state.completedSteps,
        currentStep: state.currentStep,
      }),
    }
  )
);
