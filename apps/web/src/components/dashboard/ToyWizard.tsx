'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useToyWizardStore, type WizardStep } from '@/stores/toyWizardStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
    completedSteps,
    toyConfig,
    setCurrentStep,
    markStepCompleted,
    canProceedToStep,
    resetWizard,
  } = useToyWizardStore();

  const currentStepIndex = WIZARD_STEPS.indexOf(currentStep);
  const progressPercentage = ((currentStepIndex + 1) / WIZARD_STEPS.length) * 100;

  const handleNext = () => {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Create Your AI Toy
            </h1>
            {currentStep !== 'completion' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExit}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
          
          {/* Progress bar */}
          {currentStep !== 'completion' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{STEP_TITLES[currentStep]}</span>
                <span>Step {currentStepIndex + 1} of {WIZARD_STEPS.length - 1}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}
        </div>

        {/* Main content */}
        <Card className="p-6 md:p-8">
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
          <div className="mt-8 flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={!canGoNext()}
              className="flex items-center gap-2"
            >
              {currentStep === 'review' ? 'Create Toy' : 'Next'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Exit confirmation dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Toy Creation?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will be saved. You can continue creating this toy later from where you left off.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Creating</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExit}>
              Exit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
