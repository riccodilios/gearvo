'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
      <div className="flex flex-col items-center gap-3 rounded-lg border border-amber-900/50 bg-amber-950/20 p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <h1 className="text-xl font-semibold text-zinc-100">Something went wrong</h1>
        <p className="max-w-md text-sm text-zinc-400">
          A client error occurred. Try refreshing the page or going back to the dashboard.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
