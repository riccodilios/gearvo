import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTeamUsers } from '@/app/actions/users';

export default async function SettingsPage() {
  const users = await getTeamUsers();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your shop settings"
      />

      <Card>
        <CardHeader>
          <CardTitle>Team (users)</CardTitle>
          <p className="text-sm text-zinc-400">People who can access this shop</p>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
              <p className="text-sm text-zinc-400">
                No team members yet. Connect Clerk for authentication to sign in and invite users.
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Add <code className="rounded bg-zinc-800 px-1">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{' '}
                <code className="rounded bg-zinc-800 px-1">CLERK_SECRET_KEY</code> to your .env, then add sign-in/sign-up to your app. Users will appear here once they join your tenant.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {users.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-900/50 px-3 py-2"
                >
                  <span className="font-medium text-zinc-200">{u.fullName}</span>
                  <span className="text-sm text-zinc-500">{u.email}</span>
                  <span className="rounded bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
                    {u.role}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <p className="text-sm text-zinc-400">Shop information and preferences</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500">
            Shop settings will be configurable here. Connect Stripe for payments to unlock subscription management.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <p className="text-sm text-zinc-400">Manage your SaaS plan</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500">
            Plans: Free Trial, Basic, Pro, Enterprise. Connect Stripe to enable
            subscription management.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <p className="text-sm text-zinc-400">Third-party services</p>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-1 text-sm text-zinc-500">
            <li>Clerk - Authentication</li>
            <li>Stripe - Payments & Subscriptions</li>
            <li>Cloudinary / S3 - Receipt storage</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
