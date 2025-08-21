'use client';

import { useState } from 'react';
import { useToyWizardStore } from '@/stores/toyWizardStore';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-600',
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
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-600',
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
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-600',
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
          <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Shield className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Safety Settings
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Configure Guardian Mode Safety
        </h2>
        <p className="text-gray-600">
          Set up safety features to ensure {toyConfig.name} provides a safe and age-appropriate experience.
        </p>
      </div>

      {/* Safety Level Selection */}
      <div className="space-y-4">
        <Label>Safety Level</Label>
        <RadioGroup
          value={currentSettings.safetyLevel}
          onValueChange={handleSafetyLevelChange}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SAFETY_LEVELS.map((level) => (
              <motion.label
                key={level.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                htmlFor={`safety-${level.id}`}
                className={`
                  relative p-4 border-2 rounded-lg cursor-pointer transition-all
                  ${currentSettings.safetyLevel === level.id 
                    ? `${level.borderColor} ${level.bgColor}` 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <RadioGroupItem
                  id={`safety-${level.id}`}
                  value={level.id}
                  className="sr-only"
                />
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${level.bgColor} flex items-center justify-center`}>
                      <level.icon className={`w-5 h-5 ${level.color}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{level.name}</h4>
                      <p className="text-sm text-gray-600">{level.description}</p>
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {level.features.map((feature, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-center gap-1">
                        <span className={level.color}>•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.label>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* Content Filters */}
      <div className="space-y-4">
        <div>
          <Label>Content Filters</Label>
          <p className="text-sm text-gray-500">Choose which types of content to filter</p>
        </div>
        <div className="space-y-3">
          {CONTENT_FILTER_CATEGORIES.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <category.icon className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">{category.name}</span>
              </div>
              <Switch
                checked={currentSettings.contentFilters.enabledCategories.includes(category.id)}
                onCheckedChange={() => toggleContentFilter(category.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Custom Blocked Topics */}
      <div className="space-y-4">
        <div>
          <Label>Custom Blocked Topics</Label>
          <p className="text-sm text-gray-500">Add specific topics you want {toyConfig.name} to avoid</p>
        </div>
        <div className="flex gap-2">
          <Input
            value={newBlockedTopic}
            onChange={(e) => setNewBlockedTopic(e.target.value)}
            placeholder="Add a topic to block..."
            onKeyPress={(e) => e.key === 'Enter' && addBlockedTopic()}
          />
          <Button
            type="button"
            size="sm"
            onClick={addBlockedTopic}
            disabled={!newBlockedTopic.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {currentSettings.contentFilters.customBlockedTopics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {currentSettings.contentFilters.customBlockedTopics.map((topic, index) => (
              <Badge key={index} variant="secondary" className="pr-1">
                {topic}
                <button
                  onClick={() => removeBlockedTopic(index)}
                  className="ml-2 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Information Box */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-green-800">
            <p className="font-medium mb-1">Guardian Mode Active</p>
            <p>
              These safety settings will be enforced for all interactions with {toyConfig.name}. 
              Parents can adjust these settings anytime through the parental controls dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Age-based Recommendation */}
      {toyConfig.ageGroup && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Recommended for {toyConfig.ageGroup}:</strong> Based on the selected age group, 
            we've pre-configured the safety level to "{currentSettings.safetyLevel}". 
            You can adjust this if needed.
          </p>
        </div>
      )}
    </div>
  );
}
