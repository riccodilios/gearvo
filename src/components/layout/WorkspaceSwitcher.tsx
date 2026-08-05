'use client';

import { useTransition } from 'react';
import { switchWorkspace } from '@/app/actions/tenant';
import { useRouter } from 'next/navigation';

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
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-medium text-zinc-200">{companyName}</span>
      <select
        className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-300"
        disabled={pending || branches.length < 2}
        value={currentBranchId}
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
