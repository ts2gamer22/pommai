export interface ConversationSummary {
  id: string;
  toyId: string;
  toyName: string;
  startTime: number;
  endTime: number;
  duration: number;
  participantChild?: string;
  messageCount: number;
  flaggedMessages: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];
  location: 'toy' | 'web' | 'app';
}

export interface MessageAnalysis {
  topics: string[];
  educationalValue: number;
  emotionalTone: string;
  safetyFlags: string[];
}

export interface HistoryMessage {
  id: string;
  conversationId: string;
  content: string;
  role: 'user' | 'toy';
  timestamp: number;
  audioUrl?: string;
  metadata?: {
    sentiment?: string;
    safetyScore?: number;
    flagged?: boolean;
  };
  analysis?: MessageAnalysis;
}

export interface ConversationHistory {
  conversations: ConversationSummary[];
  messages: HistoryMessage[];
}

export interface ViewerFeatures {
  timeline: {
    view: 'day' | 'week' | 'month';
    navigation: 'calendar' | 'scroll';
    highlights: 'all' | 'flagged' | 'educational';
  };
  search: {
    query: string;
    dateRange: { from: Date | null; to: Date | null };
    topics: string[];
    sentiment: ('positive' | 'neutral' | 'negative')[];
    participants: string[];
  };
  analytics: {
    conversationFrequency: any; // Chart data
    topicDistribution: any; // PieChart data
    sentimentTrends: any; // LineChart data
    vocabularyGrowth: any; // ProgressChart data
    safetyIncidents: any; // IncidentLog data
  };
}

export interface ConversationFilters {
  toyId?: string;
  dateFrom?: number;
  dateTo?: number;
  sentiment?: ('positive' | 'neutral' | 'negative')[];
  hasFlaggedMessages?: boolean;
  searchQuery?: string;
  topics?: string[];
}

export interface ConversationAnalytics {
  totalConversations: number;
  totalMessages: number;
  averageDuration: number;
  topTopics: { topic: string; count: number }[];
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  conversationsByDay: { date: string; count: number }[];
  flaggedMessageCount: number;
}
