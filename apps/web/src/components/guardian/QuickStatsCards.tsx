'use client';

import { Card } from '@pommai/ui';
import { Clock, Shield, MessageSquare } from 'lucide-react';

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  assignedToys: string[];
  dailyLimit: number;
  currentUsage: number;
  avatar?: string;
}

interface QuickStatsCardsProps {
  selectedChild: ChildProfile;
}

export function QuickStatsCards({ selectedChild }: QuickStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card
        bg="#ffffff"
        borderColor="black"
        shadowColor="#92cd41"
        className="p-4 sm:p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-gray-700">Today's Activity</p>
            <p className="text-2xl font-black text-black">{selectedChild.currentUsage} min</p>
          </div>
          <Clock className="w-8 h-8 text-blue-500" />
        </div>
      </Card>
      
      <Card
        bg="#ffffff"
        borderColor="black"
        shadowColor="#f7931e"
        className="p-4 sm:p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-gray-700">Safety Score</p>
            <p className="text-2xl font-black text-black">98%</p>
          </div>
          <Shield className="w-8 h-8 text-green-500" />
        </div>
      </Card>
      
      <Card
        bg="#ffffff"
        borderColor="black"
        shadowColor="#c381b5"
        className="p-4 sm:p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-gray-700">Messages Today</p>
            <p className="text-2xl font-black text-black">127</p>
          </div>
          <MessageSquare className="w-8 h-8 text-purple-500" />
        </div>
      </Card>
    </div>
  );
}