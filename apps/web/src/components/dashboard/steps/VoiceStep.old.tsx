'use client';

import { useEffect, useState } from 'react';
import { useToyWizardStore } from '@/stores/toyWizardStore';
import { VoiceGallery } from '@/components/voice/VoiceGallery';
import { VoicePreview } from '@/components/voice/VoicePreview';
import { VoiceUploader } from '@/components/voice/VoiceUploader';
import { Button, Card, Popup } from '@pommai/ui';
import { Volume2, Upload } from 'lucide-react';
import { useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

/**
 * VoiceStep
 *
 * Lets users pick or upload a voice.
 * - Primary headings use font-minecraft (pixel) with compact sizes.
 * - Body and helper text use font-geo for readability.
 */
export function VoiceStep() {
  const { toyConfig, updateToyConfig } = useToyWizardStore();
  const [selectedVoice, setSelectedVoice] = useState<{ _id?: string; externalVoiceId?: string; name: string } | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');

  // Ensure default voices are available for selection
  const syncDefaultVoices = useAction(api.aiServices.syncDefaultVoices);
  const hasSeededRef = (typeof window !== 'undefined') 
    ? ((window as unknown as { __pommaiSeededVoicesRef?: { value: boolean } }).__pommaiSeededVoicesRef ??= { value: false }) 
    : { value: false };
  useEffect(() => {
    if (hasSeededRef.value) return;
    hasSeededRef.value = true;
    (async () => {
      try { 
        await syncDefaultVoices({}); 
      } catch (error) { 
        console.error('Failed to sync default voices:', error);
      }
    })();
  }, [syncDefaultVoices, hasSeededRef]);

  const handleSelectVoice = (voice: { externalVoiceId?: string; name: string; _id?: string }) => {
    setSelectedVoice(voice);
    if (voice.externalVoiceId) {
      updateToyConfig('voiceId', voice.externalVoiceId);
    }
    updateToyConfig('voiceName', voice.name);
  };

  const handleVoiceUploaded = (voiceId: string, voiceName?: string) => {
    updateToyConfig('voiceId', voiceId);
    if (voiceName) {
      updateToyConfig('voiceName', voiceName);
    }
    setShowUploader(false);
  };

  return (
    <div className="space-y-6 step-component">
      <div className="text-center sm:text-left">
        <h2 className="font-minecraft text-base sm:text-lg font-black mb-3 uppercase tracking-wider text-gray-800"
          style={{
            textShadow: '2px 2px 0 #c381b5'
          }}
>
          🎤 Choose {toyConfig.name}&apos;s Voice
        </h2>
        <p className="font-geo text-sm font-medium text-gray-600 tracking-wide leading-relaxed">
          Select a voice that matches {toyConfig.name}&apos;s personality, or create your own custom voice.
        </p>
      </div>

      {/* Voice Selection (no Tabs) */}
      <Card
        bg="#ffffff"
        borderColor="black"
        shadowColor="#c381b5"
        className="p-[var(--spacing-lg)] sm:p-[var(--spacing-xl)]"
      >
        <div className="space-y-4">
          {/* Segmented control + Upload */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex gap-2">
              <Button
                bg={activeTab === 'preset' ? '#c381b5' : '#f8f8f8'}
                textColor={activeTab === 'preset' ? 'white' : 'black'}
                borderColor="black"
                shadow={activeTab === 'preset' ? '#8b5fa3' : '#e0e0e0'}
                onClick={() => setActiveTab('preset')}
                className="py-2 px-3 font-minecraft font-black uppercase tracking-wider hover-lift text-xs sm:text-sm"
              >
                🎧 Preset Voices
              </Button>
              <Button
                bg={activeTab === 'custom' ? '#c381b5' : '#f8f8f8'}
                textColor={activeTab === 'custom' ? 'white' : 'black'}
                borderColor="black"
                shadow={activeTab === 'custom' ? '#8b5fa3' : '#e0e0e0'}
                onClick={() => setActiveTab('custom')}
                className="py-2 px-3 font-minecraft font-black uppercase tracking-wider hover-lift text-xs sm:text-sm"
              >
                🎤 Custom Voice
              </Button>
            </div>
            {activeTab === 'preset' && (
              <Button
                bg="#ffffff"
                textColor="black"
                borderColor="black"
                shadow="#e0e0e0"
                onClick={() => setShowUploader(true)}
                className="py-2 px-3 font-minecraft font-black uppercase tracking-wider hover-lift text-xs sm:text-sm"
              >
                <Upload className="w-3 h-3 mr-2" /> Upload Voice
              </Button>
            )}
          </div>

          {/* Content */}
          {activeTab === 'preset' && (
            <div className="space-y-4">
              {selectedVoice && (
                <Card
                  bg="#ffffff"
                  borderColor="black"
                  shadowColor="#c381b5"
                  className="p-[var(--spacing-lg)]"
                >
                  <h3 className="retro-h3 text-base text-gray-800 mb-3">🎵 Selected Voice</h3>
                  <VoicePreview voice={selectedVoice} isForKids={toyConfig.isForKids} />
                </Card>
              )}

              <VoiceGallery
                selectedVoiceId={selectedVoice?._id}
                onSelectVoice={handleSelectVoice}
                isForKids={toyConfig.isForKids}
              />
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="text-center py-[var(--spacing-xl)]">
              <div className="max-w-md mx-auto space-y-6">
                <div className="w-14 h-14 border-4 border-black bg-gradient-to-br from-[#c381b5] to-[#f7931e] mx-auto flex items-center justify-center">
                  <Volume2 className="w-7 h-7 text-white" />
                </div>
                
                <div>
                  <h3 className="retro-h3 text-base text-gray-800 mb-3">
                    Create a Custom Voice
                  </h3>
                  <p className="font-geo text-sm font-medium text-gray-600 leading-relaxed">
                    Record your own voice or upload an audio file to create a unique voice for {toyConfig.name}
                  </p>
                </div>

                <Button
                  bg="#92cd41"
                  textColor="white"
                  borderColor="black"
                  shadow="#76a83a"
                  onClick={() => setShowUploader(true)}
                  className="w-full py-3 px-6 font-minecraft font-black uppercase tracking-wider hover-lift"
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                  Start Voice Creation
                </Button>

                <Card
                  bg="#f7931e"
                  borderColor="black"
                  shadowColor="#d67c1a"
                  className="p-4 text-left"
                >
                  <h4 className="font-minecraft font-black text-sm text-white mb-2 uppercase tracking-wider">
                    📝 Voice Creation Tips:
                  </h4>
                  <ul className="font-geo text-xs font-medium text-white space-y-1 leading-relaxed">
                    <li>• Record in a quiet environment</li>
                    <li>• Speak clearly and at a moderate pace</li>
                    <li>• Record 3-5 minutes of diverse content</li>
                    <li>• Use the provided script for best results</li>
                  </ul>
                </Card>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Voice Upload Popup */}
      {showUploader && (
        <Popup
          isOpen={showUploader}
          onClose={() => setShowUploader(false)}
          title="🎤 Upload Custom Voice"
          bg="#ffffff"
          borderColor="black"
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <VoiceUploader
            onComplete={handleVoiceUploaded}
            onCancel={() => setShowUploader(false)}
            isForKids={toyConfig.isForKids}
          />
        </Popup>
      )}
    </div>
  );
}
