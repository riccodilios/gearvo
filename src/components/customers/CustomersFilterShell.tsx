'use client';

import type { ReactNode } from 'react';
import { FilterPendingProvider } from '@/components/ui/filter-pending';

/** Client shell so customer search pending state dims the list. */
export function CustomersFilterShell({ children }: { children: ReactNode }) {
  return <FilterPendingProvider className="space-y-8">{children}</FilterPendingProvider>;
}
