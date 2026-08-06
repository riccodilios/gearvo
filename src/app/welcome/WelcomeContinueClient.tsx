'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth, useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type ContinueResult = {
  destination: '/sign-in' | '/welcome/setup' | '/dashboard';
  error?: string;
};

async function continueAfterAuth(sessionToken: string | null): Promise<ContinueResult> {
  if (!sessionToken) {
    return { destination: '/sign-in', error: 'Missing Clerk session token.' };
  }
  const res = await fetch('/api/auth/continue', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sessionToken}` },
    credentials: 'same-origin',
  });
  const data = (await res.json().catch(() => ({}))) as ContinueResult;
  return {
    destination: data.destination || '/sign-in',
    error: data.error,
  };
}

function hasClerkHandshakeParams() {
  if (typeof window === 'undefined') return false;
  const q = new URLSearchParams(window.location.search);
  return (
    q.has('__clerk_handshake') ||
    q.has('__clerk_db_jwt') ||
    q.has('__clerk_ticket')
  );
}

export function WelcomeContinueClient() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { signOut } = useClerk();
  const [message, setMessage] = useState('Finishing sign-in…');
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  const finish = async () => {
    const sessionToken = await getToken().catch(() => null);
    const result = await continueAfterAuth(sessionToken);
    if (result.error && result.destination === '/sign-in') {
      setError(result.error);
      setMessage('Sign-in incomplete');
      return;
    }
    window.location.assign(result.destination);
  };

  useEffect(() => {
    if (!isLoaded || ran.current) return;

    if (!isSignedIn) {
      if (hasClerkHandshakeParams()) {
        setMessage('Completing secure handshake…');
        return;
      }
      ran.current = true;
      window.location.replace('/sign-in');
      return;
    }

    ran.current = true;
    let cancelled = false;

    (async () => {
      if (hasClerkHandshakeParams()) {
        window.history.replaceState({}, '', '/welcome');
      }
      await finish();
    })().catch((err) => {
      console.error(err);
      if (!cancelled) {
        setError('Something went wrong finishing sign-in.');
        setMessage('Sign-in incomplete');
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-4 text-center text-zinc-50">
      <p className="text-sm text-zinc-400">{message}</p>
      {error && (
        <div className="max-w-md space-y-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
          <p className="text-sm text-amber-100">{error}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              type="button"
              onClick={() => {
                ran.current = false;
                setError(null);
                setMessage('Retrying…');
                void finish().finally(() => {
                  ran.current = true;
                });
              }}
            >
              Try again
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void (async () => {
                  try {
                    await fetch('/api/auth/continue', {
                      method: 'DELETE',
                      credentials: 'same-origin',
                    });
                  } catch {
                    // ignore
                  }
                  try {
                    await signOut();
                  } catch {
                    // ignore
                  }
                  window.location.assign('/sign-in');
                })();
              }}
            >
              Sign out
            </Button>
            <Button asChild variant="ghost">
              <Link href="/welcome/setup">Create a shop</Link>
            </Button>
          </div>
        </div>
      )}
      {!error && (
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      )}
    </div>
  );
}
