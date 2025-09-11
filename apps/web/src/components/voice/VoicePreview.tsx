"use client";

import { useState, useRef, useEffect, type ChangeEvent } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Pause,
  Volume2,
  RefreshCw,
  Mic,
  Settings,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { playAudio, stopAudio, cleanupAudioResources } from "@/lib/audio";

interface Voice {
  _id?: string;
  name: string;
  description?: string;
  externalVoiceId?: string;
  voiceId?: string;
  language?: string;
  gender?: string;
  accent?: string;
  ageGroup?: string;
}

interface VoicePreviewProps {
  voice: Voice;
  isForKids?: boolean;
}

const PREVIEW_PHRASES = {
  general: [
    "Hi there! I'm so excited to be your friend!",
    "What would you like to talk about today?",
    "That's a great question! Let me think about it.",
    "I love hearing your stories. Tell me more!",
    "Wow, you're so creative and smart!",
  ],
  kids: [
    "Hello! I'm your new friend. What's your name?",
    "Once upon a time, in a magical forest far away...",
    "That's amazing! You're doing such a great job!",
    "Let's play a fun game together!",
    "I think you're super special, just the way you are!",
  ],
  educational: [
    "Did you know that butterflies taste with their feet?",
    "Let's count together! One, two, three...",
    "The sun is a big star that gives us light and warmth.",
    "Reading books helps us learn new things every day!",
    "What's your favorite subject to learn about?",
  ],
  storytelling: [
    "In a land of dragons and knights, there lived a brave little mouse...",
    "The magical door opened, revealing a world full of wonders...",
    "And they all lived happily ever after. The end!",
    "What happens next in our story? You decide!",
    "The adventure begins when you believe in magic...",
  ],
};

