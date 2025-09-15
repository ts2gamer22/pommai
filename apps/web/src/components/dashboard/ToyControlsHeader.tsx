'use client';

import type { ChangeEvent } from 'react';
import { Button, Input } from '@pommai/ui';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@pommai/ui';
import { 
  Grid3X3,
  List,
  Plus,
  Filter
} from 'lucide-react';

interface ToyControlsHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterStatus: 'all' | 'active' | 'paused' | 'archived';
  onFilterChange: (status: 'all' | 'active' | 'paused' | 'archived') => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onCreateToy?: () => void;
}

export function ToyControlsHeader({ 
  searchQuery, 
  onSearchChange, 
  filterStatus, 
  onFilterChange,
  viewMode,
  onViewModeChange,
  onCreateToy 
}: ToyControlsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
      <div className="flex-1 max-w-md">
        <Input
          placeholder="🔍 Search toys..."
          value={searchQuery}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
          bg="#ffffff"
          borderColor="black"
          className="font-geo font-medium"
        />
      </div>
      
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              bg="#ffffff"
              textColor="black"
              borderColor="black"
              shadow="#e0e0e0"
              className="py-2 px-4 font-minecraft font-black uppercase tracking-wider hover-lift text-xs sm:text-sm"
            >
              <span className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                {filterStatus === 'all' ? 'All' : filterStatus}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <button 
              onClick={() => onFilterChange('all')}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 font-minecraft font-black uppercase tracking-wider text-xs"
            >
              All
            </button>
            <button 
              onClick={() => onFilterChange('active')}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 font-minecraft font-black uppercase tracking-wider text-xs"
            >
              Active
            </button>
            <button 
              onClick={() => onFilterChange('paused')}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 font-minecraft font-black uppercase tracking-wider text-xs"
            >
              Paused
            </button>
            <button 
              onClick={() => onFilterChange('archived')}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 font-minecraft font-black uppercase tracking-wider text-xs"
            >
              Archived
            </button>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex gap-1">
          <Button
            bg={viewMode === 'grid' ? "#c381b5" : "#ffffff"}
            textColor={viewMode === 'grid' ? "white" : "black"}
            borderColor="black"
            shadow={viewMode === 'grid' ? "#8b5fa3" : "#e0e0e0"}
            onClick={() => onViewModeChange('grid')}
            className="py-2 px-3 font-minecraft font-black hover-lift text-xs"
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            bg={viewMode === 'list' ? "#c381b5" : "#ffffff"}
            textColor={viewMode === 'list' ? "white" : "black"}
            borderColor="black"
            shadow={viewMode === 'list' ? "#8b5fa3" : "#e0e0e0"}
            onClick={() => onViewModeChange('list')}
            className="py-2 px-3 font-minecraft font-black hover-lift text-xs"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>

        <Button 
          bg="#92cd41"
          textColor="white"
          borderColor="black"
          shadow="#76a83a"
          onClick={onCreateToy} 
          className="py-2 px-4 font-minecraft font-black uppercase tracking-wider hover-lift text-xs sm:text-sm"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Toy</span>
          </span>
        </Button>
      </div>
    </div>
  );
}