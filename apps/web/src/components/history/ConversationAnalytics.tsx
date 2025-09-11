'use client';

import { Card } from '@pommai/ui';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  MessageSquare, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  Smile,
  Calendar
} from 'lucide-react';
import { ConversationAnalytics as AnalyticsType } from '@/types/history';

interface ConversationAnalyticsProps {
  analytics: AnalyticsType | null | undefined;
  isLoading: boolean;
}

export function ConversationAnalytics({ analytics, isLoading }: ConversationAnalyticsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card 
            key={i} 
            bg="#f8f8f8"
            borderColor="black"
            shadowColor="#e0e0e0"
            className="p-4"
          >
            <div className="h-8 w-32 mb-4 bg-gray-300 border-2 border-black animate-pulse"></div>
            <div className="h-32 w-full bg-gray-200 border-2 border-black animate-pulse"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const sentimentData = [
    { 
      name: 'Positive', 
      value: analytics.sentimentBreakdown.positive, 
      color: '#10b981',
      icon: '😊'
    },
    { 
      name: 'Neutral', 
      value: analytics.sentimentBreakdown.neutral, 
      color: '#6b7280',
      icon: '😐'
    },
    { 
      name: 'Negative', 
      value: analytics.sentimentBreakdown.negative, 
      color: '#ef4444',
      icon: '😔'
    },
  ];

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / (60 * 1000));
    return `${minutes} min`;
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card 
          bg="#ffffff"
          borderColor="black"
          shadowColor="#c381b5"
          className="p-4 hover-lift"
        >
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            <span className="text-2xl font-black text-black">{analytics.totalConversations}</span>
          </div>
          <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Total Conversations</p>
        </Card>
        
        <Card 
          bg="#ffffff"
          borderColor="black"
          shadowColor="#92cd41"
          className="p-4 hover-lift"
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-black text-black">{formatDuration(analytics.averageDuration)}</span>
          </div>
          <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Avg Duration</p>
        </Card>
        
        <Card 
          bg="#ffffff"
          borderColor="black"
          shadowColor="#f7931e"
          className="p-4 hover-lift"
        >
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-black text-black">{analytics.totalMessages}</span>
          </div>
          <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Total Messages</p>
        </Card>
        
        <Card 
          bg="#ffffff"
          borderColor="black"
          shadowColor="#fefcd0"
          className="p-4 hover-lift"
        >
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <span className="text-2xl font-black text-black">{analytics.flaggedMessageCount}</span>
          </div>
          <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Flagged</p>
        </Card>
      </div>

      {/* Sentiment Distribution */}
      <Card 
        bg="#ffffff"
        borderColor="black"
        shadowColor="#c381b5"
        className="p-4 hover-lift"
      >
        <h3 className="font-black text-lg uppercase tracking-wider text-black mb-4 flex items-center gap-2">
          <Smile className="w-5 h-5" />
          😊 Sentiment Distribution
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent, icon }) => `${icon} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-center gap-4">
          {sentimentData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 border border-black" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm font-bold uppercase tracking-wide text-gray-700">{item.name}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Conversations Over Time */}
      {analytics.conversationsByDay.length > 0 && (
        <Card 
          bg="#ffffff"
          borderColor="black"
          shadowColor="#92cd41"
          className="p-4 hover-lift"
        >
          <h3 className="font-black text-lg uppercase tracking-wider text-black mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            📅 Activity Trend
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.conversationsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                  name="Conversations"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Top Topics */}
      {analytics.topTopics && analytics.topTopics.length > 0 && (
        <Card 
          bg="#ffffff"
          borderColor="black"
          shadowColor="#f7931e"
          className="p-4 hover-lift"
        >
          <h3 className="font-black text-lg uppercase tracking-wider text-black mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            🔥 Top Topics
          </h3>
          <div className="space-y-2">
            {analytics.topTopics.slice(0, 5).map((topic, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border border-black bg-[#c381b5] text-white">
                  {topic.topic}
                </span>
                <span className="text-sm font-bold text-gray-700">{topic.count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
