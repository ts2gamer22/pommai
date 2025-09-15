"use client";

import { useState, useMemo, type ChangeEvent, type MouseEvent } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button, Input, Card, Badge, Skeleton } from "@pommai/ui";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@pommai/ui";
import {
  Play,
  Pause,
  Volume2,
  Check,
  Upload,
  Search,
  Filter,
} from "lucide-react";

interface Voice {
  _id: string;
  name: string;
  description?: string;
  previewUrl: string;
  provider?: string;
  gender?: string;
  language?: string;
  accent?: string;
  isPremium?: boolean;
  tags: string[];
  uploadedBy?: string;
  externalVoiceId?: string;
}

interface VoiceGalleryProps {
  selectedVoiceId?: string;
  onSelectVoice: (voice: Voice) => void;
  onUploadClick?: () => void;
  isForKids?: boolean;
}

export function VoiceGallery({
  selectedVoiceId,
  onSelectVoice,
  onUploadClick,
  isForKids = false,
}: VoiceGalleryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>("all");
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<Map<string, HTMLAudioElement>>(new Map());

  // Fetch voices based on whether it's for kids
  const queryArgs = genderFilter !== "all" || languageFilter !== "all" || ageGroupFilter !== "all"
    ? {
        gender: genderFilter !== "all" ? (genderFilter as 'male' | 'female' | 'neutral') : undefined,
        language: languageFilter !== "all" ? languageFilter : undefined,
        ageGroup: ageGroupFilter !== "all" ? ageGroupFilter : undefined,
      }
    : {};
    
  const publicVoices = useQuery(
    isForKids ? api.voices.getKidsFriendlyVoices : api.voices.getPublicVoices,
    queryArgs
  ) as Voice[] | undefined;

  const myVoices = useQuery(api.voices.getMyVoices) as Voice[] | undefined;
  const deleteVoiceMutation = useMutation(api.voices.deleteVoice);

  // Search functionality
  const searchResults = useQuery(
    api.voices.searchVoices,
    searchTerm.length > 2 ? { searchTerm } : "skip"
  ) as Voice[] | undefined;

  // Combine and filter voices
  const allVoices = useMemo(() => {
    if (searchTerm.length > 2 && searchResults) {
      return searchResults;
    }

    const combined = [];
    if (publicVoices) combined.push(...publicVoices);
    if (myVoices) {
      // Add custom voices that aren't already in public voices
      const publicIds = new Set(publicVoices?.map(v => v._id) || []);
      const uniqueMyVoices = myVoices.filter(v => !publicIds.has(v._id));
      combined.push(...uniqueMyVoices);
    }
    return combined;
  }, [publicVoices, myVoices, searchResults, searchTerm]);

  const handlePlayPreview = (voice: Voice) => {
    // Prevent preview for mock voices (created without API key)
    if (voice.externalVoiceId && voice.externalVoiceId.startsWith('mock-')) {
      return; // silently no-op; button is disabled in UI
    }

    // Stop any currently playing audio
    if (playingVoiceId) {
      const currentAudio = audioElements.get(playingVoiceId);
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    }

    if (playingVoiceId === voice._id) {
      setPlayingVoiceId(null);
      return;
    }

    // Create or get audio element
    let audio = audioElements.get(voice._id);
    if (!audio) {
      audio = new Audio(voice.previewUrl);
      audio.addEventListener('ended', () => {
        setPlayingVoiceId(null);
      });
      const newMap = new Map(audioElements);
      newMap.set(voice._id, audio);
      setAudioElements(newMap);
    }

    audio.play();
    setPlayingVoiceId(voice._id);
  };

  const handleDeleteVoice = async (voice: Voice, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteVoiceMutation({ voiceId: voice._id as Id<"voices"> });
    } catch (err) {
      console.error('Failed to delete voice', err);
    }
  };

  const getVoiceCardClass = (voice: Voice) => {
    const isSelected = selectedVoiceId === voice._id;
    const isCustom = voice.provider === "custom";
    
    if (isSelected) {
      // Light retro highlight with strong outline; avoid any dark blue backgrounds
      return "border-2 border-black bg-[#fff6cc]";
    }
    if (isCustom) {
      return "border-dashed border-purple-300 dark:border-purple-700";
    }
    return "";
  };

  if (!publicVoices && !myVoices) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-24 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search voices by name or tags..."
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {onUploadClick && (
            <Button 
              onClick={onUploadClick} 
              bg="#ffffff"
              textColor="black"
              borderColor="black"
              shadow="#e0e0e0"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Voice
            </Button>
          )}
        </div>

        {/* Simplified: remove extra filters to reduce clutter */}
      </div>

      {/* Custom Voices Section */}
      {myVoices && myVoices.length > 0 && (
        <div>
          <h3 className="retro-h3 text-base sm:text-lg mb-3">My Custom Voices</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {myVoices.map((voice) => (
              <Card
                key={voice._id}
                className={`p-4 cursor-pointer transition-all ${getVoiceCardClass(voice)}`}
                onClick={() => onSelectVoice(voice)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold">{voice.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {voice.description}
                    </p>
                  </div>
                  {selectedVoiceId === voice._id && (
                    <Check className="w-5 h-5 text-black ml-2" />
                  )}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  {voice.gender && <Badge variant="secondary">{voice.gender}</Badge>}
                  {voice.language && <Badge variant="secondary">{voice.language}</Badge>}
                  {voice.accent && <Badge variant="secondary">{voice.accent}</Badge>}
                  {/* Provider badge */}
                  {voice.externalVoiceId?.startsWith('mock-') ? (
                    <Badge variant="outline" className="text-gray-600">Mock</Badge>
                  ) : voice.provider === '11labs' ? (
                    <Badge variant="outline" className="text-purple-600">11labs</Badge>
                  ) : (
                    <Badge variant="outline" className="text-purple-600">Custom</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={(e: MouseEvent) => {
                        e.stopPropagation();
                        handlePlayPreview(voice);
                      }}
                      disabled={Boolean(voice.externalVoiceId?.startsWith('mock-'))}
                    >
                      {playingVoiceId === voice._id ? (
                        <Pause className="w-4 h-4 mr-1" />
                      ) : (
                        <Play className="w-4 h-4 mr-1" />
                      )}
                      {voice.externalVoiceId?.startsWith('mock-') ? 'Unavailable' : 'Preview'}
                    </Button>
                    {voice.uploadedBy && (
                      <Button
                        size="sm"
                        onClick={(e: MouseEvent) => handleDeleteVoice(voice, e)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Public Voices */}
      <div>
        <h3 className="retro-h3 text-base sm:text-lg mb-3">
          {isForKids ? "Kid-Friendly Voices" : "Voice Library"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allVoices.map((voice) => (
            <Card
              key={voice._id}
              className={`p-4 cursor-pointer transition-all ${getVoiceCardClass(voice)}`}
              onClick={() => onSelectVoice(voice)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold">{voice.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {voice.description}
                  </p>
                </div>
                {selectedVoiceId === voice._id && (
                  <Check className="w-5 h-5 text-black ml-2" />
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                {voice.gender && <Badge variant="secondary">{voice.gender}</Badge>}
                {voice.language && <Badge variant="secondary">{voice.language}</Badge>}
                {voice.accent && <Badge variant="secondary">{voice.accent}</Badge>}
                {/* Provider badge */}
                {voice.externalVoiceId?.startsWith('mock-') ? (
                  <Badge variant="outline" className="text-gray-600">Mock</Badge>
                ) : voice.provider === '11labs' ? (
                  <Badge variant="outline" className="text-purple-600">11labs</Badge>
                ) : null}
                {voice.isPremium && (
                  <Badge variant="default" className="bg-yellow-500">
                    Premium
                  </Badge>
                )}
                {voice.tags?.includes("kids-friendly") && (
                  <Badge variant="default" className="bg-green-500">
                    Kids Safe
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-start">
                <Button
                  size="sm"
onClick={(e: MouseEvent) => {
                        e.stopPropagation();
                        handlePlayPreview(voice);
                      }}
                >
                  {playingVoiceId === voice._id ? (
                    <Pause className="w-4 h-4 mr-1" />
                  ) : (
                    <Play className="w-4 h-4 mr-1" />
                  )}
                  Preview
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {allVoices.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Volume2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No voices found matching your criteria.</p>
          {onUploadClick && (
            <Button 
              onClick={onUploadClick} 
              bg="#ffffff"
              textColor="black"
              borderColor="black"
              shadow="#e0e0e0"
              className="mt-4"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Your Own Voice
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
