'use client';

import { useState } from 'react';
import { useToyWizardStore } from '@/stores/toyWizardStore';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Design {toyConfig.name}'s Personality
        </h2>
        <p className="text-gray-600">
          Create a unique personality that will make {toyConfig.name} special and engaging.
        </p>
      </div>

      {/* Personality Description */}
      <div className="space-y-2">
        <Label htmlFor="personality-prompt">
          Personality Description
          <span className="text-red-500 ml-1">*</span>
        </Label>
        <Textarea
          id="personality-prompt"
          value={toyConfig.personalityPrompt}
          onChange={(e) => handlePersonalityPromptChange(e.target.value)}
          placeholder={`Describe ${toyConfig.name}'s personality in detail. For example: "${toyConfig.name} is a cheerful and curious companion who loves to tell stories about space adventures..."`}
          rows={4}
          className="resize-none"
        />
        <p className="text-sm text-gray-500">
          This description will guide how {toyConfig.name} interacts and responds
        </p>
      </div>

      {/* Personality Traits */}
      <div className="space-y-3">
        <div>
          <Label>
            Core Personality Traits (Select up to 3)
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <p className="text-sm text-gray-500">Choose traits that best define {toyConfig.name}</p>
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
                  p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2
                  ${isSelected 
                    ? 'border-purple-600 bg-purple-50 text-purple-700' 
                    : isDisabled
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 hover:border-purple-400 text-gray-700'
                  }
                `}
              >
                <trait.icon className="w-6 h-6" />
                <span className="text-sm font-medium">{trait.name}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Speaking Style */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900">Speaking Style</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Vocabulary Level</Label>
            <RadioGroup
              value={toyConfig.personalityTraits.speakingStyle.vocabulary}
              onValueChange={(value) => updatePersonalityTraits({
                speakingStyle: {
                  ...toyConfig.personalityTraits.speakingStyle,
                  vocabulary: value as 'simple' | 'moderate' | 'advanced',
                },
              })}
            >
              <div className="space-y-2 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="simple" />
                  <span className="text-sm">Simple (Basic words)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="moderate" />
                  <span className="text-sm">Moderate (Everyday language)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="advanced" />
                  <span className="text-sm">Advanced (Rich vocabulary)</span>
                </label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label>Sentence Length</Label>
            <RadioGroup
              value={toyConfig.personalityTraits.speakingStyle.sentenceLength}
              onValueChange={(value) => updatePersonalityTraits({
                speakingStyle: {
                  ...toyConfig.personalityTraits.speakingStyle,
                  sentenceLength: value as 'short' | 'medium' | 'long',
                },
              })}
            >
              <div className="space-y-2 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="short" />
                  <span className="text-sm">Short & simple</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="medium" />
                  <span className="text-sm">Medium length</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="long" />
                  <span className="text-sm">Detailed & descriptive</span>
                </label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="sound-effects" className="cursor-pointer">
            Use sound effects in speech
          </Label>
          <Switch
            id="sound-effects"
            checked={toyConfig.personalityTraits.speakingStyle.usesSoundEffects}
            onCheckedChange={(checked) => updatePersonalityTraits({
              speakingStyle: {
                ...toyConfig.personalityTraits.speakingStyle,
                usesSoundEffects: checked,
              },
            })}
          />
        </div>

        {/* Catch Phrases */}
        <div className="space-y-2">
          <Label>Catch Phrases</Label>
          <div className="flex gap-2">
            <Input
              value={newCatchPhrase}
              onChange={(e) => setNewCatchPhrase(e.target.value)}
              placeholder="Add a catch phrase..."
              onKeyPress={(e) => e.key === 'Enter' && addCatchPhrase()}
            />
            <Button
              type="button"
              size="sm"
              onClick={addCatchPhrase}
              disabled={!newCatchPhrase.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {toyConfig.personalityTraits.speakingStyle.catchPhrases.map((phrase, index) => (
              <Badge key={index} variant="secondary" className="pr-1">
                {phrase}
                <button
                  onClick={() => removeCatchPhrase(index)}
                  className="ml-2 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Behavior Settings */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Behavior Settings</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="encourages-questions" className="cursor-pointer">
              Encourages questions
            </Label>
            <Switch
              id="encourages-questions"
              checked={toyConfig.personalityTraits.behavior.encouragesQuestions}
              onCheckedChange={(checked) => updatePersonalityTraits({
                behavior: {
                  ...toyConfig.personalityTraits.behavior,
                  encouragesQuestions: checked,
                },
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="tells-stories" className="cursor-pointer">
              Tells stories
            </Label>
            <Switch
              id="tells-stories"
              checked={toyConfig.personalityTraits.behavior.tellsStories}
              onCheckedChange={(checked) => updatePersonalityTraits({
                behavior: {
                  ...toyConfig.personalityTraits.behavior,
                  tellsStories: checked,
                },
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="plays-games" className="cursor-pointer">
              Plays interactive games
            </Label>
            <Switch
              id="plays-games"
              checked={toyConfig.personalityTraits.behavior.playsGames}
              onCheckedChange={(checked) => updatePersonalityTraits({
                behavior: {
                  ...toyConfig.personalityTraits.behavior,
                  playsGames: checked,
                },
              })}
            />
          </div>

          <div className="space-y-2">
            <Label>Educational Focus (0-10)</Label>
            <Slider
              value={[toyConfig.personalityTraits.behavior.educationalFocus]}
              onValueChange={([value]) => updatePersonalityTraits({
                behavior: {
                  ...toyConfig.personalityTraits.behavior,
                  educationalFocus: value,
                },
              })}
              min={0}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Pure Fun</span>
              <span>Balanced</span>
              <span>Educational</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Imagination Level (0-10)</Label>
            <Slider
              value={[toyConfig.personalityTraits.behavior.imaginationLevel]}
              onValueChange={([value]) => updatePersonalityTraits({
                behavior: {
                  ...toyConfig.personalityTraits.behavior,
                  imaginationLevel: value,
                },
              })}
              min={0}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Realistic</span>
              <span>Balanced</span>
              <span>Fantastical</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
