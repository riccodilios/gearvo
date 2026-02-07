'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Root error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 px-4 text-zinc-50">
      <div className="flex flex-col items-center gap-3 rounded-lg border border-amber-900/50 bg-amber-950/20 p-8 text-center max-w-md">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <h1 className="text-xl font-semibold text-zinc-100">Something went wrong</h1>
        <p className="text-sm text-zinc-400">
          A server error occurred. If you just deployed, check that all environment variables are set (e.g. DATABASE_URL, Clerk keys on Netlify) and try again.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
