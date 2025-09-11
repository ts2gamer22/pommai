'use client';

import { useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Tabs, TabsList, TabsTrigger, TabsContent, Input } from '@pommai/ui';
import Link from 'next/link';
import Image from 'next/image';
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
    <div className="min-h-screen bg-gradient-to-br from-[#fefcd0] to-[#f4e5d3] dashboard-page">
      {/* Navigation Header */}
      <header className="border-b-[5px] border-black bg-white shadow-[0_4px_0_0_#c381b5]">
        <div className="container mx-auto px-[var(--spacing-md)] py-[var(--spacing-md)]">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3 hover-lift transition-transform">
              <Image src="/pommaiicon.png" alt="Pommai Logo" width={40} height={40} className="h-8 w-8 sm:h-10 sm:w-10 pixelated" />
              <Image src="/pommaitext.png" alt="Pommai" width={140} height={32} className="h-6 sm:h-8 pixelated" />
            </Link>
            
            {/* Mobile-friendly navigation */}
            <nav className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex items-center gap-3">
                <span className="text-xl sm:text-2xl">👤</span>
                <span className="font-geo text-black font-bold text-xs sm:text-sm uppercase tracking-wider">Welcome!</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  bg="#c381b5"
                  textColor="white"
                  borderColor="black"
                  shadow="#8b5fa3"
                  className="py-2 px-2 sm:px-4 text-xs sm:text-sm font-minecraft font-black uppercase tracking-wider hover-lift"
                  onClick={() => router.push('/dashboard/history')}
                >
                  <span className="flex items-center gap-1 sm:gap-2">
                    <span>📜</span>
                    <span className="hidden sm:inline">History</span>
                  </span>
                </Button>
                <Button 
                  bg="#ff6b6b"
                  textColor="white"
                  borderColor="black"
                  shadow="#e84545"
                  className="py-2 px-2 sm:px-4 text-xs sm:text-sm font-minecraft font-black uppercase tracking-wider hover-lift"
                >
                  <span className="flex items-center gap-1 sm:gap-2">
                    <span>🚪</span>
                    <span className="hidden sm:inline">Sign Out</span>
                  </span>
                </Button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-[var(--spacing-md)] max-w-7xl py-[var(--spacing-md)] sm:py-[var(--spacing-lg)] lg:py-[var(--spacing-xl)]">
        {/* Dashboard Header with better mobile spacing */}
        <div className="mb-[var(--spacing-lg)] sm:mb-[var(--spacing-xl)] lg:mb-[var(--spacing-2xl)] relative">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="text-center sm:text-left">
              <h1 className="font-minecraft text-lg sm:text-xl lg:text-2xl mb-2 sm:mb-4 uppercase tracking-wider text-gray-800"
                style={{
                  textShadow: '2px 2px 0 #c381b5, 4px 4px 0 #92cd41'
                }}
              >
                My AI Toys
              </h1>
              <p className="font-geo text-gray-600 text-sm sm:text-base font-medium tracking-wide">Create magical companions for endless fun!</p>
            </div>
            <div className="hidden lg:block text-6xl xl:text-8xl animate-bounce" style={{ animationDuration: '3s' }}>
              🧸
            </div>
          </div>
        </div>

        {/* Stats Cards - Mobile-Responsive Layout */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[var(--spacing-sm)] sm:gap-[var(--spacing-md)] lg:gap-[var(--spacing-lg)] mb-[var(--spacing-xl)] sm:mb-[var(--spacing-2xl)] lg:mb-[var(--spacing-3xl)]">
          <Card 
            bg="#ffffff" 
            borderColor="black" 
            shadowColor="#c381b5"
            className="p-3 sm:p-4 lg:p-6 hover-lift transition-transform cursor-pointer group"
            onClick={() => setActiveTab('toys')}
          >
            <div className="flex justify-between items-start mb-2 sm:mb-3 lg:mb-4">
              <span className="text-2xl sm:text-3xl lg:text-4xl group-hover:animate-pulse">🧸</span>
              <span className="text-2xl sm:text-3xl lg:text-5xl font-black">0</span>
            </div>
            <h3 className="font-geo text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-600 mb-1">My Toys</h3>
            <p className="font-geo text-xs text-gray-500 hidden sm:block">Click to view</p>
          </Card>
          
          <Card 
            bg="#ffffff" 
            borderColor="black" 
            shadowColor="#92cd41"
            className="p-3 sm:p-4 lg:p-6 hover-lift transition-transform cursor-pointer group"
            onClick={() => setActiveTab('devices')}
          >
            <div className="flex justify-between items-start mb-2 sm:mb-3 lg:mb-4">
              <span className="text-2xl sm:text-3xl lg:text-4xl group-hover:animate-pulse">📱</span>
              <span className="text-2xl sm:text-3xl lg:text-5xl font-black">0</span>
            </div>
            <h3 className="font-geo text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-600 mb-1">Devices</h3>
            <p className="font-geo text-xs text-gray-500 hidden sm:block">No connections</p>
          </Card>
          
          <Card 
            bg="#ffffff" 
            borderColor="black" 
            shadowColor="#f7931e"
            className="p-3 sm:p-4 lg:p-6 hover-lift transition-transform cursor-pointer group"
            onClick={() => router.push('/dashboard/chat')}
          >
            <div className="flex justify-between items-start mb-2 sm:mb-3 lg:mb-4">
              <span className="text-2xl sm:text-3xl lg:text-4xl group-hover:animate-pulse">💬</span>
              <span className="text-2xl sm:text-3xl lg:text-5xl font-black">0</span>
            </div>
            <h3 className="font-geo text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-600 mb-1">Chats Today</h3>
            <p className="font-geo text-xs text-gray-500 hidden sm:block">Start talking!</p>
          </Card>
          
          <Card 
            bg={isGuardianMode ? "#c381b5" : "#ffffff"} 
            borderColor="black" 
            shadowColor={isGuardianMode ? "#8b5fa3" : "#ff6b6b"}
            className="p-3 sm:p-4 lg:p-6 cursor-pointer hover-lift transition-all group relative overflow-hidden"
            onClick={() => setIsGuardianMode(!isGuardianMode)}
          >
            {isGuardianMode && (
              <div className="absolute inset-0 opacity-20">
                <div className="animate-pulse bg-gradient-to-br from-purple-400 to-pink-400 h-full w-full" />
              </div>
            )}
            <div className="flex justify-between items-start mb-2 sm:mb-3 lg:mb-4 relative z-10">
              <span className="text-2xl sm:text-3xl lg:text-4xl group-hover:animate-spin" style={{ animationDuration: '2s' }}>🛡️</span>
              <span className={`text-lg sm:text-xl lg:text-3xl font-black ${ isGuardianMode ? 'text-white' : 'text-black'}`}>
                {isGuardianMode ? 'ON' : 'OFF'}
              </span>
            </div>
            <h3 className={`font-geo text-xs sm:text-sm font-semibold uppercase tracking-wider relative z-10 mb-1 ${isGuardianMode ? 'text-white' : 'text-gray-600'}`}>
              Guardian
            </h3>
            <p className={`font-geo text-xs relative z-10 hidden sm:block ${isGuardianMode ? 'text-white opacity-90' : 'text-gray-500'}`}>
              {isGuardianMode ? 'Protected' : 'Click to enable'}
            </p>
          </Card>
        </div>

        {/* Main Content Tabs - Mobile-Enhanced */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList 
            className="mb-[var(--spacing-lg)] sm:mb-[var(--spacing-xl)] w-full flex flex-wrap justify-center gap-[var(--spacing-xs)] sm:gap-[var(--spacing-sm)] p-[var(--spacing-sm)]" 
            bg="#ffffff"
            shadowColor="#c381b5"
          >
            <TabsTrigger value="toys" className="font-minecraft flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-black hover-lift uppercase tracking-wider">
              <span>🧸</span> <span className="hidden sm:inline">My </span>Toys
            </TabsTrigger>
            <TabsTrigger value="create" className="font-minecraft flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-black hover-lift uppercase tracking-wider">
              <span>✨</span> Create
            </TabsTrigger>
            <TabsTrigger value="devices" className="font-minecraft flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-black hover-lift uppercase tracking-wider">
              <span>📱</span> <span className="hidden sm:inline">Devices</span><span className="sm:hidden">Dev</span>
            </TabsTrigger>
            {isGuardianMode && (
              <TabsTrigger value="guardian" className="font-minecraft flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-black hover-lift uppercase tracking-wider">
                <span>🛡️</span> <span className="hidden sm:inline">Guardian</span><span className="sm:hidden">Guard</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="settings" className="font-minecraft flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-black hover-lift uppercase tracking-wider">
              <span>⚙️</span> <span className="hidden sm:inline">Settings</span><span className="sm:hidden">Set</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="toys">
            <MyToysGrid onCreateToy={() => setActiveTab('create')} />
          </TabsContent>

          <TabsContent value="create">
            <ToyWizard />
          </TabsContent>

          <TabsContent value="devices">
            <div className="space-y-8">
              <Card 
                bg="#ffffff" 
                borderColor="black" 
                shadowColor="#f7931e"
                className="p-[var(--spacing-xl)] text-center hover-lift"
              >
                <h2 className="font-minecraft text-base sm:text-lg lg:text-xl font-black mb-6 uppercase tracking-wider text-gray-800">Device Hub</h2>
                <div className="inline-block relative mb-8">
                  <span className="text-8xl">🔌</span>
                  <span className="absolute -bottom-2 -right-2 text-3xl animate-pulse">⚡</span>
                </div>
                <p className="font-geo text-base font-medium text-gray-700 mb-2">No devices connected</p>
                <p className="font-geo text-sm text-gray-600 mb-8">Connect a Raspberry Pi to bring your toys to life!</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    bg="#f7931e" 
                    textColor="white" 
                    shadow="#d47a1a"
                    borderColor="black"
                    className="font-minecraft font-black uppercase tracking-wider hover-lift"
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
                    className="font-minecraft font-black uppercase tracking-wider hover-lift"
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
                <h3 className="font-minecraft text-base sm:text-lg font-black mb-4 uppercase tracking-wider flex items-center gap-2 text-gray-800">
                  <span>📦</span> What You&apos;ll Need
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <span className="text-4xl block mb-2">🧠</span>
                    <p className="font-geo font-semibold text-gray-800">Raspberry Pi</p>
                    <p className="font-geo text-sm text-gray-600">Any model works!</p>
                  </div>
                  <div className="text-center">
                    <span className="text-4xl block mb-2">🎤</span>
                    <p className="font-geo font-semibold text-gray-800">Microphone</p>
                    <p className="font-geo text-sm text-gray-600">USB or GPIO</p>
                  </div>
                  <div className="text-center">
                    <span className="text-4xl block mb-2">🔊</span>
                    <p className="font-geo font-semibold text-gray-800">Speaker</p>
                    <p className="font-geo text-sm text-gray-600">3.5mm or Bluetooth</p>
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
              <h2 className="font-minecraft text-xl sm:text-2xl font-black mb-6">Interaction History</h2>
              <div className="text-center py-12 text-gray-500">
                <p className="font-geo">No interactions recorded yet.</p>
                <p className="font-geo mt-2">Voice interactions will appear here once your child starts using Pommai.</p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="max-w-5xl mx-auto space-y-8">
              <Card 
                bg="#ffffff" 
                borderColor="black" 
                shadowColor="#c381b5"
                className="p-8 hover-lift"
              >
                <div className="text-center mb-10">
                  <h2 className="font-minecraft text-base sm:text-lg lg:text-xl font-black mb-4 uppercase tracking-wider text-gray-800"
                    style={{
                      textShadow: '2px 2px 0 #c381b5'
                    }}
                  >
                    Settings & Account
                  </h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="font-minecraft font-black text-base uppercase tracking-wider flex items-center gap-2 text-gray-800">
                      <span className="text-2xl">👤</span> Profile
                    </h3>
                    
                    <Card
                      bg="#fef8e4"
                      borderColor="black"
                      shadowColor="#e0e0e0"
                      className="p-5 space-y-4"
                    >
                      <div>
                        <label className="font-geo block text-sm font-semibold mb-2 uppercase tracking-wider text-gray-700">Email</label>
                        <Input 
                          type="email" 
                          defaultValue="user@example.com" 
                          bg="#ffffff"
                          borderColor="black"
                          disabled
                          readOnly
                          className="font-geo font-medium"
                        />
                      </div>
                      
                      <div>
                        <label className="font-geo block text-sm font-semibold mb-2 uppercase tracking-wider text-gray-700">Username</label>
                        <Input 
                          defaultValue="PommaiParent123" 
                          bg="#ffffff"
                          borderColor="black"
                          className="font-geo font-medium"
                          onChange={(e: ChangeEvent<HTMLInputElement>) => console.log('Username changed:', e.target.value)}
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
                          <h4 className="font-minecraft font-black text-base uppercase tracking-wider mb-2">Free Plan</h4>
                          <p className="font-geo text-sm opacity-90">1 AI Toy • Basic Features</p>
                        </div>
                        <span className="text-3xl">🎆</span>
                      </div>
                      <Button 
                        bg="#92cd41" 
                        textColor="white" 
                        shadow="#76a83a"
                        borderColor="black"
                        className="mt-4 w-full font-minecraft font-black uppercase tracking-wider"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <span>🚀</span> Upgrade to Pro
                        </span>
                      </Button>
                    </Card>
                  </div>
                  
                  <div className="space-y-6">
                    <h3 className="font-minecraft font-black text-base uppercase tracking-wider flex items-center gap-2 text-gray-800">
                      <span className="text-2xl">🔔</span> Preferences
                    </h3>
                    
                    <Card
                      bg="#fef8e4"
                      borderColor="black"
                      shadowColor="#e0e0e0"
                      className="p-5"
                    >
                      <h4 className="font-minecraft font-black mb-4 uppercase tracking-wider flex items-center gap-2 text-gray-800">
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
                            <span className="font-geo flex-1 font-medium">{label}</span>
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
                      <h4 className="font-minecraft font-black mb-4 uppercase tracking-wider flex items-center gap-2 text-gray-800">
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
                            <span className="font-geo flex-1 font-medium">{label}</span>
                            <span className="text-xl">{icon}</span>
                          </label>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
                
                <div className="mt-10 pt-8 border-t-[5px] border-black flex justify-center gap-6">
                  <Button 
                    bg="#92cd41" 
                    textColor="white" 
                    shadow="#76a83a"
                    borderColor="black"
                    className="px-8 py-3 font-minecraft font-black uppercase tracking-wider hover-lift transition-transform"
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
                    className="px-8 py-3 font-minecraft font-black uppercase tracking-wider hover-lift"
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
