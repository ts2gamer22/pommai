'use client';

import { useState, useEffect } from 'react';
import { useToyWizardStore } from '@/stores/toyWizardStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Baby, // Replace Teddy
  Rabbit, 
  Cat, 
  Dog, 
  Bird, 
  Fish,
  Bot,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Let's start with the basics
        </h2>
        <p className="text-gray-600">
          Give your AI toy a name and choose what type of companion it will be.
        </p>
      </div>

      {/* Toy Name */}
      <div className="space-y-2">
        <Label htmlFor="toy-name">
          Toy Name
          <span className="text-red-500 ml-1">*</span>
        </Label>
        <Input
          id="toy-name"
          value={toyConfig.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g., Buddy, Luna, Max"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name}</p>
        )}
        <p className="text-sm text-gray-500">
          Choose a friendly name that's easy to remember and pronounce
        </p>
      </div>

      {/* Toy Type */}
      <div className="space-y-2">
        <Label>
          Toy Type
          <span className="text-red-500 ml-1">*</span>
        </Label>
        <RadioGroup
          value={toyConfig.type}
          onValueChange={handleTypeChange}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TOY_TYPES.map((type) => (
              <label
                key={type.id}
                htmlFor={type.id}
                className={`
                  relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer
                  transition-all hover:border-purple-400
                  ${toyConfig.type === type.id 
                    ? 'border-purple-600 bg-purple-50' 
                    : 'border-gray-200'
                  }
                `}
              >
                <RadioGroupItem
                  id={type.id}
                  value={type.id}
                  className="sr-only"
                />
                <type.icon className={`w-8 h-8 mb-2 ${
                  toyConfig.type === type.id ? 'text-purple-600' : 'text-gray-600'
                }`} />
                <span className="text-sm font-medium text-gray-900">
                  {type.name}
                </span>
                <span className="text-xs text-gray-500 text-center mt-1">
                  {type.description}
                </span>
              </label>
            ))}
          </div>
        </RadioGroup>
        {errors.type && (
          <p className="text-sm text-red-500">{errors.type}</p>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="tags">Tags</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Add tags to help categorize your toy (separate with commas)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => handleTagsChange(e.target.value)}
          placeholder="e.g., educational, storyteller, friend"
        />
        {toyConfig.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {toyConfig.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Public/Private Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="space-y-1">
          <Label htmlFor="public" className="text-base cursor-pointer">
            Make this toy public
          </Label>
          <p className="text-sm text-gray-600">
            Allow other users to discover and use your toy design
          </p>
        </div>
        <Checkbox
          id="public"
          checked={toyConfig.isPublic}
          onChange={(e) => updateToyConfig('isPublic', (e.target as HTMLInputElement).checked)}
        />
      </div>
    </div>
  );
}
