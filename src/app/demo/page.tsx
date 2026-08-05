'use client';

import Link from 'next/link';
import { MarketingFooter, MarketingNav } from '@/components/marketing/MarketingChrome';
import { GearvoMark } from '@/components/brand/GearvoLogo';
import { ResetDemoButton } from '@/components/demo/ResetDemoButton';
import { ArrowRight, Building2, Users, Package, Shield } from 'lucide-react';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <MarketingNav />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="flex items-center gap-3">
          <GearvoMark className="h-12 w-12" />
          <div>
            <p className="text-sm font-medium text-amber-500">Presentation environment</p>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Al-Noor Auto Care demo
            </h1>
          </div>
        </div>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
          A permanent, presentation-ready workshop with years of realistic operating history —
          customers, repairs, inventory, invoices, installments, and analytics. Safe to explore;
          reset anytime to the pristine demo state.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: Building2,
              title: 'Company',
              body: 'Al-Noor Auto Care · CR 1010123456 · VAT 300012345600003 · Riyadh Main & North',
            },
            {
              icon: Users,
              title: 'Roles ready',
              body: 'Owner, branch managers, service advisor, technician, cashier, inventory manager',
            },
            {
              icon: Package,
              title: 'Full modules',
              body: '200+ parts, dozens of customers & vehicles, months of repairs, payments & installments',
            },
            {
              icon: Shield,
              title: 'Isolated',
              body: 'Dedicated demo company (slug: demo-auto). Reset never touches other tenants.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <item.icon className="h-5 w-5 text-amber-400" />
              <h2 className="mt-3 font-semibold">{item.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
          <h2 className="text-lg font-semibold">Demo credentials</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Use these accounts on production (Clerk). Same password for both.
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="font-medium text-zinc-200">Company Owner · full access</p>
              <p className="mt-1 font-mono text-amber-400">demo.owner@gearvo.app</p>
              <p className="font-mono text-zinc-300">GearvoDemo2026!</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="font-medium text-zinc-200">Branch Manager · Riyadh Main</p>
              <p className="mt-1 font-mono text-amber-400">demo.manager@gearvo.app</p>
              <p className="font-mono text-zinc-300">GearvoDemo2026!</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
            >
              Sign in to demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-full border border-zinc-700 px-5 py-2.5 text-sm font-medium hover:bg-zinc-900"
            >
              Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <ResetDemoButton />
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
