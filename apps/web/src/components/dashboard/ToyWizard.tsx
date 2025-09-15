'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useToyWizardStore, type WizardStep } from '@/stores/toyWizardStore';
import { Button, ProgressBar, Card, Popup } from '@pommai/ui';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

// Import step components (to be created)
import { WelcomeStep } from './steps/WelcomeStep';
import { ToyProfileStep } from './steps/ToyProfileStep';
import { ForKidsToggleStep } from './steps/ForKidsToggleStep';
import { PersonalityStep } from './steps/PersonalityStep';
import { VoiceStep } from './steps/VoiceStep';
import { KnowledgeStep } from './steps/KnowledgeStep';
import { SafetyStep } from './steps/SafetyStep';
import { DeviceStep } from './steps/DeviceStep';
import { ReviewStep } from './steps/ReviewStep';
import { CompletionStep } from './steps/CompletionStep';

const WIZARD_STEPS: WizardStep[] = [
  'welcome',
  'toyProfile',
  'forKidsToggle',
  'personality',
  'voice',
  'knowledge',
  'safety',
  'device',
  'review',
  'completion',
];

const STEP_TITLES: Record<WizardStep, string> = {
  welcome: 'Welcome',
  toyProfile: 'Toy Profile',
  forKidsToggle: 'Kids Mode',
  personality: 'Personality',
  voice: 'Voice Selection',
  knowledge: 'Knowledge Base',
  safety: 'Safety Settings',
  device: 'Device Pairing',
  review: 'Review & Create',
  completion: 'Success!',
};

const StepComponent: Record<WizardStep, React.ComponentType> = {
  welcome: WelcomeStep,
  toyProfile: ToyProfileStep,
  forKidsToggle: ForKidsToggleStep,
  personality: PersonalityStep,
  voice: VoiceStep,
  knowledge: KnowledgeStep,
  safety: SafetyStep,
  device: DeviceStep,
  review: ReviewStep,
  completion: CompletionStep,
};

