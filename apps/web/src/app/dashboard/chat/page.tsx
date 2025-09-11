'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Bot, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@pommai/ui';

/**
 * Chat Page
 * - Pixel page title; supporting text stays Work Sans.
 * - Spacing tokens used in containers.
 */
export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toyName = searchParams.get('toy');
  
  // Get user's toys
  const toys = useQuery(api.toys.getMyToys);
  const [selectedToyId, setSelectedToyId] = useState<string | null>(null);
  
  // Find toy by name or select first available
  useEffect(() => {
    if (toys && toys.length > 0) {
      if (toyName) {
        const toy = toys.find(t => t.name === toyName);
        if (toy) {
          setSelectedToyId(toy._id);
        } else {
          setSelectedToyId(toys[0]._id);
        }
      } else {
        setSelectedToyId(toys[0]._id);
      }
    }
  }, [toys, toyName]);

  const selectedToy = toys?.find(t => t._id === selectedToyId);

  if (!toys || toys.length === 0) {
    return (
      <div className="container mx-auto px-[var(--spacing-md)] py-[var(--spacing-xl)]">
        <Card className="max-w-2xl mx-auto p-8 text-center">
          <Bot className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Toys Created Yet</h2>
          <p className="text-gray-600 mb-6">
            Create your first AI toy to start chatting!
          </p>
          <Button onClick={() => router.push('/dashboard/create-toy')}>
            Create Your First Toy
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-[var(--spacing-md)] py-[var(--spacing-xl)]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/dashboard')}
              bg="#fefcd0"
              textColor="black"
              borderColor="black"
              shadow="#c381b5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="font-minecraft text-base sm:text-lg lg:text-xl font-black text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-8 h-8" />
              Chat Simulator
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Toy Selector */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Select a Toy</h3>
              <div className="space-y-2">
                {toys.map((toy) => (
                  <button
                    key={toy._id}
                    onClick={() => setSelectedToyId(toy._id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedToyId === toy._id
                        ? 'bg-purple-100 text-purple-900'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {toy.type === 'teddy' && '🧸'}
                        {toy.type === 'bunny' && '🐰'}
                        {toy.type === 'cat' && '🐱'}
                        {toy.type === 'dog' && '🐶'}
                        {toy.type === 'bird' && '🦜'}
                        {toy.type === 'fish' && '🐠'}
                        {toy.type === 'robot' && '🤖'}
                        {toy.type === 'magical' && '✨'}
                      </span>
                      <div>
                        <p className="font-medium">{toy.name}</p>
                        <p className="text-xs text-gray-500">
                          {toy.isForKids ? 'Kids Mode' : 'General'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            {selectedToy ? (
              <Tabs defaultValue="chat" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="info">Toy Info</TabsTrigger>
                </TabsList>
                
                <TabsContent value="chat" className="mt-4">
                  <ChatInterface
                    toyId={selectedToy._id}
                    toy={selectedToy}
                    isGuardianMode={selectedToy.isForKids}
                  />
                </TabsContent>
                
                <TabsContent value="info" className="mt-4">
                  <Card className="p-6">
                    <h3 className="text-xl font-semibold mb-4">Toy Information</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium">{selectedToy.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Type</p>
                        <p className="font-medium capitalize">{selectedToy.type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Mode</p>
                        <p className="font-medium">
                          {selectedToy.isForKids ? 'Guardian Mode (For Kids)' : 'General Mode'}
                        </p>
                      </div>
                      {selectedToy.personalityPrompt && (
                        <div>
                          <p className="text-sm text-gray-500">Personality</p>
                          <p className="text-sm mt-1">{selectedToy.personalityPrompt}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-gray-600">Select a toy to start chatting</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
