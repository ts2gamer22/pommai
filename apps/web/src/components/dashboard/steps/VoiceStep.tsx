'use client';

import { useEffect, useState } from 'react';
import { useToyWizardStore } from '@/stores/toyWizardStore';
import { VoiceGallery } from '@/components/voice/VoiceGallery';
import { VoicePreview } from '@/components/voice/VoicePreview';
import { VoiceUploader } from '@/components/voice/VoiceUploader';
import { Button, Card } from '@pommai/ui';
import { Volume2, Mic, Library, ChevronLeft, AlertCircle } from 'lucide-react';
import { useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

type ViewMode = 'selection' | 'upload' | 'preview';

interface VoiceStepProps {
  toyId?: string;
  onConfirmVoice?: (voiceId: string, voiceName?: string) => Promise<void> | void;
}

export function VoiceStep({ toyId, onConfirmVoice }: VoiceStepProps) {
  const { toyConfig, updateToyConfig } = useToyWizardStore();
  const [selectedVoice, setSelectedVoice] = useState<{ 
    _id?: string; 
    externalVoiceId?: string; 
    name: string;
    description?: string;
    gender?: string;
    language?: string;
    ageGroup?: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure default voices are available
  const syncDefaultVoices = useAction(api.aiServices.syncDefaultVoices);
  
  useEffect(() => {
    const initVoices = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await syncDefaultVoices({});
      } catch (error) {
        console.error('Failed to sync voices:', error);
        setError('Failed to load default voices. Voice cloning may still work.');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only run once on mount
    if (typeof window !== 'undefined') {
      const hasInit = (window as any).__voiceStepInit;
      if (!hasInit) {
        (window as any).__voiceStepInit = true;
        initVoices();
      }
    }
  }, [syncDefaultVoices]);

  // Initialize selected voice from toyConfig
  useEffect(() => {
    if (toyConfig.voiceId && toyConfig.voiceName && !selectedVoice) {
      setSelectedVoice({
        externalVoiceId: toyConfig.voiceId,
        name: toyConfig.voiceName,
      });
    }
  }, [toyConfig.voiceId, toyConfig.voiceName, selectedVoice]);

  const handleSelectVoice = (voice: any) => {
    setSelectedVoice(voice);
    if (voice.externalVoiceId) {
      updateToyConfig('voiceId', voice.externalVoiceId);
    }
    updateToyConfig('voiceName', voice.name);
    setViewMode('preview');
  };

  const handleVoiceUploaded = (voiceId: string, voiceName?: string) => {
    updateToyConfig('voiceId', voiceId);
    if (voiceName) {
      updateToyConfig('voiceName', voiceName);
    }
    setSelectedVoice({
      externalVoiceId: voiceId,
      name: voiceName || 'Custom Voice',
    });
    setViewMode('preview');
  };

  const handleBackToSelection = () => {
    setViewMode('selection');
    setError(null);
  };

  const handleCancelUpload = () => {
    setViewMode('selection');
    setError(null);
  };

  return (
    <div className="space-y-6 step-component">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h2 
          className="font-minecraft text-base sm:text-lg font-black mb-3 uppercase tracking-wider text-gray-800"
          style={{ textShadow: '2px 2px 0 #c381b5' }}
        >
          🎤 Choose {toyConfig.name}&apos;s Voice
        </h2>
        <p className="font-geo text-sm font-medium text-gray-600 tracking-wide leading-relaxed">
          {viewMode === 'selection' && "Select a voice from our library or create your own"}
          {viewMode === 'upload' && "Record or upload your voice to create a custom voice"}
          {viewMode === 'preview' && "Test and customize the selected voice"}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <Card
          bg="#fee2e2"
          borderColor="#dc2626"
          shadowColor="#fca5a5"
          className="p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-geo text-sm font-medium text-red-800">{error}</p>
              <p className="font-geo text-xs text-red-600 mt-1">
                You can continue with mock voices for testing.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Main Content Area */}
      <Card
        bg="#ffffff"
        borderColor="black"
        shadowColor="#c381b5"
        className="overflow-hidden"
      >
        {/* View Mode Navigation */}
        {viewMode !== 'selection' && (
          <div className="border-b-2 border-black p-4 bg-gray-50">
            <Button
              bg="#ffffff"
              textColor="black"
              borderColor="black"
              shadow="#e0e0e0"
              onClick={handleBackToSelection}
              className="font-minecraft font-black uppercase tracking-wider text-xs"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Voice Library
            </Button>
          </div>
        )}

        <div className="p-[var(--spacing-lg)] sm:p-[var(--spacing-xl)]">
          {/* Selection View */}
          {viewMode === 'selection' && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card
                  bg="#f3e8ff"
                  borderColor="black"
                  shadowColor="#c381b5"
                  className="p-6 cursor-pointer transition-transform hover:scale-[1.02]"
                  onClick={() => setViewMode('selection')}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border-4 border-black bg-gradient-to-br from-[#c381b5] to-[#8b5fa3] flex items-center justify-center">
                      <Library className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-minecraft font-black text-sm uppercase tracking-wider">
                        Voice Library
                      </h3>
                      <p className="font-geo text-xs text-gray-600 mt-1">
                        Choose from pre-made voices
                      </p>
                    </div>
                  </div>
                </Card>

                <Card
                  bg="#fff6cc"
                  borderColor="black"
                  shadowColor="#f7931e"
                  className="p-6 cursor-pointer transition-transform hover:scale-[1.02]"
                  onClick={() => setViewMode('upload')}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border-4 border-black bg-gradient-to-br from-[#f7931e] to-[#d67c1a] flex items-center justify-center">
                      <Mic className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-minecraft font-black text-sm uppercase tracking-wider">
                        Create Custom Voice
                      </h3>
                      <p className="font-geo text-xs text-gray-600 mt-1">
                        Record or upload your voice
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Selected Voice Display */}
              {selectedVoice && (
                <Card
                  bg="#e8f5e9"
                  borderColor="black"
                  shadowColor="#92cd41"
                  className="p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-5 h-5 text-green-700" />
                      <div>
                        <p className="font-minecraft text-xs uppercase tracking-wider text-green-900">
                          Currently Selected
                        </p>
                        <p className="font-geo text-sm font-bold text-green-800">
                          {selectedVoice.name}
                        </p>
                      </div>
                    </div>
                    <Button
                      bg="#92cd41"
                      textColor="white"
                      borderColor="black"
                      shadow="#76a83a"
                      size="sm"
                      onClick={() => setViewMode('preview')}
                    >
                      Test Voice
                    </Button>
                  </div>
                </Card>
              )}

              {/* Voice Gallery */}
              <div>
                <h3 className="font-minecraft font-black text-sm uppercase tracking-wider mb-4">
                  Available Voices
                </h3>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent"></div>
                    <p className="font-geo text-sm text-gray-600 mt-3">Loading voices...</p>
                  </div>
                ) : (
                  <VoiceGallery
                    selectedVoiceId={selectedVoice?._id}
                    onSelectVoice={handleSelectVoice}
                    isForKids={toyConfig.isForKids}
                  />
                )}
              </div>
            </div>
          )}

          {/* Upload View */}
          {viewMode === 'upload' && (
            <div>
              <VoiceUploader
                onComplete={handleVoiceUploaded}
                onCancel={handleCancelUpload}
                isForKids={toyConfig.isForKids}
              />
            </div>
          )}

          {/* Preview View */}
          {viewMode === 'preview' && selectedVoice && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="font-minecraft font-black text-base uppercase tracking-wider mb-2">
                  Voice Preview
                </h3>
                <p className="font-geo text-sm text-gray-600">
                  Test {selectedVoice.name} with different phrases and settings
                </p>
              </div>

              <VoicePreview 
                voice={selectedVoice} 
                isForKids={toyConfig.isForKids} 
              />

              <div className="flex justify-center gap-4">
                <Button
                  bg="#f0f0f0"
                  textColor="black"
                  borderColor="black"
                  shadow="#d0d0d0"
                  onClick={() => setViewMode('selection')}
                >
                  Choose Different Voice
                </Button>
                <Button
                  bg="#92cd41"
                  textColor="white"
                  borderColor="black"
                  shadow="#76a83a"
                  onClick={async () => {
                    try {
                      if (onConfirmVoice && selectedVoice?.externalVoiceId) {
                        await onConfirmVoice(selectedVoice.externalVoiceId, selectedVoice.name);
                      }
                    } catch (e) {
                      console.warn('Persisting voice failed (non-blocking):', e);
                    } finally {
                      setViewMode('selection');
                    }
                  }}
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                  Confirm Voice Selection
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Helper Tips */}
      {viewMode === 'selection' && (
        <Card
          bg="#f7931e"
          borderColor="black"
          shadowColor="#d67c1a"
          className="p-4"
        >
          <h4 className="font-minecraft font-black text-sm text-white mb-2 uppercase tracking-wider">
            💡 Voice Selection Tips:
          </h4>
          <ul className="font-geo text-xs font-medium text-white space-y-1 leading-relaxed">
            <li>• Choose a voice that matches your toy's personality</li>
            <li>• Test the voice with different phrases before confirming</li>
            <li>• Custom voices provide a unique, personalized experience</li>
            <li>• All voices support multiple languages and emotions</li>
          </ul>
        </Card>
      )}
    </div>
  );
}
