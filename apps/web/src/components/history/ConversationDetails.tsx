'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Popup, Button, Card } from '@pommai/ui';
import { format } from 'date-fns';
import { 
  X, 
  Download, 
  Flag, 
  MessageSquare,
  User,
  Bot,
  AlertCircle,
  Clock,
  Calendar
} from 'lucide-react';

interface ConversationDetailsProps {
  conversationId: string;
  onClose: () => void;
  isGuardianMode?: boolean;
}

export function ConversationDetails({ 
  conversationId, 
  onClose,
  isGuardianMode = false 
}: ConversationDetailsProps) {
  const conversation = useQuery(
    api.conversations.getConversationWithMessages,
    { conversationId: conversationId as Id<"conversations"> }
  );

  if (!conversation) {
    return (
      <Popup
        isOpen={true}
        title="Loading Conversation..."
        onClose={onClose}
      >
        <div className="space-y-4 p-6 max-w-3xl h-[80vh]">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-gray-300 border-2 border-black animate-pulse"></div>
              <div className="h-16 w-full bg-gray-200 border-2 border-black animate-pulse"></div>
            </div>
          ))}
        </div>
      </Popup>
    );
  }

  const handleExportTranscript = () => {
    const transcript = conversation.messages
      .map((msg: { timestamp: number | string | Date; role: string; content: string }) => `[${format(new Date(msg.timestamp), 'HH:mm:ss')}] ${msg.role === 'user' ? 'User' : conversation.toy?.name || 'Toy'}: ${msg.content}`)
      .join('\n');
    
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${conversationId}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
    return avatarMap[conversation.toy?.type || ''] || '🎁';
  };

  const duration = conversation.endTime 
    ? Number(conversation.endTime) - Number(conversation.startTime)
    : Date.now() - Number(conversation.startTime);
  const durationMinutes = Math.floor(duration / (60 * 1000));

  return (
    <Popup
      isOpen={true}
      title={`💬 Conversation with ${conversation.toy?.name}`}
      onClose={onClose}
    >
      <div className="flex flex-col h-full max-w-3xl min-h-[80vh]">
        {/* Header with metadata */}
        <Card
          bg="#ffffff"
          borderColor="black"
          shadowColor="#c381b5"
          className="p-4 mb-4"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-4 text-sm font-bold text-gray-700 uppercase tracking-wide">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(conversation.startTime), 'MMMM d, yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {format(new Date(conversation.startTime), 'h:mm a')} - 
                  {conversation.endTime && format(new Date(conversation.endTime), 'h:mm a')}
                  {' '}({durationMinutes} min)
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {conversation.messages.length} messages
                </span>
              </div>
            </div>
            <Button
              bg="#f0f0f0"
              textColor="black"
              borderColor="black"
              shadow="#d0d0d0"
              onClick={handleExportTranscript}
              className="py-2 px-3 font-bold uppercase tracking-wider hover-lift"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </Card>

        {/* Messages Container */}
        <div className="flex-1 h-[400px] overflow-y-auto border-2 border-black bg-[#fefcd0] p-4">
          <div className="space-y-4">
            {conversation.messages.map((message) => (
              <div
                key={message._id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role !== 'user' && (
                  <div className="w-8 h-8 bg-purple-100 border-2 border-black flex items-center justify-center text-lg">
                    {getToyAvatar()}
                  </div>
                )}
                
                <div className={`max-w-[70%] ${message.role === 'user' ? 'order-first' : ''}`}>
                  <Card
                    bg={message.role === 'user' ? '#c381b5' : '#ffffff'}
                    borderColor="black"
                    shadowColor={message.role === 'user' ? '#8b5fa3' : '#e0e0e0'}
                    className="p-3"
                  >
                    <p className={`text-sm font-bold ${
                      message.role === 'user' ? 'text-white' : 'text-black'
                    }`}>
                      {message.content}
                    </p>
                  </Card>
                  
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <span className="font-bold text-gray-700">
                      {format(new Date(message.timestamp), 'HH:mm:ss')}
                    </span>
                    {message.metadata?.flagged && (
                      <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border border-red-600 bg-red-100 text-red-800 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Flagged
                      </span>
                    )}
                    {isGuardianMode && message.metadata?.sentiment && (
                      <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border border-gray-600 bg-gray-100 text-gray-800">
                        {message.metadata.sentiment}
                      </span>
                    )}
                    {isGuardianMode && message.metadata?.safetyScore !== undefined && (
                      <span 
                        className={`px-2 py-1 text-xs font-black uppercase tracking-wider border ${
                          message.metadata.safetyScore > 0.8 
                            ? 'border-green-600 bg-green-100 text-green-800' 
                            : 'border-red-600 bg-red-100 text-red-800'
                        }`}
                      >
                        Safety: {(message.metadata.safetyScore * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
                
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-blue-100 border-2 border-black flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Guardian Mode Footer */}
        {isGuardianMode && (
          <Card
            bg="#ffffff"
            borderColor="black"
            shadowColor="#f7931e"
            className="p-4 mt-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                🛡️ Guardian Mode: Full conversation access enabled
              </p>
              <Button
                bg="#f7931e"
                textColor="white"
                borderColor="black"
                shadow="#d67c1a"
                className="py-2 px-3 font-bold uppercase tracking-wider hover-lift"
              >
                <Flag className="w-4 h-4 mr-2" />
                Report Conversation
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Popup>
  );
}
