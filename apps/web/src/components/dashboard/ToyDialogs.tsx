'use client';

import type { ChangeEvent } from 'react';
import { Button, Input, Popup } from '@pommai/ui';

interface ToyDialogsProps {
  // Delete dialog
  showDeleteDialog: boolean;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  
  // Duplicate dialog
  showDuplicateDialog: boolean;
  duplicateName: string;
  onDuplicateNameChange: (name: string) => void;
  onDuplicateConfirm: () => void;
  onDuplicateCancel: () => void;
}

export function ToyDialogs({ 
  showDeleteDialog,
  onDeleteConfirm,
  onDeleteCancel,
  showDuplicateDialog,
  duplicateName,
  onDuplicateNameChange,
  onDuplicateConfirm,
  onDuplicateCancel
}: ToyDialogsProps) {
  return (
    <>
      {/* Delete Confirmation Popup */}
      {showDeleteDialog && (
        <Popup
          isOpen={showDeleteDialog}
          onClose={onDeleteCancel}
          title="🗑️ Delete Toy"
          bg="#ffffff"
          borderColor="black"
          className="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-gray-700 font-bold">
              Are you sure you want to delete this toy? This action will archive the toy and it will no longer be accessible.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                bg="#f0f0f0"
                textColor="black"
                borderColor="black"
                shadow="#d0d0d0"
                onClick={onDeleteCancel}
                className="flex-1 py-2 px-4 font-bold uppercase tracking-wider hover-lift"
              >
                Cancel
              </Button>
              <Button
                bg="#ff6b6b"
                textColor="white"
                borderColor="black"
                shadow="#e84545"
                onClick={onDeleteConfirm}
                className="flex-1 py-2 px-4 font-bold uppercase tracking-wider hover-lift"
              >
                Delete
              </Button>
            </div>
          </div>
        </Popup>
      )}

      {/* Duplicate Popup */}
      {showDuplicateDialog && (
        <Popup
          isOpen={showDuplicateDialog}
          onClose={onDuplicateCancel}
          title="📋 Duplicate Toy"
          bg="#ffffff"
          borderColor="black"
          className="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-gray-700 font-bold mb-4">
              Create a copy of this toy with a new name.
            </p>
            <div className="space-y-2">
              <label className="block text-sm font-black uppercase tracking-wider text-black">
                New Toy Name
              </label>
              <Input
                value={duplicateName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onDuplicateNameChange(e.target.value)}
                placeholder="Enter toy name"
                bg="#ffffff"
                borderColor="black"
                className="font-bold"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                bg="#f0f0f0"
                textColor="black"
                borderColor="black"
                shadow="#d0d0d0"
                onClick={onDuplicateCancel}
                className="flex-1 py-2 px-4 font-bold uppercase tracking-wider hover-lift"
              >
                Cancel
              </Button>
              <Button
                bg={duplicateName.trim() ? "#92cd41" : "#f0f0f0"}
                textColor={duplicateName.trim() ? "white" : "#999"}
                borderColor="black"
                shadow={duplicateName.trim() ? "#76a83a" : "#d0d0d0"}
                onClick={onDuplicateConfirm}
                disabled={!duplicateName.trim()}
                className={`flex-1 py-2 px-4 font-bold uppercase tracking-wider ${
                  duplicateName.trim() ? 'hover-lift' : 'cursor-not-allowed'
                }`}
              >
                Create Copy
              </Button>
            </div>
          </div>
        </Popup>
      )}
    </>
  );
}