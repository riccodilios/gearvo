'use client';

import { useTransition, useState } from 'react';
import { resetAndReseedDemo } from '@/app/actions/demo';
import { Button } from '@/components/ui/button';

export function ResetDemoButton({ compact }: { compact?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className={compact ? '' : 'rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6'}>
      {!compact && (
        <>
          <h2 className="text-lg font-semibold">Reset demo data</h2>
          <p className="mt-2 text-sm text-zinc-400">
            One click restores Al-Noor Auto Care to the original presentation dataset. Requires
            platform admin or demo company manager access.
          </p>
        </>
      )}
      <Button
        className={compact ? '' : 'mt-4'}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              const res = await resetAndReseedDemo();
              setMessage(res.message);
            } catch (e) {
              setMessage(e instanceof Error ? e.message : 'Reset failed');
            }
          })
        }
      >
        {pending ? 'Resetting demo…' : 'Reset demo data'}
      </Button>
      {message && <p className="mt-3 text-sm text-zinc-400">{message}</p>}
    </div>
  );
}
