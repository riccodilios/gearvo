'use client';

import { useTransition } from 'react';
import { updateIntegration } from '@/app/actions/workspace';
import type { IntegrationProvider, IntegrationStatus } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function IntegrationsPanel({
  integrations,
}: {
  integrations: {
    provider: IntegrationProvider;
    status: IntegrationStatus;
    name: string;
    description: string;
    category: string;
  }[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integration Center</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {integrations.map((i) => (
            <div
              key={i.provider}
              className="rounded-lg border border-zinc-800 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{i.name}</p>
                  <p className="text-xs text-zinc-500 capitalize">{i.category}</p>
                </div>
                <Badge variant="secondary">{i.status}</Badge>
              </div>
              <p className="text-sm text-zinc-400">{i.description}</p>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const next =
                      i.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED';
                    await updateIntegration(i.provider, next);
                  })
                }
              >
                {i.status === 'CONNECTED' ? 'Disconnect' : 'Connect (stub)'}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
