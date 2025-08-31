'use client';

import { Button } from '@pommai/ui';
import { Shield, PauseCircle } from 'lucide-react';

interface GuardianHeaderProps {
  onEmergencyStop: () => void;
}

export function GuardianHeader({ onEmergencyStop }: GuardianHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-[#c381b5]" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-black"
            style={{
              textShadow: '2px 2px 0 #c381b5'
            }}
          >
            🛡️ Guardian Dashboard
          </h1>
          <p className="font-bold text-gray-700 uppercase tracking-wide">
            Monitor and protect your children's AI interactions
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          bg="#ff6b6b"
          textColor="white"
          borderColor="black"
          shadow="#e84545"
          onClick={onEmergencyStop}
          className="py-3 px-4 sm:px-6 font-black uppercase tracking-wider hover-lift text-sm sm:text-base"
        >
          <span className="flex items-center gap-2">
            <PauseCircle className="w-5 h-5" />
            <span className="hidden sm:inline">Emergency Stop</span>
            <span className="sm:hidden">Stop</span>
          </span>
        </Button>
      </div>
    </div>
  );
}