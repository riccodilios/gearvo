'use client';

import type { ReactNode } from 'react';
import { FilterPendingProvider } from '@/components/ui/filter-pending';

export function EntityFilterShell({ children }: { children: ReactNode }) {
  return <FilterPendingProvider className="space-y-8">{children}</FilterPendingProvider>;
}
