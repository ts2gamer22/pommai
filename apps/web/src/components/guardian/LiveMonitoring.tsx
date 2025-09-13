"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, Button } from "@pommai/ui";
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
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface LiveMonitoringProps {
  childId: string;
}

export function LiveMonitoring({ childId }: LiveMonitoringProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch active conversations for toys marked as "for kids"
  const activeConversations = useQuery(
    api.conversations.getActiveConversations,
    { isForKids: true }
  );

  // Fetch messages for selected conversation
  const selectedConversationMessages = useQuery(
    api.messages.getMessages,
    selectedConversationId 
      ? { conversationId: selectedConversationId as Id<"conversations"> }
      : "skip"
  );

  // Fetch conversation details
  const selectedConversation = useQuery(
    api.conversations.getConversationWithMessages,
    selectedConversationId
      ? { conversationId: selectedConversationId as Id<"conversations"> }
      : "skip"
  );

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!selectedConversationId && activeConversations && activeConversations.length > 0) {
      setSelectedConversationId(activeConversations[0]._id);
    }
  }, [activeConversations, selectedConversationId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedConversationMessages, autoScroll]);

  const togglePause = useMutation(api.conversations.togglePauseConversation);
  const toggleMonitoring = useMutation(api.conversations.toggleMonitoring);

  const handlePauseConversation = async (conversationId: string) => {
    try {
      await togglePause({ conversationId: conversationId as Id<"conversations"> });
    } catch (e) {
      console.error("Failed to toggle pause:", e);
    }
  };

  const handleToggleMonitoring = async (conversationId: string) => {
    try {
      await toggleMonitoring({ conversationId: conversationId as Id<"conversations"> });
    } catch (e) {
      console.error("Failed to toggle monitoring:", e);
    }
  };

  const getSafetyBadge = (score?: number) => {
    if (!score) return null;
    if (score >= 0.95) return <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border border-green-600 bg-green-100 text-green-800">Safe</span>;
    if (score >= 0.8) return <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border border-gray-600 bg-gray-100 text-gray-800">Normal</span>;
    return <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border border-red-600 bg-red-100 text-red-800">Review</span>;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
      {/* Active Conversations List */}
      <Card 
        bg="#ffffff"
        borderColor="black"
        shadowColor="#c381b5"
        className="p-4 sm:p-6 xl:col-span-1 hover-lift"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="retro-h3 text-base sm:text-lg text-black flex items-center gap-2">
            <Activity className="w-4 sm:w-5 h-4 sm:h-5" />
            📊 Active Sessions
          </h3>
          <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border-2 border-black bg-[#c381b5] text-white">
            {activeConversations?.length || 0}
          </span>
        </div>

        <div className="space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
          {activeConversations?.map((conversation) => (
            <Card
              key={conversation._id}
              bg={selectedConversationId === conversation._id ? "#c381b5" : "#ffffff"}
              borderColor="black"
              shadowColor={selectedConversationId === conversation._id ? "#8b5fa3" : "#e0e0e0"}
              className={`p-3 cursor-pointer transition-all hover-lift ${
                selectedConversationId === conversation._id
                  ? "text-white"
                  : "text-black hover:shadow-[0_4px_0_2px_#c381b5]"
              }`}
              onClick={() => setSelectedConversationId(conversation._id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-black uppercase tracking-wider text-sm sm:text-base truncate">
                    {conversation.toy?.name || "Unknown Toy"}
                  </p>
                  <p className={`text-xs sm:text-sm font-bold uppercase tracking-wide truncate ${
                    selectedConversationId === conversation._id ? "text-white opacity-90" : "text-gray-600"
                  }`}>
                    Started {formatDistanceToNow(new Date(parseInt((conversation as any).startedAt || conversation.startTime || "0")), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex flex-col gap-1 items-end flex-shrink-0">
                  {conversation.isPaused && (
                    <span className="px-1 sm:px-2 py-1 text-xs font-black uppercase tracking-wider border border-orange-600 bg-orange-100 text-orange-800">
                      Paused
                    </span>
                  )}
                  <span className="px-1 sm:px-2 py-1 text-xs font-black uppercase tracking-wider border border-blue-600 bg-blue-100 text-blue-800 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    Live
                  </span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <MessageSquare className="w-3 sm:w-4 h-3 sm:h-4 text-gray-400" />
                <span className={`text-xs sm:text-sm font-bold uppercase tracking-wide ${
                  selectedConversationId === conversation._id ? "text-white opacity-90" : "text-gray-600"
                }`}>
                  {conversation.messageCount || 0} messages
                </span>
                {conversation.flaggedMessages > 0 && (
                  <span className="ml-auto px-1 py-0.5 text-xs font-black uppercase tracking-wider border border-red-600 bg-red-100 text-red-800">
                    {conversation.flaggedMessages} flagged
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>

        {(!activeConversations || activeConversations.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-8 sm:w-12 h-8 sm:h-12 mx-auto mb-3 opacity-50" />
            <p className="font-bold uppercase tracking-wide text-sm sm:text-base">No active conversations</p>
          </div>
        )}
      </Card>

      {/* Live Conversation View */}
      <Card 
        bg="#ffffff"
        borderColor="black"
        shadowColor="#f7931e"
        className="p-4 sm:p-6 xl:col-span-2 hover-lift"
      >
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 gap-4">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <h3 className="retro-h3 text-base sm:text-lg text-black truncate">
                  {selectedConversation.toy?.name || "Unknown Toy"}
                </h3>
                {selectedConversation.isPaused && (
                  <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border-2 border-red-600 bg-red-100 text-red-800 flex-shrink-0">
                    Paused
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                <Button
                  bg={selectedConversation.isMonitored ? "#f0f0f0" : "#92cd41"}
                  textColor={selectedConversation.isMonitored ? "black" : "white"}
                  borderColor="black"
                  shadow={selectedConversation.isMonitored ? "#d0d0d0" : "#76a83a"}
                  onClick={() => handleToggleMonitoring(selectedConversation._id)}
                  className="py-1 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm font-bold uppercase tracking-wider hover-lift"
                >
                  {selectedConversation.isMonitored ? (
                    <>
                      <EyeOff className="w-3 sm:w-4 h-3 sm:h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 sm:w-4 h-3 sm:h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Monitor</span>
                    </>
                  )}
                </Button>
                <Button
                  bg={selectedConversation.isPaused ? "#92cd41" : "#ff6b6b"}
                  textColor="white"
                  borderColor="black"
                  shadow={selectedConversation.isPaused ? "#76a83a" : "#e84545"}
                  onClick={() => handlePauseConversation(selectedConversation._id)}
                  className="py-1 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm font-bold uppercase tracking-wider hover-lift"
                >
                  {selectedConversation.isPaused ? (
                    <>
                      <PlayCircle className="w-3 sm:w-4 h-3 sm:h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Resume</span>
                    </>
                  ) : (
                    <>
                      <PauseCircle className="w-3 sm:w-4 h-3 sm:h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Pause</span>
                    </>
                  )}
                </Button>
                <Button
                  bg={audioEnabled ? "#c381b5" : "#f0f0f0"}
                  textColor={audioEnabled ? "white" : "black"}
                  borderColor="black"
                  shadow={audioEnabled ? "#8b5fa3" : "#d0d0d0"}
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className="py-1 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm font-bold uppercase tracking-wider hover-lift"
                >
                  {audioEnabled ? (
                    <Volume2 className="w-3 sm:w-4 h-3 sm:h-4" />
                  ) : (
                    <VolumeX className="w-3 sm:w-4 h-3 sm:h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="h-px bg-black mb-4"></div>

            {/* Messages */}
            <div className="h-[300px] sm:h-[400px] overflow-y-auto pr-2 sm:pr-4 border-2 border-black bg-[#fefcd0] p-3 sm:p-4">
              <div className="space-y-3 sm:space-y-4">
                {selectedConversation.messages?.map((message) => (
                  <div
                    key={message._id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] border-2 border-black p-2 sm:p-3 ${
                        message.role === "user"
                          ? "bg-[#c381b5] text-white shadow-[2px_2px_0_0_#8b5fa3]"
                          : message.role === "toy"
                          ? "bg-white text-black shadow-[2px_2px_0_0_#e0e0e0]"
                          : "bg-[#f7931e] text-white shadow-[2px_2px_0_0_#d67c1a]"
                      }`}
                    >
                      <p className="text-xs sm:text-sm font-bold break-words">{message.content}</p>
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                          {new Date(parseInt(message.timestamp || "0")).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {message.metadata?.safetyScore && getSafetyBadge(message.metadata.safetyScore)}
                        {message.metadata?.flagged && (
                          <span className="px-1 sm:px-2 py-1 text-xs font-black uppercase tracking-wider border border-red-600 bg-red-100 text-red-800 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Flagged
                          </span>
                        )}
                      </div>
                      {message.metadata?.topics && message.metadata.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {message.metadata.topics.map((topic: string) => (
                            <span key={topic} className="px-1 sm:px-2 py-1 text-xs font-black uppercase tracking-wider border border-black bg-[#92cd41] text-white">
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Auto-scroll toggle */}
            <div className="mt-4 flex items-center justify-between gap-4">
              <Button
                bg={autoScroll ? "#92cd41" : "#f0f0f0"}
                textColor={autoScroll ? "white" : "black"}
                borderColor="black"
                shadow={autoScroll ? "#76a83a" : "#d0d0d0"}
                onClick={() => setAutoScroll(!autoScroll)}
                className="py-1 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm font-bold uppercase tracking-wider hover-lift"
              >
                <RefreshCw className={`w-3 sm:w-4 h-3 sm:h-4 mr-1 ${autoScroll ? "animate-spin" : ""}`} />
                Auto-scroll {autoScroll ? "On" : "Off"}
              </Button>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-gray-700 truncate">
                {selectedConversation.messages?.length || 0} messages in this session
              </p>
            </div>

            {/* Safety Alert */}
            {selectedConversation.messages?.some(m => m.metadata?.flagged) && (
              <Card
                bg="#ffe4e1"
                borderColor="red"
                shadowColor="#ff6b6b"
                className="mt-4 p-3 sm:p-4"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-black uppercase tracking-wider text-sm text-red-800 mb-1">
                      Safety Alert
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-red-700">
                      This conversation contains flagged content. Please review the messages marked with safety warnings.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="font-bold uppercase tracking-wide text-gray-500">
                Select a conversation to monitor
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
