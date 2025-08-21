'use client';

import { useRouter } from 'next/navigation';
import { useToyWizardStore } from '@/stores/toyWizardStore';
import { Button } from '@/components/ui/button';
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
import { useEffect } from 'react';

export function CompletionStep() {
  const router = useRouter();
  const { toyConfig, resetWizard } = useToyWizardStore();

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
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
    const icons: Record<string, any> = {
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
        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto mb-6 flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h2 className="text-3xl font-bold text-gray-900">
          {toyConfig.name} is Ready!
        </h2>
        <div className="text-5xl mb-4">{getToyTypeIcon()}</div>
        <p className="text-lg text-gray-600 max-w-md mx-auto">
          Your AI companion has been successfully created and is excited to meet you!
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 max-w-md mx-auto"
      >
        <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
        <div className="space-y-3 text-left">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Start Chatting</p>
              <p className="text-sm text-gray-600">
                Jump right into a conversation with {toyConfig.name}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Customize Further</p>
              <p className="text-sm text-gray-600">
                Fine-tune settings anytime from the dashboard
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Share2 className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Share with Family</p>
              <p className="text-sm text-gray-600">
                Invite family members to interact with {toyConfig.name}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-3 justify-center"
      >
        <Button
          size="lg"
          onClick={handleStartChatting}
          className="group"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Start Chatting
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={handleGoToDashboard}
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
        <div className="inline-flex items-center gap-2 text-sm text-gray-500">
          <Sparkles className="w-4 h-4" />
          <span>Tip: Say "Hello" to {toyConfig.name} to start your first conversation!</span>
        </div>
      </motion.div>
    </div>
  );
}
