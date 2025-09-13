'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import { type Id } from '../../../../../../convex/_generated/dataModel';
import { EditToyForm } from '@/components/dashboard/EditToyForm';
import { Button, Card } from '@pommai/ui';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function EditToyPage() {
  const params = useParams();
  const router = useRouter();
  const toyId = params.toyId as Id<'toys'>;

  const toy = useQuery(api.toys.getToy, toyId ? { toyId } : 'skip');

  const renderContent = () => {
    if (toy === undefined) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-12 h-12 animate-spin text-[#c381b5]" />
          <p className="ml-4 font-minecraft text-lg">Loading Toy...</p>
        </div>
      );
    }

    if (toy === null) {
      return (
        <Card bg="#ffe4e1" borderColor="red" shadowColor="#ff6b6b" className="p-8 text-center">
          <h2 className="font-minecraft text-xl text-red-700 mb-4 uppercase tracking-wider">Toy Not Found</h2>
          <p className="font-geo text-gray-700 mb-6">
            We couldn't find the toy you're looking for. It might have been deleted.
          </p>
          <Button 
            onClick={() => router.push('/dashboard')}
            bg="#c381b5"
            textColor="white"
            borderColor="black"
            shadow="#8b5fa3"
            className="font-minecraft font-black uppercase tracking-wider hover-lift"
          >
            Back to Dashboard
          </Button>
        </Card>
      );
    }

    return <EditToyForm toy={toy} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fefcd0] to-[#f4e5d3] dashboard-page">
      <header className="border-b-[5px] border-black bg-white shadow-[0_4px_0_0_#c381b5]">
        <div className="container mx-auto px-[var(--spacing-md)] py-[var(--spacing-md)]">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3 hover-lift transition-transform">
              <Image src="/pommaiicon.png" alt="Pommai Logo" width={40} height={40} className="h-8 w-8 sm:h-10 sm:w-10 pixelated" />
              <Image src="/pommaitext.png" alt="Pommai" width={140} height={32} className="h-6 sm:h-8 pixelated hidden sm:block" />
            </Link>
            <Button
              onClick={() => router.push('/dashboard')}
              bg="#fefcd0"
              textColor="black"
              borderColor="black"
              shadow="#c381b5"
              className="py-2 px-3 sm:px-4 font-minecraft font-black uppercase tracking-wider hover-lift text-xs sm:text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Back to </span>Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-[var(--spacing-md)] max-w-4xl py-[var(--spacing-md)] sm:py-[var(--spacing-lg)]">
        <div className="mb-[var(--spacing-lg)]">
          <h1 className="font-minecraft text-lg sm:text-xl lg:text-2xl mb-2 sm:mb-4 uppercase tracking-wider text-gray-800"
            style={{
              textShadow: '2px 2px 0 #c381b5, 4px 4px 0 #92cd41'
            }}
          >
            Edit Toy
          </h1>
          <p className="font-geo text-gray-600 text-sm sm:text-base font-medium tracking-wide">
            Update your AI companion's personality and settings
          </p>
        </div>
        {renderContent()}
      </main>
    </div>
  );
}
