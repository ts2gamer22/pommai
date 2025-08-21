"use client";

import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";

interface VoicePreviewProps {
  voice: any;
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
  const [selectedPhrase, setSelectedPhrase] = useState("");
  const [customText, setCustomText] = useState("");
  const [phraseCategory, setPhraseCategory] = useState(isForKids ? "kids" : "general");
  const [volume, setVolume] = useState([75]);
  const [speed, setSpeed] = useState([100]);
  const [pitch, setPitch] = useState([100]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Set initial phrase
    const phrases = PREVIEW_PHRASES[phraseCategory as keyof typeof PREVIEW_PHRASES];
    setSelectedPhrase(phrases[0]);
  }, [phraseCategory]);

  const handlePlay = async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    // Here you would integrate with TTS API (11Labs, Azure, etc.)
    // For now, we'll simulate with the preview URL
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(voice.previewUrl);
        audioRef.current.addEventListener('ended', () => {
          setIsPlaying(false);
        });
      }

      audioRef.current.volume = volume[0] / 100;
      audioRef.current.playbackRate = speed[0] / 100;
      
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlaying(false);
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
            <h3 className="font-semibold text-lg">{voice.name}</h3>
            <p className="text-sm text-gray-500">{voice.description}</p>
          </div>
        </div>
        <Button
          variant="ghost"
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
          <Button variant="outline" size="sm" onClick={handleRandomPhrase}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Random
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Preview Text</label>
          <Textarea
            value={textToPreview}
            onChange={(e) => {
              setCustomText(e.target.value);
              setSelectedPhrase("");
            }}
            placeholder="Type custom text or select a phrase above..."
            className="min-h-[80px]"
          />
          {customText && (
            <Button
              variant="ghost"
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
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Volume</label>
              <span className="text-sm text-gray-500">{volume[0]}%</span>
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
              <span className="text-sm text-gray-500">{speed[0]}%</span>
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
              <span className="text-sm text-gray-500">{pitch[0]}%</span>
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

      {/* Play Controls */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handlePlay}
          className="flex-1"
          size="lg"
          disabled={!textToPreview}
        >
          {isPlaying ? (
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
        <Button variant="outline" size="lg">
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
