'use client';

import { useState, useTransition } from 'react';
import { suspendCompany, activateCompany } from '@/app/actions/users';
import { useRouter } from 'next/navigation';
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

export function SuspendToggle({
  companyId,
  status,
}: {
  companyId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const isActive = status === 'ACTIVE';

  const handleToggle = () => {
    startTransition(async () => {
      try {
        if (isActive) await suspendCompany(companyId);
        else await activateCompany(companyId);
        toast.success(isActive ? 'Company suspended' : 'Company activated');
        setOpen(false);
        router.refresh();
      } catch {
        toast.error('Could not update company status');
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={pending}>
          {isActive ? 'Suspend' : 'Activate'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isActive ? 'Suspend this company?' : 'Activate this company?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isActive
              ? 'Suspended companies cannot sign in or use the workspace until reactivated.'
              : 'The company will regain full access to Gearvo.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="w-full sm:w-auto" disabled={pending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className={`w-full sm:w-auto ${isActive ? 'bg-red-600 hover:bg-red-700' : ''}`}
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              handleToggle();
            }}
          >
            {pending ? 'Updating…' : isActive ? 'Suspend' : 'Activate'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
