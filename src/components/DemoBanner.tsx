'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export function DemoBanner() {
  return (
    <div className="border-b border-amber-900/50 bg-amber-950/30 px-4 py-3">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Demo mode: data is not saved. Connect PostgreSQL and create your shop to save customers, orders, and more.
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
