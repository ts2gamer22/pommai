"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Upload,
  Mic,
  Square,
  Check,
  X,
  Loader2,
  Volume2,
  FileAudio,
  Wand2,
} from "lucide-react";

interface VoiceUploaderProps {
  onComplete: (voiceId: string, voiceName?: string) => void;
  onCancel: () => void;
  isForKids?: boolean;
}

type UploadStep = 
  | "requirements"
  | "recordOrUpload"
  | "processing"
  | "preview"
  | "save";

const REQUIREMENTS = [
  "3-5 minutes of clear audio recording",
  "Quiet environment with minimal background noise",
  "Natural speaking voice (no whispering or shouting)",
  "Consistent tone and pace throughout",
  "Read diverse content for best results",
];

const SAMPLE_SCRIPT = `Welcome to Pommai voice recording! Please read the following text in your natural voice:

"Hello! I'm excited to be your new friend. Let me tell you a story. Once upon a time, in a magical forest, there lived a curious little rabbit who loved to explore. Every day was a new adventure!

The weather today is sunny and bright. Did you know that butterflies taste with their feet? That's amazing! I love learning new things with you.

One, two, three, four, five. Let's count together! Mathematics is fun when we practice together. What's your favorite number?

Thank you for spending time with me today. I can't wait to talk with you again soon. Remember, you're special just the way you are!"

Please continue reading any book or article for 3-5 minutes to provide enough voice samples.`;

