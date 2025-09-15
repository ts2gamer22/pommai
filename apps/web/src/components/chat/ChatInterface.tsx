'use client';

import { useState, useEffect, useRef, type ChangeEvent, type KeyboardEvent } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Button, Input, Card, Badge, Avatar, AvatarFallback, Tooltip, TooltipTrigger, TooltipContent } from '@pommai/ui';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  AlertCircle,
  Loader2,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { playAudio, stopAllAudio } from '../../lib/audio';

interface ChatInterfaceProps {
  toyId: Id<"toys">;
  toy: { name?: string; type?: string; isForKids?: boolean };
  isGuardianMode?: boolean;
  onFlagMessage?: (messageId: string, reason: string) => void;
}

export function ChatInterface({ toyId, toy, isGuardianMode: _isGuardianMode = false, onFlagMessage: _onFlagMessage }: ChatInterfaceProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Track latest request to avoid playing audio from stale responses
  const currentRequestIdRef = useRef(0);

  // Voice recording refs/state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const MAX_RECORD_SECONDS = 30;

  // Get or create active conversation
  const activeConversation = useQuery(api.conversations.getActiveConversation, { toyId });
  const createConversation = useMutation(api.conversations.createConversation);
  const sendMessage = useMutation(api.messages.sendMessage);
  const generateResponse = useAction(api.messages.generateAIResponse);
  const transcribeAudio = useAction(api.aiServices.transcribeAudio);

  // Get messages for active conversation
  const messages = useQuery(
    api.messages.getMessages,
    activeConversation ? { conversationId: activeConversation._id } : "skip"
  );

  // Conversation readiness for selected toy (prevents sending to wrong toy)
  const isConvReady = Boolean(activeConversation && activeConversation.toyId === toyId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize conversation if needed
  useEffect(() => {
    const initConversation = async () => {
      if (!activeConversation && toyId) {
        await createConversation({
          toyId,
          sessionId: `web-${Date.now()}`,
          location: 'web',
          deviceId: 'web-simulator',
        });
      }
    };
    initConversation();
  }, [toyId, activeConversation, createConversation]);

  // Stop all audio when switching toys or unmounting to prevent cross-talk
  useEffect(() => {
    stopAllAudio();
    currentRequestIdRef.current++;
    return () => {
      try { stopAllAudio(); } catch { }
    };
  }, [toyId]);

  // Helper: convert recorded Blob (webm/opus) to base64 WAV (mono, 16-bit PCM)
  const blobToWavBase64 = async (blob: Blob): Promise<string> => {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0) as ArrayBuffer);

    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;

    // Downmix to mono
    const mono = new Float32Array(length);
    for (let ch = 0; ch < numChannels; ch++) {
      const data = audioBuffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        mono[i] += data[i] / numChannels;
      }
    }

    // Encode WAV (16-bit PCM)
    const wavBuffer = new ArrayBuffer(44 + mono.length * 2);
    const view = new DataView(wavBuffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    // RIFF header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + mono.length * 2, true);
    writeString(8, 'WAVE');

    // fmt subchunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true);  // AudioFormat (1 = PCM)
    view.setUint16(22, 1, true);  // NumChannels (1 = mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BytesPerSample)
    view.setUint16(32, 2, true); // BlockAlign (NumChannels * BytesPerSample)
    view.setUint16(34, 16, true); // BitsPerSample

    // data subchunk
    writeString(36, 'data');
    view.setUint32(40, mono.length * 2, true);

    // PCM samples
    let offset = 44;
    for (let i = 0; i < mono.length; i++) {
      let s = Math.max(-1, Math.min(1, mono[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }

    const bytes = new Uint8Array(wavBuffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    const base64 = btoa(binary);
    return base64;
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !isConvReady) return;

    // Stop any ongoing audio from previous replies to avoid overlap
    try { stopAllAudio(); } catch { }

    const userMessage = message.trim();
    setMessage('');
    setIsTyping(true);
    const myReqId = ++currentRequestIdRef.current;

    try {
      // Send user message
      await sendMessage({
        conversationId: activeConversation!._id,
        content: userMessage,
        role: 'user',
      });

      // Generate AI response and optionally audio
      const response = await generateResponse({
        conversationId: activeConversation!._id,
        userMessage,
        includeAudio: !isMuted,
        sessionId: `web-${Date.now()}`,
      });

      // Respect mute state and drop stale responses
      if (currentRequestIdRef.current === myReqId && response?.audioData && !isMuted) {
        try {
          await playAudio(response.audioData, { id: `chat-tts-${Date.now()}`, cache: false });
        } catch (e) {
          console.warn('Audio playback failed:', e);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const stopRecordingInternal = () => {
    if (recordTimerRef.current) {
      window.clearTimeout(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      mr.stop();
    }
    const stream = mediaStreamRef.current;
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
  };

  const handleVoiceInput = async () => {
    if (!isConvReady) return;
    try {
      if (!isRecording) {
        // Start recording
        if (!navigator.mediaDevices?.getUserMedia) {
          alert('Microphone not supported in this browser.');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        const options: MediaRecorderOptions = {} as any;
        if (typeof MediaRecorder !== 'undefined') {
          if ((MediaRecorder as any).isTypeSupported?.('audio/webm;codecs=opus')) {
            options.mimeType = 'audio/webm;codecs=opus';
          } else if ((MediaRecorder as any).isTypeSupported?.('audio/webm')) {
            options.mimeType = 'audio/webm';
          }
        }
        const recorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (evt) => {
          if (evt.data && evt.data.size > 0) {
            chunksRef.current.push(evt.data);
          }
        };

        recorder.onstop = async () => {
          const myReqId = ++currentRequestIdRef.current;
          try {
            const mimeType = (options.mimeType as string) || 'audio/webm';
            const blob = new Blob(chunksRef.current, { type: mimeType });

            // Convert to WAV base64 for STT
            const base64Wav = await blobToWavBase64(blob);

            setIsTyping(true);
            // Call backend STT only, then run the standard chat flow
            const stt = await transcribeAudio({
              audioData: base64Wav,
              language: 'en',
            });
            const transcript = stt?.text || 'Voice message';

            if (activeConversation) {
              try {
                await sendMessage({
                  conversationId: activeConversation._id,
                  content: transcript,
                  role: 'user',
                });
              } catch { }

              // Stop any ongoing audio before playing next reply
              try { stopAllAudio(); } catch { }

              const response = await generateResponse({
                conversationId: activeConversation._id,
                userMessage: transcript,
                includeAudio: !isMuted,
                sessionId: `web-${Date.now()}`,
              });

              if (currentRequestIdRef.current === myReqId && response?.audioData && !isMuted) {
                try {
                  await playAudio(response.audioData, { id: `chat-tts-${Date.now()}`, cache: false });
                } catch (e) {
                  console.warn('Audio playback failed:', e);
                }
              }
            }
          } catch (e) {
            console.error('Voice input processing failed:', e);
          } finally {
            setIsTyping(false);
            setIsRecording(false);
          }
        };

        recorder.start();
        setIsRecording(true);
        // Safety auto-stop after MAX_RECORD_SECONDS
        recordTimerRef.current = window.setTimeout(() => {
          stopRecordingInternal();
        }, MAX_RECORD_SECONDS * 1000);
      } else {
        // Stop recording and process
        stopRecordingInternal();
      }
    } catch (error) {
      console.error('Microphone error:', error);
      alert('Could not access microphone. Please check permissions.');
      setIsRecording(false);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (next) {
      // Immediately stop any ongoing audio when muting
      try { stopAllAudio(); } catch { }
    }
  };

  const getToyAvatar = () => {
    const avatarMap: Record<string, string> = {
      teddy: '🧸',
      bunny: '🐰',
      cat: '🐱',
      dog: '🐶',
      bird: '🦜',
      fish: '🐠',
      robot: '🤖',
      magical: '✨',
    };
    return toy && toy.type ? (avatarMap[toy.type] || '🎁') : '🎁';
  };

  return (
    <Card className="h-[600px] flex flex-col">
      {/* Chat Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="text-2xl bg-purple-100">
              {getToyAvatar()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="retro-h3 text-base sm:text-lg text-gray-900">{toy?.name || 'AI Toy'}</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-500">Active</span>
              </div>
              {toy?.isForKids && (
                <Badge variant="secondary" className="text-xs">
                  Kids Mode
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages?.map((msg) => (
            <AnimatePresence key={msg._id}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className={`text-sm ${msg.role === 'user' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : getToyAvatar()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <div
                      className={`rounded-lg px-4 py-2 ${msg.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                        }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>
                        {msg.timestamp && !isNaN(new Date(msg.timestamp).getTime())
                          ? format(new Date(msg.timestamp), 'HH:mm')
                          : msg._creationTime
                            ? format(new Date(msg._creationTime), 'HH:mm')
                            : 'now'
                        }
                      </span>
                      {msg.metadata?.flagged && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Flagged
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-gray-500"
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-purple-100 text-sm">
                  {getToyAvatar()}
                </AvatarFallback>
              </Avatar>
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex items-center gap-1">
                  <span className="text-sm">{toy?.name} is typing</span>
                  <Loader2 className="w-3 h-3 animate-spin" />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2 items-center">
          <Input
            ref={inputRef}
            value={message}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
            onKeyPress={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSendMessage()}
            placeholder={isConvReady ? "Type a message..." : "Preparing conversation..."}
            disabled={isTyping || isRecording || !isConvReady}
            className="flex-1"
          />

          {/* Sound toggle (Mute) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleMute}
                bg={isMuted ? '#f0f0f0' : '#d1fae5'}
                textColor="black"
                borderColor="black"
                shadow={isMuted ? '#d0d0d0' : '#a7f3d0'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isMuted ? 'Muted' : 'Sound on'}</TooltipContent>
          </Tooltip>

          {/* Mic toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleVoiceInput}
                disabled={isTyping || !isConvReady}
                bg={isRecording ? '#d1fae5' : '#ffffff'}
                textColor="black"
                borderColor="black"
                shadow={isRecording ? '#a7f3d0' : '#e0e0e0'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isRecording ? 'Stop recording' : 'Start recording'}</TooltipContent>
          </Tooltip>

          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isTyping || !isConvReady}
            size="icon"
          >
            {isTyping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {toy?.isForKids && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Guardian Mode is active. All conversations are monitored for safety.
          </p>
        )}
      </div>
    </Card>
  );
}
