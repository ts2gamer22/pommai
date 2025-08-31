'use client';

import { useState } from 'react';
import { useToyWizardStore } from '@/stores/toyWizardStore';
import { VoiceGallery } from '@/components/voice/VoiceGallery';
import { VoicePreview } from '@/components/voice/VoicePreview';
import { VoiceUploader } from '@/components/voice/VoiceUploader';
import { Button, Card, Tabs, Popup } from '@pommai/ui';
import { Volume2 } from 'lucide-react';

export function VoiceStep() {
  const { toyConfig, updateToyConfig } = useToyWizardStore();
  const [selectedVoice, setSelectedVoice] = useState<any>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');

  const handleSelectVoice = (voice: any) => {
    setSelectedVoice(voice);
    updateToyConfig('voiceId', voice.externalVoiceId);
    updateToyConfig('voiceName', voice.name);
  };

  const handleVoiceUploaded = (voiceId: string) => {
    // In a real app, you'd fetch the voice details here
    updateToyConfig('voiceId', voiceId);
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
          🎤 Choose {toyConfig.name}'s Voice
        </h2>
        <p className="font-geo text-sm font-medium text-gray-600 tracking-wide leading-relaxed">
          Select a voice that matches {toyConfig.name}'s personality, or create your own custom voice.
        </p>
      </div>

      {/* Voice Selection Tabs */}
      <Card
        bg="#ffffff"
        borderColor="black"
        shadowColor="#c381b5"
        className="p-4 sm:p-6"
      >
        <div className="space-y-4">
          {/* Tab Headers */}
          <div className="flex gap-2">
            <Button
              bg={activeTab === 'preset' ? "#c381b5" : "#ffffff"}
              textColor={activeTab === 'preset' ? "white" : "black"}
              borderColor="black"
              shadow={activeTab === 'preset' ? "#8b5fa3" : "#e0e0e0"}
              onClick={() => setActiveTab('preset')}
              className="flex-1 py-2 px-4 font-minecraft font-black uppercase tracking-wider hover-lift"
            >
              🎧 Preset Voices
            </Button>
            <Button
              bg={activeTab === 'custom' ? "#c381b5" : "#ffffff"}
              textColor={activeTab === 'custom' ? "white" : "black"}
              borderColor="black"
              shadow={activeTab === 'custom' ? "#8b5fa3" : "#e0e0e0"}
              onClick={() => setActiveTab('custom')}
              className="flex-1 py-2 px-4 font-minecraft font-black uppercase tracking-wider hover-lift"
            >
              🎤 Custom Voice
            </Button>
          </div>

          {/* Tab Content */}
          {activeTab === 'preset' && (
            <div className="space-y-4">
              {/* Selected Voice Preview */}
              {selectedVoice && (
                <Card
                  bg="#fefcd0"
                  borderColor="black"
                  shadowColor="#c381b5"
                  className="p-4"
                >
                  <h3 className="font-minecraft font-black text-base uppercase tracking-wider text-gray-800 mb-3">🎵 Selected Voice</h3>
                  <VoicePreview voice={selectedVoice} isForKids={toyConfig.isForKids} />
                </Card>
              )}

              {/* Voice Gallery */}
              <VoiceGallery
                selectedVoiceId={selectedVoice?._id}
                onSelectVoice={handleSelectVoice}
                onUploadClick={() => setShowUploader(true)}
                isForKids={toyConfig.isForKids}
              />
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="text-center py-8">
              <div className="max-w-md mx-auto space-y-6">
                <div className="w-20 h-20 border-4 border-black bg-gradient-to-br from-[#c381b5] to-[#f7931e] mx-auto flex items-center justify-center">
                  <Volume2 className="w-10 h-10 text-white" />
                </div>
                
                <div>
                  <h3 className="font-minecraft font-black text-base uppercase tracking-wider text-gray-800 mb-3">
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
          />
        </Popup>
      )}
    </div>
  );
}
