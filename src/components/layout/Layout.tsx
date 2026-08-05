import { Sidebar } from './Sidebar';
import type { Permission } from '@/server/permissions';

export default function Layout({
  children,
  shopName,
  permissions,
  features,
  isPlatformAdmin,
}: {
  children: React.ReactNode;
  shopName?: string | null;
  permissions?: Permission[];
  features?: string[];
  isPlatformAdmin?: boolean;
}) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar
        shopName={shopName}
        permissions={permissions}
        features={features}
        isPlatformAdmin={isPlatformAdmin}
      />
      <main className="lg:ps-64">
        <div className="flex min-h-screen flex-col">{children}</div>
      </main>
    </div>
  );
}
