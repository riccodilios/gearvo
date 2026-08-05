import { getActivity } from '@/app/actions/workspace';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils';

export default async function ActivityPage() {
  const activity = await getActivity({ take: 100 });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Activity timeline"
        description="Audit log of important business actions"
      />
      <Card>
        <CardContent className="divide-y divide-zinc-800 p-0">
          {activity.length === 0 ? (
            <p className="p-6 text-sm text-zinc-500">No activity recorded yet.</p>
          ) : (
            activity.map((a) => (
              <div key={a.id} className="px-6 py-4">
                <p className="font-medium">{a.summary}</p>
                <p className="text-xs text-zinc-500">
                  {a.action} · {a.entityType}
                  {a.entityId ? ` #${a.entityId.slice(0, 8)}` : ''} ·{' '}
                  {a.user?.fullName ?? 'System'} · {formatDateTime(a.createdAt)}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
