"use client";

import { useState } from "react";
import { Card, Button } from "@pommai/ui";
import { SafetyControls } from "./SafetyControls";
import { LiveMonitoring } from "./LiveMonitoring";
import { SafetyAnalytics } from "./SafetyAnalytics";
import { GuardianHeader } from "./GuardianHeader";
import { ActiveAlertsCard } from "./ActiveAlertsCard";
import { ChildProfilesCard } from "./ChildProfilesCard";
import { OverviewTab } from "./OverviewTab";

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  assignedToys: string[];
  dailyLimit: number; // minutes
  currentUsage: number;
  avatar?: string;
}

interface SafetyAlert {
  id: string;
  severity: "low" | "medium" | "high";
  type: "content" | "usage" | "behavior";
  message: string;
  timestamp: Date;
  resolved: boolean;
  childId: string;
  toyId: string;
}

export function GuardianDashboard() {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data - in production, these would come from Convex queries
  const childrenProfiles: ChildProfile[] = [
    {
      id: "child-1",
      name: "Emma",
      age: 7,
      assignedToys: ["toy-1", "toy-2"],
      dailyLimit: 120,
      currentUsage: 45,
      avatar: "🧒",
    },
    {
      id: "child-2",
      name: "Liam",
      age: 5,
      assignedToys: ["toy-3"],
      dailyLimit: 90,
      currentUsage: 30,
      avatar: "👦",
    },
  ];

  const safetyAlerts: SafetyAlert[] = [
    {
      id: "alert-1",
      severity: "low",
      type: "usage",
      message: "Emma has been chatting for 45 minutes today",
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 min ago
      resolved: false,
      childId: "child-1",
      toyId: "toy-1",
    },
    {
      id: "alert-2",
      severity: "medium",
      type: "content",
      message: "Blocked attempt to discuss inappropriate topic",
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      resolved: true,
      childId: "child-2",
      toyId: "toy-3",
    },
  ];

  // Mock mutations
  const emergencyStop = () => {
    console.log("Emergency stop activated");
    // In production, this would pause all toys
  };

  const resolveAlert = (alertId: string) => {
    console.log("Resolving alert:", alertId);
    // In production, this would mark the alert as resolved
  };

  const selectedChild = childrenProfiles.find(c => c.id === selectedChildId) || childrenProfiles[0];
  const activeAlerts = safetyAlerts.filter(a => !a.resolved);
  const childAlerts = safetyAlerts.filter(a => a.childId === selectedChild.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fefcd0] to-[#f4e5d3]">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <GuardianHeader onEmergencyStop={emergencyStop} />

        {/* Active Alerts */}
        <ActiveAlertsCard activeAlerts={activeAlerts} />

        {/* Child Profiles */}
          <ChildProfilesCard 
          profiles={childrenProfiles}
          selectedChildId={selectedChildId}
          onChildSelect={setSelectedChildId}
        />

        {/* Main Content Tabs */}
        <div className="space-y-4">
          {/* Tab Navigation */}
          <Card
            bg="#ffffff"
            borderColor="black"
            shadowColor="#c381b5"
            className="p-2"
          >
            <div className="grid grid-cols-4 gap-2">
              <Button
                bg={activeTab === "overview" ? "#c381b5" : "#f0f0f0"}
                textColor={activeTab === "overview" ? "white" : "black"}
                borderColor="black"
                shadow={activeTab === "overview" ? "#8b5fa3" : "#d0d0d0"}
                onClick={() => setActiveTab("overview")}
                className="py-2 px-4 font-minecraft font-black uppercase tracking-wider hover-lift text-xs sm:text-sm"
              >
                Overview
              </Button>
              <Button
                bg={activeTab === "monitoring" ? "#c381b5" : "#f0f0f0"}
                textColor={activeTab === "monitoring" ? "white" : "black"}
                borderColor="black"
                shadow={activeTab === "monitoring" ? "#8b5fa3" : "#d0d0d0"}
                onClick={() => setActiveTab("monitoring")}
                className="py-2 px-4 font-minecraft font-black uppercase tracking-wider hover-lift text-xs sm:text-sm"
              >
                Live Monitoring
              </Button>
              <Button
                bg={activeTab === "controls" ? "#c381b5" : "#f0f0f0"}
                textColor={activeTab === "controls" ? "white" : "black"}
                borderColor="black"
                shadow={activeTab === "controls" ? "#8b5fa3" : "#d0d0d0"}
                onClick={() => setActiveTab("controls")}
                className="py-2 px-4 font-minecraft font-black uppercase tracking-wider hover-lift text-xs sm:text-sm"
              >
                Safety Controls
              </Button>
              <Button
                bg={activeTab === "analytics" ? "#c381b5" : "#f0f0f0"}
                textColor={activeTab === "analytics" ? "white" : "black"}
                borderColor="black"
                shadow={activeTab === "analytics" ? "#8b5fa3" : "#d0d0d0"}
                onClick={() => setActiveTab("analytics")}
                className="py-2 px-4 font-minecraft font-black uppercase tracking-wider hover-lift text-xs sm:text-sm"
              >
                Analytics
              </Button>
            </div>
          </Card>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <OverviewTab 
              selectedChild={selectedChild}
              childAlerts={childAlerts}
              onResolveAlert={resolveAlert}
            />
          )}

          {activeTab === "monitoring" && (
            <LiveMonitoring childId={selectedChild.id} />
          )}

          {activeTab === "controls" && (
            <SafetyControls childId={selectedChild.id} />
          )}

          {activeTab === "analytics" && (
            <SafetyAnalytics childId={selectedChild.id} />
          )}
        </div>
      </div>
    </div>
  );
}
