'use client';

import { useToyWizardStore } from '@/stores/toyWizardStore';
import { Card } from '@pommai/ui';
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
    <div className="space-y-6 step-component">
      <div className="text-center sm:text-left">
        <h2 className="font-minecraft text-base sm:text-lg font-black mb-3 uppercase tracking-wider text-gray-800"
          style={{
            textShadow: '2px 2px 0 #c381b5'
          }}
        >
          🛁 Who is this toy for?
        </h2>
        <p className="font-geo text-sm font-medium text-gray-600 tracking-wide leading-relaxed">
          Choose whether to enable Guardian Mode with enhanced safety features for children.
        </p>
      </div>

      {/* Mode Selection */}
      <div className="space-y-4">
        <label className="font-geo block text-sm font-semibold uppercase tracking-wider text-black mb-2">Select Mode</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Kids Mode */}
          <motion.label
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative flex flex-col p-6 border-[5px] cursor-pointer transition-all hover-lift
              ${ toyConfig.isForKids 
                ? 'border-black bg-[#c381b5] text-white' 
                : 'border-black bg-white text-black hover:bg-[#fefcd0]'
              }
            `}
            style={{
              borderImageSlice: 3,
              borderImageWidth: 2,
              borderImageRepeat: 'stretch',
              borderImageOutset: 2,
              boxShadow: toyConfig.isForKids
                ? '2px 2px 0 2px #8b5fa3, -2px -2px 0 2px #c381b5'
                : '2px 2px 0 2px #e0e0e0, -2px -2px 0 2px #ffffff',
            }}
          >
            <input
              type="radio"
              name="mode"
              checked={toyConfig.isForKids}
              onChange={() => handleModeChange(true)}
              className="sr-only"
            />
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 border-2 border-black flex items-center justify-center ${
                toyConfig.isForKids ? 'bg-white text-[#c381b5]' : 'bg-[#fefcd0] text-black'
              }`}>
                <Shield className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-minecraft font-black text-base uppercase tracking-wider mb-3">
                  Guardian Mode (For Kids)
                </h3>
                <p className="font-geo text-sm font-medium opacity-90 leading-relaxed mb-4">
                  Enhanced safety features, content filtering, and age-appropriate interactions
                </p>
                <ul className="space-y-2 text-sm font-geo font-medium">
                  <li className="flex items-center gap-2">
                    <span className="text-[#92cd41] font-bold">✓</span>
                    <span>Strict content moderation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#92cd41] font-bold">✓</span>
                    <span>No personal information collection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#92cd41] font-bold">✓</span>
                    <span>Educational focus</span>
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
              relative flex flex-col p-6 border-[5px] cursor-pointer transition-all hover-lift
              ${ !toyConfig.isForKids 
                ? 'border-black bg-[#c381b5] text-white' 
                : 'border-black bg-white text-black hover:bg-[#fefcd0]'
              }
            `}
            style={{
              borderImageSlice: 3,
              borderImageWidth: 2,
              borderImageRepeat: 'stretch',
              borderImageOutset: 2,
              boxShadow: !toyConfig.isForKids
                ? '2px 2px 0 2px #8b5fa3, -2px -2px 0 2px #c381b5'
                : '2px 2px 0 2px #e0e0e0, -2px -2px 0 2px #ffffff',
            }}
          >
            <input
              type="radio"
              name="mode"
              checked={!toyConfig.isForKids}
              onChange={() => handleModeChange(false)}
              className="sr-only"
            />
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 border-2 border-black flex items-center justify-center ${
                !toyConfig.isForKids ? 'bg-white text-[#c381b5]' : 'bg-[#fefcd0] text-black'
              }`}>
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-minecraft font-black text-base uppercase tracking-wider mb-3">
                  General Mode
                </h3>
                <p className="font-geo text-sm font-medium opacity-90 leading-relaxed mb-4">
                  Full features for teens and adults with standard safety measures
                </p>
                <ul className="space-y-2 text-sm font-geo font-medium">
                  <li className="flex items-center gap-2">
                    <span className="text-[#f7931e] font-bold">•</span>
                    <span>More conversational freedom</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#f7931e] font-bold">•</span>
                    <span>Advanced personality options</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#f7931e] font-bold">•</span>
                    <span>Complex interactions</span>
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
          <label className="font-geo block text-sm font-semibold uppercase tracking-wider text-black mb-3">Select Age Group</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {AGE_GROUPS.map((group) => (
              <label
                key={group.id}
                htmlFor={`age-${group.id}`}
                className={`
                  relative flex items-center p-4 border-[5px] cursor-pointer transition-all hover-lift
                  ${ toyConfig.ageGroup === group.id 
                    ? 'border-black bg-[#c381b5] text-white' 
                    : 'border-black bg-white text-black hover:bg-[#fefcd0]'
                  }
                `}
                style={{
                  borderImageSlice: 3,
                  borderImageWidth: 2,
                  borderImageRepeat: 'stretch',
                  borderImageOutset: 2,
                  boxShadow: toyConfig.ageGroup === group.id
                    ? '2px 2px 0 2px #8b5fa3, -2px -2px 0 2px #c381b5'
                    : '2px 2px 0 2px #e0e0e0, -2px -2px 0 2px #ffffff',
                }}
              >
                <input
                  id={`age-${group.id}`}
                  type="radio"
                  name="ageGroup"
                  value={group.id}
                  checked={toyConfig.ageGroup === group.id}
                  onChange={(e) => handleAgeGroupChange(e.target.value as '3-5' | '6-8' | '9-12')}
                  className="sr-only"
                />
                <div className="flex items-center gap-3 w-full">
                  <group.icon className={`w-8 h-8 ${
                    toyConfig.ageGroup === group.id ? 'text-white' : 'text-[#c381b5]'
                  }`} />
                  <div>
                    <span className="font-minecraft font-black text-sm uppercase tracking-wider">{group.name}</span>
                    <p className="font-geo text-xs font-medium opacity-80 leading-relaxed">{group.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </motion.div>
      )}

      {/* Information Box */}
      <Card
        bg={toyConfig.isForKids ? "#92cd41" : "#c381b5"}
        borderColor="black"
        shadowColor={toyConfig.isForKids ? "#76a83a" : "#8b5fa3"}
        className="p-4"
      >
        <p className="font-geo text-sm font-medium text-white leading-relaxed">
          <strong className="font-minecraft uppercase tracking-wider">📝 Note:</strong> {
            toyConfig.isForKids 
              ? 'Guardian Mode includes automatic content filtering, safe conversation boundaries, and parental controls. Safety settings can be customized in the next steps.'
              : 'General Mode is designed for mature users who want full creative freedom with their AI companion. Basic safety measures are still in place.'
          }
        </p>
      </Card>
    </div>
  );
}
