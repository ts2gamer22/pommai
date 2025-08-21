"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Star,
  Check,
  Upload,
  Search,
  Filter,
} from "lucide-react";

interface VoiceGalleryProps {
  selectedVoiceId?: string;
  onSelectVoice: (voice: any) => void;
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
  const publicVoices = useQuery(
    isForKids ? api.voices.getKidsFriendlyVoices : api.voices.getPublicVoices,
    genderFilter !== "all" || languageFilter !== "all" || ageGroupFilter !== "all"
      ? {
          gender: genderFilter !== "all" ? (genderFilter as any) : undefined,
          language: languageFilter !== "all" ? languageFilter : undefined,
          ageGroup: ageGroupFilter !== "all" ? ageGroupFilter : undefined,
        }
      : {}
  );

  const myVoices = useQuery(api.voices.getMyVoices);

  // Search functionality
  const searchResults = useQuery(
    api.voices.searchVoices,
    searchTerm.length > 2 ? { searchTerm } : "skip"
  );

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

  const handlePlayPreview = (voice: any) => {
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

  const getVoiceCardClass = (voice: any) => {
    const isSelected = selectedVoiceId === voice._id;
    const isCustom = voice.provider === "custom";
    
    if (isSelected) {
      return "border-2 border-blue-500 bg-blue-50 dark:bg-blue-950";
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {onUploadClick && (
            <Button onClick={onUploadClick} variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Upload Voice
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
            </SelectContent>
          </Select>

          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="ja">Japanese</SelectItem>
              <SelectItem value="zh">Chinese</SelectItem>
            </SelectContent>
          </Select>

          <Select value={ageGroupFilter} onValueChange={setAgeGroupFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Age Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ages</SelectItem>
              <SelectItem value="child">Child</SelectItem>
              <SelectItem value="teen">Teen</SelectItem>
              <SelectItem value="adult">Adult</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Custom Voices Section */}
      {myVoices && myVoices.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">My Custom Voices</h3>
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
                    <Check className="w-5 h-5 text-blue-500 ml-2" />
                  )}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary">{voice.gender}</Badge>
                  <Badge variant="secondary">{voice.language}</Badge>
                  {voice.accent && <Badge variant="secondary">{voice.accent}</Badge>}
                  <Badge variant="outline" className="text-purple-600">
                    Custom
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
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
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Volume2 className="w-4 h-4" />
                    {voice.usageCount}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Public Voices */}
      <div>
        <h3 className="text-lg font-semibold mb-3">
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
                  <Check className="w-5 h-5 text-blue-500 ml-2" />
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">{voice.gender}</Badge>
                <Badge variant="secondary">{voice.language}</Badge>
                {voice.accent && <Badge variant="secondary">{voice.accent}</Badge>}
                {voice.isPremium && (
                  <Badge variant="default" className="bg-yellow-500">
                    Premium
                  </Badge>
                )}
                {voice.tags.includes("kids-friendly") && (
                  <Badge variant="default" className="bg-green-500">
                    Kids Safe
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
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
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {voice.averageRating.toFixed(1)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Volume2 className="w-4 h-4" />
                    {voice.usageCount}
                  </div>
                </div>
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
            <Button onClick={onUploadClick} variant="outline" className="mt-4">
              <Upload className="w-4 h-4 mr-2" />
              Upload Your Own Voice
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
