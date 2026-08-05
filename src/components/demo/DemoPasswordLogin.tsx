'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSignIn } from '@clerk/nextjs';
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
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('GearvoDemo2026!');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      if (!isLoaded || !signIn || !setActive) {
        setError('Auth is still loading. Try again in a moment.');
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
        setError('Sign-in incomplete. Try the regular sign-in page or contact support.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Demo sign-in failed');
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3">
      <div>
        <Label htmlFor="demo-email">Email</Label>
        <Input
          id="demo-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1"
          autoComplete="username"
          required
        />
      </div>
      <div>
        <Label htmlFor="demo-password">Password</Label>
        <Input
          id="demo-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1"
          autoComplete="current-password"
          required
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={pending || !isLoaded} className="w-full sm:w-auto">
        {pending ? 'Signing in…' : 'Enter demo (no OTP)'}
      </Button>
      <p className="text-xs text-zinc-500">
        Uses a one-time Clerk ticket so email OTP is skipped for these demo accounts only.
      </p>
    </form>
  );
}
