'use client';

import { Card, Button } from '@pommai/ui';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { 
  MessageSquare, 
  Clock, 
  AlertCircle,
  Smile,
  Frown,
  Meh,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ConversationListProps {
  conversations: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

export function ConversationList({ 
  conversations, 
  selectedId, 
  onSelect, 
  isLoading 
}: ConversationListProps) {
  if (isLoading) {
    return (
      <Card 
        bg="#ffffff"
        borderColor="black"
        shadowColor="#e0e0e0"
        className="p-4"
      >
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 bg-gray-300 border-2 border-black animate-pulse"></div>
              <div className="h-20 w-full bg-gray-200 border-2 border-black animate-pulse"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card 
        bg="#ffffff"
        borderColor="black"
        shadowColor="#c381b5"
        className="p-8 text-center hover-lift"
      >
        <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-black uppercase tracking-wider text-black mb-2">No conversations found</h3>
        <p className="font-bold text-gray-700 uppercase tracking-wide">
          Try adjusting your filters or search criteria
        </p>
      </Card>
    );
  }

  // Group conversations by date
  const groupedConversations = conversations.reduce((groups: Record<string, any[]>, conv: any) => {
    const date = new Date(conv.startedAt);
    let dateKey: string;
    
    if (isToday(date)) {
      dateKey = 'Today';
    } else if (isYesterday(date)) {
      dateKey = 'Yesterday';
    } else {
      dateKey = format(date, 'MMMM d, yyyy');
    }
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(conv);
    return groups;
  }, {} as Record<string, any[]>);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <Smile className="w-4 h-4 text-green-500" />;
      case 'negative':
        return <Frown className="w-4 h-4 text-red-500" />;
      default:
        return <Meh className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / (60 * 1000));
    const seconds = Math.floor((duration % (60 * 1000)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card 
      bg="#ffffff"
      borderColor="black"
      shadowColor="#c381b5"
      className="overflow-hidden hover-lift"
    >
      <div className="h-[600px] overflow-y-auto border-2 border-black bg-[#fefcd0]">
        <div className="p-4 space-y-6">
          {Object.entries(groupedConversations).map(([date, convs]) => (
            <div key={date}>
              <h3 className="text-sm font-black uppercase tracking-wider text-black mb-3">
                📅 {date}
              </h3>
              <div className="space-y-2">
                {convs.map((conv) => (
                  <Card
                    key={conv._id}
                    bg={selectedId === conv._id ? "#c381b5" : "#ffffff"}
                    borderColor="black"
                    shadowColor={selectedId === conv._id ? "#8b5fa3" : "#e0e0e0"}
                    className={`p-4 cursor-pointer transition-all hover-lift ${
                      selectedId === conv._id 
                        ? 'text-white' 
                        : 'text-black hover:shadow-[0_4px_0_2px_#c381b5]'
                    }`}
                    onClick={() => onSelect(conv._id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-black uppercase tracking-wider text-inherit">
                            {conv.toyName}
                          </h4>
                          {conv.flaggedMessageCount > 0 && (
                            <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border border-red-600 bg-red-100 text-red-800 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {conv.flaggedMessageCount} flagged
                            </span>
                          )}
                        </div>
                        
                        <div className={`flex items-center gap-4 text-sm font-bold ${
                          selectedId === conv._id ? 'text-white opacity-90' : 'text-gray-700'
                        }`}>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(conv.startedAt), 'h:mm a')}
                          </span>
                          {conv.duration > 0 && (
                            <span className="flex items-center gap-1">
                              Duration: {formatDuration(conv.duration)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {conv.messageCount} messages
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getSentimentIcon(conv.sentiment)}
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    
                    {conv.topics && conv.topics.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {conv.topics.slice(0, 3).map((topic: string, i: number) => (
                          <span key={i} className="px-2 py-1 text-xs font-black uppercase tracking-wider border border-black bg-[#92cd41] text-white">
                            {topic}
                          </span>
                        ))}
                        {conv.topics.length > 3 && (
                          <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border border-black bg-[#f7931e] text-white">
                            +{conv.topics.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
