"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Clock,
  Filter,
  Bell,
  Plus,
  X,
  Save,
  AlertCircle,
} from "lucide-react";

interface SafetyControlsProps {
  childId: string;
}

interface TimeRestriction {
  id: string;
  dayType: "weekday" | "weekend";
  startTime: string;
  endTime: string;
}

export function SafetyControls({ childId }: SafetyControlsProps) {
  // Content Filtering State
  const [strictnessLevel, setStrictnessLevel] = useState<"low" | "medium" | "high">("medium");
  const [blockedTopics, setBlockedTopics] = useState<string[]>([
    "violence",
    "inappropriate content",
    "scary stories",
  ]);
  const [allowedTopics, setAllowedTopics] = useState<string[]>([
    "education",
    "creativity",
    "friendship",
    "nature",
  ]);
  const [newBlockedTopic, setNewBlockedTopic] = useState("");
  const [newAllowedTopic, setNewAllowedTopic] = useState("");

  // Time Controls State
  const [dailyLimit, setDailyLimit] = useState([90]); // minutes
  const [timeRestrictions, setTimeRestrictions] = useState<TimeRestriction[]>([
    { id: "1", dayType: "weekday", startTime: "07:00", endTime: "20:00" },
    { id: "2", dayType: "weekend", startTime: "08:00", endTime: "21:00" },
  ]);
  const [schoolDayRules, setSchoolDayRules] = useState(true);
  const [weekendRules, setWeekendRules] = useState(true);

  // Notification Preferences
  const [realTimeAlerts, setRealTimeAlerts] = useState(true);
  const [dailySummary, setDailySummary] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [severityThreshold, setSeverityThreshold] = useState<"all" | "medium" | "high">("medium");

  const handleAddBlockedTopic = () => {
    if (newBlockedTopic.trim()) {
      setBlockedTopics([...blockedTopics, newBlockedTopic.trim()]);
      setNewBlockedTopic("");
    }
  };

  const handleAddAllowedTopic = () => {
    if (newAllowedTopic.trim()) {
      setAllowedTopics([...allowedTopics, newAllowedTopic.trim()]);
      setNewAllowedTopic("");
    }
  };

  const handleRemoveBlockedTopic = (topic: string) => {
    setBlockedTopics(blockedTopics.filter(t => t !== topic));
  };

  const handleRemoveAllowedTopic = (topic: string) => {
    setAllowedTopics(allowedTopics.filter(t => t !== topic));
  };

  const handleSaveSettings = () => {
    console.log("Saving safety settings:", {
      contentFilters: { strictnessLevel, blockedTopics, allowedTopics },
      timeControls: { dailyLimit: dailyLimit[0], timeRestrictions, schoolDayRules, weekendRules },
      notifications: { realTimeAlerts, dailySummary, weeklyReport, severityThreshold },
    });
    // In production, this would save to Convex
  };

  return (
    <div className="space-y-6">
      {/* Content Filtering */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Content Filtering</h3>
        </div>

        <div className="space-y-6">
          {/* Strictness Level */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Content Filter Strictness
            </Label>
            <Select value={strictnessLevel} onValueChange={(value: any) => setStrictnessLevel(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div>
                    <p className="font-medium">Low</p>
                    <p className="text-sm text-gray-500">Basic filtering for obvious inappropriate content</p>
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div>
                    <p className="font-medium">Medium</p>
                    <p className="text-sm text-gray-500">Balanced filtering for age-appropriate content</p>
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div>
                    <p className="font-medium">High</p>
                    <p className="text-sm text-gray-500">Strict filtering with maximum protection</p>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Blocked Topics */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Blocked Topics
            </Label>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Add blocked topic..."
                value={newBlockedTopic}
                onChange={(e) => setNewBlockedTopic(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddBlockedTopic()}
              />
              <Button onClick={handleAddBlockedTopic} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {blockedTopics.map((topic) => (
                <Badge key={topic} variant="destructive" className="gap-1">
                  {topic}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => handleRemoveBlockedTopic(topic)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Allowed Topics */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Encouraged Topics
            </Label>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Add encouraged topic..."
                value={newAllowedTopic}
                onChange={(e) => setNewAllowedTopic(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddAllowedTopic()}
              />
              <Button onClick={handleAddAllowedTopic} size="sm" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allowedTopics.map((topic) => (
                <Badge key={topic} variant="secondary" className="gap-1">
                  {topic}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => handleRemoveAllowedTopic(topic)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Time Controls */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold">Time Controls</h3>
        </div>

        <div className="space-y-6">
          {/* Daily Limit */}
          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-sm font-medium">Daily Usage Limit</Label>
              <span className="text-sm font-medium">{dailyLimit[0]} minutes</span>
            </div>
            <Slider
              value={dailyLimit}
              onValueChange={setDailyLimit}
              min={30}
              max={240}
              step={15}
              className="w-full"
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>30 min</span>
              <span>4 hours</span>
            </div>
          </div>

          {/* School Day Rules */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="school-rules" className="text-sm font-medium">
                School Day Restrictions
              </Label>
              <p className="text-sm text-gray-500">
                Limit access during school hours on weekdays
              </p>
            </div>
            <Switch
              id="school-rules"
              checked={schoolDayRules}
              onCheckedChange={setSchoolDayRules}
            />
          </div>

          {/* Weekend Rules */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="weekend-rules" className="text-sm font-medium">
                Weekend Extended Hours
              </Label>
              <p className="text-sm text-gray-500">
                Allow extra time on weekends
              </p>
            </div>
            <Switch
              id="weekend-rules"
              checked={weekendRules}
              onCheckedChange={setWeekendRules}
            />
          </div>

          {/* Time Restrictions */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Allowed Hours
            </Label>
            <div className="space-y-2">
              {timeRestrictions.map((restriction) => (
                <div key={restriction.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                  <Badge variant="outline">
                    {restriction.dayType === "weekday" ? "Weekdays" : "Weekends"}
                  </Badge>
                  <span className="text-sm">
                    {restriction.startTime} - {restriction.endTime}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Notification Preferences</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="real-time" className="text-sm font-medium">
                Real-time Alerts
              </Label>
              <p className="text-sm text-gray-500">
                Get instant notifications for safety concerns
              </p>
            </div>
            <Switch
              id="real-time"
              checked={realTimeAlerts}
              onCheckedChange={setRealTimeAlerts}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="daily-summary" className="text-sm font-medium">
                Daily Summary
              </Label>
              <p className="text-sm text-gray-500">
                Receive a daily report of your child's activity
              </p>
            </div>
            <Switch
              id="daily-summary"
              checked={dailySummary}
              onCheckedChange={setDailySummary}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="weekly-report" className="text-sm font-medium">
                Weekly Report
              </Label>
              <p className="text-sm text-gray-500">
                Get detailed weekly analytics and insights
              </p>
            </div>
            <Switch
              id="weekly-report"
              checked={weeklyReport}
              onCheckedChange={setWeeklyReport}
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">
              Alert Severity Threshold
            </Label>
            <Select value={severityThreshold} onValueChange={(value: any) => setSeverityThreshold(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Alerts</SelectItem>
                <SelectItem value="medium">Medium & High Priority</SelectItem>
                <SelectItem value="high">High Priority Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">Reset to Defaults</Button>
        <Button onClick={handleSaveSettings} className="gap-2">
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
      </div>

      {/* Info Box */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          These settings apply to all toys assigned to this child. Changes take effect immediately.
        </AlertDescription>
      </Alert>
    </div>
  );
}
