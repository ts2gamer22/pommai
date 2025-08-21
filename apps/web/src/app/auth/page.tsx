'use client';

import { useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/Tabs';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authClient.signIn.email(
        {
          email,
          password,
        },
        {
          onError: (ctx) => {
            console.error('Login error:', ctx.error);
            setError(ctx.error.message || 'Invalid email or password');
          },
        }
      );
      router.push('/dashboard');
    } catch (err) {
      console.error('Login catch error:', err);
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authClient.signUp.email(
        {
          email,
          password,
          name,
        },
        {
          onError: (ctx) => {
            console.error('Signup error:', ctx.error);
            setError(ctx.error.message || 'Failed to create account');
          },
        }
      );
      router.push('/dashboard');
    } catch (err) {
      console.error('Signup catch error:', err);
      setError('Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#92cd41' }}>
      {/* Header */}
      <header className="border-b-4 border-black bg-white">
        <div className="container mx-auto px-4 py-5">
          <Link href="/" className="flex items-center gap-3 justify-center">
            <img src="/pommaiicon.png" alt="Pommai Logo" className="h-12 w-12" />
            <img src="/pommaitext.png" alt="Pommai" className="h-10" />
          </Link>
        </div>
      </header>

      {/* Auth Form Container */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="relative">
          {/* Decorative elements */}
          <div className="absolute -top-20 -left-20 text-8xl animate-bounce opacity-50">🎮</div>
          <div className="absolute -bottom-16 -right-16 text-8xl animate-pulse opacity-50">🧸</div>
          
          <Card 
            bg="#ffffff" 
            borderColor="black" 
            shadowColor="#76a83a"
            className="w-full max-w-md p-0 overflow-hidden border-4"
          >
          {/* Colored Header Bar */}
          <div className="bg-gradient-to-r from-[#c381b5] to-[#8b5fa3] p-8 text-white">
            <h2 className="text-4xl font-bold mb-2 retro-text">
              Welcome to Pommai
            </h2>
            <p className="text-white/90 text-lg">Safe, AI-powered companions for children</p>
          </div>
          
          <div className="p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6 w-full grid grid-cols-2 h-14 p-0 bg-gray-100 border-2 border-black">
                <TabsTrigger 
                  value="login" 
                  className="text-lg font-bold h-full data-[state=active]:bg-[#c381b5] data-[state=active]:text-white border-r border-black"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="text-lg font-bold h-full data-[state=active]:bg-[#c381b5] data-[state=active]:text-white"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-black mb-2 uppercase tracking-widest text-black">
                    Email Address
                  </label>
                  <Input 
                    type="email" 
                    placeholder="parent@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    bg="#fefcd0"
                    borderColor="black"
                    className="text-base py-4 px-4 font-medium border-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-black mb-2 uppercase tracking-widest text-black">
                    Password
                  </label>
                  <Input 
                    type="password" 
                    placeholder="Enter your password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    bg="#fefcd0"
                    borderColor="black"
                    className="text-base py-4 px-4 font-medium border-2"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 mr-3 border-2 border-black rounded cursor-pointer" 
                    />
                    <span className="text-sm font-medium text-gray-700">Remember me</span>
                  </label>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm font-bold hover:underline" 
                    style={{ color: '#c381b5' }}
                  >
                    Forgot password?
                  </Link>
                </div>

                {error && (
                  <Card bg="#ffdddd" borderColor="#ff0000" shadowColor="#cc0000" className="p-4">
                    <p className="text-red-700 text-sm font-bold flex items-center">
                      <span className="text-xl mr-2">⚠️</span>
                      {error}
                    </p>
                  </Card>
                )}
                
                <div className="pt-4">
                  <Button 
                    type="submit"
                    bg="#c381b5" 
                    textColor="white" 
                    shadow="#8b5fa3"
                    borderColor="black"
                    className="w-full py-5 text-xl font-black tracking-wider border-2 hover:translate-y-[-2px] transition-transform"
                    disabled={loading}
                  >
                    {loading ? 'LOGGING IN...' : 'LOGIN TO DASHBOARD'}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-5">
                <div>
                  <label className="block text-xs font-black mb-2 uppercase tracking-widest text-black">
                    Full Name
                  </label>
                  <Input 
                    type="text" 
                    placeholder="John Doe" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    bg="#fefcd0"
                    borderColor="black"
                    className="text-base py-4 px-4 font-medium border-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-black mb-2 uppercase tracking-widest text-black">
                    Email Address
                  </label>
                  <Input 
                    type="email" 
                    placeholder="parent@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    bg="#fefcd0"
                    borderColor="black"
                    className="text-base py-4 px-4 font-medium border-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-black mb-2 uppercase tracking-widest text-black">
                    Password
                  </label>
                  <Input 
                    type="password" 
                    placeholder="Create a strong password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    bg="#fefcd0"
                    borderColor="black"
                    className="text-base py-4 px-4 font-medium border-2"
                    required
                  />
                  <p className="text-xs text-gray-600 mt-2 font-medium">
                    Must be at least 8 characters long
                  </p>
                </div>

                <div className="flex items-start pt-2">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 mt-0.5 mr-3 border-2 border-black rounded cursor-pointer" 
                    required 
                  />
                  <label className="text-sm font-medium text-gray-700">
                    I agree to the <Link href="/terms" className="font-bold hover:underline" style={{ color: '#c381b5' }}>Terms of Service</Link> and{' '}
                    <Link href="/privacy" className="font-bold hover:underline" style={{ color: '#c381b5' }}>Privacy Policy</Link>
                  </label>
                </div>

                {error && (
                  <Card bg="#ffdddd" borderColor="#ff0000" shadowColor="#cc0000" className="p-4">
                    <p className="text-red-700 text-sm font-bold flex items-center">
                      <span className="text-xl mr-2">⚠️</span>
                      {error}
                    </p>
                  </Card>
                )}
                
                <div className="pt-4">
                  <Button 
                    type="submit"
                    bg="#92cd41" 
                    textColor="white" 
                    shadow="#76a83a"
                    borderColor="black"
                    className="w-full py-5 text-xl font-black tracking-wider border-2 hover:translate-y-[-2px] transition-transform"
                    disabled={loading}
                  >
                    {loading ? 'CREATING ACCOUNT...' : 'CREATE FREE ACCOUNT'}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
          </div>
        </Card>
        </div>
      </div>
    </div>
  );
}
