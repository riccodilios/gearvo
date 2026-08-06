'use client';

import { useTransition } from 'react';
import { switchWorkspace } from '@/app/actions/tenant';
import { useRouter } from 'next/navigation';
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

  return (
    <div className="flex max-w-[11rem] items-center gap-1.5 text-sm sm:max-w-none">
      <span className="hidden truncate font-medium text-zinc-200 md:inline md:max-w-[8rem] lg:max-w-[12rem]">
        {companyName}
      </span>
      <select
        className={cn(
          'max-w-[9.5rem] touch-manipulation truncate rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 sm:max-w-[12rem] sm:text-sm',
          'focus:outline-none focus:ring-2 focus:ring-amber-500/40'
        )}
        disabled={pending || branches.length < 2}
        value={currentBranchId}
        aria-label="Branch"
        onChange={(e) =>
          startTransition(async () => {
            await switchWorkspace(companyId, e.target.value);
            router.refresh();
          })
        }
      >
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </div>
  );
}
