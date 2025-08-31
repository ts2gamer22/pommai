'use client';

import { Card } from '@pommai/ui';
import { AlertCircle } from 'lucide-react';

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

interface ActiveAlertsCardProps {
  activeAlerts: SafetyAlert[];
}

export function ActiveAlertsCard({ activeAlerts }: ActiveAlertsCardProps) {
  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <Card
      bg="#ffe4e1"
      borderColor="red"
      shadowColor="#ff6b6b"
      className="p-4 sm:p-6 animate-pulse"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
        <div>
          <h3 className="font-black text-lg uppercase tracking-wider text-red-600 mb-2">
            ⚠️ Active Safety Alerts
          </h3>
          <p className="font-bold text-red-700 uppercase tracking-wide">
            You have {activeAlerts.length} unresolved safety alerts that require your attention.
          </p>
        </div>
      </div>
    </Card>
  );
}