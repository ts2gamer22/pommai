'use client';

import { motion } from 'framer-motion';
import { Sparkles, Heart, Shield, Brain } from 'lucide-react';

export function WelcomeStep() {
  const features = [
    {
      icon: Heart,
      title: 'Personalized Companion',
      description: 'Create a unique AI friend with custom personality traits',
    },
    {
      icon: Brain,
      title: 'Smart & Adaptive',
      description: 'Your toy learns and grows with every interaction',
    },
    {
      icon: Shield,
      title: 'Safe for Kids',
      description: 'Built-in safety features and content filtering',
    },
    {
      icon: Sparkles,
      title: 'Magical Experience',
      description: 'Bring toys to life with advanced AI technology',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
        </motion.div>
        
        <h2 className="text-3xl font-bold text-gray-900">
          Welcome to AI Toy Creation!
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Let's create a magical AI companion together. This wizard will guide you 
          through personalizing your toy's personality, voice, and capabilities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-50 rounded-lg p-4 flex gap-4"
          >
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
                <feature.icon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{feature.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-purple-800">
          <strong>Note:</strong> This process takes about 5-10 minutes. Your progress 
          is automatically saved, so you can return anytime to continue where you left off.
        </p>
      </div>
    </div>
  );
}
