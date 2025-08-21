'use client';

import { useToyWizardStore } from '@/stores/toyWizardStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Edit2, 
  Shield, 
  Volume2, 
  Brain,
  Users,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Review Your AI Toy
        </h2>
        <p className="text-gray-600">
          Take a moment to review {toyConfig.name}'s configuration before creating your AI companion.
        </p>
      </div>

      {/* Quick Summary */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl">{getToyTypeIcon()}</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{toyConfig.name}</h3>
            <p className="text-gray-600 mb-3">{toyConfig.type.charAt(0).toUpperCase() + toyConfig.type.slice(1)}</p>
            <div className="flex flex-wrap gap-2">
              {toyConfig.isForKids && (
                <Badge variant="default" className="bg-green-600">
                  <Shield className="w-3 h-3 mr-1" />
                  Guardian Mode
                </Badge>
              )}
              {toyConfig.ageGroup && (
                <Badge variant="secondary">Ages {toyConfig.ageGroup}</Badge>
              )}
              {toyConfig.isPublic && (
                <Badge variant="outline">Public</Badge>
              )}
              {toyConfig.tags.map((tag, index) => (
                <Badge key={index} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Review */}
      <Accordion type="single" collapsible className="w-full">
        {/* Personality */}
        <AccordionItem value="personality">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              <span>Personality Configuration</span>
              <Check className="w-4 h-4 text-green-600 ml-auto mr-2" />
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-4">
            <div className="flex justify-between items-start">
              <div className="space-y-3 flex-1">
                <div>
                  <p className="text-sm font-medium text-gray-700">Personality Traits</p>
                  <div className="flex gap-2 mt-1">
                    {toyConfig.personalityTraits.traits.map((trait, index) => (
                      <Badge key={index} variant="secondary">{trait}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Description</p>
                  <p className="text-sm text-gray-600 mt-1">{toyConfig.personalityPrompt}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Speaking Style</p>
                    <p className="text-sm text-gray-600">
                      {toyConfig.personalityTraits.speakingStyle.vocabulary} vocabulary, 
                      {' ' + toyConfig.personalityTraits.speakingStyle.sentenceLength} sentences
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Behavior</p>
                    <p className="text-sm text-gray-600">
                      Educational: {toyConfig.personalityTraits.behavior.educationalFocus}/10,
                      Imagination: {toyConfig.personalityTraits.behavior.imaginationLevel}/10
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editSection('personality')}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Voice */}
        <AccordionItem value="voice">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              <span>Voice Selection</span>
              <Check className="w-4 h-4 text-green-600 ml-auto mr-2" />
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-700">Selected Voice</p>
                <p className="text-sm text-gray-600 mt-1">{toyConfig.voiceName || 'Custom Voice'}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editSection('voice')}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Knowledge Base */}
        {toyConfig.knowledgeBase && (
          <AccordionItem value="knowledge">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span>Knowledge Base</span>
                <Check className="w-4 h-4 text-green-600 ml-auto mr-2" />
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-4">
              <div className="flex justify-between items-start">
                <div className="space-y-3 flex-1">
                  {toyConfig.knowledgeBase.toyBackstory.origin && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Origin Story</p>
                      <p className="text-sm text-gray-600 mt-1">{toyConfig.knowledgeBase.toyBackstory.origin}</p>
                    </div>
                  )}
                  
                  {toyConfig.knowledgeBase.toyBackstory.specialAbilities.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Special Abilities</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {toyConfig.knowledgeBase.toyBackstory.specialAbilities.map((ability, index) => (
                          <Badge key={index} variant="outline">{ability}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {toyConfig.knowledgeBase.familyInfo?.members && toyConfig.knowledgeBase.familyInfo.members.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Family Members</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {toyConfig.knowledgeBase.familyInfo.members.length} family member(s) added
                      </p>
                    </div>
                  )}

                  {toyConfig.knowledgeBase.customFacts.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Custom Facts</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {toyConfig.knowledgeBase.customFacts.length} custom fact(s) added
                      </p>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editSection('knowledge')}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Safety Settings (for Kids Mode) */}
        {toyConfig.isForKids && toyConfig.safetySettings && (
          <AccordionItem value="safety">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span>Guardian Mode Settings</span>
                <Check className="w-4 h-4 text-green-600 ml-auto mr-2" />
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-4">
              <div className="flex justify-between items-start">
                <div className="space-y-3 flex-1">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Safety Level</p>
                    <Badge 
                      variant={
                        toyConfig.safetySettings.safetyLevel === 'strict' ? 'default' :
                        toyConfig.safetySettings.safetyLevel === 'moderate' ? 'secondary' :
                        'outline'
                      }
                      className="mt-1"
                    >
                      {toyConfig.safetySettings.safetyLevel.charAt(0).toUpperCase() + 
                       toyConfig.safetySettings.safetyLevel.slice(1)}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Content Filters</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {toyConfig.safetySettings.contentFilters.enabledCategories.length} filter(s) enabled
                    </p>
                  </div>

                  {toyConfig.safetySettings.contentFilters.customBlockedTopics.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Blocked Topics</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {toyConfig.safetySettings.contentFilters.customBlockedTopics.map((topic, index) => (
                          <Badge key={index} variant="outline">{topic}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editSection('safety')}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {/* Final Confirmation */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Ready to Create?</p>
            <p>
              Once you create {toyConfig.name}, you can start interacting right away. 
              You can always update settings later from the dashboard.
            </p>
          </div>
        </div>
      </div>

      {isCreating && (
        <div className="text-center py-4">
          <div className="animate-pulse text-purple-600">
            Creating your AI companion...
          </div>
        </div>
      )}
    </div>
  );
}
