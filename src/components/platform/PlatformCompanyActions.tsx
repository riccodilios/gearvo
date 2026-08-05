'use client';

import { useTransition } from 'react';
import { resetAndReseedDemo } from '@/app/actions/demo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GearvoMark } from '@/components/brand/GearvoLogo';

export function PlatformCompanyActions() {
  const [pending, startTransition] = useTransition();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GearvoMark className="h-7 w-7" />
          Demo environment
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await resetAndReseedDemo();
              alert(res.message);
            })
          }
        >
          {pending ? 'Resetting…' : 'Reset demo data'}
        </Button>
        <p className="text-sm text-zinc-500">
          One-click restore of Al-Noor Auto Care (slug: demo-auto) with full presentation data.
        </p>
      </CardContent>
    </Card>
  );
}
