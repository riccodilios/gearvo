'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useFilterPending } from '@/components/ui/filter-pending';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { cn } from '@/lib/utils';

export function RepairOrdersSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isPending, startTransition } = useFilterPending();
  const q = searchParams.get('q') ?? '';

  const pushSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('q', value);
    else params.delete('q');
    startTransition(() => {
      router.push(`/repair-orders?${params.toString()}`);
    });
  }, 300);

  return (
    <div className={cn('relative max-w-sm', isPending && 'ring-1 ring-amber-500/30 rounded-md')}>
      <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <Input
        placeholder="Search by customer, order #, or description..."
        defaultValue={q}
        onChange={(e) => pushSearch(e.target.value)}
        className="ps-9"
        aria-busy={isPending}
      />
    </div>
  );
}
