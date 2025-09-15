'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { type Doc } from '../../../convex/_generated/dataModel';
import { Button, Card, Popup } from '@pommai/ui';
import { Save, Trash, Loader2, AlertCircle } from 'lucide-react';
import { useToyWizardStore } from '@/stores/toyWizardStore';

// Import step components to reuse their UI structure
import { ToyProfileStep } from './steps/ToyProfileStep';
import { ForKidsToggleStep } from './steps/ForKidsToggleStep';
import { PersonalityStep } from './steps/PersonalityStep';
import { VoiceStep } from './steps/VoiceStep';
import { KnowledgeStep } from './steps/KnowledgeStep';
import { SafetyStep } from './steps/SafetyStep';

type ToyDocument = Doc<'toys'>;

interface EditToyFormProps {
  toy: ToyDocument;
}

export function EditToyForm({ toy }: EditToyFormProps) {
  const router = useRouter();
  const { toyConfig, setToyConfig, resetWizard, updateToyConfig } = useToyWizardStore();

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const updateToyMutation = useMutation(api.toys.updateToy);
  const deleteToyMutation = useMutation(api.toys.deleteToy);

  // Fetch the toy's knowledge base document if it exists
  const knowledgeBaseDoc = useQuery(
    api.knowledgeBase.getKnowledgeBase,
    toy.knowledgeBaseId ? { toyId: toy._id } : 'skip'
  );

  // When the component mounts, populate the wizard's store with the toy's data
  useEffect(() => {
    // Convert the toy document to match the store's ToyConfig type
    setToyConfig({
      name: toy.name,
      type: toy.type,
      isForKids: toy.isForKids,
      ageGroup: toy.ageGroup as '3-5' | '6-8' | '9-12' | undefined,
      voiceId: toy.voiceId,
      voiceName: '', // voiceName not stored in DB, will be fetched from voices table if needed
      personalityPrompt: toy.personalityPrompt,
      personalityTraits: toy.personalityTraits || {
        traits: [],
        speakingStyle: {
          vocabulary: 'moderate',
          sentenceLength: 'medium',
          usesSoundEffects: false,
          catchPhrases: [],
        },
        interests: [],
        favoriteTopics: [],
        avoidTopics: [],
        behavior: {
          encouragesQuestions: true,
          tellsStories: true,
          playsGames: true,
          educationalFocus: 5,
          imaginationLevel: 5,
        },
      },
      safetySettings: toy.safetyLevel ? {
        safetyLevel: toy.safetyLevel,
        contentFilters: toy.contentFilters || {
          enabledCategories: [],
          customBlockedTopics: [],
        },
      } : undefined,
      isPublic: toy.isPublic,
      tags: toy.tags || [],
    });

    // Clean up the store when the component unmounts
    return () => {
      resetWizard();
    };
  }, [toy, setToyConfig, resetWizard]);

  // Synchronize the store's knowledgeBase with the fetched document
  useEffect(() => {
    // If the toy has no associated knowledge base, ensure the store reflects that
    if (!toy.knowledgeBaseId) {
      updateToyConfig('knowledgeBase', undefined);
      return;
    }

    // When the query is skipped or still loading, do nothing yet
    if (knowledgeBaseDoc === undefined) return;

    // No KB found for this toy
    if (knowledgeBaseDoc === null) {
      updateToyConfig('knowledgeBase', undefined);
      return;
    }

    // Map the Convex KB doc to the store's KnowledgeBase shape (omit non-UI fields)
    updateToyConfig('knowledgeBase', {
      toyBackstory: {
        origin: knowledgeBaseDoc.toyBackstory.origin,
        personality: knowledgeBaseDoc.toyBackstory.personality,
        specialAbilities: knowledgeBaseDoc.toyBackstory.specialAbilities,
        favoriteThings: knowledgeBaseDoc.toyBackstory.favoriteThings,
      },
      familyInfo: knowledgeBaseDoc.familyInfo,
      customFacts: knowledgeBaseDoc.customFacts,
    });
  }, [toy.knowledgeBaseId, knowledgeBaseDoc, updateToyConfig]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    
    // Debug log to see what we're saving
    console.log('Saving toy with config:', {
      toyId: toy._id,
      name: toyConfig.name,
      type: toyConfig.type,
      personalityPrompt: toyConfig.personalityPrompt,
      tags: toyConfig.tags,
    });
    
    try {
      await updateToyMutation({
        toyId: toy._id,
        name: toyConfig.name,
        type: toyConfig.type,
        personalityPrompt: toyConfig.personalityPrompt,
        personalityTraits: toyConfig.personalityTraits,
        voiceId: toyConfig.voiceId,
        safetyLevel: toyConfig.safetySettings?.safetyLevel,
        contentFilters: toyConfig.safetySettings?.contentFilters,
        tags: toyConfig.tags,
      });
      console.log('Toy updated successfully!');
      router.push('/dashboard');
    } catch (e) {
      console.error("Failed to update toy:", e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await deleteToyMutation({ toyId: toy._id });
      setShowDeleteDialog(false);
      router.push('/dashboard');
    } catch (e) {
      console.error("Failed to delete toy:", e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      setShowDeleteDialog(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Toy Profile */}
      <Card bg="#ffffff" borderColor="black" shadowColor="#c381b5" className="p-6 sm:p-8">
        <h2 className="font-minecraft text-lg mb-4 uppercase tracking-wider flex items-center gap-2">
          <span className="text-2xl">🧸</span>
          Toy Profile
        </h2>
        <ToyProfileStep />
      </Card>
      
      {/* For Kids Toggle */}
      <Card bg="#ffffff" borderColor="black" shadowColor="#92cd41" className="p-6 sm:p-8">
        <h2 className="font-minecraft text-lg mb-4 uppercase tracking-wider flex items-center gap-2">
          <span className="text-2xl">👶</span>
          Age Settings
        </h2>
        <ForKidsToggleStep />
      </Card>
      
      {/* Personality */}
      <Card bg="#ffffff" borderColor="black" shadowColor="#f7931e" className="p-6 sm:p-8">
        <h2 className="font-minecraft text-lg mb-4 uppercase tracking-wider flex items-center gap-2">
          <span className="text-2xl">✨</span>
          Personality
        </h2>
        <PersonalityStep />
      </Card>

      {/* Voice */}
      <Card bg="#ffffff" borderColor="black" shadowColor="#c381b5" className="p-6 sm:p-8">
        <h2 className="font-minecraft text-lg mb-4 uppercase tracking-wider flex items-center gap-2">
          <span className="text-2xl">🎤</span>
          Voice Settings
        </h2>
        <VoiceStep
          toyId={toy._id as any}
          onConfirmVoice={async (voiceId: string, voiceName?: string) => {
            try {
              await updateToyMutation({ toyId: toy._id as any, voiceId });
              updateToyConfig('voiceId', voiceId);
              if (voiceName) updateToyConfig('voiceName', voiceName);
            } catch (e) {
              console.warn('Failed to persist voice selection:', e);
            }
          }}
        />
      </Card>

      {/* Knowledge Base */}
      <Card bg="#ffffff" borderColor="black" shadowColor="#92cd41" className="p-6 sm:p-8">
        <h2 className="font-minecraft text-lg mb-4 uppercase tracking-wider flex items-center gap-2">
          <span className="text-2xl">📚</span>
          Knowledge Base
        </h2>
        <KnowledgeStep />
      </Card>

      {/* Safety Settings (only for Kids mode) */}
      {toyConfig.isForKids && (
        <Card bg="#ffffff" borderColor="black" shadowColor="#ff6b6b" className="p-6 sm:p-8">
          <h2 className="font-minecraft text-lg mb-4 uppercase tracking-wider flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            Safety Settings
          </h2>
          <SafetyStep />
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card bg="#ffe4e1" borderColor="red" shadowColor="#ff6b6b" className="p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="font-geo font-semibold text-red-700">{error}</p>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t-4 border-black">
        <Button
          onClick={() => setShowDeleteDialog(true)}
          bg="#ff6b6b"
          textColor="white"
          borderColor="black"
          shadow="#e84545"
          className="w-full sm:w-auto py-3 px-6 font-minecraft font-black uppercase tracking-wider hover-lift"
          disabled={isSaving}
        >
          <Trash className="w-4 h-4 mr-2" />
          Delete Toy
        </Button>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            onClick={() => router.push('/dashboard')}
            bg="#f0f0f0"
            textColor="black"
            borderColor="black"
            shadow="#d0d0d0"
            className="flex-1 sm:flex-none py-3 px-6 font-minecraft font-black uppercase tracking-wider hover-lift"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            bg="#92cd41"
            textColor="white"
            borderColor="black"
            shadow="#76a83a"
            className="flex-1 sm:flex-none py-3 px-6 font-minecraft font-black uppercase tracking-wider hover-lift"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <Popup
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          title="🗑️ Delete Toy?"
          bg="#ffffff"
          borderColor="black"
        >
          <div className="space-y-4">
            <p className="font-geo text-gray-700">
              Are you sure you want to permanently delete <strong>"{toy.name}"</strong>? 
            </p>
            <div className="bg-[#ffe4e1] border-2 border-red-500 rounded-lg p-3">
              <p className="font-geo text-red-700 text-sm">
                ⚠️ This action cannot be undone. All conversations and data associated with this toy will be lost.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                onClick={() => setShowDeleteDialog(false)}
                bg="#f0f0f0"
                textColor="black"
                borderColor="black"
                shadow="#d0d0d0"
                className="font-minecraft font-black uppercase tracking-wider hover-lift"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                bg="#ff6b6b"
                textColor="white"
                borderColor="black"
                shadow="#e84545"
                className="font-minecraft font-black uppercase tracking-wider hover-lift"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash className="w-4 h-4 mr-2" />
                    Delete Forever
                  </>
                )}
              </Button>
            </div>
          </div>
        </Popup>
      )}
    </div>
  );
}
