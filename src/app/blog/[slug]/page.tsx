import { MarketingFooter, MarketingNav } from '@/components/marketing/MarketingChrome';

export default function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <BlogBody params={params} />
      </main>
      <MarketingFooter />
    </div>
  );
}

async function BlogBody({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <>
      <p className="text-sm text-zinc-500">{slug}</p>
      <h1 className="mt-2 text-4xl font-bold capitalize">
        {slug.replace(/-/g, ' ')}
      </h1>
      <p className="mt-6 text-lg text-zinc-400">
        Gearvo helps automotive businesses operate with the clarity of modern SaaS —
        from a single bay to a multi-branch network across Saudi Arabia.
      </p>
    </>
  );
}
