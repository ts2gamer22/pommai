"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
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
  // Fetch real children
  const children = useQuery(api.children.listChildren, {});

  // Map to UI-friendly profile model
  const childrenProfiles: ChildProfile[] = useMemo(() => {
    return (children || []).map((c: any): ChildProfile => {
      const ageYears = (() => {
        try {
          const bd = new Date(c.birthDate);
          const diff = Date.now() - bd.getTime();
          const ageDate = new Date(diff);
          return Math.abs(ageDate.getUTCFullYear() - 1970);
        } catch {
          return 0;
        }
      })();
      const dailyLimit = c.settings?.dailyTimeLimit ?? c.guardianControls?.timeControls?.dailyLimit ?? 90;
      return {
        id: c._id,
        name: c.name,
        age: ageYears,
        assignedToys: [], // TODO: enhance with real assignments if needed
        dailyLimit,
        currentUsage: 0, // TODO: compute from today conversations duration
        avatar: c.avatar || "🧒",
      };
    });
  }, [children]);

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Initialize selected child after loading
  useEffect(() => {
    if (!selectedChildId && childrenProfiles.length > 0) {
      setSelectedChildId(childrenProfiles[0].id);
    }
  }, [childrenProfiles, selectedChildId]);

  // Alerts from Convex
  const alertsRaw = useQuery(api.alerts.getActiveAlerts, { includeResolved: true });
  const resolveAlertMutation = useMutation(api.alerts.resolveAlert);
  const emergencyStopMutation = useMutation(api.toys.emergencyStopAllToys as any);

  const safetyAlerts: SafetyAlert[] = useMemo(() => {
    return (alertsRaw || []).map((a: any) => ({
      id: a.messageId,
      severity: (a.severity || "low") as any,
      type: "content",
      message: a.content,
      timestamp: new Date(a.timestamp || Date.now()),
      resolved: !!a.resolved,
      childId: (a.childId || "") as string,
      toyId: a.toyId as string,
    }));
  }, [alertsRaw]);

  // Use useMemo to prevent recalculation on every render
  const selectedChild = useMemo(() => {
    return childrenProfiles.find((c) => c.id === selectedChildId) || childrenProfiles[0];
  }, [childrenProfiles, selectedChildId]);

  const activeAlerts = useMemo(() => {
    return safetyAlerts.filter((a) => !a.resolved);
  }, [safetyAlerts]);

  const childAlerts = useMemo(() => {
    return safetyAlerts.filter((a) => a.childId === selectedChild?.id);
  }, [safetyAlerts, selectedChild]);

  const onEmergencyStop = async () => {
    try {
      if (!selectedChild?.id) return;
      await emergencyStopMutation({ childId: selectedChild.id as Id<"children"> } as any);
      console.log("Emergency stop activated for child:", selectedChild.id);
    } catch (e) {
      console.error("Emergency stop failed", e);
    }
  };

  const onResolveAlert = async (alertId: string) => {
    try {
      // alertId corresponds to messageId
      await resolveAlertMutation({ messageId: alertId as Id<"messages"> });
    } catch (e) {
      console.error("Failed to resolve alert", e);
    }
  };

  const isLoadingChildren = children === undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fefcd0] to-[#f4e5d3]">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <GuardianHeader onEmergencyStop={onEmergencyStop} />

        {/* Active Alerts */}
        <ActiveAlertsCard activeAlerts={activeAlerts} />

        {/* Child Profiles */}
        {isLoadingChildren ? (
          <Card bg="#ffffff" borderColor="black" shadowColor="#c381b5" className="p-6">
            <p className="font-bold uppercase tracking-wide text-gray-600">Loading children...</p>
          </Card>
        ) : (
          <ChildProfilesCard
            profiles={childrenProfiles}
            selectedChildId={selectedChildId}
            onChildSelect={setSelectedChildId}
          />
        )}

        {/* Main Content Tabs */}
        <div className="space-y-4">
          {/* Tab Navigation */}
          <Card bg="#ffffff" borderColor="black" shadowColor="#c381b5" className="p-2">
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
          {activeTab === "overview" && selectedChild && (
            <OverviewTab selectedChild={selectedChild} childAlerts={childAlerts} onResolveAlert={onResolveAlert} />
          )}

          {activeTab === "monitoring" && selectedChild && <LiveMonitoring childId={selectedChild.id} />}

          {activeTab === "controls" && selectedChild && <SafetyControls childId={selectedChild.id} />}

          {activeTab === "analytics" && selectedChild && <SafetyAnalytics childId={selectedChild.id} />}
        </div>
      </div>
    </div>
  );
}
