'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, Button, Input, Tabs, TabsContent, TabsList, TabsTrigger } from '@pommai/ui';
import Calendar from 'react-calendar';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon,
  MessageSquare,
  Clock,
  TrendingUp,
  AlertCircle,
  Download,
  ChevronDown,
  ChevronUp,
  Smile,
  Frown,
  Meh
} from 'lucide-react';
import { ConversationAnalytics } from './ConversationAnalytics';
import { ConversationList } from './ConversationList';
import { ConversationDetails } from './ConversationDetails';
import { ConversationFilters } from '@/types/history';
import 'react-calendar/dist/Calendar.css';

interface ConversationViewerProps {
  toyId?: string;
  isGuardianMode?: boolean;
}

export function ConversationViewer({ toyId, isGuardianMode = false }: ConversationViewerProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [timelineView, setTimelineView] = useState<'day' | 'week' | 'month'>('week');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState<ConversationFilters>({
    toyId: toyId as any,
    searchQuery: '',
    sentiment: [],
    hasFlaggedMessages: undefined,
  });

  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    subDays(new Date(), 7),
    new Date()
  ]);

  // Update filters when search or date changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      searchQuery,
      dateFrom: dateRange[0] ? startOfDay(dateRange[0]).getTime() : undefined,
      dateTo: dateRange[1] ? endOfDay(dateRange[1]).getTime() : undefined,
    }));
  }, [searchQuery, dateRange]);

  // Fetch conversations with filters
  const conversations = useQuery(
    api.conversations.getFilteredConversationHistory,
    filters as any
  );

  // Fetch analytics
  const analytics = useQuery(
    api.conversations.getConversationAnalytics,
    {
      toyId: toyId as any,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    }
  );

  const handleSentimentToggle = (sentiment: 'positive' | 'neutral' | 'negative') => {
    setFilters(prev => {
      const current = prev.sentiment || [];
      const updated = current.includes(sentiment)
        ? current.filter(s => s !== sentiment)
        : [...current, sentiment];
      return { ...prev, sentiment: updated };
    });
  };

  const handleFlaggedToggle = () => {
    setFilters(prev => ({
      ...prev,
      hasFlaggedMessages: prev.hasFlaggedMessages === true ? undefined : true
    }));
  };

  const handleExport = (format: 'pdf' | 'csv' | 'json') => {
    // TODO: Implement export functionality
    console.log('Exporting as', format);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-black uppercase tracking-wider text-black">
          💬 Conversation History
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Timeline View Tabs */}
          <div className="flex bg-gray-100 border-2 border-black">
            {(['day', 'week', 'month'] as const).map((view) => (
              <Button
                key={view}
                bg={timelineView === view ? '#c381b5' : 'transparent'}
                textColor={timelineView === view ? 'white' : 'black'}
                borderColor="transparent"
                className={`px-4 py-2 font-bold uppercase tracking-wider border-r border-black last:border-r-0 ${
                  timelineView === view ? '' : 'hover:bg-gray-200'
                }`}
                onClick={() => setTimelineView(view)}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </Button>
            ))}
          </div>
          
          {/* Export Buttons */}
          <div className="flex gap-1">
            {['pdf', 'csv'].map((format) => (
              <Button
                key={format}
                bg="#f0f0f0"
                textColor="black"
                borderColor="black"
                shadow="#d0d0d0"
                onClick={() => handleExport(format as 'pdf' | 'csv')}
                className="py-2 px-3 font-bold uppercase tracking-wider hover-lift"
              >
                <Download className="w-4 h-4 mr-1" />
                {format.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card
        bg="#ffffff"
        borderColor="black"
        shadowColor="#c381b5"
        className="p-4"
      >
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg="#fefcd0"
                borderColor="black"
                className="pl-10 font-medium"
              />
            </div>
            
            <Button
              bg={showCalendar ? '#c381b5' : '#f0f0f0'}
              textColor={showCalendar ? 'white' : 'black'}
              borderColor="black"
              shadow={showCalendar ? '#8b5fa3' : '#d0d0d0'}
              onClick={() => setShowCalendar(!showCalendar)}
              className="py-2 px-4 font-bold uppercase tracking-wider hover-lift relative"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              {dateRange[0] && dateRange[1] ? (
                `${format(dateRange[0], 'MMM d')} - ${format(dateRange[1], 'MMM d')}`
              ) : (
                'Select dates'
              )}
            </Button>
            
            <Button
              bg={showFilters ? '#c381b5' : '#f0f0f0'}
              textColor={showFilters ? 'white' : 'black'}
              borderColor="black"
              shadow={showFilters ? '#8b5fa3' : '#d0d0d0'}
              onClick={() => setShowFilters(!showFilters)}
              className="py-2 px-4 font-bold uppercase tracking-wider hover-lift"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </Button>
          </div>

          {/* Date Picker */}
          {showCalendar && (
            <Card
              bg="#ffffff"
              borderColor="black"
              shadowColor="#f7931e"
              className="absolute z-10 p-2 mt-2"
            >
              <Calendar
                selectRange
                onChange={(value: any) => {
                  if (Array.isArray(value)) {
                    setDateRange([value[0], value[1]]);
                    setShowCalendar(false);
                  }
                }}
                value={dateRange}
                className="border-0"
              />
            </Card>
          )}

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t-2 border-black">
              <div>
                <label className="text-sm font-black uppercase tracking-wider text-black mb-2 block">
                  😊 Sentiment
                </label>
                <div className="space-y-2">
                  {[
                    { key: 'positive', icon: Smile, color: 'text-green-500', label: 'Positive' },
                    { key: 'neutral', icon: Meh, color: 'text-gray-500', label: 'Neutral' },
                    { key: 'negative', icon: Frown, color: 'text-red-500', label: 'Negative' }
                  ].map(({ key, icon: Icon, color, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.sentiment?.includes(key as any) || false}
                        onChange={() => handleSentimentToggle(key as any)}
                        className="w-4 h-4 border-2 border-black"
                      />
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-sm font-bold uppercase tracking-wide text-black">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-black uppercase tracking-wider text-black mb-2 block">
                  🛡️ Safety
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasFlaggedMessages === true}
                    onChange={handleFlaggedToggle}
                    className="w-4 h-4 border-2 border-black"
                  />
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-bold uppercase tracking-wide text-black">Has flagged messages</span>
                </label>
              </div>

              <div className="flex items-end">
                <Button
                  bg="#f0f0f0"
                  textColor="black"
                  borderColor="black"
                  shadow="#d0d0d0"
                  onClick={() => {
                    setFilters({
                      toyId: toyId as any,
                      searchQuery: '',
                      sentiment: [],
                      hasFlaggedMessages: undefined,
                    });
                    setSearchQuery('');
                    setDateRange([subDays(new Date(), 7), new Date()]);
                  }}
                  className="py-2 px-4 font-bold uppercase tracking-wider hover-lift"
                >
                  Clear filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-2">
          <ConversationList
            conversations={conversations || []}
            selectedId={selectedConversationId}
            onSelect={setSelectedConversationId}
            isLoading={conversations === undefined}
          />
        </div>

        {/* Analytics Sidebar */}
        <div className="space-y-4">
          <ConversationAnalytics
            analytics={analytics}
            isLoading={analytics === undefined}
          />
        </div>
      </div>

      {/* Conversation Details Modal */}
      {selectedConversationId && (
        <ConversationDetails
          conversationId={selectedConversationId}
          onClose={() => setSelectedConversationId(null)}
          isGuardianMode={isGuardianMode}
        />
      )}
    </div>
  );
}
