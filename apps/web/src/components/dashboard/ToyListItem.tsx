'use client';

import { formatDistanceToNow } from 'date-fns';
import { Card, Button, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@pommai/ui';
import { 
  MoreVertical, 
  Play, 
  Pause, 
  Edit, 
  Copy, 
  Trash, 
  MessageSquare,
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
}

interface ToyListItemProps {
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

export function ToyListItem({ 
  toy, 
  onChat, 
  onEdit, 
  onStatusToggle, 
  onDuplicate, 
  onDelete 
}: ToyListItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <Card 
        bg="#ffffff" 
        borderColor="black" 
        shadowColor="#c381b5"
        className="hover-lift transition-transform"
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="text-3xl">{getToyAvatar(toy.type)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-minecraft font-black text-lg uppercase tracking-wider text-black">
                    {toy.name}
                  </h3>
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
                <div className="flex items-center gap-4 text-sm font-geo font-semibold text-gray-700 mt-1">
                  <span className="font-geo uppercase tracking-wider">{0} conversations</span>
                  <span>•</span>
                  <span className="font-geo uppercase tracking-wider">{0} messages</span>
                  <span>•</span>
                  <span className="font-geo uppercase tracking-wider">
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
                bg={toy.status === 'active' ? "#ff6b6b" : "#92cd41"}
                textColor="white"
                borderColor="black"
                shadow={toy.status === 'active' ? "#e84545" : "#76a83a"}
                className="py-2 px-3 font-minecraft font-black hover-lift"
                onClick={() => onStatusToggle(toy._id as Id<"toys">, toy.status)}
              >
                {toy.status === 'active' ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              <Button
                bg="#c381b5"
                textColor="white"
                borderColor="black"
                shadow="#8b5fa3"
                className="py-2 px-3 font-minecraft font-black hover-lift"
                onClick={() => onChat(toy._id)}
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  bg="#ffffff"
                  textColor="black"
                  borderColor="black"
                  shadow="#e0e0e0"
                  className="py-2 px-3 font-minecraft font-black hover-lift"
                >
                  <MoreVertical className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  bg="#ffffff"
                  borderColor="black"
                  shadowColor="#e0e0e0"
                >
                  <button 
                    onClick={() => onChat(toy._id)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 font-minecraft font-black uppercase tracking-wider text-sm flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Chat
                  </button>
                  <button 
                    onClick={() => onEdit(toy._id)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 font-minecraft font-black uppercase tracking-wider text-sm flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button 
                    onClick={() => onDuplicate(toy._id, `${toy.name} Copy`)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 font-minecraft font-black uppercase tracking-wider text-sm flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                  <hr className="border-gray-300 my-1" />
                  <button 
                    onClick={() => onDelete(toy._id)}
                    className="w-full text-left px-3 py-2 hover:bg-red-100 font-minecraft font-black uppercase tracking-wider text-sm flex items-center gap-2 text-red-600"
                  >
                    <Trash className="w-4 h-4" />
                    Delete
                  </button>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}