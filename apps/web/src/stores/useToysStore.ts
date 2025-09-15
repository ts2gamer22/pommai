import { create } from 'zustand';

export interface ToyFilters {
  search: string;
  status: 'all' | 'active' | 'paused' | 'archived';
  type: 'all' | string;
  isForKids: 'all' | 'true' | 'false';
}

interface ToysUIState {
  // UI-only state (no server data here)
  viewMode: 'grid' | 'list';
  filters: ToyFilters;
  sortBy: 'name' | 'created' | 'lastActive' | 'conversations';
  sortOrder: 'asc' | 'desc';

  // UI actions
  setViewMode: (mode: 'grid' | 'list') => void;
  updateFilters: (filters: Partial<ToyFilters>) => void;
  setSorting: (sortBy: ToysUIState['sortBy'], sortOrder: ToysUIState['sortOrder']) => void;
  clearFilters: () => void;
  reset: () => void;
}

const defaultFilters: ToyFilters = {
  search: '',
  status: 'all',
  type: 'all',
  isForKids: 'all',
};

export const useToysStore = create<ToysUIState>()((set) => ({
  // Initial UI state
  viewMode: 'grid',
  filters: defaultFilters,
  sortBy: 'created',
  sortOrder: 'desc',

  // UI actions
  setViewMode: (viewMode) => set({ viewMode }),
  updateFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  setSorting: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
  clearFilters: () => set({ filters: defaultFilters }),
  reset: () => set({
    viewMode: 'grid',
    filters: defaultFilters,
    sortBy: 'created',
    sortOrder: 'desc',
  }),
}));
