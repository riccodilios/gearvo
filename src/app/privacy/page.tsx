import { MarketingFooter, MarketingNav } from '@/components/marketing/MarketingChrome';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-4 py-16 space-y-4 text-zinc-400">
        <h1 className="text-4xl font-bold text-zinc-50">Privacy Policy</h1>
        <p>
          Gearvo processes workshop operational data on behalf of each customer
          company. Tenant data is isolated by company and branch. We do not sell
          personal data. Contact privacy@gearvo.app for data requests.
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}
