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
import { PendingLink } from '@/components/ui/pending-link';

type NavItem = {
  href: string;
  labelKey: keyof Dictionary['app'];
  icon: LucideIcon;
  permission?: Permission;
  feature?: string;
  platformOnly?: boolean;
  group: 'work' | 'ops' | 'insights' | 'admin';
};

const navItems: NavItem[] = [
  { href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard, permission: 'workspace:read', group: 'work' },
  { href: '/customers', labelKey: 'customers', icon: Users, permission: 'customers:read', feature: 'CRM', group: 'work' },
  { href: '/repair-orders', labelKey: 'repairOrders', icon: Wrench, permission: 'repairs:read', group: 'work' },
  { href: '/invoices', labelKey: 'invoices', icon: FileText, permission: 'invoices:read', group: 'work' },
  { href: '/inventory', labelKey: 'inventory', icon: Package, permission: 'inventory:read', feature: 'INVENTORY', group: 'ops' },
  { href: '/suppliers', labelKey: 'suppliers', icon: Building2, permission: 'suppliers:read', group: 'ops' },
  { href: '/marketplace', labelKey: 'marketplace', icon: ShoppingCart, permission: 'marketplace:read', feature: 'MARKETPLACE', group: 'ops' },
  { href: '/employees', labelKey: 'employees', icon: UserCog, permission: 'members:manage', feature: 'EMPLOYEES', group: 'ops' },
  { href: '/analytics', labelKey: 'analytics', icon: BarChart3, permission: 'analytics:read', feature: 'ANALYTICS', group: 'insights' },
  { href: '/activity', labelKey: 'activity', icon: Activity, permission: 'activity:read', group: 'insights' },
  { href: '/settings', labelKey: 'settings', icon: Settings, permission: 'settings:read', group: 'admin' },
  { href: '/platform', labelKey: 'platform', icon: Shield, platformOnly: true, group: 'admin' },
];

const GROUP_LABELS: Record<NavItem['group'], { en: string; ar: string }> = {
  work: { en: 'Workshop', ar: 'الورشة' },
  ops: { en: 'Operations', ar: 'العمليات' },
  insights: { en: 'Insights', ar: 'التحليلات' },
  admin: { en: 'Account', ar: 'الحساب' },
};

function SignOutRow() {
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
      className="h-11 w-full justify-start gap-3 px-3 text-zinc-400 hover:text-zinc-50"
      onClick={handleSignOut}
      disabled={loading}
    >
      <LogOut className="h-5 w-5 shrink-0" />
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
  const { t, locale } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const permSet = new Set(permissions);
  const featureSet = new Set(features);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const visible = navItems.filter((item) => {
    if (item.platformOnly) return isPlatformAdmin;
    if (isPlatformAdmin) return true;
    if (item.permission && !permSet.has(item.permission)) return false;
    if (item.feature && !featureSet.has(item.feature)) return false;
    return true;
  });

  const groups = (['work', 'ops', 'insights', 'admin'] as const)
    .map((g) => ({
      key: g,
      label: locale === 'ar' ? GROUP_LABELS[g].ar : GROUP_LABELS[g].en,
      items: visible.filter((i) => i.group === g),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed z-50 h-11 w-11 touch-manipulation lg:hidden"
        style={{
          top: 'max(0.75rem, env(safe-area-inset-top))',
          insetInlineStart: 'max(0.75rem, env(safe-area-inset-left))',
        }}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? t.app.closeMenu : t.app.openMenu}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <aside
        className={cn(
          'fixed inset-y-0 start-0 z-40 flex w-[min(100vw-3rem,18rem)] flex-col border-e border-zinc-800 bg-zinc-950 transition-transform duration-200 ease-out',
          'lg:w-64 lg:translate-x-0',
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full rtl:translate-x-full lg:translate-x-0 rtl:lg:translate-x-0'
        )}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-800 px-4 ps-14 lg:h-16 lg:ps-6">
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-2"
            onClick={() => setMobileOpen(false)}
          >
            <GearvoMark className="h-8 w-8 shrink-0" />
            <span className="truncate text-lg font-bold text-zinc-50 lg:text-xl">
              {shopName ?? t.brand}
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-4 [-webkit-overflow-scrolling:touch]">
          {groups.map((group) => (
            <div key={group.key}>
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <PendingLink
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors touch-manipulation',
                        isActive
                          ? 'bg-amber-600/15 text-amber-400'
                          : 'text-zinc-400 active:bg-zinc-800/80 hover:bg-zinc-800 hover:text-zinc-50'
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0 opacity-90" />
                      {t.app[item.labelKey]}
                    </PendingLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 space-y-2 border-t border-zinc-800 p-3">
          <SignedIn>
            <div className="flex items-center gap-3 rounded-xl bg-zinc-900/60 px-3 py-2">
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
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-zinc-300">{t.brand}</p>
                <p className="truncate text-[11px] text-zinc-600">{t.tagline}</p>
              </div>
            </div>
          </SignedIn>
          <SignOutRow />
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/55 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}
    </>
  );
}
