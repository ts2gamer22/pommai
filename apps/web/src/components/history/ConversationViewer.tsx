'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
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
    toyId,
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
    filters
  );

  // Fetch analytics
  const analytics = useQuery(
    api.conversations.getConversationAnalytics,
    {
      toyId,
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Conversation History</h2>
        <div className="flex items-center gap-2">
          <Select value={timelineView} onValueChange={(value: any) => setTimelineView(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <Download className="w-4 h-4 mr-1" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <Download className="w-4 h-4 mr-1" />
              CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowCalendar(!showCalendar)}
              className="relative"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              {dateRange[0] && dateRange[1] ? (
                `${format(dateRange[0], 'MMM d')} - ${format(dateRange[1], 'MMM d')}`
              ) : (
                'Select dates'
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </Button>
          </div>

          {/* Date Picker */}
          {showCalendar && (
            <div className="absolute z-10 bg-white border rounded-lg shadow-lg p-2">
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
            </div>
          )}

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Sentiment</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={filters.sentiment?.includes('positive') || false}
                      onCheckedChange={() => handleSentimentToggle('positive')}
                    />
                    <Smile className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Positive</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={filters.sentiment?.includes('neutral') || false}
                      onCheckedChange={() => handleSentimentToggle('neutral')}
                    />
                    <Meh className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Neutral</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={filters.sentiment?.includes('negative') || false}
                      onCheckedChange={() => handleSentimentToggle('negative')}
                    />
                    <Frown className="w-4 h-4 text-red-500" />
                    <span className="text-sm">Negative</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Safety</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={filters.hasFlaggedMessages === true}
                    onCheckedChange={handleFlaggedToggle}
                  />
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">Has flagged messages</span>
                </label>
              </div>

              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilters({
                      toyId,
                      searchQuery: '',
                      sentiment: [],
                      hasFlaggedMessages: undefined,
                    });
                    setSearchQuery('');
                    setDateRange([subDays(new Date(), 7), new Date()]);
                  }}
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
