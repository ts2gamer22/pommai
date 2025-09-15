'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card } from '@pommai/ui';
import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Id } from '../../../convex/_generated/dataModel';
import { ToyEmptyState } from './ToyEmptyState';
import { ToyControlsHeader } from './ToyControlsHeader';
import { ToyGridItem } from './ToyGridItem';
import { ToyListItem } from './ToyListItem';
import { ToyDialogs } from './ToyDialogs';
import { useToysStore } from '@/stores/useToysStore';

interface MyToysGridProps {
  onCreateToy?: () => void;
}

export function MyToysGrid({ onCreateToy }: MyToysGridProps) {
  const router = useRouter();
  const { viewMode, setViewMode, filters, updateFilters } = useToysStore();
  const [selectedToy, setSelectedToy] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateName, setDuplicateName] = useState('');

  // Fetch toys
  const toys = useQuery(api.toys.getMyToys);
  const updateToyStatus = useMutation(api.toys.updateToyStatus);
  const duplicateToy = useMutation(api.toys.duplicateToy);
  const deleteToy = useMutation(api.toys.deleteToy);

  interface Toy { _id: string; name: string; type: string; status: 'active' | 'paused' | 'archived'; }
  // Filter toys using UI store filters
  const q = (filters.search ?? '').trim().toLowerCase();
  const s = filters.status ?? 'all';
  const filteredToys = toys?.filter((toy: Toy) => {
    const matchesSearch = q.length === 0 ||
      toy.name.toLowerCase().includes(q) ||
      toy.type.toLowerCase().includes(q);
    const matchesStatus = s === 'all' || toy.status === s;
    return matchesSearch && matchesStatus;
  });

  const handleStatusToggle = async (toyId: Id<"toys">, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    await updateToyStatus({ toyId, status: newStatus });
  };

  const handleDuplicate = async () => {
    if (selectedToy && duplicateName.trim()) {
      await duplicateToy({ 
        toyId: selectedToy as Id<"toys">, 
        newName: duplicateName.trim() 
      });
      setShowDuplicateDialog(false);
      setDuplicateName('');
      setSelectedToy(null);
    }
  };

  const handleDelete = async () => {
    if (selectedToy) {
      await deleteToy({ toyId: selectedToy as Id<"toys"> });
      setShowDeleteDialog(false);
      setSelectedToy(null);
    }
  };

  const handleChat = (toyId: string) => {
    router.push(`/dashboard/chat?toyId=${toyId}`);
  };

  const handleEdit = (toyId: string) => {
    router.push(`/dashboard/toys/edit/${toyId}`);
  };

  const handleDuplicateStart = (toyId: string, name: string) => {
    setSelectedToy(toyId);
    setDuplicateName(name);
    setShowDuplicateDialog(true);
  };

  const handleDeleteStart = (toyId: string) => {
    setSelectedToy(toyId);
    setShowDeleteDialog(true);
  };

  if (!toys) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-6">
          <div className="h-10 w-64 bg-gray-200 animate-pulse rounded" />
          <div className="h-10 w-32 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card 
              key={i} 
              bg="#f0f0f0" 
              borderColor="black" 
              shadowColor="#e0e0e0"
              className="h-64 w-full animate-pulse"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-300 rounded" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-300 rounded w-3/4" />
                    <div className="h-3 bg-gray-300 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-300 rounded" />
                  <div className="h-3 bg-gray-300 rounded w-2/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (toys.length === 0) {
    return <ToyEmptyState onCreateToy={onCreateToy} />;
  }

  return (
    <div className="space-y-4">
      <ToyControlsHeader 
        searchQuery={filters.search}
        onSearchChange={(value) => updateFilters({ search: value })}
        filterStatus={filters.status}
        onFilterChange={(value) => updateFilters({ status: value })}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreateToy={onCreateToy}
      />

      <AnimatePresence mode="popLayout">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredToys?.map((toy) => (
              <ToyGridItem
                key={toy._id}
                toy={toy}
                onChat={handleChat}
                onEdit={handleEdit}
                onStatusToggle={handleStatusToggle}
                onDuplicate={handleDuplicateStart}
                onDelete={handleDeleteStart}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredToys?.map((toy) => (
              <ToyListItem
                key={toy._id}
                toy={toy}
                onChat={handleChat}
                onEdit={handleEdit}
                onStatusToggle={handleStatusToggle}
                onDuplicate={handleDuplicateStart}
                onDelete={handleDeleteStart}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <ToyDialogs
        showDeleteDialog={showDeleteDialog}
        onDeleteConfirm={handleDelete}
        onDeleteCancel={() => {
          setShowDeleteDialog(false);
          setSelectedToy(null);
        }}
        showDuplicateDialog={showDuplicateDialog}
        duplicateName={duplicateName}
        onDuplicateNameChange={setDuplicateName}
        onDuplicateConfirm={handleDuplicate}
        onDuplicateCancel={() => {
          setShowDuplicateDialog(false);
          setSelectedToy(null);
        }}
      />
    </div>
  );
}
