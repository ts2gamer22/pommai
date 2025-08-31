import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type ToyStatus = 'active' | 'paused' | 'archived';
export type ToyType = 'teddy' | 'bunny' | 'cat' | 'dog' | 'bird' | 'fish' | 'robot' | 'magical';

export interface Toy {
  _id: string;
  name: string;
  type: ToyType;
  status: ToyStatus;
  isForKids: boolean;
  voiceId: string;
  voiceName?: string;
  personalityPrompt: string;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  conversationCount: number;
  messageCount: number;
  lastActiveAt?: string;
  deviceId?: string;
}

export interface ToyFilters {
  search: string;
  status: 'all' | ToyStatus;
  type: 'all' | ToyType;
  isForKids: 'all' | 'true' | 'false';
}

interface ToysState {
  // Data
  toys: Toy[];
  selectedToy: Toy | null;
  isLoading: boolean;
  error: string | null;
  
  // UI State
  viewMode: 'grid' | 'list';
  filters: ToyFilters;
  sortBy: 'name' | 'created' | 'lastActive' | 'conversations';
  sortOrder: 'asc' | 'desc';
  
  // Actions
  setToys: (toys: Toy[]) => void;
  addToy: (toy: Toy) => void;
  updateToy: (toyId: string, updates: Partial<Toy>) => void;
  removeToy: (toyId: string) => void;
  setSelectedToy: (toy: Toy | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // UI Actions
  setViewMode: (mode: 'grid' | 'list') => void;
  updateFilters: (filters: Partial<ToyFilters>) => void;
  setSorting: (sortBy: ToysState['sortBy'], sortOrder: ToysState['sortOrder']) => void;
  clearFilters: () => void;
  
  // Computed
  filteredToys: () => Toy[];
  toysByStatus: () => Record<ToyStatus, Toy[]>;
  activeToys: () => Toy[];
  kidsModeToys: () => Toy[];
  
  // Actions
  reset: () => void;
}

const defaultFilters: ToyFilters = {
  search: '',
  status: 'all',
  type: 'all',
  isForKids: 'all',
};

export const useToysStore = create<ToysState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    toys: [],
    selectedToy: null,
    isLoading: false,
    error: null,
    
    // UI State
    viewMode: 'grid',
    filters: defaultFilters,
    sortBy: 'created',
    sortOrder: 'desc',
    
    // Data actions
    setToys: (toys) => set({ toys, error: null }),
    
    addToy: (toy) => set((state) => ({
      toys: [toy, ...state.toys]
    })),
    
    updateToy: (toyId, updates) => set((state) => ({
      toys: state.toys.map(toy => 
        toy._id === toyId ? { ...toy, ...updates } : toy
      ),
      selectedToy: state.selectedToy?._id === toyId 
        ? { ...state.selectedToy, ...updates }
        : state.selectedToy
    })),
    
    removeToy: (toyId) => set((state) => ({
      toys: state.toys.filter(toy => toy._id !== toyId),
      selectedToy: state.selectedToy?._id === toyId ? null : state.selectedToy
    })),
    
    setSelectedToy: (toy) => set({ selectedToy: toy }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    
    // UI actions
    setViewMode: (viewMode) => set({ viewMode }),
    
    updateFilters: (newFilters) => set((state) => ({
      filters: { ...state.filters, ...newFilters }
    })),
    
    setSorting: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
    
    clearFilters: () => set({ filters: defaultFilters }),
    
    // Computed getters
    filteredToys: () => {
      const { toys, filters, sortBy, sortOrder } = get();
      
      let filtered = toys.filter(toy => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          if (!toy.name.toLowerCase().includes(searchLower) && 
              !toy.type.toLowerCase().includes(searchLower) &&
              !toy.tags.some(tag => tag.toLowerCase().includes(searchLower))) {
            return false;
          }
        }
        
        // Status filter
        if (filters.status !== 'all' && toy.status !== filters.status) {
          return false;
        }
        
        // Type filter
        if (filters.type !== 'all' && toy.type !== filters.type) {
          return false;
        }
        
        // Kids mode filter
        if (filters.isForKids !== 'all') {
          const isForKidsFilter = filters.isForKids === 'true';
          if (toy.isForKids !== isForKidsFilter) {
            return false;
          }
        }
        
        return true;
      });
      
      // Sort
      filtered.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'created':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          case 'lastActive':
            const aLastActive = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
            const bLastActive = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
            comparison = aLastActive - bLastActive;
            break;
          case 'conversations':
            comparison = a.conversationCount - b.conversationCount;
            break;
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });
      
      return filtered;
    },
    
    toysByStatus: () => {
      const toys = get().toys;
      return {
        active: toys.filter(toy => toy.status === 'active'),
        paused: toys.filter(toy => toy.status === 'paused'),
        archived: toys.filter(toy => toy.status === 'archived'),
      };
    },
    
    activeToys: () => get().toys.filter(toy => toy.status === 'active'),
    kidsModeToys: () => get().toys.filter(toy => toy.isForKids),
    
    reset: () => set({
      toys: [],
      selectedToy: null,
      isLoading: false,
      error: null,
      viewMode: 'grid',
      filters: defaultFilters,
      sortBy: 'created',
      sortOrder: 'desc',
    }),
  }))
);