'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { SignOutButton } from '@clerk/nextjs';

/** Shown when there is no workspace (empty auth / missing company). */
export function DemoBanner() {
  return (
    <div className="border-b border-amber-900/50 bg-amber-950/30 px-4 py-3">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Demo mode: data is not saved. Connect PostgreSQL and create your shop to save customers,
            orders, and more.
          </span>
        </div>
        <Link
          href="/welcome/setup"
          className="shrink-0 text-sm font-medium text-amber-500 underline hover:text-amber-400"
        >
          Set up my shop
        </Link>
      </div>
    </div>
  );
}

/** Shown inside the isolated Al-Noor presentation company. */
export function PresentationDemoBanner() {
  return (
    <div className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-2.5">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-amber-100">
          <span className="font-semibold">Presentation demo</span>
          {' — '}
          Al-Noor Auto Care is sample data. Sign out before using your real Gearvo account.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/demo" className="font-medium text-amber-300 underline hover:text-amber-200">
            Demo home
          </Link>
          <SignOutButton redirectUrl="/">
            <button type="button" className="font-medium text-zinc-200 underline hover:text-white">
              Sign out
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
