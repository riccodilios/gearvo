'use client';

import { useTransition, useState } from 'react';
import { resetAndReseedDemo } from '@/app/actions/demo';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/lib/mutation-toast';

export function ResetDemoButton({ compact }: { compact?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleReset = () => {
    startTransition(async () => {
      try {
        const res = await resetAndReseedDemo();
        setMessage(res.message);
        toast.success('Demo data reset');
        setOpen(false);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Reset failed';
        setMessage(msg);
        toast.error(msg);
      }
    });
  };

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
      <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
        <AlertDialogTrigger asChild>
          <Button className={compact ? '' : 'mt-4'} disabled={pending}>
            {pending ? 'Resetting demo…' : 'Reset demo data'}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset demo data?</AlertDialogTitle>
            <AlertDialogDescription>
              This replaces all Al-Noor demo records with the original sample dataset. Any
              changes made during the presentation will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="w-full sm:w-auto" disabled={pending}>
              Keep current data
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full bg-red-600 hover:bg-red-700 sm:w-auto"
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                handleReset();
              }}
            >
              {pending ? 'Resetting…' : 'Reset now'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {message && <p className="mt-3 text-sm text-zinc-400">{message}</p>}
    </div>
  );
}
