'use client';

import { useState, useTransition } from 'react';
import { archiveBranch, createBranch } from '@/app/actions/workspace';
import { switchWorkspace } from '@/app/actions/tenant';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

type Branch = {
  id: string;
  name: string;
  slug: string;
  isDefault: boolean;
  isArchived: boolean;
  address: string | null;
};

export function BranchManager({
  companyId,
  branches,
}: {
  companyId: string;
  branches: Branch[];
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branches</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {branches.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 px-3 py-2"
            >
              <div>
                <p className="font-medium">
                  {b.name}{' '}
                  {b.isDefault && <Badge className="ml-1">Default</Badge>}
                  {b.isArchived && (
                    <Badge variant="secondary" className="ml-1">
                      Archived
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-zinc-500">
                  {b.slug}
                  {b.address ? ` · ${b.address}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending || b.isArchived}
                  onClick={() =>
                    startTransition(async () => {
                      await switchWorkspace(companyId, b.id);
                      router.refresh();
                    })
                  }
                >
                  Switch
                </Button>
                {!b.isDefault && !b.isArchived && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await archiveBranch(b.id);
                        router.refresh();
                      })
                    }
                  >
                    Archive
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>

        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              await createBranch({ name, slug: slug || name });
              setName('');
              setSlug('');
              router.refresh();
            });
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="branch-name">New branch</Label>
            <Input
              id="branch-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="branch-slug">Slug</Label>
            <Input
              id="branch-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto from name"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={pending || !name}>
              Add branch
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
