"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, Button, ProgressBar } from "@pommai/ui";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@pommai/ui";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  Brain,
  Heart,
  Shield,
  Clock,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
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
  Legend,
  ResponsiveContainer,
} from "recharts";

interface SafetyAnalyticsProps {
  childId: string;
}

export function SafetyAnalytics({ childId }: SafetyAnalyticsProps) {
  const [range, setRange] = useState<"today" | "week" | "month" | "year">("week");
  
  const { now, dateFrom } = useMemo(() => {
    const currentTime = Date.now();
    let fromTime;
    
    if (range === "today") fromTime = new Date(new Date().toDateString()).getTime();
    else if (range === "week") fromTime = currentTime - 7 * 24 * 60 * 60 * 1000;
    else if (range === "month") fromTime = currentTime - 30 * 24 * 60 * 60 * 1000;
    else if (range === "year") fromTime = currentTime - 365 * 24 * 60 * 60 * 1000;
    else fromTime = undefined;
    
    return { now: currentTime, dateFrom: fromTime };
  }, [range]);

  const analytics = useQuery(api.conversations.getConversationAnalytics, {
    toyId: undefined,
    dateFrom,
    dateTo: now,
  });

  // Memoize calculated values to prevent unnecessary recalculations
  const calculatedData = useMemo(() => {
    const avgMinutes = (analytics?.averageDuration || 0) / 60;
    const totalConversations = analytics?.totalConversations || 0;
    const totalMessages = analytics?.totalMessages || 0;
    const flaggedCount = analytics?.flaggedMessageCount || 0;
    const sentiment = analytics?.sentimentBreakdown || { positive: 0, neutral: 0, negative: 0 };

    // Derive activity data from conversationsByDay, estimate messages/minutes per conv
    const estimatedMsgsPerConv = totalConversations > 0 ? totalMessages / totalConversations : 0;
    const conversationsByDay = analytics?.conversationsByDay || [];
    const activityData = conversationsByDay.map((d: any) => ({
      day: d?.date?.slice(5) || '', // MM-DD
      minutes: Math.round((avgMinutes || 0) * (d?.count || 0)),
      messages: Math.round(estimatedMsgsPerConv * (d?.count || 0)),
      count: d?.count || 0,
    }));

    const topicsDistribution = (analytics?.topTopics || []).slice(0, 5).map((t: any, idx: number) => ({
      name: t?.topic || `Topic ${idx + 1}`,
      value: t?.count || 0,
      color: ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#6B7280"][idx % 5],
    }));

    return {
      avgMinutes,
      totalConversations,
      totalMessages,
      flaggedCount,
      sentiment,
      activityData,
      topicsDistribution,
    };
  }, [analytics]);

  const { avgMinutes, totalConversations, totalMessages, flaggedCount, sentiment, activityData, topicsDistribution } = calculatedData;

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <h3 className="retro-h3 text-base sm:text-lg text-black flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          📊 Safety Analytics & Insights
        </h3>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={(v) => setRange(v as any)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            bg="#f0f0f0"
            textColor="black"
            borderColor="black"
            shadow="#d0d0d0"
            className="py-2 px-3 font-bold uppercase tracking-wider hover-lift"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card 
          bg="#ffffff"
          borderColor="black"
          shadowColor="#92cd41"
          className="p-4 hover-lift"
        >
          <div className="flex items-center justify-between mb-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border border-green-600 bg-green-100 text-green-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Safe
            </span>
          </div>
          <p className="text-2xl font-black text-black">{Math.max(0, Math.min(100, Math.round(((sentiment.positive + sentiment.neutral * 0.5) / Math.max(1, totalMessages)) * 100)))}%</p>
          <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Safety Score</p>
        </Card>

        <Card 
          bg="#ffffff"
          borderColor="black"
          shadowColor="#f7931e"
          className="p-4 hover-lift"
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border border-gray-600 bg-gray-100 text-gray-800">Avg</span>
          </div>
          <p className="text-2xl font-black text-black">{Math.round(avgMinutes)} min</p>
          <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Avg Session Duration</p>
        </Card>

        <Card 
          bg="#ffffff"
          borderColor="black"
          shadowColor="#c381b5"
          className="p-4 hover-lift"
        >
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border border-gray-600 bg-gray-100 text-gray-800">All</span>
          </div>
          <p className="text-2xl font-black text-black">{totalMessages}</p>
          <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Total Messages</p>
        </Card>

        <Card 
          bg="#ffffff"
          borderColor="black"
          shadowColor="#fefcd0"
          className="p-4 hover-lift"
        >
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border border-green-600 bg-green-100 text-green-600">Total</span>
          </div>
          <p className="text-2xl font-black text-black">{flaggedCount}</p>
          <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Safety Incidents</p>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card 
        bg="#ffffff"
        borderColor="black"
        shadowColor="#c381b5"
        className="p-4 sm:p-6 hover-lift"
      >
        <h4 className="text-md font-black uppercase tracking-wider text-black mb-4">
          📊 Activity Overview
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={activityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="minutes" fill="#3B82F6" name="Minutes (est)" />
            <Bar yAxisId="right" dataKey="messages" fill="#10B981" name="Messages (est)" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topics Distribution */}
        <Card 
          bg="#ffffff"
          borderColor="black"
          shadowColor="#f7931e"
          className="p-4 sm:p-6 hover-lift"
        >
          <h4 className="text-md font-black uppercase tracking-wider text-black mb-4">
            📚 Conversation Topics
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={topicsDistribution.length > 0 ? topicsDistribution : [{ name: "No data", value: 1, color: "#e5e7eb" }]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(topicsDistribution.length > 0 ? topicsDistribution : [{ color: "#e5e7eb" } as any]).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={(entry as any).color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Safety Trends */}
        <Card 
          bg="#ffffff"
          borderColor="black"
          shadowColor="#92cd41"
          className="p-4 sm:p-6 hover-lift"
        >
          <h4 className="text-md font-black uppercase tracking-wider text-black mb-4">
            📈 Sentiment Breakdown
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[{ label: "All", Positive: sentiment.positive, Neutral: sentiment.neutral, Negative: sentiment.negative }] }>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Positive" fill="#10B981" />
              <Bar dataKey="Neutral" fill="#9CA3AF" />
              <Bar dataKey="Negative" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Emotional Insights */}
      <Card 
        bg="#ffffff"
        borderColor="black"
        shadowColor="#c381b5"
        className="p-4 sm:p-6 hover-lift"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-black uppercase tracking-wider text-black flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-600" />
            💖 Emotional Well-being Insights
          </h4>
          <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border border-gray-600 bg-gray-100 text-gray-800">
            Coming Soon
          </span>
        </div>
        <div className="text-sm font-bold uppercase tracking-wide text-gray-700">
          This dashboard section will show AI-derived emotional insights from recent conversations.
        </div>
      </Card>

      {/* Learning Progress */}
      <Card 
        bg="#ffffff"
        borderColor="black"
        shadowColor="#92cd41"
        className="p-4 sm:p-6 hover-lift"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-black uppercase tracking-wider text-black flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            🧠 Learning & Development
          </h4>
          <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border border-green-600 bg-green-100 text-green-600">
            On Track
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            bg="#f8f4ff"
            borderColor="black"
            shadowColor="#c381b5"
            className="text-center p-4"
          >
            <p className="text-2xl font-black text-purple-600">127</p>
            <p className="text-sm font-bold uppercase tracking-wide text-gray-700">New Words Learned</p>
          </Card>
          <Card
            bg="#e3f2fd"
            borderColor="black"
            shadowColor="#2196f3"
            className="text-center p-4"
          >
            <p className="text-2xl font-black text-blue-600">45</p>
            <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Questions Asked</p>
          </Card>
          <Card
            bg="#e8f5e8"
            borderColor="black"
            shadowColor="#4caf50"
            className="text-center p-4"
          >
            <p className="text-2xl font-black text-green-600">23</p>
            <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Stories Completed</p>
          </Card>
        </div>
      </Card>

      {/* Recommendations */}
      <Card 
        bg="#ffffff"
        borderColor="black"
        shadowColor="#f7931e"
        className="p-4 sm:p-6 hover-lift"
      >
        <h4 className="text-md font-black uppercase tracking-wider text-black mb-4">
          💡 Personalized Recommendations
        </h4>
        <div className="space-y-3">
          <Card
            bg="#e8f5e8"
            borderColor="green"
            shadowColor="#4caf50"
            className="p-3"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-black text-sm uppercase tracking-wider text-green-800">
                  Encourage more educational content
                </p>
                <p className="text-sm font-bold text-green-700">
                  Your child responds well to learning activities. Consider enabling more educational games.
                </p>
              </div>
            </div>
          </Card>
          <Card
            bg="#e3f2fd"
            borderColor="blue"
            shadowColor="#2196f3"
            className="p-3"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-black text-sm uppercase tracking-wider text-blue-800">
                  Adjust weekend time limits
                </p>
                <p className="text-sm font-bold text-blue-700">
                  Weekend usage is higher than weekdays. Consider setting specific weekend limits.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
}
