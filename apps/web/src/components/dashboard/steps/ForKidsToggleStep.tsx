'use client';

import { useToyWizardStore } from '@/stores/toyWizardStore';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Shield, Users, Baby, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const AGE_GROUPS = [
  { 
    id: '3-5', 
    name: 'Ages 3-5', 
    description: 'Simple vocabulary, basic concepts',
    icon: Baby,
  },
  { 
    id: '6-8', 
    name: 'Ages 6-8', 
    description: 'Educational focus, storytelling',
    icon: Users,
  },
  { 
    id: '9-12', 
    name: 'Ages 9-12', 
    description: 'Advanced topics, creative play',
    icon: Zap,
  },
];

export function ForKidsToggleStep() {
  const { toyConfig, updateToyConfig, updateSafetySettings } = useToyWizardStore();

  const handleModeChange = (isForKids: boolean) => {
    updateToyConfig('isForKids', isForKids);
    
    if (isForKids && !toyConfig.safetySettings) {
      // Initialize default safety settings for kids mode
      updateSafetySettings({
        safetyLevel: 'moderate',
        contentFilters: {
          enabledCategories: ['language', 'topics', 'personal-info'],
          customBlockedTopics: [],
        },
      });
    }
  };

  const handleAgeGroupChange = (ageGroup: '3-5' | '6-8' | '9-12') => {
    updateToyConfig('ageGroup', ageGroup);
    
    // Adjust safety level based on age group
    const safetyLevel = ageGroup === '3-5' ? 'strict' : 
                       ageGroup === '6-8' ? 'moderate' : 
                       'relaxed';
    
    updateSafetySettings({ safetyLevel });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Who is this toy for?
        </h2>
        <p className="text-gray-600">
          Choose whether to enable Guardian Mode with enhanced safety features for children.
        </p>
      </div>

      {/* Mode Selection */}
      <div className="space-y-4">
        <Label>Select Mode</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Kids Mode */}
          <motion.label
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative flex flex-col p-6 border-2 rounded-lg cursor-pointer transition-all
              ${toyConfig.isForKids 
                ? 'border-purple-600 bg-purple-50' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <input
              type="radio"
              name="mode"
              checked={toyConfig.isForKids}
              onChange={() => handleModeChange(true)}
              className="sr-only"
            />
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                toyConfig.isForKids ? 'bg-purple-600' : 'bg-gray-200'
              }`}>
                <Shield className={`w-6 h-6 ${
                  toyConfig.isForKids ? 'text-white' : 'text-gray-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">
                  Guardian Mode (For Kids)
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Enhanced safety features, content filtering, and age-appropriate interactions
                </p>
                <ul className="mt-3 space-y-1 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Strict content moderation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    No personal information collection
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Educational focus
                  </li>
                </ul>
              </div>
            </div>
          </motion.label>

          {/* General Mode */}
          <motion.label
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative flex flex-col p-6 border-2 rounded-lg cursor-pointer transition-all
              ${!toyConfig.isForKids 
                ? 'border-purple-600 bg-purple-50' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <input
              type="radio"
              name="mode"
              checked={!toyConfig.isForKids}
              onChange={() => handleModeChange(false)}
              className="sr-only"
            />
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                !toyConfig.isForKids ? 'bg-purple-600' : 'bg-gray-200'
              }`}>
                <Users className={`w-6 h-6 ${
                  !toyConfig.isForKids ? 'text-white' : 'text-gray-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">
                  General Mode
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Full features for teens and adults with standard safety measures
                </p>
                <ul className="mt-3 space-y-1 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">•</span>
                    More conversational freedom
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">•</span>
                    Advanced personality options
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">•</span>
                    Complex interactions
                  </li>
                </ul>
              </div>
            </div>
          </motion.label>
        </div>
      </div>

      {/* Age Group Selection (only for Kids Mode) */}
      {toyConfig.isForKids && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          <Label>Select Age Group</Label>
          <RadioGroup
            value={toyConfig.ageGroup || ''}
            onValueChange={(value) => handleAgeGroupChange(value as '3-5' | '6-8' | '9-12')}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {AGE_GROUPS.map((group) => (
                <label
                  key={group.id}
                  htmlFor={`age-${group.id}`}
                  className={`
                    relative flex items-center p-4 border-2 rounded-lg cursor-pointer
                    transition-all hover:border-purple-400
                    ${toyConfig.ageGroup === group.id 
                      ? 'border-purple-600 bg-purple-50' 
                      : 'border-gray-200'
                    }
                  `}
                >
                  <RadioGroupItem
                    id={`age-${group.id}`}
                    value={group.id}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3 w-full">
                    <group.icon className={`w-8 h-8 ${
                      toyConfig.ageGroup === group.id ? 'text-purple-600' : 'text-gray-600'
                    }`} />
                    <div>
                      <span className="font-medium text-gray-900">{group.name}</span>
                      <p className="text-xs text-gray-600">{group.description}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </RadioGroup>
        </motion.div>
      )}

      {/* Information Box */}
      <div className={`p-4 rounded-lg border ${
        toyConfig.isForKids 
          ? 'bg-green-50 border-green-200' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        <p className={`text-sm ${
          toyConfig.isForKids ? 'text-green-800' : 'text-blue-800'
        }`}>
          <strong>Note:</strong> {
            toyConfig.isForKids 
              ? 'Guardian Mode includes automatic content filtering, safe conversation boundaries, and parental controls. Safety settings can be customized in the next steps.'
              : 'General Mode is designed for mature users who want full creative freedom with their AI companion. Basic safety measures are still in place.'
          }
        </p>
      </div>
    </div>
  );
}
