import Layout from '@/components/layout/Layout';
import { DemoBanner } from '@/components/DemoBanner';
import { getTenantId } from '@/lib/tenant';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenantId = await getTenantId();

  return (
    <>
      {!tenantId && <DemoBanner />}
      <Layout>{children}</Layout>
    </>
  );
}
