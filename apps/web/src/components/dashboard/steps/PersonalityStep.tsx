'use client';

import { useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { useToyWizardStore } from '@/stores/toyWizardStore';
import { TextArea, Button, Input, Card } from '@pommai/ui';
import { 
  Plus, 
  X, 
  Sparkles, 
  BookOpen, 
  Gamepad2, 
  MessageSquare,
  Brain,
  Heart,
  Zap,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PERSONALITY_TRAITS = [
  { id: 'friendly', name: 'Friendly', icon: Heart },
  { id: 'curious', name: 'Curious', icon: Brain },
  { id: 'playful', name: 'Playful', icon: Gamepad2 },
  { id: 'helpful', name: 'Helpful', icon: Star },
  { id: 'creative', name: 'Creative', icon: Sparkles },
  { id: 'adventurous', name: 'Adventurous', icon: Zap },
  { id: 'patient', name: 'Patient', icon: Heart },
  { id: 'funny', name: 'Funny', icon: MessageSquare },
  { id: 'wise', name: 'Wise', icon: BookOpen },
];

export function PersonalityStep() {
  const { toyConfig, updateToyConfig, updatePersonalityTraits, setError, clearError } = useToyWizardStore();
  const [newCatchPhrase, setNewCatchPhrase] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [newFavoriteTopic, setNewFavoriteTopic] = useState('');
  const [newAvoidTopic, setNewAvoidTopic] = useState('');

  const handlePersonalityPromptChange = (value: string) => {
    updateToyConfig('personalityPrompt', value);
    if (value.trim()) {
      clearError('personalityPrompt');
    } else {
      setError('personalityPrompt', 'Please describe your toy\'s personality');
    }
  };

  const toggleTrait = (traitId: string) => {
    const currentTraits = [...toyConfig.personalityTraits.traits];
    const index = currentTraits.indexOf(traitId);
    
    if (index > -1) {
      currentTraits.splice(index, 1);
    } else if (currentTraits.length < 3) {
      currentTraits.push(traitId);
    }
    
    updatePersonalityTraits({ traits: currentTraits });
  };

  const addCatchPhrase = () => {
    if (newCatchPhrase.trim()) {
      updatePersonalityTraits({
        speakingStyle: {
          ...toyConfig.personalityTraits.speakingStyle,
          catchPhrases: [...toyConfig.personalityTraits.speakingStyle.catchPhrases, newCatchPhrase.trim()],
        },
      });
      setNewCatchPhrase('');
    }
  };

  const removeCatchPhrase = (index: number) => {
    const phrases = [...toyConfig.personalityTraits.speakingStyle.catchPhrases];
    phrases.splice(index, 1);
    updatePersonalityTraits({
      speakingStyle: {
        ...toyConfig.personalityTraits.speakingStyle,
        catchPhrases: phrases,
      },
    });
  };

  const addItem = (type: 'interests' | 'favoriteTopics' | 'avoidTopics', value: string) => {
    if (value.trim()) {
      updatePersonalityTraits({
        [type]: [...toyConfig.personalityTraits[type], value.trim()],
      });
    }
  };

  const removeItem = (type: 'interests' | 'favoriteTopics' | 'avoidTopics', index: number) => {
    const items = [...toyConfig.personalityTraits[type]];
    items.splice(index, 1);
    updatePersonalityTraits({ [type]: items });
  };

  return (
    <div className="space-y-6 step-component">
      <div className="text-center sm:text-left">
        <h2 className="font-minecraft text-base sm:text-lg font-black mb-3 uppercase tracking-wider text-gray-800"
          style={{
            textShadow: '2px 2px 0 #c381b5'
          }}
        >
          ✨ Design {toyConfig.name}&apos;s Personality
        </h2>
        <p className="font-geo text-sm font-medium text-gray-600 tracking-wide leading-relaxed">
          Create a unique personality that will make {toyConfig.name} special and engaging.
        </p>
      </div>

      {/* Personality Description */}
      <div className="space-y-3">
        <label className="block text-sm font-geo font-semibold uppercase tracking-wider text-gray-700">
          Personality Description
          <span className="text-red-500 ml-1">*</span>
        </label>
        <TextArea
          value={toyConfig.personalityPrompt}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handlePersonalityPromptChange(e.target.value)}
          placeholder={`Describe ${toyConfig.name}'s personality in detail. For example: "${toyConfig.name} is a cheerful and curious companion who loves to tell stories about space adventures..."`}
          rows={4}
          bg="#ffffff"
          borderColor="black"
          className="font-geo font-medium resize-none"
        />
        <p className="font-geo text-sm font-medium text-gray-600 leading-relaxed">
          This description will guide how {toyConfig.name} interacts and responds
        </p>
      </div>

      {/* Personality Traits */}
      <div className="space-y-4">
        <div>
          <label className="font-geo block text-sm font-semibold uppercase tracking-wider text-black mb-2">
            Core Personality Traits (Select up to 3)
            <span className="text-red-500 ml-1">*</span>
          </label>
          <p className="font-geo text-sm font-medium text-gray-600 leading-relaxed">Choose traits that best define {toyConfig.name}</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {PERSONALITY_TRAITS.map((trait) => {
            const isSelected = toyConfig.personalityTraits.traits.includes(trait.id);
            const isDisabled = !isSelected && toyConfig.personalityTraits.traits.length >= 3;
            
            return (
              <motion.button
                key={trait.id}
                whileHover={!isDisabled ? { scale: 1.05 } : {}}
                whileTap={!isDisabled ? { scale: 0.95 } : {}}
                onClick={() => !isDisabled && toggleTrait(trait.id)}
                disabled={isDisabled}
                className={`
                  p-3 border-[5px] transition-all flex flex-col items-center gap-2 font-minecraft font-black uppercase tracking-wider
                  ${isSelected 
                    ? 'border-black bg-[#c381b5] text-white' 
                    : isDisabled
                    ? 'border-black bg-[#f0f0f0] text-gray-400 cursor-not-allowed'
                    : 'border-black bg-white text-black hover:bg-[#fefcd0] hover-lift'
                  }
                `}
                style={{
                  borderImageSlice: 3,
                  borderImageWidth: 2,
                  borderImageRepeat: 'stretch',
                  borderImageOutset: 2,
                  boxShadow: isSelected
                    ? '2px 2px 0 2px #8b5fa3, -2px -2px 0 2px #c381b5'
                    : isDisabled
                    ? '2px 2px 0 2px #d0d0d0, -2px -2px 0 2px #f0f0f0'
                    : '2px 2px 0 2px #e0e0e0, -2px -2px 0 2px #ffffff',
                }}
              >
                <trait.icon className="w-6 h-6" />
                <span className="text-xs sm:text-sm">{trait.name}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Speaking Style */}
      <Card
        bg="#fefcd0"
        borderColor="black"
        shadowColor="#c381b5"
        className="p-4 sm:p-6"
      >
        <h3 className="font-minecraft font-black text-base uppercase tracking-wider text-gray-800 mb-4">🗣️ Speaking Style</h3>
        
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          <div>
            <label className="font-geo block text-sm font-semibold uppercase tracking-wider text-black mb-3">Vocabulary Level</label>
            <div className="space-y-2">
              {[
                { value: 'simple', label: 'Simple (Basic words)' },
                { value: 'moderate', label: 'Moderate (Everyday language)' },
                { value: 'advanced', label: 'Advanced (Rich vocabulary)' }
              ].map((option) => (
                <label 
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded transition-colors"
                >
                  <input
                    type="radio"
                    name="vocabulary"
                    value={option.value}
                    checked={toyConfig.personalityTraits.speakingStyle.vocabulary === option.value}
                    onChange={(e) => updatePersonalityTraits({
                      speakingStyle: {
                        ...toyConfig.personalityTraits.speakingStyle,
                        vocabulary: e.target.value as 'simple' | 'moderate' | 'advanced',
                      },
                    })}
                    className="pixel-checkbox"
                  />
                  <span className="font-geo text-sm font-medium">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Catch Phrases */}
        <div className="space-y-3 mt-6">
          <label className="font-geo block text-sm font-semibold uppercase tracking-wider text-black mb-2">Catch Phrases</label>
          <div className="flex gap-2">
            <Input
              value={newCatchPhrase}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNewCatchPhrase(e.target.value)}
              placeholder="Add a catch phrase..."
              onKeyPress={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addCatchPhrase()}
              bg="#ffffff"
              borderColor="black"
              className="font-geo font-medium flex-1"
            />
            <Button
              bg={newCatchPhrase.trim() ? "#92cd41" : "#f0f0f0"}
              textColor={newCatchPhrase.trim() ? "white" : "#999"}
              borderColor="black"
              shadow={newCatchPhrase.trim() ? "#76a83a" : "#d0d0d0"}
              onClick={addCatchPhrase}
              disabled={!newCatchPhrase.trim()}
              className={`py-2 px-3 font-minecraft font-black ${newCatchPhrase.trim() ? 'hover-lift' : 'cursor-not-allowed'}`}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {toyConfig.personalityTraits.speakingStyle.catchPhrases.map((phrase, index) => (
              <span 
                key={index} 
                className="px-2 py-1 text-xs font-black uppercase tracking-wider border-2 border-black bg-[#f7931e] text-white flex items-center gap-2"
              >
                {phrase}
                <button
                  onClick={() => removeCatchPhrase(index)}
                  className="hover:text-red-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* Behavior Settings */}
      <Card
        bg="#ffffff"
        borderColor="black"
        shadowColor="#92cd41"
        className="p-4 sm:p-6"
      >
        <h3 className="font-minecraft font-black text-base uppercase tracking-wider text-gray-800 mb-4">🎭 Behavior Settings</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: 'encouragesQuestions', label: '❓ Encourages questions' },
            { key: 'tellsStories', label: '📚 Tells stories' },
            { key: 'playsGames', label: '🎮 Plays interactive games' },
            { key: 'usesSoundEffects', label: '🔊 Uses sound effects' }
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between p-3 bg-[#fefcd0] border-2 border-black cursor-pointer hover:bg-white transition-colors">
              <span className="font-geo text-sm font-medium text-black">{item.label}</span>
              <input
                type="checkbox"
                checked={false}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  // For now, just handle usesSoundEffects
                  if (item.key === 'usesSoundEffects') {
                    updatePersonalityTraits({
                      speakingStyle: {
                        ...toyConfig.personalityTraits.speakingStyle,
                        usesSoundEffects: e.target.checked,
                      },
                    });
                  }
                  // TODO: Add behavior object support
                }}
                className="pixel-checkbox"
              />
            </label>
          ))}
        </div>
      </Card>
    </div>
  );
}