'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useCallback, useTransition } from 'react';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/provider';

export function SuppliersSearch() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const pushSearch = useDebouncedCallback((value: string) => {
    startTransition(() => {
      router.push(`/suppliers?${createQueryString('q', value)}`);
    });
  }, 300);

  return (
    <div
      className={cn(
        'relative max-w-sm transition-opacity',
        isPending && 'opacity-60 ring-1 ring-amber-500/30 rounded-md'
      )}
    >
      <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <Input
        placeholder={t.ui.searchSuppliers}
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(e) => pushSearch(e.target.value)}
        className="ps-9"
        aria-busy={isPending}
      />
    </div>
  );
}
