'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SignOutButton } from '@clerk/nextjs';
import { Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DISMISS_KEY = 'gearvo-demo-banner-dismissed';

/** Compact, dismissible notice for the Al-Noor presentation company. */
export function PresentationDemoBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      // ignore
    }
    setVisible(true);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
  };

  if (!visible) return null;

  return (
    <div
      role="status"
      className="border-b border-sky-500/25 bg-sky-950/40 px-3 py-2 text-sky-50 sm:px-4"
      style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
    >
      <div className="mx-auto flex max-w-6xl items-start gap-2 sm:items-center">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-400 sm:mt-0" aria-hidden />
        <p className="min-w-0 flex-1 text-xs leading-snug text-sky-100/90 sm:text-sm">
          <span className="font-medium text-sky-50">Demo data</span>
          <span className="text-sky-200/80"> — Al-Noor sample shop. </span>
          <SignOutButton redirectUrl="/">
            <button
              type="button"
              className="font-medium text-sky-300 underline-offset-2 hover:underline"
            >
              Sign out
            </button>
          </SignOutButton>
          <span className="text-sky-200/80"> before a real account. </span>
          <Link
            href="/demo"
            className="font-medium text-sky-300 underline-offset-2 hover:underline"
          >
            Demo home
          </Link>
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-sky-300 hover:bg-sky-900/50 hover:text-sky-50"
          onClick={dismiss}
          aria-label="Dismiss demo notice"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
