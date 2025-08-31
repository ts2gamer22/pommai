'use client';

import { useState } from 'react';
import { Card, Button, Input } from '@pommai/ui';
import { authClient } from '@/lib/auth-client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setNeedsVerification(false);

    try {
      await authClient.signIn.email(
        {
          email,
          password,
          callbackURL: '/dashboard',
        },
        {
          onSuccess: () => {
            router.push('/dashboard');
          },
          onError: (ctx) => {
            // Handle email verification error
            if (ctx.error.status === 403) {
              setNeedsVerification(true);
              setError('Please verify your email address before signing in. Check your inbox for the verification link.');
            } else {
              setError(ctx.error.message || 'Invalid email or password');
            }
          },
        }
      );
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setVerificationSent(false);

    try {
      const { data, error: signupError } = await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: '/dashboard',
      });

      if (signupError) {
        setError(signupError.message || 'Failed to create account');
      } else {
        // Show verification message
        setVerificationSent(true);
        setActiveTab('verification');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError(null);
    setIsLoading(true);

    try {
      await authClient.sendVerificationEmail({
        email,
        callbackURL: '/dashboard',
      });
      setVerificationSent(true);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page min-h-screen flex flex-col bg-gradient-to-br from-[#fefcd0] to-[#f4e5d3]">
      {/* Header */}
      <header className="border-b-4 border-black bg-white shadow-[0_4px_0_0_#c381b5]">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <Link href="/" className="flex items-center justify-center gap-2 sm:gap-3 hover-lift">
            <img src="/pommaiicon.png" alt="Pommai Logo" className="h-10 w-10 sm:h-12 sm:w-12 pixelated" />
            <img src="/pommaitext.png" alt="Pommai" className="h-8 sm:h-10 pixelated" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm relative">
          {/* Decorative elements removed for cleaner UI */}
          
          <Card 
            bg="#ffffff" 
            borderColor="black" 
            shadowColor="#c381b5"
            className="overflow-hidden hover-lift"
          >
            {/* Header Section */}
            <div className="bg-white border-b-4 border-black p-4 sm:p-5 text-center">
              <h1 className="text-xs font-minecraft font-black uppercase tracking-wider mb-1 text-[#c381b5] main-title">Welcome to Pommai</h1>
              <p className="text-xs font-geo font-semibold uppercase tracking-wide text-gray-700">Safe AI Companions for Children</p>
            </div>
            
            {/* Form Container */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Button Navigation */}
              <div className="flex gap-3 justify-center mb-6">
                <Button
                  onClick={() => setActiveTab('login')}
                  bg={activeTab === 'login' ? '#c381b5' : '#fefcd0'}
                  textColor={activeTab === 'login' ? 'white' : 'black'}
                  shadow={activeTab === 'login' ? '#8b5fa3' : '#c381b5'}
                  borderColor="black"
                  className="text-xs font-minecraft font-black tracking-wider border-2 px-8 py-3 hover:translate-y-[-2px] transition-transform touch-manipulation"
                >
                  LOGIN
                </Button>
                <Button
                  onClick={() => setActiveTab('signup')}
                  bg={activeTab === 'signup' ? '#c381b5' : '#fefcd0'}
                  textColor={activeTab === 'signup' ? 'white' : 'black'}
                  shadow={activeTab === 'signup' ? '#8b5fa3' : '#c381b5'}
                  borderColor="black"
                  className="text-xs font-minecraft font-black tracking-wider border-2 px-8 py-3 hover:translate-y-[-2px] transition-transform touch-manipulation"
                >
                  SIGN UP
                </Button>
              </div>

              {activeTab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-geo font-semibold uppercase tracking-wider text-black">
                        Email Address
                      </label>
                      <Input 
                        type="email" 
                        placeholder="parent@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        bg="#fefcd0"
                        borderColor="black"
                        fontSize="12px"
                        className="text-xs py-1 px-2 font-minecraft font-medium border-2 w-full"
                        required
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-geo font-semibold uppercase tracking-wider text-black">
                        Password
                      </label>
                      <Input 
                        type="password" 
                        placeholder="Enter your password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        bg="#fefcd0"
                        borderColor="black"
                        fontSize="12px"
                        className="text-xs py-1 px-2 font-minecraft font-medium border-2 w-full"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center cursor-pointer gap-2">
                        <input 
                          type="checkbox" 
                          className="w-3 h-3 border-2 border-black" 
                        />
                        <span className="text-xs font-geo font-semibold uppercase tracking-wide text-gray-700">Remember me</span>
                      </label>
                      <Link 
                        href="/forgot-password" 
                        className="text-xs font-geo font-bold uppercase tracking-wider hover:underline transition-colors" 
                        style={{ color: '#c381b5' }}
                      >
                        Forgot password?
                      </Link>
                    </div>

                    {error && (
                      <Card bg="#ffdddd" borderColor="red" shadowColor="#ff6b6b" className="p-4">
                        <p className="text-red-700 text-xs font-geo font-bold uppercase tracking-wide">
                          ERROR: {typeof error === 'string' ? error : 'Authentication failed'}
                        </p>
                        {needsVerification && (
                          <Button
                            onClick={handleResendVerification}
                            bg="#fefcd0"
                            textColor="black"
                            shadow="#f39c12"
                            borderColor="black"
                            className="mt-3 text-xs font-minecraft font-black tracking-wider border-2 px-4 py-2 hover:translate-y-[-2px] transition-transform"
                            disabled={isLoading}
                          >
                            RESEND VERIFICATION EMAIL
                          </Button>
                        )}
                      </Card>
                    )}
                    
                    <div className="pt-2">
                      <Button 
                        type="submit"
                        bg="#c381b5" 
                        textColor="white" 
                        shadow="#8b5fa3"
                        borderColor="black"
                        className="w-full py-3 text-xs sm:text-sm font-minecraft font-black tracking-wider border-2 hover:translate-y-[-2px] transition-transform touch-manipulation"
                        disabled={isLoading}
                      >
                        {isLoading ? 'LOGGING IN...' : 'LOGIN TO DASHBOARD'}
                      </Button>
                    </div>
                  </form>
              )}

              {activeTab === 'verification' && (
                <div className="text-center space-y-4">
                  <div className="text-6xl mb-4">📧</div>
                  <h2 className="text-lg font-minecraft font-black uppercase tracking-wider text-[#c381b5]">
                    Check Your Email!
                  </h2>
                  <p className="text-xs font-geo font-semibold uppercase tracking-wide text-gray-700">
                    We've sent a verification link to:
                  </p>
                  <p className="text-sm font-minecraft font-bold text-black">
                    {email}
                  </p>
                  <Card bg="#e8f6f3" borderColor="#27ae60" shadowColor="#27ae60" className="p-4 mt-4">
                    <p className="text-green-700 text-xs font-geo font-semibold uppercase tracking-wide">
                      ✅ Please check your inbox and click the verification link to activate your account.
                    </p>
                  </Card>
                  <div className="space-y-3 mt-6">
                    <p className="text-xs font-geo font-medium uppercase tracking-wide text-gray-600">
                      Didn't receive the email?
                    </p>
                    <Button
                      onClick={handleResendVerification}
                      bg="#fefcd0"
                      textColor="black"
                      shadow="#c381b5"
                      borderColor="black"
                      className="text-xs font-minecraft font-black tracking-wider border-2 px-6 py-2 hover:translate-y-[-2px] transition-transform"
                      disabled={isLoading}
                    >
                      {isLoading ? 'SENDING...' : 'RESEND VERIFICATION EMAIL'}
                    </Button>
                    {verificationSent && (
                      <p className="text-xs font-geo font-semibold uppercase tracking-wide text-green-600">
                        ✓ Verification email sent successfully!
                      </p>
                    )}
                  </div>
                  <div className="mt-6 pt-4 border-t-2 border-gray-200">
                    <Button
                      onClick={() => {
                        setActiveTab('login');
                        setVerificationSent(false);
                        setError(null);
                      }}
                      bg="#c381b5"
                      textColor="white"
                      shadow="#8b5fa3"
                      borderColor="black"
                      className="text-xs font-minecraft font-black tracking-wider border-2 px-6 py-2 hover:translate-y-[-2px] transition-transform"
                    >
                      BACK TO LOGIN
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'signup' && (
                <div>
                  <form onSubmit={handleSignup} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-geo font-semibold uppercase tracking-wider text-black">
                        Full Name
                      </label>
                      <Input 
                        type="text" 
                        placeholder="John Doe" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        bg="#fefcd0"
                        borderColor="black"
                        fontSize="12px"
                        className="text-xs py-1 px-2 font-minecraft font-medium border-2 w-full"
                        required
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-geo font-semibold uppercase tracking-wider text-black">
                        Email Address
                      </label>
                      <Input 
                        type="email" 
                        placeholder="parent@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        bg="#fefcd0"
                        borderColor="black"
                        fontSize="12px"
                        className="text-xs py-1 px-2 font-minecraft font-medium border-2 w-full"
                        required
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-geo font-semibold uppercase tracking-wider text-black">
                        Password
                      </label>
                      <Input 
                        type="password" 
                        placeholder="Create a strong password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        bg="#fefcd0"
                        borderColor="black"
                        fontSize="12px"
                        className="text-xs py-1 px-2 font-minecraft font-medium border-2 w-full"
                        required
                      />
                      <p className="text-xs font-geo font-medium uppercase tracking-wide text-gray-600">
                        Must be at least 8 characters long
                      </p>
                    </div>

                    <div className="flex items-start pt-1 gap-2">
                      <input 
                        type="checkbox" 
                        className="w-3 h-3 border-2 border-black mt-1" 
                        required 
                      />
                      <label className="text-xs font-geo font-semibold uppercase tracking-wide text-gray-700 leading-relaxed">
                        I agree to the{' '}
                        <Link href="/terms" className="font-geo font-bold hover:underline transition-colors" style={{ color: '#c381b5' }}>Terms of Service</Link>
                        {' '}and{' '}
                        <Link href="/privacy" className="font-geo font-bold hover:underline transition-colors" style={{ color: '#c381b5' }}>Privacy Policy</Link>
                      </label>
                    </div>

                    {error && (
                      <Card bg="#ffdddd" borderColor="red" shadowColor="#ff6b6b" className="p-4">
                        <p className="text-red-700 text-xs font-geo font-bold uppercase tracking-wide">
                          ERROR: {typeof error === 'string' ? error : 'Account creation failed'}
                        </p>
                      </Card>
                    )}
                    
                    <div className="pt-2">
                      <Button 
                        type="submit"
                        bg="#92cd41" 
                        textColor="white" 
                        shadow="#76a83a"
                        borderColor="black"
                        className="w-full py-3 text-xs sm:text-sm font-minecraft font-black tracking-wider border-2 hover:translate-y-[-2px] transition-transform touch-manipulation"
                        disabled={isLoading}
                      >
                        {isLoading ? 'CREATING ACCOUNT...' : 'CREATE FREE ACCOUNT'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
