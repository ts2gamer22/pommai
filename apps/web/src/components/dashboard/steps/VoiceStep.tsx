'use client';

import { useState } from 'react';
import { useToyWizardStore } from '@/stores/toyWizardStore';
import { VoiceGallery } from '@/components/voice/VoiceGallery';
import { VoicePreview } from '@/components/voice/VoicePreview';
import { VoiceUploader } from '@/components/voice/VoiceUploader';
import { Button } from '@/components/Button';
import { Volume2 } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/Tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function VoiceStep() {
  const { toyConfig, updateToyConfig } = useToyWizardStore();
  const [selectedVoice, setSelectedVoice] = useState<any>(null);
  const [showUploader, setShowUploader] = useState(false);

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose {toyConfig.name}'s Voice
        </h2>
        <p className="text-gray-600">
          Select a voice that matches {toyConfig.name}'s personality, or create your own custom voice.
        </p>
      </div>

      <Tabs defaultValue="preset" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preset">Preset Voices</TabsTrigger>
          <TabsTrigger value="custom">Custom Voice</TabsTrigger>
        </TabsList>

        <TabsContent value="preset" className="space-y-4">
          {/* Selected Voice Preview */}
          {selectedVoice && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Selected Voice</h3>
              <VoicePreview voice={selectedVoice} isForKids={toyConfig.isForKids} />
            </div>
          )}

          {/* Voice Gallery */}
          <VoiceGallery
            selectedVoiceId={selectedVoice?._id}
            onSelectVoice={handleSelectVoice}
            onUploadClick={() => setShowUploader(true)}
            isForKids={toyConfig.isForKids}
          />
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <div className="text-center py-8">
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto flex items-center justify-center">
                <Volume2 className="w-10 h-10 text-white" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Create a Custom Voice
                </h3>
                <p className="text-sm text-gray-600">
                  Record your own voice or upload an audio file to create a unique voice for {toyConfig.name}
                </p>
              </div>

              <Button
                onClick={() => setShowUploader(true)}
                size="lg"
                className="w-full"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Start Voice Creation
              </Button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Voice Creation Tips:
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Record in a quiet environment</li>
                  <li>• Speak clearly and at a moderate pace</li>
                  <li>• Record 3-5 minutes of diverse content</li>
                  <li>• Use the provided script for best results</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Voice Upload Dialog */}
      <Dialog open={showUploader} onOpenChange={setShowUploader}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Custom Voice</DialogTitle>
          </DialogHeader>
          <VoiceUploader
            onComplete={handleVoiceUploaded}
            onCancel={() => setShowUploader(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
