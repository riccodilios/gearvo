'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createShopAndSignIn } from '@/app/actions/tenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CreateShopForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createShopAndSignIn(formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    if (result?.redirect) {
      router.push(result.redirect);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-400">
          {error}
        </div>
      )}
      <div>
        <Label htmlFor="name">Shop name *</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Joe's Auto Repair"
          required
          className="mt-2"
        />
      </div>
      <div>
        <Label htmlFor="slug">URL slug (optional)</Label>
        <Input
          id="slug"
          name="slug"
          placeholder="joes-auto"
          className="mt-2"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Used in URLs. Defaults to a slug from the shop name.
        </p>
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating...' : 'Create my shop'}
      </Button>
    </form>
  );
}
