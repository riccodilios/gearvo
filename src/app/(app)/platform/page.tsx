import {
  listCompaniesForPlatform,
} from '@/app/actions/users';
import { requirePlatformAdmin } from '@/server/auth';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlatformCompanyActions } from '@/components/platform/PlatformCompanyActions';
import { SuspendToggle } from '@/components/platform/SuspendToggle';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';

export default async function PlatformAdminPage() {
  try {
    await requirePlatformAdmin();
  } catch {
    redirect('/dashboard');
  }

  const [companies, userCount, health] = await Promise.all([
    listCompaniesForPlatform(),
    prisma.user.count(),
    prisma.$queryRaw`SELECT 1 as ok`.then(() => true).catch(() => false),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Platform Admin"
        description="Manage companies, subscriptions, and system health"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Companies</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{companies.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Users</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{userCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Database</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={health ? 'default' : 'destructive'}>
              {health ? 'Healthy' : 'Down'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <PlatformCompanyActions />

      <Card>
        <CardHeader>
          <CardTitle>Companies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {companies.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 p-4"
            >
              <div>
                <p className="font-medium">
                  {c.name}{' '}
                  <span className="text-zinc-500 text-sm">/{c.slug}</span>
                </p>
                <p className="text-xs text-zinc-500">
                  {c._count.branches} branches · {c._count.memberships} members ·{' '}
                  {c._count.customers} customers · {c.plan}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={c.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {c.status}
                </Badge>
                <SuspendToggle companyId={c.id} status={c.status} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
