import Layout from '@/components/layout/Layout';
import { AppHeader } from '@/components/layout/AppHeader';
import { PresentationDemoBanner } from '@/components/DemoBanner';
import { WorkspaceSwitcher } from '@/components/layout/WorkspaceSwitcher';
import { getWorkspaceContext, getNavAccess } from '@/server/auth';
import { listBranches } from '@/app/actions/workspace';
import { redirect } from 'next/navigation';

/** Auth/workspace-bound routes must not be statically prerendered at build time. */
export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ctx, nav] = await Promise.all([getWorkspaceContext(), getNavAccess()]);

  // Signed in but no company membership → empty nav/data. Send them to create a shop.
  if (!ctx) {
    redirect('/welcome/setup');
  }

  const branches = await listBranches();
  const isPresentationDemo = ctx.company.slug === 'demo-auto';

  return (
    <>
      {isPresentationDemo && <PresentationDemoBanner />}
      <Layout
        shopName={ctx.company.name}
        permissions={nav?.permissions}
        features={nav?.features}
        isPlatformAdmin={nav?.isPlatformAdmin}
      >
        <AppHeader shopName={ctx.company.name}>
          <WorkspaceSwitcher
            companyId={ctx.company.id}
            companyName={ctx.company.name}
            currentBranchId={ctx.branch.id}
            branches={branches
              .filter((b) => !b.isArchived)
              .map((b) => ({ id: b.id, name: b.name }))}
          />
        </AppHeader>
        <div className="flex-1 p-4 pt-4 lg:p-8">{children}</div>
      </Layout>
    </>
  );
}
