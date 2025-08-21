'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { formatDistanceToNow } from 'date-fns';
import { 
  MoreVertical, 
  Play, 
  Pause, 
  Edit, 
  Copy, 
  Trash, 
  MessageSquare,
  Wifi,
  WifiOff,
  Grid3X3,
  List,
  Plus,
  Shield,
  Search,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Id } from '../../../convex/_generated/dataModel';

interface MyToysGridProps {
  onCreateToy?: () => void;
}

export function MyToysGrid({ onCreateToy }: MyToysGridProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'archived'>('all');
  const [selectedToy, setSelectedToy] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateName, setDuplicateName] = useState('');

  // Fetch toys
  const toys = useQuery(api.toys.getMyToys);
  const updateToyStatus = useMutation(api.toys.updateToyStatus);
  const duplicateToy = useMutation(api.toys.duplicateToy);
  const deleteToy = useMutation(api.toys.deleteToy);

  // Filter toys
  const filteredToys = toys?.filter(toy => {
    const matchesSearch = toy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         toy.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || toy.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getToyAvatar = (type: string) => {
    const avatarMap: Record<string, string> = {
      teddy: '🧸',
      bunny: '🐰',
      cat: '🐱',
      dog: '🐶',
      bird: '🦜',
      fish: '🐠',
      robot: '🤖',
      magical: '✨',
    };
    return avatarMap[type] || '🎁';
  };

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
    // TODO: Navigate to edit page or open edit modal
    router.push(`/dashboard/toys/edit/${toyId}`);
  };

  if (!toys) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (toys.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-block relative mb-8">
          <span className="text-9xl animate-bounce inline-block">🧸</span>
          <span className="absolute -top-2 -right-2 text-4xl animate-spin" style={{ animationDuration: '3s' }}>✨</span>
        </div>
        <h3 className="text-3xl font-bold mb-4">No Toys Yet!</h3>
        <p className="text-xl text-gray-600 mb-8">Let's create your first AI companion</p>
        <Button 
          size="lg"
          onClick={onCreateToy}
          className="gap-2"
        >
          <Plus className="w-5 h-5" />
          Create My First Toy
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search toys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                {filterStatus === 'all' ? 'All' : filterStatus}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterStatus('all')}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('active')}>Active</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('paused')}>Paused</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('archived')}>Archived</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          <Button onClick={onCreateToy} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Toy
          </Button>
        </div>
      </div>

      {/* Toys Display */}
      <AnimatePresence mode="popLayout">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredToys?.map((toy) => (
              <motion.div
                key={toy._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-5xl">{getToyAvatar(toy.type)}</div>
                        <div>
                          <h3 className="font-semibold text-lg">{toy.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={toy.status === 'active' ? 'default' : 'secondary'}>
                              {toy.status}
                            </Badge>
                            {toy.isForKids && (
                              <Badge variant="outline" className="gap-1">
                                <Shield className="w-3 h-3" />
                                Kids
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleChat(toy._id)}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Chat
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(toy._id)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedToy(toy._id);
                            setDuplicateName(`${toy.name} Copy`);
                            setShowDuplicateDialog(true);
                          }}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedToy(toy._id);
                              setShowDeleteDialog(true);
                            }}
                            className="text-red-600"
                          >
                            <Trash className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {toy.conversationCount || 0} chats
                        </span>
                        <span>
                          {toy.lastActiveAt 
                            ? formatDistanceToNow(new Date(toy.lastActiveAt), { addSuffix: true })
                            : 'Never used'
                          }
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {toy.assignedDevices?.length > 0 ? (
                          <Badge variant="outline" className="gap-1">
                            <Wifi className="w-3 h-3" />
                            {toy.assignedDevices.length} device{toy.assignedDevices.length > 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-gray-400">
                            <WifiOff className="w-3 h-3" />
                            No devices
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleStatusToggle(toy._id, toy.status)}
                      >
                        {toy.status === 'active' ? (
                          <>
                            <Pause className="w-4 h-4 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleChat(toy._id)}
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Chat
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredToys?.map((toy) => (
              <motion.div
                key={toy._id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-3xl">{getToyAvatar(toy.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{toy.name}</h3>
                          <Badge variant={toy.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {toy.status}
                          </Badge>
                          {toy.isForKids && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Shield className="w-3 h-3" />
                              Kids
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>{toy.conversationCount || 0} conversations</span>
                          <span>•</span>
                          <span>{toy.messageCount || 0} messages</span>
                          <span>•</span>
                          <span>
                            Last active {toy.lastActiveAt 
                              ? formatDistanceToNow(new Date(toy.lastActiveAt), { addSuffix: true })
                              : 'never'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusToggle(toy._id, toy.status)}
                      >
                        {toy.status === 'active' ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChat(toy._id)}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(toy._id)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedToy(toy._id);
                            setDuplicateName(`${toy.name} Copy`);
                            setShowDuplicateDialog(true);
                          }}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedToy(toy._id);
                              setShowDeleteDialog(true);
                            }}
                            className="text-red-600"
                          >
                            <Trash className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Toy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this toy? This action will archive the toy and it will no longer be accessible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedToy(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Toy</DialogTitle>
            <DialogDescription>
              Create a copy of this toy with a new name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="duplicate-name">New Toy Name</Label>
              <Input
                id="duplicate-name"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                placeholder="Enter toy name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDuplicateDialog(false);
                setSelectedToy(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleDuplicate} disabled={!duplicateName.trim()}>
              Create Copy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
