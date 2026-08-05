'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { SignedIn, UserButton, useClerk } from '@clerk/nextjs';
import {
  LayoutDashboard,
  Users,
  Package,
  Wrench,
  FileText,
  BarChart3,
  Settings,
  Menu,
  X,
  Building2,
  ShoppingCart,
  LogOut,
  Activity,
  UserCog,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { clearTenantAndSignOut } from '@/app/actions/tenant';
import type { Permission } from '@/server/permissions';
import { useI18n } from '@/i18n/provider';
import type { Dictionary } from '@/i18n/dictionaries';
import { GearvoMark } from '@/components/brand/GearvoLogo';

type NavItem = {
  href: string;
  labelKey: keyof Dictionary['app'];
  icon: LucideIcon;
  permission?: Permission;
  feature?: string;
  platformOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard, permission: 'workspace:read' },
  { href: '/customers', labelKey: 'customers', icon: Users, permission: 'customers:read', feature: 'CRM' },
  { href: '/repair-orders', labelKey: 'repairOrders', icon: Wrench, permission: 'repairs:read' },
  { href: '/inventory', labelKey: 'inventory', icon: Package, permission: 'inventory:read', feature: 'INVENTORY' },
  { href: '/marketplace', labelKey: 'marketplace', icon: ShoppingCart, permission: 'marketplace:read', feature: 'MARKETPLACE' },
  { href: '/invoices', labelKey: 'invoices', icon: FileText, permission: 'invoices:read' },
  { href: '/suppliers', labelKey: 'suppliers', icon: Building2, permission: 'suppliers:read' },
  { href: '/employees', labelKey: 'employees', icon: UserCog, permission: 'members:manage', feature: 'EMPLOYEES' },
  { href: '/analytics', labelKey: 'analytics', icon: BarChart3, permission: 'analytics:read', feature: 'ANALYTICS' },
  { href: '/activity', labelKey: 'activity', icon: Activity, permission: 'activity:read' },
  { href: '/settings', labelKey: 'settings', icon: Settings, permission: 'settings:read' },
  { href: '/platform', labelKey: 'platform', icon: Shield, platformOnly: true },
];

function SignOutButton() {
  const router = useRouter();
  const { t } = useI18n();
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(false);
  const handleSignOut = async () => {
    setLoading(true);
    try {
      await clearTenantAndSignOut();
      await signOut({ redirectUrl: '/' });
    } catch {
      router.push('/');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2 text-zinc-400 hover:text-zinc-50"
      onClick={handleSignOut}
      disabled={loading}
    >
      <LogOut className="h-4 w-4" />
      {loading ? t.app.signingOut : t.app.signOut}
    </Button>
  );
}

export function Sidebar({
  shopName,
  permissions = [],
  features = [],
  isPlatformAdmin = false,
}: {
  shopName?: string | null;
  permissions?: Permission[];
  features?: string[];
  isPlatformAdmin?: boolean;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const permSet = new Set(permissions);
  const featureSet = new Set(features);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const visible = navItems.filter((item) => {
    if (item.platformOnly) return isPlatformAdmin;
    if (isPlatformAdmin) return true;
    if (item.permission && !permSet.has(item.permission)) return false;
    if (item.feature && !featureSet.has(item.feature)) return false;
    return true;
  });

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed start-4 top-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? t.app.closeMenu : t.app.openMenu}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <aside
        className={cn(
          'fixed inset-y-0 start-0 z-40 w-64 border-e border-zinc-800 bg-zinc-950 transition-transform duration-200',
          'lg:translate-x-0 rtl:lg:translate-x-0',
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full rtl:translate-x-full lg:translate-x-0 rtl:lg:translate-x-0'
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-zinc-800 px-6">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
            <GearvoMark className="h-8 w-8 shrink-0" />
            <span className="truncate text-xl font-bold text-zinc-50">
              {shopName ?? t.brand}
            </span>
          </Link>
        </div>

        <nav className="space-y-1 p-4 pb-40">
          {visible.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-amber-600/10 text-amber-500'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {t.app[item.labelKey]}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 start-4 end-4 space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <SignedIn>
            <div className="flex items-center justify-center">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  variables: {
                    colorPrimary: '#f59e0b',
                    colorBackground: '#18181b',
                    colorText: '#fafafa',
                  },
                  elements: {
                    userButtonPopoverCard: {
                      backgroundColor: '#18181b',
                      color: '#fafafa',
                    },
                    userButtonPopoverActionButton: {
                      color: '#f4f4f5',
                    },
                  },
                }}
              />
            </div>
          </SignedIn>
          <SignOutButton />
          <p className="text-xs font-medium text-zinc-500">{t.brand}</p>
          <p className="text-xs text-zinc-600">{t.tagline}</p>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}
    </>
  );
}