export function VoicePreview({ voice, isForKids = false }: VoicePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhrase, setSelectedPhrase] = useState("");
  const [customText, setCustomText] = useState("");
  const [phraseCategory, setPhraseCategory] = useState(isForKids ? "kids" : "general");
  const [volume, setVolume] = useState([75]);
  const [speed, setSpeed] = useState([100]);
  const [pitch, setPitch] = useState([100]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const currentAudioId = useRef<string | null>(null);
  
  // Use Convex action for TTS
  const synthesizeSpeech = useAction(api.aiServices.synthesizeSpeech);

  useEffect(() => {
    // Set initial phrase
    const phrases = PREVIEW_PHRASES[phraseCategory as keyof typeof PREVIEW_PHRASES];
    setSelectedPhrase(phrases[0]);
  }, [phraseCategory]);
  
  useEffect(() => {
    // Cleanup audio resources on unmount
    return () => {
      if (currentAudioId.current) {
        stopAudio(currentAudioId.current);
      }
      cleanupAudioResources();
    };
  }, []);

  const handlePlay = async () => {
    if (isPlaying) {
      // Stop currently playing audio
      if (currentAudioId.current) {
        stopAudio(currentAudioId.current);
      }
      setIsPlaying(false);
      return;
    }

    const textToSpeak = customText || selectedPhrase;
    if (!textToSpeak) {
      setError("Please enter or select text to preview");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call ElevenLabs TTS via Convex action
      const audioResponse = await synthesizeSpeech({
        text: textToSpeak,
        voiceId: voice.externalVoiceId || voice.voiceId || "JBFqnCBsd6RMkjVDRZzb", // Fallback to default voice
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: pitch[0] / 100, // Map pitch to style for effect
          useSpeakerBoost: true,
        },
        outputFormat: "mp3_44100_128",
      });

      if (audioResponse?.audioData) {
        // Generate unique ID for this audio
        const audioId = `voice-preview-${Date.now()}`;
        currentAudioId.current = audioId;
        
        // Play the audio using our utility
        await playAudio(audioResponse.audioData, {
          id: audioId,
          volume: volume[0] / 100,
          cache: true,
          onEnded: () => {
            setIsPlaying(false);
            currentAudioId.current = null;
          },
          onError: (error) => {
            console.error("Audio playback error:", error);
            setError("Failed to play audio. Please try again.");
            setIsPlaying(false);
            currentAudioId.current = null;
          },
        });
        
        setIsPlaying(true);
      } else {
        throw new Error("No audio data received from TTS service");
      }
    } catch (error) {
      console.error("Error synthesizing speech:", error);
      setError(error instanceof Error ? error.message : "Failed to generate speech. Please try again.");
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRandomPhrase = () => {
    const phrases = PREVIEW_PHRASES[phraseCategory as keyof typeof PREVIEW_PHRASES];
    const currentIndex = phrases.indexOf(selectedPhrase);
    let newIndex = Math.floor(Math.random() * phrases.length);
    
    // Ensure we get a different phrase
    while (newIndex === currentIndex && phrases.length > 1) {
      newIndex = Math.floor(Math.random() * phrases.length);
    }
    
    setSelectedPhrase(phrases[newIndex]);
  };

  const textToPreview = customText || selectedPhrase;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Volume2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="retro-h3 text-base sm:text-lg">{voice.name}</h3>
            <p className="text-sm text-gray-500">{voice.description}</p>
          </div>
        </div>
        <Button
          bg="#ffffff"
          textColor="black"
          borderColor="black"
          shadow="#e0e0e0"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Settings className="w-4 h-4 mr-1" />
          {showAdvanced ? "Hide" : "Show"} Settings
        </Button>
      </div>

      {/* Phrase Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Select value={phraseCategory} onValueChange={setPhraseCategory}>
            <SelectTrigger className="w-[200px]">
              <Sparkles className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General Phrases</SelectItem>
              <SelectItem value="kids">Kid-Friendly</SelectItem>
              <SelectItem value="educational">Educational</SelectItem>
              <SelectItem value="storytelling">Storytelling</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            bg="#ffffff"
            textColor="black"
            borderColor="black"
            shadow="#e0e0e0"
            size="sm" 
            onClick={handleRandomPhrase}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Random
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Preview Text</label>
          <Textarea
            value={textToPreview}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
              setCustomText(e.target.value);
              setSelectedPhrase("");
            }}
            placeholder="Type custom text or select a phrase above..."
            className="min-h-[80px]"
          />
          {customText && (
            <Button
              bg="#f0f0f0"
              textColor="black"
              borderColor="black"
              shadow="#d0d0d0"
              size="sm"
              onClick={() => {
                setCustomText("");
                handleRandomPhrase();
              }}
            >
              Clear custom text
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="space-y-4 p-4 rounded-lg border-2 border-black bg-[#fff6cc]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Volume</label>
              <span className="text-sm text-gray-700">{volume[0]}%</span>
            </div>
            <Slider
              value={volume}
              onValueChange={setVolume}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Speed</label>
              <span className="text-sm text-gray-700">{speed[0]}%</span>
            </div>
            <Slider
              value={speed}
              onValueChange={setSpeed}
              min={50}
              max={150}
              step={10}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Pitch</label>
              <span className="text-sm text-gray-700">{pitch[0]}%</span>
            </div>
            <Slider
              value={pitch}
              onValueChange={setPitch}
              min={50}
              max={150}
              step={10}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Play Controls */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handlePlay}
          className="flex-1"
          size="lg"
          disabled={!textToPreview || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : isPlaying ? (
            <>
              <Pause className="w-5 h-5 mr-2" />
              Stop Preview
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Play Preview
            </>
          )}
        </Button>
        <Button 
          bg="#ffffff"
          textColor="black"
          borderColor="black"
          shadow="#e0e0e0"
          size="lg" 
          disabled={isLoading}
        >
          <Mic className="w-5 h-5 mr-2" />
          Test with Mic
        </Button>
      </div>

      {/* Voice Details */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div>
          <p className="text-sm text-gray-500">Language</p>
          <p className="font-medium">{voice.language}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Gender</p>
          <p className="font-medium capitalize">{voice.gender}</p>
        </div>
        {voice.accent && (
          <div>
            <p className="text-sm text-gray-500">Accent</p>
            <p className="font-medium">{voice.accent}</p>
          </div>
        )}
        <div>
          <p className="text-sm text-gray-500">Age Group</p>
          <p className="font-medium">{voice.ageGroup}</p>
        </div>
      </div>
    </Card>
  );
}
