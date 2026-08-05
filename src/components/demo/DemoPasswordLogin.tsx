'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSignIn, useAuth, SignOutButton } from '@clerk/nextjs';
import { enterDemoWithPassword } from '@/app/actions/demo-login';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function DemoPasswordLogin({
  defaultEmail = 'demo.owner@gearvo.app',
}: {
  defaultEmail?: string;
}) {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn } = useAuth();
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignedIn) {
      setError('Sign out of your current session first, then enter the demo.');
      return;
    }

    startTransition(async () => {
      if (!isLoaded || !signIn || !setActive) {
        setError('Auth is still loading. Try again in a moment.');
        return;
      }

      if (!password.trim()) {
        setError('Enter the demo password.');
        return;
      }

      const res = await enterDemoWithPassword(email, password);
      if (!res.ok) {
        setError(res.error);
        return;
      }

      try {
        const attempt = await signIn.create({
          strategy: 'ticket',
          ticket: res.ticket,
        });
        if (attempt.status === 'complete' && attempt.createdSessionId) {
          await setActive({ session: attempt.createdSessionId });
          router.push(res.redirectTo);
          router.refresh();
          return;
        }
        setError('Sign-in incomplete. Check credentials and try again.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Demo sign-in failed');
      }
    });
  };

  if (isSignedIn) {
    return (
      <div className="mt-4 space-y-3 rounded-xl border border-zinc-700 bg-zinc-950/60 p-4">
        <p className="text-sm text-zinc-300">
          You already have an active session. Sign out before entering the isolated demo account.
        </p>
        <SignOutButton redirectUrl="/demo">
          <Button type="button" variant="outline">
            Sign out
          </Button>
        </SignOutButton>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3" autoComplete="off">
      <div>
        <Label htmlFor="demo-email">Email</Label>
        <Input
          id="demo-email"
          type="email"
          name="demo-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1"
          autoComplete="off"
          required
        />
      </div>
      <div>
        <Label htmlFor="demo-password">Password</Label>
        <Input
          id="demo-password"
          type="password"
          name="demo-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1"
          autoComplete="new-password"
          placeholder="Enter demo password"
          required
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={pending || !isLoaded} className="w-full sm:w-auto">
        {pending ? 'Signing in…' : 'Enter demo (no OTP)'}
      </Button>
      <p className="text-xs text-zinc-500">
        Demo login only works here on <span className="text-zinc-300">/demo</span>. Regular Sign in
        never uses these tickets.
      </p>
    </form>
  );
}
