'use client';

import { useTransition } from 'react';
import { toggleFeature } from '@/app/actions/workspace';
import type { FeatureModule } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function FeatureFlagsPanel({
  features,
}: {
  features: { feature: FeatureModule; enabled: boolean }[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature modules</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 sm:grid-cols-2">
          {features.map((f) => (
            <li
              key={f.feature}
              className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{f.feature}</span>
                <Badge variant={f.enabled ? 'default' : 'secondary'}>
                  {f.enabled ? 'On' : 'Off'}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await toggleFeature(f.feature, !f.enabled);
                  })
                }
              >
                {f.enabled ? 'Disable' : 'Enable'}
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
