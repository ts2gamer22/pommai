"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Shield,
  Users,
  AlertTriangle,
  Activity,
  Clock,
  PauseCircle,
  PlayCircle,
  Settings,
  BarChart3,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SafetyControls } from "./SafetyControls";
import { LiveMonitoring } from "./LiveMonitoring";
import { SafetyAnalytics } from "./SafetyAnalytics";

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
  const children: ChildProfile[] = [
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

  const pauseAllToys = () => {
    console.log("All toys paused");
    // In production, this would pause all toys
  };

  const resolveAlert = (alertId: string) => {
    console.log("Resolving alert:", alertId);
    // In production, this would mark the alert as resolved
  };

  const selectedChild = children.find(c => c.id === selectedChildId) || children[0];
  const activeAlerts = safetyAlerts.filter(a => !a.resolved);
  const childAlerts = safetyAlerts.filter(a => a.childId === selectedChild.id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Guardian Dashboard</h1>
              <p className="text-gray-600">Monitor and protect your children's AI interactions</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="lg"
              onClick={emergencyStop}
              className="gap-2"
            >
              <PauseCircle className="w-5 h-5" />
              Emergency Stop
            </Button>
          </div>
        </div>

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Active Safety Alerts</AlertTitle>
            <AlertDescription>
              You have {activeAlerts.length} unresolved safety alerts that require your attention.
            </AlertDescription>
          </Alert>
        )}

        {/* Child Profiles */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Children
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <Card
                key={child.id}
                className={`p-4 cursor-pointer transition-all ${
                  selectedChild.id === child.id
                    ? "border-2 border-blue-500 bg-blue-50 dark:bg-blue-950"
                    : "hover:border-gray-300"
                }`}
                onClick={() => setSelectedChildId(child.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{child.avatar}</div>
                    <div>
                      <h3 className="font-semibold">{child.name}</h3>
                      <p className="text-sm text-gray-500">{child.age} years old</p>
                    </div>
                  </div>
                  {selectedChild.id === child.id && (
                    <Badge variant="default">Selected</Badge>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Daily Usage</span>
                      <span>{child.currentUsage} / {child.dailyLimit} min</span>
                    </div>
                    <Progress
                      value={(child.currentUsage / child.dailyLimit) * 100}
                      className="h-2"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Active Toys</span>
                    <Badge variant="secondary">{child.assignedToys.length}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Alerts</span>
                    <Badge 
                      variant={childAlerts.some(a => !a.resolved) ? "destructive" : "secondary"}
                    >
                      {childAlerts.filter(a => !a.resolved).length}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
            <TabsTrigger value="controls">Safety Controls</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Recent Alerts */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Recent Safety Alerts
              </h3>
              <div className="space-y-3">
                {childAlerts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No safety alerts for {selectedChild.name}
                  </p>
                ) : (
                  childAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border ${
                        alert.resolved
                          ? "bg-gray-50 border-gray-200"
                          : alert.severity === "high"
                          ? "bg-red-50 border-red-200"
                          : alert.severity === "medium"
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {alert.resolved ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                          ) : alert.severity === "high" ? (
                            <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                          ) : alert.severity === "medium" ? (
                            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{alert.message}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        {!alert.resolved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Today's Activity</p>
                    <p className="text-2xl font-bold">{selectedChild.currentUsage} min</p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-500" />
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Safety Score</p>
                    <p className="text-2xl font-bold">98%</p>
                  </div>
                  <Shield className="w-8 h-8 text-green-500" />
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Messages Today</p>
                    <p className="text-2xl font-bold">127</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-purple-500" />
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="monitoring">
            <LiveMonitoring childId={selectedChild.id} />
          </TabsContent>

          <TabsContent value="controls">
            <SafetyControls childId={selectedChild.id} />
          </TabsContent>

          <TabsContent value="analytics">
            <SafetyAnalytics childId={selectedChild.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
