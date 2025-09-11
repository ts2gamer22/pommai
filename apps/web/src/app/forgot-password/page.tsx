'use client';

import { useState, type ChangeEvent } from 'react';
import { Card, Button, Input } from '@pommai/ui';
import { authClient } from '../../lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authClient.forgetPassword({
        email,
        redirectTo: '/reset-password',
      });
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#fefcd0] to-[#f4e5d3]">
      {/* Header */}
      <header className="border-b-4 border-black bg-white shadow-[0_4px_0_0_#c381b5]">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <Link href="/" className="flex items-center justify-center gap-2 sm:gap-3 hover-lift">
            <Image src="/pommaiicon.png" alt="Pommai Logo" width={48} height={48} className="h-10 w-10 sm:h-12 sm:w-12 pixelated" />
            <Image src="/pommaitext.png" alt="Pommai" width={160} height={40} className="h-8 sm:h-10 pixelated" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm">
          <Card 
            bg="#ffffff" 
            borderColor="black" 
            shadowColor="#c381b5"
            className="overflow-hidden hover-lift"
          >
            {/* Header Section */}
            <div className="bg-white border-b-4 border-black p-4 sm:p-5 text-center">
              <div className="text-6xl mb-3">🔒</div>
              <h1 className="text-xs font-minecraft font-black uppercase tracking-wider mb-1 text-[#c381b5]">
                Forgot Password?
              </h1>
              <p className="text-xs font-geo font-semibold uppercase tracking-wide text-gray-700">
                No worries! We&apos;ll help you reset it
              </p>
            </div>
            
            {/* Form Container */}
            <div className="p-4 sm:p-6">
              {!success ? (
                <form onSubmit={handleRequestReset} className="space-y-4">
                    <p className="text-xs font-geo font-medium uppercase tracking-wide text-gray-600 text-center">
                      Enter your email address and we&apos;ll send you a link to reset your password.
                    </p>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-geo font-semibold uppercase tracking-wider text-black">
                      Email Address
                    </label>
                    <Input 
                      type="email" 
                      placeholder="parent@example.com" 
                      value={email}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      bg="#fefcd0"
                      borderColor="black"
                      fontSize="12px"
                      className="text-xs py-1 px-2 font-minecraft font-medium border-2 w-full"
                      required
                    />
                  </div>

                  {error && (
                    <Card bg="#ffdddd" borderColor="red" shadowColor="#ff6b6b" className="p-3">
                      <p className="text-red-700 text-xs font-geo font-bold uppercase tracking-wide">
                        {error}
                      </p>
                    </Card>
                  )}
                  
                  <div className="space-y-3">
                    <Button 
                      type="submit"
                      bg="#e74c3c" 
                      textColor="white" 
                      shadow="#c0392b"
                      borderColor="black"
                      className="w-full py-3 text-xs sm:text-sm font-minecraft font-black tracking-wider border-2 hover:translate-y-[-2px] transition-transform"
                      disabled={isLoading}
                    >
                      {isLoading ? 'SENDING...' : 'SEND RESET LINK'}
                    </Button>
                    
                    <div className="text-center">
                      <Link 
                        href="/auth"
                        className="text-xs font-geo font-bold uppercase tracking-wider hover:underline transition-colors"
                        style={{ color: '#c381b5' }}
                      >
                        Back to Login
                      </Link>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="text-center space-y-4">
                  <div className="text-6xl mb-4">📧</div>
                  <h2 className="text-lg font-minecraft font-black uppercase tracking-wider text-[#92cd41]">
                    Check Your Email!
                  </h2>
                  <Card bg="#e8f6f3" borderColor="#27ae60" shadowColor="#27ae60" className="p-4">
                    <p className="text-green-700 text-xs font-geo font-semibold uppercase tracking-wide">
                      We&apos;ve sent a password reset link to:
                    </p>
                    <p className="text-sm font-minecraft font-bold text-black mt-2">
                      {email}
                    </p>
                  </Card>
                  <p className="text-xs font-geo font-medium uppercase tracking-wide text-gray-600">
                    The link will expire in 1 hour for security reasons.
                  </p>
                  <div className="pt-4">
                    <Button
                      onClick={() => router.push('/auth')}
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
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
