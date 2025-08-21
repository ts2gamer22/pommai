'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  Frown,
  Meh,
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
          <Card key={i} className="p-4">
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-32 w-full" />
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
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            <span className="text-2xl font-bold">{analytics.totalConversations}</span>
          </div>
          <p className="text-sm text-gray-600">Total Conversations</p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold">{formatDuration(analytics.averageDuration)}</span>
          </div>
          <p className="text-sm text-gray-600">Avg Duration</p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold">{analytics.totalMessages}</span>
          </div>
          <p className="text-sm text-gray-600">Total Messages</p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <span className="text-2xl font-bold">{analytics.flaggedMessageCount}</span>
          </div>
          <p className="text-sm text-gray-600">Flagged</p>
        </Card>
      </div>

      {/* Sentiment Distribution */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Smile className="w-5 h-5" />
          Sentiment Distribution
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent, icon }) => `${icon} ${(percent * 100).toFixed(0)}%`}
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
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-600">{item.name}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Conversations Over Time */}
      {analytics.conversationsByDay.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Activity Trend
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
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top Topics
          </h3>
          <div className="space-y-2">
            {analytics.topTopics.slice(0, 5).map((topic, i) => (
              <div key={i} className="flex items-center justify-between">
                <Badge variant="secondary">{topic.topic}</Badge>
                <span className="text-sm text-gray-600">{topic.count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
