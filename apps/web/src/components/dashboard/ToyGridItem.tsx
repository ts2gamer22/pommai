'use client';

import { formatDistanceToNow } from 'date-fns';
import { Card, Button } from '@pommai/ui';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@pommai/ui';
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
  Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Id } from '../../../convex/_generated/dataModel';

interface Toy {
  _id: string;
  name: string;
  type: string;
  status: 'active' | 'paused' | 'archived';
  isForKids: boolean;
  lastActiveAt?: string;
  assignedDevices?: unknown[];
}

interface ToyGridItemProps {
  toy: Toy;
  onChat: (toyId: string) => void;
  onEdit: (toyId: string) => void;
  onStatusToggle: (toyId: Id<"toys">, currentStatus: string) => void;
  onDuplicate: (toyId: string, name: string) => void;
  onDelete: (toyId: string) => void;
}

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

export function ToyGridItem({ 
  toy, 
  onChat, 
  onEdit, 
  onStatusToggle, 
  onDuplicate, 
  onDelete 
}: ToyGridItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        bg="#ffffff" 
        borderColor="black" 
        shadowColor="#c381b5"
        className="overflow-hidden hover-lift transition-transform cursor-pointer group"
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-4xl sm:text-5xl group-hover:animate-pulse">
                {getToyAvatar(toy.type)}
              </div>
              <div>
                <h3 className="font-minecraft font-black text-base uppercase tracking-wider text-gray-800">
                  {toy.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 text-xs font-minecraft font-black uppercase tracking-wider border-2 border-black ${
                    toy.status === 'active' 
                      ? 'bg-[#92cd41] text-white' 
                      : 'bg-[#f0f0f0] text-black'
                  }`}>
                    {toy.status}
                  </span>
                  {toy.isForKids && (
                    <span className="px-2 py-1 text-xs font-minecraft font-black uppercase tracking-wider border-2 border-black bg-[#f7931e] text-white flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Kids
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  bg="#ffffff"
                  textColor="black"
                  borderColor="black"
                  shadow="#e0e0e0"
                  className="py-1 px-2 hover-lift"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <button 
                  onClick={() => onChat(toy._id)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 font-minecraft font-black uppercase tracking-wider text-xs flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </button>
                <button 
                  onClick={() => onEdit(toy._id)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 font-minecraft font-black uppercase tracking-wider text-xs flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button 
                  onClick={() => onDuplicate(toy._id, `${toy.name} Copy`)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 font-minecraft font-black uppercase tracking-wider text-xs flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
                <hr className="border-gray-300 my-1" />
                <button 
                  onClick={() => onDelete(toy._id)}
                  className="w-full text-left px-3 py-2 hover:bg-red-100 font-minecraft font-black uppercase tracking-wider text-xs flex items-center gap-2 text-red-600"
                >
                  <Trash className="w-4 h-4" />
                  Delete
                </button>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-3 text-sm font-geo font-medium text-gray-600">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 font-geo tracking-wider">
                <MessageSquare className="w-4 h-4" />
                {0} chats
              </span>
              <span className="font-geo text-xs tracking-wider">
                {toy.lastActiveAt 
                  ? formatDistanceToNow(new Date(toy.lastActiveAt), { addSuffix: true })
                  : 'Never used'
                }
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {(toy.assignedDevices?.length || 0) > 0 ? (
                <span className="px-2 py-1 text-xs font-minecraft font-black uppercase tracking-wider border-2 border-black bg-[#92cd41] text-white flex items-center gap-1">
                  <Wifi className="w-3 h-3" />
                  {toy.assignedDevices?.length} device{(toy.assignedDevices?.length || 0) > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="px-2 py-1 text-xs font-minecraft font-black uppercase tracking-wider border-2 border-black bg-[#f0f0f0] text-gray-400 flex items-center gap-1">
                  <WifiOff className="w-3 h-3" />
                  No devices
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              bg={toy.status === 'active' ? "#ff6b6b" : "#92cd41"}
              textColor="white"
              borderColor="black"
              shadow={toy.status === 'active' ? "#e84545" : "#76a83a"}
              className="flex-1 py-2 text-xs font-minecraft font-black uppercase tracking-wider hover-lift"
              onClick={() => onStatusToggle(toy._id as Id<"toys">, toy.status)}
            >
              {toy.status === 'active' ? (
                <span className="flex items-center justify-center gap-1">
                  <Pause className="w-4 h-4" />
                  Pause
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1">
                  <Play className="w-4 h-4" />
                  Activate
                </span>
              )}
            </Button>
            <Button
              bg="#c381b5"
              textColor="white"
              borderColor="black"
              shadow="#8b5fa3"
              className="flex-1 py-2 text-xs font-minecraft font-black uppercase tracking-wider hover-lift"
              onClick={() => onChat(toy._id)}
            >
              <span className="flex items-center justify-center gap-1">
                <MessageSquare className="w-4 h-4" />
                Chat
              </span>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}