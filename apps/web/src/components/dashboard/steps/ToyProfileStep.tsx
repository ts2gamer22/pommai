'use client';

import { useState, useEffect } from 'react';
import { useToyWizardStore } from '@/stores/toyWizardStore';
import { Input, TextArea, Card } from '@pommai/ui';
import { 
  Baby,
  Rabbit, 
  Cat, 
  Dog, 
  Bird, 
  Fish,
  Bot,
  Sparkles,
  HelpCircle
} from 'lucide-react';

const TOY_TYPES = [
  { id: 'teddy', name: 'Teddy Bear', icon: Baby, description: 'Classic cuddly companion' },
  { id: 'bunny', name: 'Bunny', icon: Rabbit, description: 'Hoppy and playful friend' },
  { id: 'cat', name: 'Cat', icon: Cat, description: 'Curious and independent' },
  { id: 'dog', name: 'Dog', icon: Dog, description: 'Loyal and energetic buddy' },
  { id: 'bird', name: 'Bird', icon: Bird, description: 'Chirpy and adventurous' },
  { id: 'fish', name: 'Fish', icon: Fish, description: 'Calm and mysterious' },
  { id: 'robot', name: 'Robot', icon: Bot, description: 'Futuristic tech companion' },
  { id: 'magical', name: 'Magical Creature', icon: Sparkles, description: 'Fantasy and imagination' },
];

export function ToyProfileStep() {
  const { toyConfig, updateToyConfig, setError, clearError, errors } = useToyWizardStore();
  const [tags, setTags] = useState<string>(toyConfig.tags.join(', '));

  const handleNameChange = (value: string) => {
    updateToyConfig('name', value);
    if (value.trim()) {
      clearError('name');
    } else {
      setError('name', 'Toy name is required');
    }
  };

  const handleTypeChange = (value: string) => {
    updateToyConfig('type', value);
    clearError('type');
  };

  const handleTagsChange = (value: string) => {
    setTags(value);
    const tagArray = value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    updateToyConfig('tags', tagArray);
  };

  useEffect(() => {
    // Validate on mount
    if (!toyConfig.name) {
      setError('name', 'Toy name is required');
    }
    if (!toyConfig.type) {
      setError('type', 'Please select a toy type');
    }
  }, []);

  return (
    <div className="space-y-6 step-component">
      <div className="text-center sm:text-left">
        <h2 className="font-minecraft text-base sm:text-lg font-black mb-2 uppercase tracking-wider text-gray-800"
          style={{
            textShadow: '2px 2px 0 #c381b5'
          }}
        >
          👾 Let's start with the basics
        </h2>
        <p className="font-geo font-medium text-gray-600 tracking-wide">
          Give your AI toy a name and choose what type of companion it will be.
        </p>
      </div>

      {/* Toy Name */}
      <div className="space-y-3">
        <label className="block text-sm font-geo font-semibold uppercase tracking-wider text-gray-700">
          Toy Name
          <span className="text-red-500 ml-1">*</span>
        </label>
        <Input
          value={toyConfig.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g., Buddy, Luna, Max"
          bg={errors.name ? "#ffe4e1" : "#ffffff"}
          borderColor={errors.name ? "red" : "black"}
          className={`font-geo font-medium ${errors.name ? 'animate-pulse' : ''}`}
        />
        {errors.name && (
          <p className="font-geo text-sm text-red-500 font-semibold uppercase tracking-wider">{errors.name}</p>
        )}
        <p className="font-geo text-sm font-medium text-gray-600 tracking-wide">
          Choose a friendly name that's easy to remember and pronounce
        </p>
      </div>

      {/* Toy Type */}
      <div className="space-y-3">
        <label className="font-geo block text-sm font-semibold uppercase tracking-wider text-black mb-2">
          Toy Type
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {TOY_TYPES.map((type) => (
            <label
              key={type.id}
              className={`
                relative flex flex-col items-center p-3 sm:p-4 border-[5px] cursor-pointer
                transition-all hover-lift font-black uppercase tracking-wider text-center
                ${toyConfig.type === type.id 
                  ? 'border-black bg-[#c381b5] text-white' 
                  : 'border-black bg-white text-black hover:bg-[#fefcd0]'
                }
              `}
              style={{
                borderImageSlice: 3,
                borderImageWidth: 2,
                borderImageRepeat: 'stretch',
                borderImageOutset: 2,
                boxShadow: toyConfig.type === type.id
                  ? '2px 2px 0 2px #8b5fa3, -2px -2px 0 2px #c381b5'
                  : '2px 2px 0 2px #e0e0e0, -2px -2px 0 2px #ffffff',
              }}
            >
              <input
                type="radio"
                name="toyType"
                value={type.id}
                checked={toyConfig.type === type.id}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="sr-only"
              />
              <type.icon className={`w-6 h-6 sm:w-8 sm:h-8 mb-2 ${
                toyConfig.type === type.id ? 'text-white animate-pulse' : 'text-[#c381b5]'
              }`} />
              <span className="font-minecraft text-xs sm:text-sm font-black mb-1">
                {type.name}
              </span>
              <span className="font-geo text-xs font-medium opacity-80">
                {type.description}
              </span>
            </label>
          ))}
        </div>
        {errors.type && (
          <p className="font-geo text-sm text-red-500 font-semibold uppercase tracking-wider">{errors.type}</p>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="font-geo text-sm font-semibold uppercase tracking-wider text-black">Tags</label>
          <div className="group relative">
            <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="invisible group-hover:visible absolute bottom-6 left-0 bg-black text-white text-xs p-2 rounded whitespace-nowrap z-10">
              Add tags to help categorize your toy (separate with commas)
            </div>
          </div>
        </div>
        <Input
          value={tags}
          onChange={(e) => handleTagsChange(e.target.value)}
          placeholder="e.g., educational, storyteller, friend"
          bg="#ffffff"
          borderColor="black"
          className="font-geo font-medium"
        />
        {toyConfig.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {toyConfig.tags.map((tag, index) => (
              <span 
                key={index} 
                className="font-minecraft px-2 py-1 text-xs font-black uppercase tracking-wider border-2 border-black bg-[#92cd41] text-white"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Public/Private Toggle */}
      <Card
        bg="#fefcd0"
        borderColor="black"
        shadowColor="#c381b5"
        className="p-4 sm:p-6"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <label className="font-minecraft text-base font-black uppercase tracking-wider text-black cursor-pointer">
              🌍 Make this toy public
            </label>
            <p className="font-geo text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Allow other users to discover and use your toy design
            </p>
          </div>
          <label className="cursor-pointer">
            <input
              type="checkbox"
              checked={toyConfig.isPublic}
              onChange={(e) => updateToyConfig('isPublic', e.target.checked)}
              className="pixel-checkbox"
            />
          </label>
        </div>
      </Card>
    </div>
  );
}
