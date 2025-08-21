'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
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
      <Card className="p-4">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card className="p-8 text-center">
        <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations found</h3>
        <p className="text-gray-600">
          Try adjusting your filters or search criteria
        </p>
      </Card>
    );
  }

  // Group conversations by date
  const groupedConversations = conversations.reduce((groups, conv) => {
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
    <Card className="overflow-hidden">
      <ScrollArea className="h-[600px]">
        <div className="p-4 space-y-6">
          {Object.entries(groupedConversations).map(([date, convs]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {date}
              </h3>
              <div className="space-y-2">
                {convs.map((conv) => (
                  <motion.div
                    key={conv._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: 4 }}
                    onClick={() => onSelect(conv._id)}
                    className={`
                      p-4 rounded-lg border cursor-pointer transition-all
                      ${selectedId === conv._id 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">
                            {conv.toyName}
                          </h4>
                          {conv.flaggedMessageCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {conv.flaggedMessageCount} flagged
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
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
                        {conv.topics.slice(0, 3).map((topic, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {conv.topics.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{conv.topics.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
