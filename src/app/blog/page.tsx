import Link from 'next/link';
import { MarketingFooter, MarketingNav } from '@/components/marketing/MarketingChrome';

const posts = [
  {
    slug: 'multi-branch-workshop-ops',
    title: 'How multi-branch workshops stay profitable',
    excerpt: 'Shared branding, isolated stock, and company-wide KPIs.',
  },
  {
    slug: 'saudi-vat-ready-invoicing',
    title: 'VAT-ready invoices for Saudi workshops',
    excerpt: 'CR numbers, VAT fields, and a path to ZATCA.',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="mb-8 text-4xl font-bold">Blog</h1>
        <div className="space-y-6">
          {posts.map((p) => (
            <article key={p.slug} className="rounded-xl border border-zinc-800 p-6">
              <h2 className="text-xl font-semibold">{p.title}</h2>
              <p className="mt-2 text-zinc-400">{p.excerpt}</p>
              <Link href={`/blog/${p.slug}`} className="mt-3 inline-block text-amber-500">
                Read more
              </Link>
            </article>
          ))}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
