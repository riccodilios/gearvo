'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/provider';

export function InventorySearchFilter({
  categories,
}: {
  categories: string[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const q = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? 'all';

  const pushSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('q', value);
    else params.delete('q');
    startTransition(() => {
      router.push(`/inventory?${params.toString()}`);
    });
  }, 300);

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') params.set('category', value);
    else params.delete('category');
    startTransition(() => {
      router.push(`/inventory?${params.toString()}`);
    });
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center transition-opacity duration-150',
        isPending && 'opacity-60'
      )}
      aria-busy={isPending}
    >
      <div className="relative max-w-sm flex-1">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          placeholder={t.ui.searchInventory}
          defaultValue={q}
          onChange={(e) => pushSearch(e.target.value)}
          className="ps-9"
        />
      </div>
      <Select value={category} onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-full touch-manipulation sm:w-[180px]">
          <SelectValue placeholder={t.ui.category} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t.ui.allCategories}</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