export function VoiceUploader({ onComplete, onCancel, isForKids = false }: VoiceUploaderProps) {
  const [step, setStep] = useState<UploadStep>("requirements");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [voiceData, setVoiceData] = useState({
    name: "",
    description: "",
    language: "en",
    accent: "",
    ageGroup: "adult",
    gender: "neutral" as "male" | "female" | "neutral",
    tags: [] as string[],
    isPublic: false,
  });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

const cloneVoice = useAction(api.aiServices.cloneElevenVoiceFromBase64);
const [isProcessing, setIsProcessing] = useState(false);
const [error, setError] = useState<string | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        alert("File too large. Please upload a file smaller than 50MB.");
        return;
      }
      
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  };

  const processVoice = async () => {
    if (!audioBlob) return;
    
    setStep("processing");
    setProcessingProgress(20);
    setError(null);
    
    try {
      // For now, we'll go directly to the preview step
      // The actual voice cloning happens when saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProcessingProgress(50);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProcessingProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setStep("preview");
    } catch (error) {
      console.error("Error processing voice:", error);
      setError(error instanceof Error ? error.message : "Failed to process voice");
      setStep("recordOrUpload");
    }
  };

  const saveVoice = async () => {
    if (!audioBlob || !voiceData.name || !voiceData.description) {
      setError("Please fill in all required fields");
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Convert Blob to base64
      const base64Audio: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          const b64 = res?.split(',')[1] || '';
          resolve(b64);
        };
        reader.onerror = () => reject(new Error('Failed to read audio file'));
        reader.readAsDataURL(audioBlob);
      });

      // Add kid-friendly tags if in kids mode
      const tags = [...voiceData.tags];
      if (isForKids) {
        tags.push('kids-friendly', 'child-safe');
      }

      const result = await cloneVoice({
        name: voiceData.name,
        description: voiceData.description,
        language: voiceData.language,
        accent: voiceData.accent || undefined,
        ageGroup: voiceData.ageGroup,
        gender: voiceData.gender,
        tags,
        isPublic: voiceData.isPublic,
        fileBase64: base64Audio,
        mimeType: audioBlob.type || 'audio/webm',
      });

      // Pass back the external voice id and name
      if (result?.externalVoiceId) {
        onComplete(result.externalVoiceId, voiceData.name);
      } else {
        throw new Error('Voice cloning succeeded but no externalVoiceId returned');
      }
    } catch (error) {
      console.error("Error saving voice:", error);
      setError(error instanceof Error ? error.message : "Failed to save voice. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderStep = () => {
    switch (step) {
      case "requirements":
        return (
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Voice Upload Requirements</h2>
              <p className="text-gray-600">
                To create a high-quality voice clone, please ensure you meet these requirements:
              </p>
            </div>
            
            <div className="space-y-3">
              {REQUIREMENTS.map((req, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <p className="text-sm">{req}</p>
                </div>
              ))}
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Pro Tip:</p>
                  <p>
                    For best results, read from a variety of content including stories,
                    educational material, and conversational phrases.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={() => setStep("recordOrUpload")}>
                Continue
              </Button>
            </div>
          </Card>
        );

      case "recordOrUpload":
        return (
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Record or Upload Voice</h2>
              <p className="text-gray-600">
                Choose to record directly or upload an existing audio file.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Mic className="w-8 h-8 text-blue-500" />
                  <h3 className="font-semibold">Record Voice</h3>
                </div>
                
                {!audioBlob && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      <p className="text-sm font-medium mb-2">Sample Script:</p>
                      <pre className="text-xs whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                        {SAMPLE_SCRIPT}
                      </pre>
                    </div>
                    
                    {isRecording ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                          <span className="font-medium">Recording... {formatTime(recordingTime)}</span>
                        </div>
                        <Progress value={(recordingTime / 300) * 100} className="h-2" />
                        <Button 
                          bg="#ff6b6b"
                          textColor="white"
                          borderColor="black"
                          shadow="#e84545"
                          onClick={stopRecording}
                          className="w-full"
                        >
                          <Square className="w-4 h-4 mr-2" />
                          Stop Recording
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={startRecording} className="w-full">
                        <Mic className="w-4 h-4 mr-2" />
                        Start Recording
                      </Button>
                    )}
                  </div>
                )}
              </Card>
              
              <Card className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <FileAudio className="w-8 h-8 text-purple-500" />
                  <h3 className="font-semibold">Upload File</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <p>Supported formats: MP3, WAV, M4A, WEBM</p>
                    <p>Maximum file size: 50MB</p>
                    <p>Minimum duration: 3 minutes</p>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    bg="#ffffff"
                    textColor="black"
                    borderColor="black"
                    shadow="#e0e0e0"
                    className="w-full"
                    disabled={!!audioBlob}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              </Card>
            </div>
            
            {audioBlob && (
              <Card className="p-4 space-y-4 bg-green-50 dark:bg-green-950">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">Audio ready for processing</p>
                      <p className="text-sm text-gray-600">
                        Duration: {formatTime(recordingTime)}
                      </p>
                    </div>
                  </div>
                  <audio src={audioUrl!} controls className="max-w-xs" />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    bg="#f0f0f0"
                    textColor="black"
                    borderColor="black"
                    shadow="#d0d0d0"
                    onClick={() => {
                      setAudioBlob(null);
                      setAudioUrl(null);
                      setRecordingTime(0);
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                  <Button onClick={processVoice} className="flex-1">
                    <Wand2 className="w-4 h-4 mr-2" />
                    Process Voice
                  </Button>
                </div>
              </Card>
            )}
            
            {!audioBlob && (
              <div className="flex justify-between">
                <Button 
                  bg="#f0f0f0"
                  textColor="black"
                  borderColor="black"
                  shadow="#d0d0d0"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
              </div>
            )}
          </Card>
        );

      case "processing":
        return (
          <Card className="p-6 space-y-6">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500" />
              <h2 className="text-2xl font-bold">Processing Your Voice</h2>
              <p className="text-gray-600">
                This may take a few minutes. Please don&apos;t close this window.
              </p>
              
              <div className="max-w-md mx-auto space-y-3">
                <Progress value={processingProgress} className="h-3" />
                <p className="text-sm text-gray-500">
                  {processingProgress < 20 && "Analyzing audio quality..."}
                  {processingProgress >= 20 && processingProgress < 40 && "Detecting voice characteristics..."}
                  {processingProgress >= 40 && processingProgress < 60 && "Creating voice model..."}
                  {processingProgress >= 60 && processingProgress < 80 && "Optimizing for real-time synthesis..."}
                  {processingProgress >= 80 && "Voice clone ready!"}
                </p>
              </div>
            </div>
          </Card>
        );

      case "preview":
        return (
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Preview & Save Voice</h2>
              <p className="text-gray-600">
                Test your voice clone and provide details before saving.
              </p>
            </div>
            
            <Card className="p-4 bg-blue-50 dark:bg-blue-950">
              <div className="flex items-center gap-3">
                <Volume2 className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="font-medium">Voice Clone Ready!</p>
                  <p className="text-sm text-gray-600">
                    Your voice has been successfully processed.
                  </p>
                </div>
              </div>
            </Card>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Voice Name *</Label>
                <Input
                  id="name"
                  value={voiceData.name}
onChange={(e: ChangeEvent<HTMLInputElement>) => setVoiceData({ ...voiceData, name: e.target.value })}
                  placeholder="e.g., My Natural Voice"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={voiceData.description}
onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setVoiceData({ ...voiceData, description: e.target.value })}
                  placeholder="Describe the voice characteristics..."
                  rows={3}
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={voiceData.language}
                    onValueChange={(value) => setVoiceData({ ...voiceData, language: value })}
                  >
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="accent">Accent (Optional)</Label>
                  <Input
                    id="accent"
                    value={voiceData.accent}
onChange={(e: ChangeEvent<HTMLInputElement>) => setVoiceData({ ...voiceData, accent: e.target.value })}
                    placeholder="e.g., British, Southern US"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={voiceData.gender}
                    onValueChange={(value) => setVoiceData({ ...voiceData, gender: value as 'male' | 'female' | 'neutral' })}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="ageGroup">Age Group</Label>
                  <Select
                    value={voiceData.ageGroup}
                    onValueChange={(value) => setVoiceData({ ...voiceData, ageGroup: value })}
                  >
                    <SelectTrigger id="ageGroup">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="teen">Teen</SelectItem>
                      <SelectItem value="adult">Adult</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="public">Make voice public</Label>
                  <p className="text-sm text-gray-500">
                    Allow other users to use this voice
                  </p>
                </div>
                <Switch
                  id="public"
                  checked={voiceData.isPublic}
                  onCheckedChange={(checked) => setVoiceData({ ...voiceData, isPublic: checked })}
                />
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border-2 border-red-500 text-red-700 rounded">
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
            
            <div className="flex justify-between">
              <Button 
                bg="#f0f0f0"
                textColor="black"
                borderColor="black"
                shadow="#d0d0d0"
                onClick={onCancel}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={saveVoice}
                disabled={!voiceData.name || !voiceData.description || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Voice...
                  </>
                ) : (
                  "Save Voice"
                )}
              </Button>
            </div>
          </Card>
        );
    }
  };

  return <div className="max-w-3xl mx-auto">{renderStep()}</div>;
}
