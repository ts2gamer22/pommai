'use client';

import { motion } from 'framer-motion';
import { Sparkles, Heart, Shield, Brain } from 'lucide-react';
import { Card } from '@pommai/ui';

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
    <div className="space-y-6 step-component">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
        >
          <div className="w-20 h-20 mx-auto flex items-center justify-center mb-4">
            <Sparkles className="w-16 h-16 text-[#c381b5] animate-pulse" />
          </div>
        </motion.div>
        
        <h2 className="font-minecraft text-base sm:text-lg font-black mb-4 uppercase tracking-wider text-gray-800"
          style={{
            textShadow: '2px 2px 0 #c381b5'
          }}
        >
          🎉 Welcome to AI Toy Creation!
        </h2>
        <p className="font-geo text-sm font-medium text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Let's create a magical AI companion together! This wizard will guide you 
          through personalizing your toy's personality, voice, and capabilities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-8">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              bg="#ffffff"
              borderColor="black"
              shadowColor="#c381b5"
              className="p-4 sm:p-6 hover-lift transition-transform cursor-pointer group"
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#fefcd0] border-2 border-black flex items-center justify-center group-hover:animate-pulse">
                    <feature.icon className="w-6 h-6 text-[#c381b5]" />
                  </div>
                </div>
                <div>
                  <h3 className="font-minecraft font-black text-base uppercase tracking-wider text-gray-800 mb-2">{feature.title}</h3>
                  <p className="font-geo text-sm font-medium text-gray-600 tracking-wide leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card
        bg="#fefcd0"
        borderColor="black"
        shadowColor="#c381b5"
        className="p-4 sm:p-6 mt-6"
      >
        <p className="font-geo text-sm font-medium text-gray-700">
          <strong className="font-minecraft uppercase tracking-wider">📝 Note:</strong> This process takes about 5-10 minutes. Your progress 
          is automatically saved, so you can return anytime to continue where you left off.
        </p>
      </Card>
    </div>
  );
}