export function ToyWizard() {
  const router = useRouter();
  const [showExitDialog, setShowExitDialog] = useState(false);
  
  const {
    currentStep,
    toyConfig,
    setCurrentStep,
    markStepCompleted,
    resetWizard,
    setIsCreating,
  } = useToyWizardStore();
  

  const createToy = useMutation(api.toys.createToy);
  const upsertKnowledgeBase = useMutation(api.knowledgeBase.upsertKnowledgeBase);

  const currentStepIndex = WIZARD_STEPS.indexOf(currentStep);
  const progressPercentage = ((currentStepIndex + 1) / WIZARD_STEPS.length) * 100;

  const handleNext = async () => {
    // Special handling for review step - actually create the toy
    if (currentStep === 'review') {
      try {
        setIsCreating(true);

        // Map safety settings to mutation args
        const safetyLevel = toyConfig.safetySettings?.safetyLevel;
        const contentFilters = toyConfig.safetySettings?.contentFilters;

        // Persist the toy in Convex
        const toyId = await createToy({
          name: toyConfig.name,
          type: toyConfig.type,
          isForKids: toyConfig.isForKids,
          ageGroup: toyConfig.ageGroup,
          voiceId: toyConfig.voiceId,
          personalityPrompt: toyConfig.personalityPrompt,
          personalityTraits: toyConfig.personalityTraits,
          safetyLevel,
          contentFilters,
          isPublic: toyConfig.isPublic,
          tags: toyConfig.tags,
        });

        // Optionally upsert knowledge base if provided by the wizard
        if (toyConfig.knowledgeBase) {
          const kb = toyConfig.knowledgeBase;
          const hasContent = (
            (kb.toyBackstory.origin?.trim()?.length ?? 0) > 0 ||
            (kb.toyBackstory.personality?.trim()?.length ?? 0) > 0 ||
            (kb.toyBackstory.specialAbilities?.length ?? 0) > 0 ||
            (kb.toyBackstory.favoriteThings?.length ?? 0) > 0 ||
            (kb.customFacts?.length ?? 0) > 0 ||
            (kb.familyInfo?.members?.length ?? 0) > 0 ||
            (kb.familyInfo?.pets?.length ?? 0) > 0 ||
            (kb.familyInfo?.importantDates?.length ?? 0) > 0
          );
          if (hasContent) {
            await upsertKnowledgeBase({
              toyId,
              toyBackstory: kb.toyBackstory,
              familyInfo: kb.familyInfo,
              customFacts: kb.customFacts ?? [],
            });
          }
        }
      } catch (err) {
        console.error('Failed to create toy:', err);
      } finally {
        setIsCreating(false);
      }
    }
    
    markStepCompleted(currentStep);
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < WIZARD_STEPS.length) {
      setCurrentStep(WIZARD_STEPS[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(WIZARD_STEPS[prevIndex]);
    }
  };

  const handleExit = () => {
    setShowExitDialog(true);
  };

  const confirmExit = () => {
    resetWizard();
    router.push('/dashboard');
  };

  const canGoNext = () => {
    // Step-specific validation logic
    switch (currentStep) {
      case 'welcome':
        return true;
      case 'toyProfile':
        return toyConfig.name.trim() !== '' && toyConfig.type !== '';
      case 'forKidsToggle':
        return true;
      case 'personality':
        return toyConfig.personalityPrompt.trim() !== '' && 
               toyConfig.personalityTraits.traits.length > 0;
      case 'voice':
        return toyConfig.voiceId !== '';
      case 'knowledge':
        return true; // Optional step
      case 'safety':
        return !toyConfig.isForKids || toyConfig.safetySettings !== undefined;
      case 'device':
        return true; // Can skip device pairing
      case 'review':
        return true;
      case 'completion':
        return false;
      default:
        return false;
    }
  };

  const CurrentStepComponent = StepComponent[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fefcd0] to-[#f4e5d3] py-[var(--spacing-lg)] sm:py-[var(--spacing-xl)] toy-wizard">
      <div className="max-w-4xl mx-auto px-[var(--spacing-md)]">
        {/* Header */}
        <div className="mb-[var(--spacing-xl)] sm:mb-[var(--spacing-2xl)]">
          <div className="flex items-center justify-between mb-[var(--spacing-lg)] sm:mb-[var(--spacing-xl)]">
            <div className="text-center sm:text-left">
              <h1 className="font-minecraft text-base sm:text-lg lg:text-xl font-black mb-3 uppercase tracking-wider text-gray-800"
                style={{
                  textShadow: '2px 2px 0 #c381b5, 4px 4px 0 #92cd41'
                }}
              >
                🧸 Create Your AI Toy
              </h1>
              <p className="font-geo text-sm sm:text-base font-medium text-gray-600 leading-relaxed">Design the perfect companion!</p>
            </div>
            {currentStep !== 'completion' && (
              <Button
                bg="#ff6b6b"
                textColor="white"
                borderColor="black"
                shadow="#e84545"
                onClick={handleExit}
                className="py-2 px-3 text-sm font-minecraft font-black uppercase tracking-wider hover-lift"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          {/* Progress bar */}
          {currentStep !== 'completion' && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-geo font-medium text-gray-700">
                <span className="font-geo">{STEP_TITLES[currentStep]}</span>
                <span className="font-geo">Step {currentStepIndex + 1} of {WIZARD_STEPS.length - 1}</span>
              </div>
              <ProgressBar 
                progress={progressPercentage} 
                color="#c381b5"
                borderColor="black"
                className="shadow-[0_2px_0_2px_#8b5fa3]"
              />
            </div>
          )}
        </div>

        {/* Main content */}
          <Card 
          bg="#ffffff" 
          borderColor="black" 
          shadowColor="#c381b5"
          className="p-[var(--spacing-lg)] sm:p-[var(--spacing-xl)] lg:p-[var(--spacing-2xl)] hover-lift transition-transform"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CurrentStepComponent />
            </motion.div>
          </AnimatePresence>
        </Card>

        {/* Navigation buttons */}
        {currentStep !== 'completion' && (
          <div className="mt-[var(--spacing-xl)] sm:mt-[var(--spacing-2xl)] flex flex-col sm:flex-row justify-between gap-[var(--spacing-md)]">
            <Button
              bg={currentStepIndex === 0 ? "#f0f0f0" : "#ffffff"}
              textColor={currentStepIndex === 0 ? "#999" : "black"}
              borderColor="black"
              shadow={currentStepIndex === 0 ? "#d0d0d0" : "#e0e0e0"}
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className={`flex items-center gap-2 py-3 px-6 sm:px-8 font-minecraft font-black uppercase tracking-wider transition-all ${
                currentStepIndex === 0 ? 'cursor-not-allowed' : 'hover-lift'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            
            <Button
              bg={canGoNext() ? "#92cd41" : "#f0f0f0"}
              textColor={canGoNext() ? "white" : "#999"}
              borderColor="black"
              shadow={canGoNext() ? "#76a83a" : "#d0d0d0"}
              onClick={handleNext}
              disabled={!canGoNext()}
              className={`flex items-center gap-2 py-3 px-6 sm:px-8 font-minecraft font-black uppercase tracking-wider transition-all ${
                canGoNext() ? 'hover-lift' : 'cursor-not-allowed'
              }`}
            >
              <span>{currentStep === 'review' ? '✨ Create Toy' : 'Next'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Exit confirmation popup */}
      {showExitDialog && (
        <Popup
          isOpen={showExitDialog}
          onClose={() => setShowExitDialog(false)}
          title="🚪 Exit Toy Creation?"
          bg="#ffffff"
          borderColor="black"
          className="max-w-md"
        >
          <div className="space-y-4">
            <p className="font-geo text-gray-700 font-semibold">
              Your progress will be saved automatically. You can continue creating this toy later from where you left off.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                bg="#f0f0f0"
                textColor="black"
                borderColor="black"
                shadow="#d0d0d0"
                onClick={() => setShowExitDialog(false)}
                className="flex-1 py-2 px-4 font-minecraft font-black uppercase tracking-wider hover-lift"
              >
                Continue Creating
              </Button>
              <Button
                bg="#ff6b6b"
                textColor="white"
                borderColor="black"
                shadow="#e84545"
                onClick={confirmExit}
                className="flex-1 py-2 px-4 font-minecraft font-black uppercase tracking-wider hover-lift"
              >
                Exit
              </Button>
            </div>
          </div>
        </Popup>
      )}
    </div>
  );
}
