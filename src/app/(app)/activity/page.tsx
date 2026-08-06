import { getActivity } from '@/app/actions/workspace';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils';
import { Activity } from 'lucide-react';

export default async function ActivityPage() {
  const activity = await getActivity({ take: 100 });

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Activity timeline"
        description="Audit log of important business actions"
      />
      {activity.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-6 w-6" />}
          title="No activity yet"
          description="Actions like creating customers, repair orders, and payments will show up here."
        />
      ) : (
        <Card>
          <CardContent className="divide-y divide-zinc-800 p-0">
            {activity.map((a) => (
              <div key={a.id} className="px-4 py-3.5 sm:px-6 sm:py-4">
                <p className="text-[15px] font-medium leading-snug text-zinc-50 sm:text-base">
                  {a.summary}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  {a.action} · {a.entityType}
                  {a.entityId ? ` #${a.entityId.slice(0, 8)}` : ''} ·{' '}
                  {a.user?.fullName ?? 'System'} · {formatDateTime(a.createdAt)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
