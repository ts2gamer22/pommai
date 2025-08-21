'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
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
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-3xl h-[80vh]">
          <DialogHeader>
            <Skeleton className="h-8 w-64" />
          </DialogHeader>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleExportTranscript = () => {
    const transcript = conversation.messages
      .map(msg => `[${format(new Date(msg.timestamp), 'HH:mm:ss')}] ${msg.role === 'user' ? 'User' : conversation.toy?.name || 'Toy'}: ${msg.content}`)
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
    ? conversation.endTime - conversation.startTime 
    : Date.now() - conversation.startTime;
  const durationMinutes = Math.floor(duration / (60 * 1000));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                Conversation with {conversation.toy?.name}
              </DialogTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
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
              variant="outline"
              size="sm"
              onClick={handleExportTranscript}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {conversation.messages.map((message) => (
              <div
                key={message._id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role !== 'user' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-purple-100 text-lg">
                      {getToyAvatar()}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[70%] ${message.role === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span>{format(new Date(message.timestamp), 'HH:mm:ss')}</span>
                    {message.metadata?.flagged && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Flagged
                      </Badge>
                    )}
                    {isGuardianMode && message.metadata?.sentiment && (
                      <Badge variant="secondary" className="text-xs">
                        {message.metadata.sentiment}
                      </Badge>
                    )}
                    {isGuardianMode && message.metadata?.safetyScore !== undefined && (
                      <Badge 
                        variant={message.metadata.safetyScore > 0.8 ? "default" : "destructive"} 
                        className="text-xs"
                      >
                        Safety: {(message.metadata.safetyScore * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                </div>
                
                {message.role === 'user' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-blue-100">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {isGuardianMode && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Guardian Mode: Full conversation access enabled
              </p>
              <Button variant="outline" size="sm">
                <Flag className="w-4 h-4 mr-2" />
                Report Conversation
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
