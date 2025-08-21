"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Safety Analytics & Insights
        </h3>
        <div className="flex items-center gap-2">
          <Select defaultValue="week">
            <SelectTrigger className="w-[140px]">
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
          <Button size="sm" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Shield className="w-5 h-5 text-green-600" />
            <Badge variant="secondary" className="text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +2%
            </Badge>
          </div>
          <p className="text-2xl font-bold">98%</p>
          <p className="text-sm text-gray-500">Safety Score</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <Badge variant="secondary" className="text-red-600">
              <TrendingDown className="w-3 h-3 mr-1" />
              -15%
            </Badge>
          </div>
          <p className="text-2xl font-bold">74 min</p>
          <p className="text-sm text-gray-500">Avg Daily Usage</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            <Badge variant="secondary">Stable</Badge>
          </div>
          <p className="text-2xl font-bold">1,280</p>
          <p className="text-sm text-gray-500">Total Messages</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <Badge variant="secondary" className="text-green-600">
              Low
            </Badge>
          </div>
          <p className="text-2xl font-bold">3</p>
          <p className="text-sm text-gray-500">Safety Incidents</p>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card className="p-6">
        <h4 className="text-md font-semibold mb-4">Weekly Activity Overview</h4>
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
        <Card className="p-6">
          <h4 className="text-md font-semibold mb-4">Conversation Topics</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={topicsDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
        <Card className="p-6">
          <h4 className="text-md font-semibold mb-4">Safety Trends</h4>
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
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-semibold flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-600" />
            Emotional Well-being Insights
          </h4>
          <Badge variant="outline" className="text-green-600">
            Healthy
          </Badge>
        </div>
        <div className="space-y-4">
          {emotionalInsights.map((emotion) => (
            <div key={emotion.emotion}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">{emotion.emotion}</span>
                <span className="text-sm text-gray-500">{emotion.percentage}%</span>
              </div>
              <Progress value={emotion.percentage} className="h-2" />
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <p className="text-sm">
            <strong>AI Insight:</strong> Your child shows healthy emotional patterns with
            predominantly positive interactions. The curiosity level indicates good engagement
            with educational content.
          </p>
        </div>
      </Card>

      {/* Learning Progress */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Learning & Development
          </h4>
          <Badge variant="default">On Track</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">127</p>
            <p className="text-sm text-gray-500">New Words Learned</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">45</p>
            <p className="text-sm text-gray-500">Questions Asked</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-green-600">23</p>
            <p className="text-sm text-gray-500">Stories Completed</p>
          </div>
        </div>
      </Card>

      {/* Recommendations */}
      <Card className="p-6">
        <h4 className="text-md font-semibold mb-4">Personalized Recommendations</h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Encourage more educational content</p>
              <p className="text-sm text-gray-600">
                Your child responds well to learning activities. Consider enabling more educational games.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Adjust weekend time limits</p>
              <p className="text-sm text-gray-600">
                Weekend usage is higher than weekdays. Consider setting specific weekend limits.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
