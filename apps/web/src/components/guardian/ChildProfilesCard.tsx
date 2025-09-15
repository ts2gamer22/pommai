'use client';

import { useState } from 'react';
import { Card, ProgressBar, Button } from '@pommai/ui';
import { Users, Plus } from 'lucide-react';
import { CreateChildDialog } from './CreateChildDialog';

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  assignedToys: string[];
  dailyLimit: number; // minutes
  currentUsage: number;
  avatar?: string;
}

interface ChildProfilesCardProps {
  profiles: ChildProfile[];
  selectedChildId: string | null;
  onChildSelect: (childId: string) => void;
}

export function ChildProfilesCard({ 
  profiles, 
  selectedChildId, 
  onChildSelect 
}: ChildProfilesCardProps) {
  const [showCreate, setShowCreate] = useState(false);
  const selectedChild = profiles.find(c => c.id === selectedChildId) || profiles[0];

  return (
    <Card 
      bg="#ffffff" 
      borderColor="black" 
      shadowColor="#c381b5"
      className="p-4 sm:p-6 hover-lift transition-transform"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black uppercase tracking-wider text-black flex items-center gap-2">
          <Users className="w-5 h-5" />
          👨‍👩‍👧‍👦 Your Children
        </h2>
        <Button
          bg="#92cd41"
          textColor="white"
          borderColor="black"
          shadow="#76a83a"
          onClick={() => setShowCreate(true)}
          className="py-2 px-3 font-black uppercase tracking-wider hover-lift text-xs sm:text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Child
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((child) => (
          <Card
            key={child.id}
            bg={selectedChild?.id === child.id ? "#c381b5" : "#ffffff"}
            borderColor="black"
            shadowColor={selectedChild?.id === child.id ? "#8b5fa3" : "#e0e0e0"}
            className={`p-4 cursor-pointer transition-all hover-lift ${
              selectedChild?.id === child.id ? 'text-white' : 'text-black'
            }`}
            onClick={() => onChildSelect(child.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{child.avatar}</div>
                <div>
                  <h3 className="font-black uppercase tracking-wider">{child.name}</h3>
                  <p className={`text-sm font-bold uppercase tracking-wide ${
                    selectedChild?.id === child.id ? 'text-white opacity-90' : 'text-gray-600'
                  }`}>
                    {child.age} years old
                  </p>
                </div>
              </div>
              {selectedChild?.id === child.id && (
                <span className="px-2 py-1 text-xs font-black uppercase tracking-wider border-2 border-white bg-[#92cd41] text-white">
                  Selected
                </span>
              )}
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="uppercase tracking-wider">Daily Usage</span>
                  <span className="uppercase tracking-wider">{child.currentUsage} / {child.dailyLimit} min</span>
                </div>
                <ProgressBar
                  progress={(child.currentUsage / child.dailyLimit) * 100}
                  color={selectedChild?.id === child.id ? "#92cd41" : "#c381b5"}
                  borderColor="black"
                  className="shadow-[0_2px_0_2px_rgba(0,0,0,0.3)]"
                />
              </div>
              
              <div className="flex items-center justify-between text-sm font-bold">
                <span className={`uppercase tracking-wider ${
                  selectedChild?.id === child.id ? 'text-white' : 'text-gray-700'
                }`}>
                  🧸 {child.assignedToys.length} toy{child.assignedToys.length !== 1 ? 's' : ''}
                </span>
                <span className={`text-xs uppercase tracking-wider ${
                  selectedChild?.id === child.id ? 'text-white opacity-90' : 'text-gray-500'
                }`}>
                  Active
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Child Dialog */}
      <CreateChildDialog
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(id) => {
          onChildSelect(id);
          setShowCreate(false);
        }}
      />
    </Card>
  );
}
