import { MarketingFooter, MarketingNav } from '@/components/marketing/MarketingChrome';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-4 py-16 space-y-4 text-zinc-400">
        <h1 className="text-4xl font-bold text-zinc-50">Terms of Service</h1>
        <p>
          By using Gearvo you agree to use the platform lawfully, protect account
          credentials, and ensure you have rights to customer and vehicle data you
          store. Subscription fees are billed per company plan.
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}
