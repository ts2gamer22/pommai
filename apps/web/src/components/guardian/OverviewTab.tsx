'use client';

import { Card, Button } from '@pommai/ui';
import { AlertTriangle, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { QuickStatsCards } from './QuickStatsCards';

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  assignedToys: string[];
  dailyLimit: number;
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

interface OverviewTabProps {
  selectedChild: ChildProfile;
  childAlerts: SafetyAlert[];
  onResolveAlert: (alertId: string) => void;
}

export function OverviewTab({ 
  selectedChild, 
  childAlerts, 
  onResolveAlert 
}: OverviewTabProps) {
  return (
    <div className="space-y-4">
      {/* Recent Alerts */}
      <Card
        bg="#ffffff"
        borderColor="black"
        shadowColor="#c381b5"
        className="p-4 sm:p-6"
      >
        <h3 className="text-lg font-black mb-4 uppercase tracking-wider text-black flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          ⚠️ Recent Safety Alerts
        </h3>
        <div className="space-y-3">
          {childAlerts.length === 0 ? (
            <p className="text-gray-500 text-center py-8 font-bold uppercase tracking-wide">
              No safety alerts for {selectedChild.name}
            </p>
          ) : (
            childAlerts.map((alert) => (
              <Card
                key={alert.id}
                bg={alert.resolved
                  ? "#f8f8f8"
                  : alert.severity === "high"
                  ? "#ffe4e1"
                  : alert.severity === "medium"
                  ? "#fff3cd"
                  : "#e1f5fe"}
                borderColor={alert.resolved
                  ? "gray"
                  : alert.severity === "high"
                  ? "red"
                  : alert.severity === "medium"
                  ? "orange"
                  : "blue"}
                shadowColor={alert.resolved
                  ? "#d0d0d0"
                  : alert.severity === "high"
                  ? "#ff6b6b"
                  : alert.severity === "medium"
                  ? "#f7931e"
                  : "#92cd41"}
                className="p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {alert.resolved ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    ) : alert.severity === "high" ? (
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    ) : alert.severity === "medium" ? (
                      <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-black">{alert.message}</p>
                      <p className="text-sm text-gray-500 mt-1 font-bold uppercase tracking-wide">
                        {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {!alert.resolved && (
                    <Button
                      bg="#92cd41"
                      textColor="white"
                      borderColor="black"
                      shadow="#76a83a"
                      onClick={() => onResolveAlert(alert.id)}
                      className="py-1 px-3 font-bold uppercase tracking-wider hover-lift"
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>

      {/* Quick Stats */}
      <QuickStatsCards selectedChild={selectedChild} />
    </div>
  );
}