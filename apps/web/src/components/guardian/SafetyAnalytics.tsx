"use client";

import { Card, Button, ProgressBar } from "@pommai/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// Mock data for charts
const weeklyActivityData = [
  { day: "Mon", minutes: 45, messages: 120 },
  { day: "Tue", minutes: 60, messages: 150 },
  { day: "Wed", minutes: 30, messages: 80 },
  { day: "Thu", minutes: 75, messages: 190 },
  { day: "Fri", minutes: 90, messages: 220 },
  { day: "Sat", minutes: 120, messages: 280 },
  { day: "Sun", minutes: 100, messages: 240 },
];

const topicsDistribution = [
  { name: "Education", value: 35, color: "#3B82F6" },
  { name: "Games", value: 25, color: "#10B981" },
  { name: "Stories", value: 20, color: "#F59E0B" },
  { name: "Creative", value: 15, color: "#8B5CF6" },
  { name: "Other", value: 5, color: "#6B7280" },
];

const safetyTrends = [
  { date: "Week 1", safetyScore: 98, incidents: 0 },
  { date: "Week 2", safetyScore: 97, incidents: 1 },
  { date: "Week 3", safetyScore: 99, incidents: 0 },
  { date: "Week 4", safetyScore: 96, incidents: 2 },
];

const emotionalInsights = [
  { emotion: "Happy", percentage: 65 },
  { emotion: "Curious", percentage: 20 },
  { emotion: "Neutral", percentage: 10 },
  { emotion: "Frustrated", percentage: 5 },
];

export function SafetyAnalytics({ childId }: SafetyAnalyticsProps) {
  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <h3 className="retro-h3 text-base sm:text-lg text-black flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          📊 Safety Analytics & Insights
        </h3>
        <div className="flex items-center gap-2">
          <Select defaultValue="week">
            <SelectTrigger className="w-[140px] border-2 border-black font-bold">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
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
              +2%
            </span>
          </div>
          <p className="text-2xl font-black text-black">98%</p>
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
            <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border border-red-600 bg-red-100 text-red-600 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              -15%
            </span>
          </div>
          <p className="text-2xl font-black text-black">74 min</p>
          <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Avg Daily Usage</p>
        </Card>

        <Card 
          bg="#ffffff"
          borderColor="black"
          shadowColor="#c381b5"
          className="p-4 hover-lift"
        >
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border border-gray-600 bg-gray-100 text-gray-800">Stable</span>
          </div>
          <p className="text-2xl font-black text-black">1,280</p>
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
            <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border border-green-600 bg-green-100 text-green-600">Low</span>
          </div>
          <p className="text-2xl font-black text-black">3</p>
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
          📊 Weekly Activity Overview
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyActivityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="minutes" fill="#3B82F6" name="Minutes" />
            <Bar yAxisId="right" dataKey="messages" fill="#10B981" name="Messages" />
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
                data={topicsDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {topicsDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
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
            📈 Safety Trends
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={safetyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="safetyScore"
                stroke="#10B981"
                name="Safety Score"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="incidents"
                stroke="#EF4444"
                name="Incidents"
                strokeWidth={2}
              />
            </LineChart>
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
          <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border border-green-600 bg-green-100 text-green-600">
            Healthy
          </span>
        </div>
        <div className="space-y-4">
          {emotionalInsights.map((emotion) => (
            <div key={emotion.emotion}>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-black uppercase tracking-wider text-black">{emotion.emotion}</span>
                <span className="text-sm font-bold text-gray-700">{emotion.percentage}%</span>
              </div>
              <ProgressBar 
                progress={emotion.percentage} 
                color="#c381b5"
                borderColor="black"
                className="h-2 shadow-[0_2px_0_1px_rgba(0,0,0,0.3)]"
              />
            </div>
          ))}
        </div>
        <Card
          bg="#e1f5fe"
          borderColor="blue"
          shadowColor="#2196f3"
          className="mt-4 p-4"
        >
          <p className="text-sm font-bold text-blue-800">
            <strong>🤖 AI Insight:</strong> Your child shows healthy emotional patterns with
            predominantly positive interactions. The curiosity level indicates good engagement
            with educational content.
          </p>
        </Card>
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
