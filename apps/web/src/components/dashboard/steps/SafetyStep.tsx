'use client';

import { useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { useToyWizardStore } from '@/stores/toyWizardStore';
import { Input, Button, Card } from '@pommai/ui';
import { 
  Shield, 
  Lock, 
  AlertTriangle,
  Info,
  Plus,
  X,
  Eye,
  MessageSquare,
  Users,
  Globe,
  Heart
} from 'lucide-react';
import { motion } from 'framer-motion';

const SAFETY_LEVELS = [
  {
    id: 'strict',
    name: 'Strict',
    description: 'Maximum protection for young children',
    icon: Shield,
    features: [
      'No personal information sharing',
      'Pre-approved topics only',
      'Educational content focus',
      'No external references',
    ],
  },
  {
    id: 'moderate',
    name: 'Moderate',
    description: 'Balanced safety for school-age children',
    icon: Lock,
    features: [
      'Limited personal info sharing',
      'Most topics allowed',
      'Age-appropriate content',
      'Some creative freedom',
    ],
  },
  {
    id: 'relaxed',
    name: 'Relaxed',
    description: 'Basic safety for older children',
    icon: Eye,
    features: [
      'More conversational freedom',
      'Wider topic range',
      'Creative expression',
      'Educational guidance',
    ],
  },
];

const CONTENT_FILTER_CATEGORIES = [
  { id: 'language', name: 'Language & Profanity', icon: MessageSquare },
  { id: 'topics', name: 'Sensitive Topics', icon: AlertTriangle },
  { id: 'personal-info', name: 'Personal Information', icon: Users },
  { id: 'external-content', name: 'External Content', icon: Globe },
  { id: 'emotional', name: 'Emotional Topics', icon: Heart },
];

export function SafetyStep() {
  const { toyConfig, updateSafetySettings } = useToyWizardStore();
  const [newBlockedTopic, setNewBlockedTopic] = useState('');

  // Skip this step if not in kids mode
  if (!toyConfig.isForKids) {
    return (
      <div className="space-y-6">
      <div className="text-center py-12">
          <div className="w-20 h-20 border-4 border-black bg-[#f0f0f0] mx-auto mb-4 flex items-center justify-center">
            <Shield className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="font-minecraft text-base sm:text-lg lg:text-xl font-black mb-2 uppercase tracking-wider text-gray-800"
            style={{
              textShadow: '2px 2px 0 #c381b5'
            }}
          >
            🛡️ Safety Settings
          </h2>
          <p className="font-geo font-medium text-gray-700 max-w-md mx-auto">
            Guardian Mode safety settings are only available when creating toys for children. 
            {toyConfig.name} will have standard safety measures for general use.
          </p>
        </div>
      </div>
    );
  }

  const currentSettings = toyConfig.safetySettings || {
    safetyLevel: 'moderate',
    contentFilters: {
      enabledCategories: ['language', 'topics', 'personal-info'],
      customBlockedTopics: [],
    },
  };

  const handleSafetyLevelChange = (level: 'strict' | 'moderate' | 'relaxed') => {
    updateSafetySettings({ safetyLevel: level });
  };

  const toggleContentFilter = (categoryId: string) => {
    const enabled = [...currentSettings.contentFilters.enabledCategories];
    const index = enabled.indexOf(categoryId);
    
    if (index > -1) {
      enabled.splice(index, 1);
    } else {
      enabled.push(categoryId);
    }
    
    updateSafetySettings({
      contentFilters: {
        ...currentSettings.contentFilters,
        enabledCategories: enabled,
      },
    });
  };

  const addBlockedTopic = () => {
    if (newBlockedTopic.trim()) {
      const topics = [...currentSettings.contentFilters.customBlockedTopics, newBlockedTopic.trim()];
      updateSafetySettings({
        contentFilters: {
          ...currentSettings.contentFilters,
          customBlockedTopics: topics,
        },
      });
      setNewBlockedTopic('');
    }
  };

  const removeBlockedTopic = (index: number) => {
    const topics = [...currentSettings.contentFilters.customBlockedTopics];
    topics.splice(index, 1);
    updateSafetySettings({
      contentFilters: {
        ...currentSettings.contentFilters,
        customBlockedTopics: topics,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <h2 className="font-minecraft text-base sm:text-lg lg:text-xl font-black mb-2 uppercase tracking-wider text-gray-800"
          style={{
            textShadow: '2px 2px 0 #c381b5'
          }}
        >
          🛡️ Configure Guardian Mode Safety
        </h2>
        <p className="font-geo font-medium text-gray-700">
          Set up safety features to ensure {toyConfig.name} provides a safe and age-appropriate experience.
        </p>
      </div>

      {/* Safety Level Selection */}
      <Card
        bg="#ffffff"
        borderColor="black"
        shadowColor="#c381b5"
        className="p-4 sm:p-6"
      >
        <h3 className="retro-h3 text-lg text-black mb-4">📊 Safety Level</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SAFETY_LEVELS.map((level) => (
            <motion.label
              key={level.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              htmlFor={`safety-${level.id}`}
              className={`
                relative p-4 border-[5px] cursor-pointer transition-all hover-lift
                ${ currentSettings.safetyLevel === level.id 
                  ? 'border-black bg-[#c381b5] text-white' 
                  : 'border-black bg-white text-black hover:bg-[#fefcd0]'
                }
              `}
              style={{
                borderImageSlice: 3,
                borderImageWidth: 2,
                borderImageRepeat: 'stretch',
                borderImageOutset: 2,
                boxShadow: currentSettings.safetyLevel === level.id
                  ? '2px 2px 0 2px #8b5fa3, -2px -2px 0 2px #c381b5'
                  : '2px 2px 0 2px #e0e0e0, -2px -2px 0 2px #ffffff',
              }}
            >
              <input
                id={`safety-${level.id}`}
                type="radio"
                name="safetyLevel"
                value={level.id}
                checked={currentSettings.safetyLevel === level.id}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleSafetyLevelChange(e.target.value as 'strict' | 'moderate' | 'relaxed')}
                className="sr-only"
              />
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 border-2 border-black flex items-center justify-center ${
                    currentSettings.safetyLevel === level.id ? 'bg-white text-[#c381b5]' : 'bg-[#fefcd0]'
                  }`}>
                    <level.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-base uppercase tracking-wider">{level.name}</h4>
                    <p className="text-xs font-bold opacity-80 uppercase tracking-wide">{level.description}</p>
                  </div>
                </div>
                <ul className="space-y-1 text-xs font-bold">
                  {level.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 uppercase tracking-wide">
                      <span className="text-[#92cd41]">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.label>
          ))}
        </div>
      </Card>

      {/* Content Filters */}
      <Card
        bg="#fefcd0"
        borderColor="black"
        shadowColor="#92cd41"
        className="p-4 sm:p-6"
      >
        <h3 className="retro-h3 text-lg text-black mb-4">🛡️ Content Filters</h3>
        <p className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Choose which types of content to filter</p>
        
        <div className="space-y-3">
          {CONTENT_FILTER_CATEGORIES.map((category) => (
            <label
              key={category.id}
              className="flex items-center justify-between p-3 border-2 border-black bg-white cursor-pointer hover:bg-[#fefcd0] transition-colors"
            >
              <div className="flex items-center gap-3">
                <category.icon className="w-5 h-5 text-[#c381b5]" />
                <span className="font-bold text-black uppercase tracking-wider text-sm">{category.name}</span>
              </div>
              <input
                type="checkbox"
                checked={currentSettings.contentFilters.enabledCategories.includes(category.id)}
                onChange={() => toggleContentFilter(category.id)}
                className="pixel-checkbox"
              />
            </label>
          ))}
        </div>
      </Card>

      {/* Custom Blocked Topics */}
      <Card
        bg="#ffffff"
        borderColor="black"
        shadowColor="#f7931e"
        className="p-4 sm:p-6"
      >
        <h3 className="font-black text-lg uppercase tracking-wider text-black mb-4">🚫 Custom Blocked Topics</h3>
        <p className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Add specific topics you want {toyConfig.name} to avoid</p>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newBlockedTopic}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNewBlockedTopic(e.target.value)}
              placeholder="Add a topic to block..."
              onKeyPress={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addBlockedTopic()}
              bg="#ffffff"
              borderColor="black"
              className="font-bold flex-1"
            />
            <Button
              bg={newBlockedTopic.trim() ? "#ff6b6b" : "#f0f0f0"}
              textColor={newBlockedTopic.trim() ? "white" : "#999"}
              borderColor="black"
              shadow={newBlockedTopic.trim() ? "#e84545" : "#d0d0d0"}
              onClick={addBlockedTopic}
              disabled={!newBlockedTopic.trim()}
              className={`py-2 px-3 font-bold ${newBlockedTopic.trim() ? 'hover-lift' : 'cursor-not-allowed'}`}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {currentSettings.contentFilters.customBlockedTopics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {currentSettings.contentFilters.customBlockedTopics.map((topic, index) => (
                <span 
                  key={index} 
                  className="px-2 py-1 text-xs font-black uppercase tracking-wider border-2 border-black bg-[#ff6b6b] text-white flex items-center gap-2"
                >
                  {topic}
                  <button
                    onClick={() => removeBlockedTopic(index)}
                    className="hover:text-red-200 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Information Box */}
      <Card
        bg="#92cd41"
        borderColor="black"
        shadowColor="#76a83a"
        className="p-4"
      >
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
          <div className="text-sm font-bold text-white">
            <p className="font-black mb-1 uppercase tracking-wider">🛡️ Guardian Mode Active</p>
            <p className="uppercase tracking-wide">
              These safety settings will be enforced for all interactions with {toyConfig.name}. 
              Parents can adjust these settings anytime through the parental controls dashboard.
            </p>
          </div>
        </div>
      </Card>

      {/* Age-based Recommendation */}
      {toyConfig.ageGroup && (
        <Card
          bg="#f7931e"
          borderColor="black"
          shadowColor="#d67c1a"
          className="p-4"
        >
          <p className="text-sm font-bold text-white uppercase tracking-wide">
            <strong>📊 Recommended for {toyConfig.ageGroup}:</strong> Based on the selected age group, 
            we&apos;ve pre-configured the safety level to &quot;{currentSettings.safetyLevel}&quot;. 
            You can adjust this if needed.
          </p>
        </Card>
      )}
    </div>
  );
}
