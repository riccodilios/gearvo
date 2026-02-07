'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { SignedIn, UserButton } from '@clerk/nextjs';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { clearTenantAndSignOut } from '@/app/actions/tenant';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/repair-orders', label: 'Repair Orders', icon: Wrench },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingCart },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/suppliers', label: 'Suppliers', icon: Building2 },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const handleSignOut = async () => {
    setLoading(true);
    const { redirect } = await clearTenantAndSignOut();
    router.push(redirect);
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
      {loading ? 'Signing out...' : 'Sign out'}
    </Button>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 border-r border-zinc-800 bg-zinc-950 transition-transform',
          'translate-x-0 lg:translate-x-0',
          !mobileOpen && '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-zinc-800 px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-50">Gearvo</span>
          </Link>
        </div>

        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
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
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <SignedIn>
            <div className="flex items-center justify-center">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  variables: { colorPrimary: '#f59e0b' },
                }}
              />
            </div>
          </SignedIn>
          <SignOutButton />
          <p className="text-xs font-medium text-zinc-500">Gearvo SaaS</p>
          <p className="text-xs text-zinc-600">Mechanic Shop OS</p>
          <p className="text-xs text-zinc-500">Made by Rakan AlHakim</p>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
