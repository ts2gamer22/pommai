"use client";

import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { Card, Button, Input } from "@pommai/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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
      <Card 
        bg="#ffffff"
        borderColor="black"
        shadowColor="#c381b5"
        className="p-4 sm:p-6 hover-lift"
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-blue-600" />
          <h3 className="retro-h3 text-base sm:text-lg text-black">
            🔎 Content Filtering
          </h3>
        </div>

        <div className="space-y-6">
          {/* Strictness Level */}
          <div>
            <label className="block text-sm font-black uppercase tracking-wider text-black mb-2">
              Content Filter Strictness
            </label>
            <Select value={strictnessLevel} onValueChange={(value) => setStrictnessLevel(value as "low" | "medium" | "high")}>
              <SelectTrigger className="w-full border-2 border-black font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div>
                    <p className="font-bold text-black">Low</p>
                    <p className="text-sm text-gray-500">Basic filtering for obvious inappropriate content</p>
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div>
                    <p className="font-bold text-black">Medium</p>
                    <p className="text-sm text-gray-500">Balanced filtering for age-appropriate content</p>
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div>
                    <p className="font-bold text-black">High</p>
                    <p className="text-sm text-gray-500">Strict filtering with maximum protection</p>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Blocked Topics */}
          <div>
            <label className="block text-sm font-black uppercase tracking-wider text-black mb-2">
              🚫 Blocked Topics
            </label>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Add blocked topic..."
                value={newBlockedTopic}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewBlockedTopic(e.target.value)}
                onKeyPress={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleAddBlockedTopic()}
                bg="#ffffff"
                borderColor="black"
                className="font-bold flex-1"
              />
              <Button
                bg={newBlockedTopic.trim() ? "#ff6b6b" : "#f0f0f0"}
                textColor={newBlockedTopic.trim() ? "white" : "#999"}
                borderColor="black"
                shadow={newBlockedTopic.trim() ? "#e84545" : "#d0d0d0"}
                onClick={handleAddBlockedTopic}
                disabled={!newBlockedTopic.trim()}
                className={`py-2 px-3 font-bold ${newBlockedTopic.trim() ? 'hover-lift' : 'cursor-not-allowed'}`}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {blockedTopics.map((topic) => (
                <span key={topic} className="px-2 py-1 text-xs font-black uppercase tracking-wider border-2 border-red-600 bg-red-100 text-red-800 flex items-center gap-2">
                  {topic}
                  <button
                    onClick={() => handleRemoveBlockedTopic(topic)}
                    className="hover:text-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Allowed Topics */}
          <div>
            <label className="block text-sm font-black uppercase tracking-wider text-black mb-2">
              ✅ Encouraged Topics
            </label>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Add encouraged topic..."
                value={newAllowedTopic}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewAllowedTopic(e.target.value)}
                onKeyPress={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleAddAllowedTopic()}
                bg="#ffffff"
                borderColor="black"
                className="font-bold flex-1"
              />
              <Button
                bg={newAllowedTopic.trim() ? "#92cd41" : "#f0f0f0"}
                textColor={newAllowedTopic.trim() ? "white" : "#999"}
                borderColor="black"
                shadow={newAllowedTopic.trim() ? "#76a83a" : "#d0d0d0"}
                onClick={handleAddAllowedTopic}
                disabled={!newAllowedTopic.trim()}
                className={`py-2 px-3 font-bold ${newAllowedTopic.trim() ? 'hover-lift' : 'cursor-not-allowed'}`}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allowedTopics.map((topic) => (
                <span key={topic} className="px-2 py-1 text-xs font-black uppercase tracking-wider border-2 border-green-600 bg-green-100 text-green-800 flex items-center gap-2">
                  {topic}
                  <button
                    onClick={() => handleRemoveAllowedTopic(topic)}
                    className="hover:text-green-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Time Controls */}
      <Card 
        bg="#ffffff"
        borderColor="black"
        shadowColor="#92cd41"
        className="p-4 sm:p-6 hover-lift"
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-green-600" />
          <h3 className="retro-h3 text-base sm:text-lg text-black retro-shadow-green">
            ⏰ Time Controls
          </h3>
        </div>

        <div className="space-y-6">
          {/* Daily Limit */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-black uppercase tracking-wider text-black">Daily Usage Limit</label>
              <span className="text-sm font-black text-black">{dailyLimit[0]} minutes</span>
            </div>
            <Slider
              value={dailyLimit}
              onValueChange={setDailyLimit}
              min={30}
              max={240}
              step={15}
              className="w-full"
            />
            <div className="flex justify-between mt-1 text-xs font-bold uppercase tracking-wide text-gray-500">
              <span>30 min</span>
              <span>4 hours</span>
            </div>
          </div>

          {/* School Day Rules */}
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="school-rules" className="text-sm font-black uppercase tracking-wider text-black">
                🏫 School Day Restrictions
              </label>
              <p className="text-sm font-bold text-gray-600">
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
              <label htmlFor="weekend-rules" className="text-sm font-black uppercase tracking-wider text-black">
                🎉 Weekend Extended Hours
              </label>
              <p className="text-sm font-bold text-gray-600">
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
            <label className="block text-sm font-black uppercase tracking-wider text-black mb-2">
              🕰️ Allowed Hours
            </label>
            <div className="space-y-2">
              {timeRestrictions.map((restriction) => (
                <Card
                  key={restriction.id}
                  bg="#f8f8f8"
                  borderColor="black"
                  shadowColor="#e0e0e0"
                  className="flex items-center gap-2 p-3"
                >
                  <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border border-black bg-[#fefcd0] text-black">
                    {restriction.dayType === "weekday" ? "Weekdays" : "Weekends"}
                  </span>
                  <span className="text-sm font-bold text-black">
                    {restriction.startTime} - {restriction.endTime}
                  </span>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card 
        bg="#ffffff"
        borderColor="black"
        shadowColor="#f7931e"
        className="p-4 sm:p-6 hover-lift"
      >
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-purple-600" />
          <h3 className="retro-h3 text-base sm:text-lg text-black retro-shadow-orange">
            🔔 Notification Preferences
          </h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="real-time" className="text-sm font-black uppercase tracking-wider text-black">
                ⚡ Real-time Alerts
              </label>
              <p className="text-sm font-bold text-gray-600">
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
              <label htmlFor="daily-summary" className="text-sm font-black uppercase tracking-wider text-black">
                📅 Daily Summary
              </label>
              <p className="text-sm font-bold text-gray-600">
                Receive a daily report of your child&apos;s activity
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
              <label htmlFor="weekly-report" className="text-sm font-black uppercase tracking-wider text-black">
                📈 Weekly Report
              </label>
              <p className="text-sm font-bold text-gray-600">
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
            <label className="block text-sm font-black uppercase tracking-wider text-black mb-2">
              🎯 Alert Severity Threshold
            </label>
            <Select value={severityThreshold} onValueChange={(value) => setSeverityThreshold(value as "all" | "medium" | "high")}>
              <SelectTrigger className="border-2 border-black font-bold">
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
        <Button
          bg="#f0f0f0"
          textColor="black"
          borderColor="black"
          shadow="#d0d0d0"
          className="py-2 px-4 font-bold uppercase tracking-wider hover-lift"
        >
          Reset to Defaults
        </Button>
        <Button
          bg="#92cd41"
          textColor="white"
          borderColor="black"
          shadow="#76a83a"
          onClick={handleSaveSettings}
          className="py-2 px-4 font-bold uppercase tracking-wider hover-lift flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
      </div>

      {/* Info Box */}
      <Card
        bg="#e3f2fd"
        borderColor="blue"
        shadowColor="#2196f3"
        className="p-4"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <p className="text-sm font-bold text-blue-800 uppercase tracking-wide">
            ℹ️ These settings apply to all toys assigned to this child. Changes take effect immediately.
          </p>
        </div>
      </Card>
    </div>
  );
}
