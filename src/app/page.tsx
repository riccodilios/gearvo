import Link from 'next/link';
import { Wrench, BarChart3, Users, Package, FileText, Shield } from 'lucide-react';

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Gearvo</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="/welcome/setup"
              className="text-sm font-medium text-zinc-400 hover:text-amber-500"
            >
              Get started
            </Link>
            <Link
              href="/sign-up"
              className="text-sm font-medium text-zinc-400 hover:text-amber-500"
            >
              Sign up
            </Link>
            <Link
              href="/sign-in"
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            The operating system for
            <span className="text-amber-500"> mechanic shops</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            Run your shop with one place for customers, repairs, inventory, invoices, and payments.
            Each shop gets its own secure workspace and metrics.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/welcome/setup"
              className="rounded-lg bg-amber-600 px-6 py-3 text-base font-medium text-white hover:bg-amber-700"
            >
              Create your shop
            </Link>
            <Link
              href="/sign-in"
              className="rounded-lg border border-zinc-700 px-6 py-3 text-base font-medium hover:bg-zinc-800"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="border-t border-zinc-800 bg-zinc-900/30 py-24">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-2xl font-bold">
              Everything you need to run your shop
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-zinc-400">
              One platform. Your data. Your metrics.
            </p>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Users,
                  title: 'Customer CRM',
                  description: 'Track clients, vehicles, tags (VIP, frequent buyer), and full purchase history.',
                },
                {
                  icon: Wrench,
                  title: 'Repair orders',
                  description: 'Create jobs, attach parts, track labor and profit per repair.',
                },
                {
                  icon: Package,
                  title: 'Inventory & suppliers',
                  description: 'Manage parts, cost vs retail, low-stock alerts, and supplier ordering.',
                },
                {
                  icon: FileText,
                  title: 'Invoices & payments',
                  description: 'Generate invoices, record payments, split payments, and installments.',
                },
                {
                  icon: BarChart3,
                  title: 'Analytics',
                  description: 'Revenue trends, profit margins, forecasts, and payment method breakdowns.',
                },
                {
                  icon: Shield,
                  title: 'Your data, isolated',
                  description: 'Each mechanic shop has its own workspace. Data is never shared between shops.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 p-6"
                >
                  <item.icon className="h-10 w-10 text-amber-500" />
                  <h3 className="mt-4 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-zinc-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-800 py-24">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h2 className="text-2xl font-bold">Ready to run your shop?</h2>
            <p className="mt-2 text-zinc-400">
              Create your account and get your own workspace in minutes.
            </p>
            <Link
              href="/welcome/setup"
              className="mt-6 inline-block rounded-lg bg-amber-600 px-6 py-3 font-medium text-white hover:bg-amber-700"
            >
              Get started
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-zinc-500">
          Gearvo — Mechanic shop operating system. Multi-tenant SaaS.
        </div>
      </footer>
    </div>
  );
}
