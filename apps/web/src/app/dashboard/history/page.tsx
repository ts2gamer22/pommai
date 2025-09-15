'use client';

import { ConversationViewer } from '@/components/history/ConversationViewer';
import { Button } from '@pommai/ui';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * Conversation History Page
 * - Pixel title and token-based spacing.
 */
export default function ConversationHistoryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
<div className="container mx-auto px-[var(--spacing-md)] py-[var(--spacing-xl)] max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
<h1 className="font-minecraft text-base sm:text-lg lg:text-xl font-black text-gray-900">
                Conversation History
              </h1>
              <p className="text-gray-600 mt-2">
                View and analyze all conversations with your AI toys
              </p>
            </div>
          </div>
        </div>

        {/* Conversation Viewer */}
        <ConversationViewer isGuardianMode={true} />
      </div>
    </div>
  );
}
