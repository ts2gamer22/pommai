'use client';

import { useState, useEffect, useRef, type ChangeEvent, type KeyboardEvent } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Button, Input, Card, Badge, Avatar, AvatarFallback } from '@pommai/ui';
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

  // Get or create active conversation
  const activeConversation = useQuery(api.conversations.getActiveConversation, { toyId });
  const createConversation = useMutation(api.conversations.createConversation);
  const sendMessage = useMutation(api.messages.sendMessage);
  const generateResponse = useAction(api.messages.generateAIResponse);

  // Get messages for active conversation
  const messages = useQuery(
    api.messages.getMessages,
    activeConversation ? { conversationId: activeConversation._id } : "skip"
  );

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

  const handleSendMessage = async () => {
    if (!message.trim() || !activeConversation) return;

    const userMessage = message.trim();
    setMessage('');
    setIsTyping(true);

    try {
      // Send user message
      await sendMessage({
        conversationId: activeConversation._id,
        content: userMessage,
        role: 'user',
      });

      // Generate AI response
      await generateResponse({
        conversationId: activeConversation._id,
        userMessage,
      });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceInput = () => {
    // TODO: Implement voice recording
    setIsRecording(!isRecording);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
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
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMute}
          className="text-gray-500"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
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
                      className={`rounded-lg px-4 py-2 ${
                        msg.role === 'user'
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
        <div className="flex gap-2">
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            onClick={handleVoiceInput}
            disabled={isTyping}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          
          <Input
            ref={inputRef}
            value={message}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
            onKeyPress={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            disabled={isTyping || isRecording}
            className="flex-1"
          />
          
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isTyping}
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
