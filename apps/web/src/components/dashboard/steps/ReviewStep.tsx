'use client';

import { useToyWizardStore } from '@/stores/toyWizardStore';
import { Button, Card } from '@pommai/ui';
import { 
  Check, 
  Edit2, 
  Shield, 
  Volume2, 
  Brain,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export function ReviewStep() {
  const { toyConfig, setCurrentStep, isCreating } = useToyWizardStore();

  const editSection = (step: any) => {
    setCurrentStep(step);
  };

  const getToyTypeIcon = () => {
    const icons: Record<string, any> = {
      teddy: '🧸',
      bunny: '🐰',
      cat: '🐱',
      dog: '🐶',
      bird: '🦜',
      fish: '🐠',
      robot: '🤖',
      magical: '✨',
    };
    return icons[toyConfig.type] || '🎁';
  };

  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl font-black mb-2 uppercase tracking-wider text-black"
          style={{
            textShadow: '2px 2px 0 #c381b5'
          }}
        >
          📋 Review Your AI Toy
        </h2>
        <p className="font-bold text-gray-700 uppercase tracking-wide">
          Take a moment to review {toyConfig.name}'s configuration before creating your AI companion.
        </p>
      </div>

      {/* Quick Summary */}
      <Card
        bg="#fefcd0"
        borderColor="black"
        shadowColor="#c381b5"
        className="p-4 sm:p-6"
      >
        <div className="flex items-start gap-4">
          <div className="text-4xl">{getToyTypeIcon()}</div>
          <div className="flex-1">
            <h3 className="text-xl font-black uppercase tracking-wider text-black mb-2">{toyConfig.name}</h3>
            <p className="font-bold text-gray-700 uppercase tracking-wide mb-3">
              {toyConfig.type.charAt(0).toUpperCase() + toyConfig.type.slice(1)}
            </p>
            <div className="flex flex-wrap gap-2">
              {toyConfig.isForKids && (
                <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border-2 border-black bg-[#92cd41] text-white flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Guardian Mode
                </span>
              )}
              {toyConfig.ageGroup && (
                <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border-2 border-black bg-[#f7931e] text-white">
                  Ages {toyConfig.ageGroup}
                </span>
              )}
              {toyConfig.isPublic && (
                <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border-2 border-black bg-[#c381b5] text-white">
                  Public
                </span>
              )}
              {toyConfig.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 text-xs font-black uppercase tracking-wider border border-black bg-white text-black">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Review Cards */}
      <div className="space-y-4">
        {/* Personality */}
        <Card
          bg="#ffffff"
          borderColor="black"
          shadowColor="#c381b5"
          className="p-4 sm:p-6"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              <h3 className="font-black text-lg uppercase tracking-wider text-black">Personality Configuration</h3>
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <Button
              bg="#f0f0f0"
              textColor="black"
              borderColor="black"
              shadow="#d0d0d0"
              onClick={() => editSection('personality')}
              className="py-1 px-3 font-bold uppercase tracking-wider hover-lift"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-black">Personality Traits</p>
              <div className="flex gap-2 mt-1">
                {toyConfig.personalityTraits.traits.map((trait, index) => (
                  <span key={index} className="px-2 py-1 text-xs font-black uppercase tracking-wider border border-black bg-[#fefcd0] text-black">
                    {trait}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-black">Description</p>
              <p className="text-sm font-bold text-gray-700 mt-1">{toyConfig.personalityPrompt}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-black">Speaking Style</p>
                <p className="text-sm font-bold text-gray-700">
                  {toyConfig.personalityTraits.speakingStyle.vocabulary} vocabulary, 
                  {' ' + toyConfig.personalityTraits.speakingStyle.sentenceLength} sentences
                </p>
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-black">Behavior</p>
                <p className="text-sm font-bold text-gray-700">
                  Educational: {toyConfig.personalityTraits.behavior.educationalFocus}/10,
                  Imagination: {toyConfig.personalityTraits.behavior.imaginationLevel}/10
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Voice */}
        <Card
          bg="#ffffff"
          borderColor="black"
          shadowColor="#f7931e"
          className="p-4 sm:p-6"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              <h3 className="font-black text-lg uppercase tracking-wider text-black">Voice Selection</h3>
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <Button
              bg="#f0f0f0"
              textColor="black"
              borderColor="black"
              shadow="#d0d0d0"
              onClick={() => editSection('voice')}
              className="py-1 px-3 font-bold uppercase tracking-wider hover-lift"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="mt-3">
            <p className="text-sm font-black uppercase tracking-wider text-black">Selected Voice</p>
            <p className="text-sm font-bold text-gray-700 mt-1">{toyConfig.voiceName || 'Custom Voice'}</p>
          </div>
        </Card>

        {/* Knowledge Base */}
        {toyConfig.knowledgeBase && (
          <Card
            bg="#ffffff"
            borderColor="black"
            shadowColor="#92cd41"
            className="p-4 sm:p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-black text-lg uppercase tracking-wider text-black">Knowledge Base</h3>
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <Button
                bg="#f0f0f0"
                textColor="black"
                borderColor="black"
                shadow="#d0d0d0"
                onClick={() => editSection('knowledge')}
                className="py-1 px-3 font-bold uppercase tracking-wider hover-lift"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {toyConfig.knowledgeBase.toyBackstory.origin && (
                <div>
                  <p className="text-sm font-black uppercase tracking-wider text-black">Origin Story</p>
                  <p className="text-sm font-bold text-gray-700 mt-1">{toyConfig.knowledgeBase.toyBackstory.origin}</p>
                </div>
              )}
              
              {toyConfig.knowledgeBase.toyBackstory.specialAbilities.length > 0 && (
                <div>
                  <p className="text-sm font-black uppercase tracking-wider text-black">Special Abilities</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {toyConfig.knowledgeBase.toyBackstory.specialAbilities.map((ability, index) => (
                      <span key={index} className="px-2 py-1 text-xs font-black uppercase tracking-wider border border-black bg-[#c381b5] text-white">
                        {ability}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {toyConfig.knowledgeBase.customFacts && toyConfig.knowledgeBase.customFacts.length > 0 && (
                <div>
                  <p className="text-sm font-black uppercase tracking-wider text-black">Custom Knowledge</p>
                  <p className="text-sm font-bold text-gray-700 mt-1">
                    {toyConfig.knowledgeBase.customFacts.length} custom fact(s) added
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Safety Notice */}
      {isCreating && (
        <Card
          bg="#f7931e"
          borderColor="black"
          shadowColor="#d67c1a"
          className="p-4"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-white" />
            <p className="text-sm font-bold text-white uppercase tracking-wide">
              🔄 Creating your AI companion... This may take a few moments.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
