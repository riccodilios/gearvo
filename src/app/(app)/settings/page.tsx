import { getActivity, getFeatures, getIntegrations, listBranches } from '@/app/actions/workspace';
import { getTeamUsers } from '@/app/actions/users';
import { getWorkspaceContext } from '@/server/auth';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { currentUser } from '@clerk/nextjs/server';
import { formatDateTime } from '@/lib/utils';
import { CompanySettingsForm } from '@/components/settings/CompanySettingsForm';
import { FeatureFlagsPanel } from '@/components/settings/FeatureFlagsPanel';
import { IntegrationsPanel } from '@/components/settings/IntegrationsPanel';
import { BranchManager } from '@/components/settings/BranchManager';
import { getT } from '@/i18n/server';

export default async function SettingsPage() {
  const ctx = await getWorkspaceContext();
  const [t, team, features, integrations, branches, activity, clerkUser] =
    await Promise.all([
      getT(),
      getTeamUsers(),
      getFeatures(),
      getIntegrations(),
      listBranches(),
      getActivity({ take: 10 }),
      currentUser().catch(() => null),
    ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t.app.settings}
        description={t.ui.settingsDesc}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.ui.account}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {clerkUser ? (
              <>
                <p>
                  <span className="text-zinc-500">{t.ui.signedInAs} </span>
                  {clerkUser.primaryEmailAddress?.emailAddress}
                </p>
                <p className="text-zinc-500">
                  {t.ui.roleLabel}: {ctx?.role?.replace(/_/g, ' ') ?? '—'}
                </p>
              </>
            ) : (
              <p className="text-zinc-500">
                Dev mode — Clerk not configured. Set ALLOW_DEV_AUTH_BYPASS=true
                and seed the demo user.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.ui.subscription}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge>{ctx?.company.plan ?? 'TRIAL'}</Badge>
            <p className="text-sm text-zinc-500">
              {t.ui.billingHint}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/settings#integrations">{t.ui.openIntegrationCenter}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {ctx && (
        <>
          <CompanySettingsForm
            initial={{
              name: ctx.company.name,
              email: ctx.company.email ?? '',
              phone: ctx.company.phone ?? '',
              address: ctx.company.address ?? '',
              commercialRegNumber: ctx.company.commercialRegNumber ?? '',
              vatNumber: ctx.company.vatNumber ?? '',
              currency: ctx.company.currency,
              locale: ctx.company.locale,
            }}
          />

          <BranchManager
            companyId={ctx.company.id}
            branches={branches.map((b) => ({
              id: b.id,
              name: b.name,
              slug: b.slug,
              isDefault: b.isDefault,
              isArchived: b.isArchived,
              address: b.address,
            }))}
          />
        </>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Team</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/employees">Manage employees</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {team.length === 0 ? (
            <p className="text-sm text-zinc-500">No team members yet.</p>
          ) : (
            <ul className="space-y-2">
              {team.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2 text-sm"
                >
                  <span>
                    {m.user.fullName}{' '}
                    <span className="text-zinc-500">({m.user.email})</span>
                  </span>
                  <Badge variant="secondary">
                    {m.role.replace(/_/g, ' ')}
                    {m.branch ? ` · ${m.branch.name}` : ' · All branches'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <FeatureFlagsPanel
        features={features.map((f) => ({
          feature: f.feature,
          enabled: f.enabled,
        }))}
      />

      <IntegrationsPanel
        integrations={integrations.map((i) => ({
          provider: i.provider,
          status: i.status,
          name: i.definition.name,
          description: i.definition.description,
          category: i.definition.category,
        }))}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent activity</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/activity">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-sm text-zinc-500">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="border-b border-zinc-800 pb-2 text-sm last:border-0">
                  <p>{a.summary}</p>
                  <p className="text-xs text-zinc-500">
                    {a.user?.fullName ?? 'System'} · {formatDateTime(a.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
