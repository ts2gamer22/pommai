"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  MessageSquare,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  Shield,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface LiveMonitoringProps {
  childId: string;
}

interface LiveMessage {
  id: string;
  role: "user" | "toy" | "system";
  content: string;
  timestamp: Date;
  flagged?: boolean;
  safetyScore?: number;
  topics?: string[];
}

interface ActiveConversation {
  id: string;
  toyId: string;
  toyName: string;
  startTime: Date;
  messages: LiveMessage[];
  isPaused: boolean;
  isMonitored: boolean;
}

export function LiveMonitoring({ childId }: LiveMonitoringProps) {
  const [activeConversations, setActiveConversations] = useState<ActiveConversation[]>([
    {
      id: "conv-1",
      toyId: "toy-1",
      toyName: "Buddy Bear",
      startTime: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      isPaused: false,
      isMonitored: true,
      messages: [
        {
          id: "msg-1",
          role: "user",
          content: "Hi Buddy! Can we play a game?",
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          safetyScore: 100,
        },
        {
          id: "msg-2",
          role: "toy",
          content: "Of course! I love playing games with you. How about we play 'I Spy' or would you like to hear a story?",
          timestamp: new Date(Date.now() - 1000 * 60 * 4),
          safetyScore: 100,
          topics: ["games", "storytelling"],
        },
        {
          id: "msg-3",
          role: "user",
          content: "Let's play I Spy!",
          timestamp: new Date(Date.now() - 1000 * 60 * 3),
          safetyScore: 100,
        },
        {
          id: "msg-4",
          role: "toy",
          content: "Great choice! I'll start. I spy with my little eye, something that is... blue! Can you guess what it is?",
          timestamp: new Date(Date.now() - 1000 * 60 * 2),
          safetyScore: 100,
          topics: ["games", "colors"],
        },
      ],
    },
  ]);
  
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>("conv-1");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConversation = activeConversations.find(c => c.id === selectedConversationId);

  useEffect(() => {
    // Simulate real-time message updates
    const interval = setInterval(() => {
      if (selectedConversation && !selectedConversation.isPaused) {
        // Add a new message every 30 seconds for demo
        const newMessage: LiveMessage = {
          id: `msg-${Date.now()}`,
          role: Math.random() > 0.5 ? "user" : "toy",
          content: getRandomMessage(),
          timestamp: new Date(),
          safetyScore: Math.random() * 20 + 80, // 80-100 safety score
          topics: ["conversation", "play"],
        };
        
        setActiveConversations(prev => 
          prev.map(conv => 
            conv.id === selectedConversationId
              ? { ...conv, messages: [...conv.messages, newMessage] }
              : conv
          )
        );
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedConversationId, selectedConversation?.isPaused]);

  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedConversation?.messages, autoScroll]);

  const getRandomMessage = () => {
    const messages = [
      "That's a wonderful idea!",
      "Can you tell me more about that?",
      "I love hearing your stories!",
      "What's your favorite color?",
      "Let's count to ten together!",
      "You're doing great!",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const handlePauseConversation = (conversationId: string) => {
    setActiveConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, isPaused: !conv.isPaused }
          : conv
      )
    );
  };

  const handleToggleMonitoring = (conversationId: string) => {
    setActiveConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, isMonitored: !conv.isMonitored }
          : conv
      )
    );
  };

  const getSafetyBadge = (score?: number) => {
    if (!score) return null;
    if (score >= 95) return <Badge variant="default" className="bg-green-500">Safe</Badge>;
    if (score >= 80) return <Badge variant="secondary">Normal</Badge>;
    return <Badge variant="destructive">Review</Badge>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Active Conversations List */}
      <Card className="p-6 lg:col-span-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Active Sessions
          </h3>
          <Badge variant="secondary">{activeConversations.length}</Badge>
        </div>

        <div className="space-y-3">
          {activeConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedConversationId === conversation.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                  : "hover:border-gray-300"
              }`}
              onClick={() => setSelectedConversationId(conversation.id)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{conversation.toyName}</p>
                  <p className="text-sm text-gray-500">
                    Started {formatDistanceToNow(conversation.startTime, { addSuffix: true })}
                  </p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {conversation.isPaused && (
                    <Badge variant="outline" className="text-orange-600">
                      Paused
                    </Badge>
                  )}
                  {conversation.isMonitored && (
                    <Badge variant="outline" className="text-blue-600">
                      <Eye className="w-3 h-3 mr-1" />
                      Live
                    </Badge>
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {conversation.messages.length} messages
                </span>
              </div>
            </div>
          ))}
        </div>

        {activeConversations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No active conversations</p>
          </div>
        )}
      </Card>

      {/* Live Conversation View */}
      <Card className="p-6 lg:col-span-2">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">{selectedConversation.toyName}</h3>
                {selectedConversation.isPaused && (
                  <Badge variant="destructive">Paused</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleMonitoring(selectedConversation.id)}
                >
                  {selectedConversation.isMonitored ? (
                    <><EyeOff className="w-4 h-4 mr-1" /> Hide</>
                  ) : (
                    <><Eye className="w-4 h-4 mr-1" /> Monitor</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant={selectedConversation.isPaused ? "default" : "destructive"}
                  onClick={() => handlePauseConversation(selectedConversation.id)}
                >
                  {selectedConversation.isPaused ? (
                    <><PlayCircle className="w-4 h-4 mr-1" /> Resume</>
                  ) : (
                    <><PauseCircle className="w-4 h-4 mr-1" /> Pause</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAudioEnabled(!audioEnabled)}
                >
                  {audioEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <Separator className="mb-4" />

            {/* Messages */}
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {selectedConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-blue-500 text-white"
                          : message.role === "toy"
                          ? "bg-gray-100 dark:bg-gray-800"
                          : "bg-yellow-100 dark:bg-yellow-900"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                        {message.safetyScore && getSafetyBadge(message.safetyScore)}
                        {message.flagged && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Flagged
                          </Badge>
                        )}
                      </div>
                      {message.topics && message.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {message.topics.map((topic) => (
                            <Badge key={topic} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Auto-scroll toggle */}
            <div className="mt-4 flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAutoScroll(!autoScroll)}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${autoScroll ? "animate-spin" : ""}`} />
                Auto-scroll {autoScroll ? "On" : "Off"}
              </Button>
              <p className="text-sm text-gray-500">
                {selectedConversation.messages.length} messages in this session
              </p>
            </div>

            {/* Safety Alert */}
            {selectedConversation.messages.some(m => m.flagged) && (
              <Alert className="mt-4" variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This conversation contains flagged content. Review required.
                </AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-[500px] text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select a conversation to monitor</p>
            </div>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <Card className="p-4 lg:col-span-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium">
              All conversations are being monitored for safety
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              Export Session
            </Button>
            <Button size="sm" variant="outline">
              Safety Report
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
