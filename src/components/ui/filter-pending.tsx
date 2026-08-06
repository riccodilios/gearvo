'use client';

import {
  createContext,
  useContext,
  useTransition,
  type ReactNode,
  type TransitionStartFunction,
} from 'react';
import { cn } from '@/lib/utils';

type FilterPendingValue = {
  isPending: boolean;
  startTransition: TransitionStartFunction;
};

const FilterPendingContext = createContext<FilterPendingValue | null>(null);

/** Wraps list/filter UIs so search transitions dim content immediately. */
export function FilterPendingProvider({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <FilterPendingContext.Provider value={{ isPending, startTransition }}>
      <div
        className={cn(
          'transition-opacity duration-150',
          isPending && 'opacity-60',
          className
        )}
        aria-busy={isPending}
      >
        {children}
      </div>
    </FilterPendingContext.Provider>
  );
}

export function useFilterPending() {
  const ctx = useContext(FilterPendingContext);
  if (!ctx) {
    throw new Error('useFilterPending must be used within FilterPendingProvider');
  }
  return ctx;
}
