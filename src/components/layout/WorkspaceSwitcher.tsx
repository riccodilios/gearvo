'use client';

import { useTransition } from 'react';
import { switchWorkspace } from '@/app/actions/tenant';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from '@/components/ui/select';
import { toast } from '@/lib/mutation-toast';
import { formError } from '@/lib/form-error';
import { cn } from '@/lib/utils';

export function WorkspaceSwitcher({
  companyId,
  companyName,
  branches,
  currentBranchId,
}: {
  companyId: string;
  companyName: string;
  branches: { id: string; name: string }[];
  currentBranchId: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const current = branches.find((b) => b.id === currentBranchId);
  const canSwitch = branches.length > 1;

  if (!canSwitch) {
    return (
      <div
        className={cn(
          'inline-flex max-w-[8.5rem] items-center gap-1.5 rounded-full border border-zinc-800/80 bg-zinc-900/70 px-2 py-1 text-[11px] text-zinc-400 sm:max-w-[14rem] sm:gap-2 sm:rounded-lg sm:px-2.5 sm:py-1.5 sm:text-xs'
        )}
        title={current?.name ?? 'Branch'}
      >
        <MapPin className="h-3 w-3 shrink-0 text-amber-500/80 sm:h-3.5 sm:w-3.5" aria-hidden />
        <span className="truncate font-medium text-zinc-300">{current?.name ?? 'Branch'}</span>
      </div>
    );
  }

  return (
    <Select
      value={currentBranchId}
      disabled={pending}
      onValueChange={(branchId) => {
        if (branchId === currentBranchId) return;
        const next = branches.find((b) => b.id === branchId);
        startTransition(async () => {
          try {
            await switchWorkspace(companyId, branchId);
            toast.success(next ? `Switched to ${next.name}` : 'Branch updated');
            router.refresh();
          } catch (err) {
            toast.error(formError(err));
          }
        });
      }}
    >
      <SelectTrigger
        aria-label="Switch branch"
        className={cn(
          'h-8 max-w-[8.75rem] justify-start gap-1 rounded-full border-zinc-800/80 bg-zinc-900/80 px-2 text-[11px] shadow-none touch-manipulation',
          'focus:ring-1 focus:ring-amber-500/50 focus:ring-offset-0 focus:ring-offset-transparent',
          'data-[state=open]:border-amber-500/40 data-[state=open]:bg-zinc-900',
          'sm:h-9 sm:max-w-[13rem] sm:gap-1.5 sm:rounded-lg sm:px-2.5 sm:text-xs',
          '[&>span]:min-w-0 [&>span]:flex-1 [&>span]:truncate',
          '[&_svg:last-child]:ms-0.5 [&_svg:last-child]:h-3 [&_svg:last-child]:w-3 [&_svg:last-child]:opacity-60 sm:[&_svg:last-child]:h-3.5 sm:[&_svg:last-child]:w-3.5',
          pending && 'opacity-60'
        )}
      >
        <MapPin className="h-3 w-3 shrink-0 text-amber-500 sm:h-3.5 sm:w-3.5" aria-hidden />
        <SelectValue placeholder="Branch" />
      </SelectTrigger>
      <SelectContent
        align="end"
        className="min-w-[12rem] rounded-xl border-zinc-800 bg-zinc-950/98 p-1 shadow-xl shadow-black/40 backdrop-blur-md sm:min-w-[14rem]"
      >
        <SelectGroup>
          <SelectLabel className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:text-[11px]">
            {companyName}
          </SelectLabel>
          {branches.map((b) => (
            <SelectItem
              key={b.id}
              value={b.id}
              className="cursor-pointer rounded-lg py-2 pl-8 pr-2 text-sm focus:bg-amber-600/15 focus:text-amber-100"
            >
              {b.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
