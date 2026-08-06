'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

function isChunkLoadError(error: Error) {
  const name = error.name || '';
  const msg = error.message || '';
  return (
    name === 'ChunkLoadError' ||
    msg.includes('ChunkLoadError') ||
    msg.includes('Loading chunk') ||
    msg.includes('Failed to load chunk') ||
    msg.includes('error loading dynamically imported module')
  );
}

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Root error:', error);

    if (!isChunkLoadError(error)) return;

    // After a Netlify redeploy, open tabs keep HTML that points at deleted chunks.
    // One hard reload usually picks up the new build.
    const key = 'gearvo-chunk-reload';
    try {
      if (sessionStorage.getItem(key) === '1') return;
      sessionStorage.setItem(key, '1');
    } catch {
      // ignore
    }
    window.location.reload();
  }, [error]);

  const chunk = isChunkLoadError(error);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 px-4 text-zinc-50">
      <div className="flex flex-col items-center gap-3 rounded-lg border border-amber-900/50 bg-amber-950/20 p-8 text-center max-w-md">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <h1 className="text-xl font-semibold text-zinc-100">
          {chunk ? 'App update required' : 'Something went wrong'}
        </h1>
        <p className="text-sm text-zinc-400">
          {chunk
            ? 'A new version was deployed. Refresh the page to continue (your sign-in was saved).'
            : 'Something unexpected happened. Try again, or go home and sign in once more.'}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button
            onClick={() => {
              if (chunk) {
                window.location.reload();
                return;
              }
              reset();
            }}
            variant="default"
          >
            {chunk ? 'Refresh' : 'Try again'}
          </Button>
          <Button asChild variant="outline">
            <Link href="/welcome/setup">Continue setup</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
