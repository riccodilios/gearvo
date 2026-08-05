import Layout from '@/components/layout/Layout';
import { AppHeader } from '@/components/layout/AppHeader';
import { DemoBanner } from '@/components/DemoBanner';
import { WorkspaceSwitcher } from '@/components/layout/WorkspaceSwitcher';
import { getWorkspaceContext, getNavAccess } from '@/server/auth';
import { listBranches } from '@/app/actions/workspace';

/** Auth/workspace-bound routes must not be statically prerendered at build time. */
export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ctx, nav] = await Promise.all([getWorkspaceContext(), getNavAccess()]);
  const branches = ctx ? await listBranches() : [];

  return (
    <>
      {!ctx && <DemoBanner />}
      <Layout
        shopName={ctx?.company.name ?? null}
        permissions={nav?.permissions}
        features={nav?.features}
        isPlatformAdmin={nav?.isPlatformAdmin}
      >
        <AppHeader shopName={ctx?.company.name ?? null}>
          {ctx && (
            <WorkspaceSwitcher
              companyId={ctx.company.id}
              companyName={ctx.company.name}
              currentBranchId={ctx.branch.id}
              branches={branches
                .filter((b) => !b.isArchived)
                .map((b) => ({ id: b.id, name: b.name }))}
            />
          )}
        </AppHeader>
        <div className="flex-1 p-4 pt-4 lg:p-8">{children}</div>
      </Layout>
    </>
  );
}
