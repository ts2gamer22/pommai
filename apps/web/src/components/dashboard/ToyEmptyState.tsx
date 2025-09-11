'use client';

import { Button } from '@pommai/ui';
import { Plus } from 'lucide-react';

interface ToyEmptyStateProps {
  onCreateToy?: () => void;
}

export function ToyEmptyState({ onCreateToy }: ToyEmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="inline-block relative mb-8">
        <span className="text-9xl animate-bounce inline-block">🧸</span>
        <span className="absolute -top-2 -right-2 text-4xl animate-spin" style={{ animationDuration: '3s' }}>✨</span>
      </div>
      <h3 className="text-3xl font-black mb-4 uppercase tracking-wider text-black"
        style={{
          textShadow: '2px 2px 0 #c381b5'
        }}
      >
        No Toys Yet!
      </h3>
      <p className="text-xl font-bold text-gray-700 mb-8 uppercase tracking-wide">Let&apos;s create your first AI companion</p>
      <Button 
        bg="#92cd41"
        textColor="white"
        borderColor="black"
        shadow="#76a83a"
        onClick={onCreateToy}
        className="py-3 px-6 font-black uppercase tracking-wider hover-lift text-lg"
      >
        <span className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create My First Toy
        </span>
      </Button>
    </div>
  );
}