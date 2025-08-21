'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/Tabs';
import { Input } from '@/components/Input';
import Link from 'next/link';
import { ToyWizard } from '@/components/dashboard/ToyWizard';
import { MyToysGrid } from '@/components/dashboard/MyToysGrid';
import { GuardianDashboard } from '@/components/guardian/GuardianDashboard';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('toys');
  const [isGuardianMode, setIsGuardianMode] = useState(false);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  
  const toggleTrait = (trait: string) => {
    setSelectedTraits(prev => 
      prev.includes(trait) 
        ? prev.filter(t => t !== trait)
        : [...prev, trait]
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fefcd0' }}>
      {/* Navigation Header */}
      <header className="border-b-[5px] border-black bg-white relative" 
        style={{
          boxShadow: '0 4px 0 0 #c381b5'
        }}
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 hover:translate-y-[-1px] transition-transform">
            <img src="/pommaiicon.png" alt="Pommai Logo" className="h-10 w-10 pixelated" />
            <img src="/pommaitext.png" alt="Pommai" className="h-8 pixelated" />
          </Link>
          <nav className="flex gap-4 items-center">
            <div className="hidden md:flex items-center gap-2">
              <span className="text-2xl">👤</span>
              <span className="text-black font-bold uppercase tracking-wider">Welcome back!</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                bg="#c381b5"
                textColor="white"
                borderColor="black"
                shadow="#8b5fa3"
                className="py-2 px-4 text-sm font-bold uppercase tracking-wider"
                onClick={() => router.push('/dashboard/history')}
              >
                <span className="flex items-center gap-2">
                  <span>📜</span>
                  History
                </span>
              </Button>
              <Button 
                bg="#ff6b6b"
                textColor="white"
                borderColor="black"
                shadow="#e84545"
                className="py-2 px-6 text-sm font-bold uppercase tracking-wider"
              >
                <span className="flex items-center gap-2">
                  <span>🚪</span>
                  Sign Out
                </span>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 max-w-7xl py-6 md:py-8">
        {/* Dashboard Header with Pixel Art */}
        <div className="mb-8 relative">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl md:text-6xl font-black mb-3 uppercase tracking-wider text-black"
                style={{
                  textShadow: '3px 3px 0 #c381b5, 6px 6px 0 #92cd41'
                }}
              >
                My AI Toys
              </h1>
              <p className="text-gray-700 text-lg md:text-xl font-bold uppercase tracking-wide">Create magical companions for endless fun!</p>
            </div>
            <div className="hidden lg:block text-6xl xl:text-8xl animate-bounce" style={{ animationDuration: '3s' }}>
              🧸
            </div>
          </div>
        </div>

        {/* Quick Stats - Improved Layout */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <Card 
            bg="#ffffff" 
            borderColor="black" 
            shadowColor="#c381b5"
            className="p-4 md:p-6 hover:translate-y-[-2px] transition-transform cursor-pointer group"
            onClick={() => setActiveTab('toys')}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-3xl md:text-4xl group-hover:animate-pulse">🧸</span>
              <span className="text-3xl md:text-5xl font-black">0</span>
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">My Toys</h3>
            <p className="text-xs text-gray-500 mt-1">Click to view</p>
          </Card>
          
          <Card 
            bg="#ffffff" 
            borderColor="black" 
            shadowColor="#92cd41"
            className="p-4 md:p-6 hover:translate-y-[-2px] transition-transform cursor-pointer group"
            onClick={() => setActiveTab('devices')}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-3xl md:text-4xl group-hover:animate-pulse">📱</span>
              <span className="text-3xl md:text-5xl font-black">0</span>
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">Devices</h3>
            <p className="text-xs text-gray-500 mt-1">No connections</p>
          </Card>
          
          <Card 
            bg="#ffffff" 
            borderColor="black" 
            shadowColor="#f7931e"
            className="p-4 md:p-6 hover:translate-y-[-2px] transition-transform cursor-pointer group"
            onClick={() => router.push('/dashboard/chat')}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-3xl md:text-4xl group-hover:animate-pulse">💬</span>
              <span className="text-3xl md:text-5xl font-black">0</span>
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">Chats Today</h3>
            <p className="text-xs text-gray-500 mt-1">Start talking!</p>
          </Card>
          
          <Card 
            bg={isGuardianMode ? "#c381b5" : "#ffffff"} 
            borderColor="black" 
            shadowColor={isGuardianMode ? "#8b5fa3" : "#ff6b6b"}
            className="p-4 md:p-6 cursor-pointer hover:translate-y-[-2px] transition-all group relative overflow-hidden"
            onClick={() => setIsGuardianMode(!isGuardianMode)}
          >
            {isGuardianMode && (
              <div className="absolute inset-0 opacity-20">
                <div className="animate-pulse bg-gradient-to-br from-purple-400 to-pink-400" />
              </div>
            )}
            <div className="flex justify-between items-start mb-3 relative z-10">
              <span className="text-3xl md:text-4xl group-hover:animate-spin" style={{ animationDuration: '2s' }}>🛡️</span>
              <span className={`text-xl md:text-2xl font-black ${isGuardianMode ? 'text-white' : 'text-black'}`}>
                {isGuardianMode ? 'ON' : 'OFF'}
              </span>
            </div>
            <h3 className={`text-sm font-bold uppercase tracking-wider relative z-10 ${isGuardianMode ? 'text-white' : 'text-gray-700'}`}>
              Guardian
            </h3>
            <p className={`text-xs mt-1 relative z-10 ${isGuardianMode ? 'text-white opacity-90' : 'text-gray-500'}`}>
              {isGuardianMode ? 'Protected' : 'Click to enable'}
            </p>
          </Card>
        </div>

        {/* Main Content Tabs - Enhanced */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList 
            className="mb-8 w-full flex flex-wrap justify-center gap-2" 
            bg="#fef8e4"
            shadowColor="#92cd41"
          >
            <TabsTrigger value="toys" className="flex items-center gap-2">
              <span>🧸</span> My Toys
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <span>✨</span> Create
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex items-center gap-2">
              <span>📱</span> Devices
            </TabsTrigger>
            {isGuardianMode && (
              <TabsTrigger value="guardian" className="flex items-center gap-2">
                <span>🛡️</span> Guardian
              </TabsTrigger>
            )}
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <span>⚙️</span> Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="toys">
            <MyToysGrid onCreateToy={() => setActiveTab('create')} />
          </TabsContent>

          <TabsContent value="create">
            <ToyWizard />
          </TabsContent>

          <TabsContent value="devices">
            <div className="space-y-6">
              <Card 
                bg="#ffffff" 
                borderColor="black" 
                shadowColor="#f7931e"
                className="p-8 text-center"
              >
                <h2 className="text-3xl font-black mb-6 uppercase tracking-wider">Device Hub</h2>
                <div className="inline-block relative mb-8">
                  <span className="text-8xl">🔌</span>
                  <span className="absolute -bottom-2 -right-2 text-3xl animate-pulse">⚡</span>
                </div>
                <p className="text-xl font-bold text-gray-700 mb-2">No devices connected</p>
                <p className="text-gray-600 mb-6">Connect a Raspberry Pi to bring your toys to life!</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    bg="#f7931e" 
                    textColor="white" 
                    shadow="#d47a1a"
                    borderColor="black"
                    className="font-bold uppercase tracking-wider"
                  >
                    <span className="flex items-center gap-2">
                      <span>📚</span> Setup Guide
                    </span>
                  </Button>
                  <Button 
                    bg="#92cd41" 
                    textColor="white" 
                    shadow="#76a83a"
                    borderColor="black"
                    className="font-bold uppercase tracking-wider"
                  >
                    <span className="flex items-center gap-2">
                      <span>🔍</span> Scan for Devices
                    </span>
                  </Button>
                </div>
              </Card>
              
              {/* Device Requirements Card */}
              <Card 
                bg="#fef8e4" 
                borderColor="black" 
                shadowColor="#f7931e"
                className="p-6"
              >
                <h3 className="text-xl font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
                  <span>📦</span> What You&apos;ll Need
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <span className="text-4xl block mb-2">🧠</span>
                    <p className="font-bold">Raspberry Pi</p>
                    <p className="text-sm text-gray-600">Any model works!</p>
                  </div>
                  <div className="text-center">
                    <span className="text-4xl block mb-2">🎤</span>
                    <p className="font-bold">Microphone</p>
                    <p className="text-sm text-gray-600">USB or GPIO</p>
                  </div>
                  <div className="text-center">
                    <span className="text-4xl block mb-2">🔊</span>
                    <p className="font-bold">Speaker</p>
                    <p className="text-sm text-gray-600">3.5mm or Bluetooth</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {isGuardianMode && (
            <TabsContent value="guardian">
              <GuardianDashboard />
            </TabsContent>
          )}

          <TabsContent value="history">
            <Card 
              bg="#ffffff" 
              borderColor="black" 
              shadowColor="#c381b5"
              className="p-6"
            >
              <h2 className="text-2xl font-semibold mb-6">Interaction History</h2>
              <div className="text-center py-12 text-gray-500">
                <p>No interactions recorded yet.</p>
                <p className="mt-2">Voice interactions will appear here once your child starts using Pommai.</p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="max-w-5xl mx-auto space-y-6">
              <Card 
                bg="#ffffff" 
                borderColor="black" 
                shadowColor="#c381b5"
                className="p-8"
              >
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-black mb-3 uppercase tracking-wider text-black"
                    style={{
                      textShadow: '2px 2px 0 #c381b5'
                    }}
                  >
                    Settings & Account
                  </h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="font-black text-xl uppercase tracking-wider flex items-center gap-2">
                      <span className="text-2xl">👤</span> Profile
                    </h3>
                    
                    <Card
                      bg="#fef8e4"
                      borderColor="black"
                      shadowColor="#e0e0e0"
                      className="p-5 space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-black mb-2 uppercase tracking-wider">Email</label>
                        <Input 
                          type="email" 
                          defaultValue="user@example.com" 
                          bg="#ffffff"
                          borderColor="black"
                          disabled
                          readOnly
                          className="font-bold"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-black mb-2 uppercase tracking-wider">Username</label>
                        <Input 
                          defaultValue="PommaiParent123" 
                          bg="#ffffff"
                          borderColor="black"
                          className="font-bold"
                          onChange={(e) => console.log('Username changed:', e.target.value)}
                        />
                      </div>
                    </Card>
                    
                    <Card
                      bg="#c381b5"
                      borderColor="black"
                      shadowColor="#8b5fa3"
                      className="p-5 text-white"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-black text-lg uppercase tracking-wider mb-2">Free Plan</h4>
                          <p className="text-sm opacity-90">1 AI Toy • Basic Features</p>
                        </div>
                        <span className="text-3xl">🎆</span>
                      </div>
                      <Button 
                        bg="#92cd41" 
                        textColor="white" 
                        shadow="#76a83a"
                        borderColor="black"
                        className="mt-4 w-full font-black uppercase tracking-wider"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <span>🚀</span> Upgrade to Pro
                        </span>
                      </Button>
                    </Card>
                  </div>
                  
                  <div className="space-y-6">
                    <h3 className="font-black text-xl uppercase tracking-wider flex items-center gap-2">
                      <span className="text-2xl">🔔</span> Preferences
                    </h3>
                    
                    <Card
                      bg="#fef8e4"
                      borderColor="black"
                      shadowColor="#e0e0e0"
                      className="p-5"
                    >
                      <h4 className="font-black mb-4 uppercase tracking-wider flex items-center gap-2">
                        <span>📧</span> Notifications
                      </h4>
                      <div className="space-y-3">
                        {[
                          { label: 'Toy activity alerts', icon: '🧸', checked: true },
                          { label: 'Weekly usage reports', icon: '📈', checked: false },
                          { label: 'Security notifications', icon: '🔒', checked: true },
                          { label: 'New feature updates', icon: '✨', checked: true }
                        ].map(({ label, icon, checked }) => (
                          <label key={label} className="flex items-center cursor-pointer p-2 hover:bg-white rounded transition-colors">
                            <Checkbox className="mr-3" defaultChecked={checked} />
                            <span className="flex-1 font-bold">{label}</span>
                            <span className="text-xl">{icon}</span>
                          </label>
                        ))}
                      </div>
                    </Card>
                    
                    <Card
                      bg="#ffe4e1"
                      borderColor="black"
                      shadowColor="#ff6b6b"
                      className="p-5"
                    >
                      <h4 className="font-black mb-4 uppercase tracking-wider flex items-center gap-2">
                        <span>🧸</span> Default Toy Settings
                      </h4>
                      <div className="space-y-3">
                        {[
                          { label: 'Auto-enable Guardian Mode', icon: '🛡️', checked: false },
                          { label: 'Require device confirmation', icon: '🔐', checked: true },
                          { label: 'Daily conversation limits', icon: '⏱️', checked: false },
                          { label: 'Educational mode by default', icon: '🎓', checked: true }
                        ].map(({ label, icon, checked }) => (
                          <label key={label} className="flex items-center cursor-pointer p-2 hover:bg-white rounded transition-colors">
                            <Checkbox className="mr-3" defaultChecked={checked} />
                            <span className="flex-1 font-bold">{label}</span>
                            <span className="text-xl">{icon}</span>
                          </label>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
                
                <div className="mt-8 pt-8 border-t-[5px] border-black flex justify-center gap-4">
                  <Button 
                    bg="#92cd41" 
                    textColor="white" 
                    shadow="#76a83a"
                    borderColor="black"
                    className="px-8 py-3 font-black uppercase tracking-wider transform hover:scale-105 transition-transform"
                  >
                    <span className="flex items-center gap-2">
                      <span>💾</span> Save Changes
                    </span>
                  </Button>
                  <Button 
                    bg="#f0f0f0" 
                    textColor="black" 
                    shadow="#d0d0d0"
                    borderColor="black"
                    className="px-8 py-3 font-black uppercase tracking-wider"
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
