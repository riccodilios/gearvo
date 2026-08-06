import Layout from '@/components/layout/Layout';
import { AppHeader } from '@/components/layout/AppHeader';
import { PresentationDemoBanner } from '@/components/DemoBanner';
import { WorkspaceSwitcher } from '@/components/layout/WorkspaceSwitcher';
import { getWorkspaceContext, getNavAccess } from '@/server/auth';
import { redirect } from 'next/navigation';
import { DEMO_COMPANY_SLUG } from '@/server/demo-constants';

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

  const isPresentationDemo = ctx.company.slug === DEMO_COMPANY_SLUG;

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
            branches={ctx.branches.map((b) => ({ id: b.id, name: b.name }))}
          />
        </AppHeader>
        <div className="gearvo-page-enter flex-1 space-y-6 p-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4 sm:space-y-8 lg:p-8">
          {children}
        </div>
      </Layout>
    </>
  );
}
