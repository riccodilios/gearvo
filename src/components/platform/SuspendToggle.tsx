'use client';

import { useTransition } from 'react';
import { suspendCompany, activateCompany } from '@/app/actions/users';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function SuspendToggle({
  companyId,
  status,
}: {
  companyId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          if (status === 'ACTIVE') await suspendCompany(companyId);
          else await activateCompany(companyId);
          router.refresh();
        })
      }
    >
      {status === 'ACTIVE' ? 'Suspend' : 'Activate'}
    </Button>
  );
}
