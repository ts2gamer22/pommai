'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useToyWizardStore } from '@/stores/toyWizardStore';
import { useToysStore, ToyType } from '@/stores/useToysStore';
import { Button, Card } from '@pommai/ui';
import { 
  CheckCircle2, 
  MessageSquare, 
  Settings, 
  Share2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

/**
 * CompletionStep
 *
 * Displays the final success screen after creating a toy.
 * Typography rules:
 * - Primary title uses font-minecraft (pixel) with compact responsive sizes.
 * - All supporting text uses font-geo for readability.
 */
export function CompletionStep() {
  const router = useRouter();
  const { toyConfig, resetWizard } = useToyWizardStore();
  const { addToy } = useToysStore();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Add the newly created toy to the toys store
      const newToy = {
      _id: `toy_${Date.now()}`, // Generate a temporary ID
      name: toyConfig.name,
      type: toyConfig.type as unknown as ToyType,
      status: 'active' as const,
      isForKids: toyConfig.isForKids,
      voiceId: toyConfig.voiceId,
      voiceName: toyConfig.voiceName,
      personalityPrompt: toyConfig.personalityPrompt,
      isPublic: toyConfig.isPublic,
      tags: toyConfig.tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      conversationCount: 0,
      messageCount: 0,
      lastActiveAt: undefined,
      deviceId: undefined,
    };
    
    addToy(newToy);
    
    // Trigger confetti animation
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: ReturnType<typeof setInterval> = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const handleStartChatting = () => {
    // In real app, would navigate to the chat interface with the new toy
    resetWizard();
    router.push(`/dashboard/chat?toy=${toyConfig.name}`);
  };

  const handleGoToDashboard = () => {
    resetWizard();
    router.push('/dashboard');
  };

  const getToyTypeIcon = () => {
    const icons: Record<string, string> = {
      teddy: '🧸',
      bunny: '🐰',
      cat: '🐱',
      dog: '🐶',
      bird: '🦜',
      fish: '🐠',
      robot: '🤖',
      magical: '✨',
    };
    return icons[toyConfig.type] || '🎁';
  };

  return (
    <div className="space-y-6 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
      >
        <div className="w-24 h-24 border-4 border-black bg-[#92cd41] mx-auto mb-6 flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h2 className="font-minecraft text-base sm:text-lg lg:text-xl font-black uppercase tracking-wider text-gray-800"
          style={{
            textShadow: '2px 2px 0 #c381b5'
          }}
        >
          {toyConfig.name} is Ready!
        </h2>
        <div className="text-5xl mb-4">{getToyTypeIcon()}</div>
        <p className="font-geo text-sm sm:text-base font-medium text-gray-700 max-w-md mx-auto">
          Your AI companion has been successfully created and is excited to meet you!
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card
          bg="#fefcd0"
          borderColor="black"
          shadowColor="#c381b5"
          className="p-[var(--spacing-xl)] max-w-md mx-auto"
        >
          <h3 className="retro-h3 text-base sm:text-lg text-black mb-3">What&apos;s Next?</h3>
          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-[#c381b5] mt-0.5" />
              <div>
                <p className="font-black text-black uppercase tracking-wide">Start Chatting</p>
                <p className="font-geo text-sm font-medium text-gray-700">
                  Jump right into a conversation with {toyConfig.name}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Settings className="w-5 h-5 text-[#f7931e] mt-0.5" />
              <div>
                <p className="font-black text-black uppercase tracking-wide">Customize Further</p>
                <p className="font-geo text-sm font-medium text-gray-700">
                  Fine-tune settings anytime from the dashboard
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Share2 className="w-5 h-5 text-[#92cd41] mt-0.5" />
              <div>
                <p className="font-black text-black uppercase tracking-wide">Share with Family</p>
                <p className="font-geo text-sm font-medium text-gray-700">
                  Invite family members to interact with {toyConfig.name}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-3 justify-center"
      >
        <Button
          bg="#c381b5"
          textColor="white"
          borderColor="black"
          shadow="#8b5fa3"
          onClick={handleStartChatting}
          className="group py-3 px-6 font-black uppercase tracking-wider hover-lift"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Start Chatting
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
        <Button
          bg="#ffffff"
          textColor="black"
          borderColor="black"
          shadow="#e0e0e0"
          onClick={handleGoToDashboard}
          className="py-3 px-6 font-black uppercase tracking-wider hover-lift"
        >
          Go to Dashboard
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8"
      >
        <Card
          bg="#f7931e"
          borderColor="black"
          shadowColor="#d67c1a"
          className="p-[var(--spacing-lg)] max-w-md mx-auto"
        >
          <div className="inline-flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wide">
            <Sparkles className="w-4 h-4" />
            <span>Tip: Say &quot;Hello&quot; to {toyConfig.name} to start your first conversation!</span>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
