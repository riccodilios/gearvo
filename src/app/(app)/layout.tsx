import Layout from '@/components/layout/Layout';
import { AppHeader } from '@/components/layout/AppHeader';
import { DemoBanner } from '@/components/DemoBanner';
import { getTenantId, getTenant } from '@/lib/tenant';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tenantId, tenant] = await Promise.all([getTenantId(), getTenant()]);

  return (
    <>
      {!tenantId && <DemoBanner />}
      <Layout shopName={tenant?.name ?? null}>
        <AppHeader shopName={tenant?.name ?? null} />
        <div className="flex-1 p-4 pt-4 lg:p-8">{children}</div>
      </Layout>
    </>
  );
}
