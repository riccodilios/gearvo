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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/lib/mutation-toast';
import { formError } from '@/lib/form-error';

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
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const router = useRouter();
  const archiveTarget = branches.find((b) => b.id === archiveId);

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
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 px-3 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {b.name}{' '}
                  {b.isDefault && <Badge className="ms-1">Default</Badge>}
                  {b.isArchived && (
                    <Badge variant="secondary" className="ms-1">
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
                  className="min-h-10 touch-manipulation"
                  disabled={pending || b.isArchived}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        await switchWorkspace(companyId, b.id);
                        toast.success(`Switched to ${b.name}`);
                        router.refresh();
                      } catch (err) {
                        toast.error(formError(err));
                      }
                    })
                  }
                >
                  Switch
                </Button>
                {!b.isDefault && !b.isArchived && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="min-h-10 touch-manipulation"
                    disabled={pending}
                    onClick={() => setArchiveId(b.id)}
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
              try {
                await createBranch({ name, slug: slug || name });
                setName('');
                setSlug('');
                toast.success('Branch created');
                router.refresh();
              } catch (err) {
                toast.error(formError(err));
              }
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
              placeholder="optional"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={pending || !name.trim()} className="w-full">
              {pending ? 'Saving…' : 'Add branch'}
            </Button>
          </div>
        </form>
      </CardContent>

      <AlertDialog
        open={!!archiveId}
        onOpenChange={(open) => !open && !pending && setArchiveId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {archiveTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Archived branches are hidden from day-to-day switching. Existing data stays
              intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="w-full sm:w-auto" disabled={pending}>
              Keep active
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full bg-red-600 hover:bg-red-700 sm:w-auto"
              disabled={pending || !archiveId}
              onClick={(e) => {
                e.preventDefault();
                if (!archiveId) return;
                const id = archiveId;
                startTransition(async () => {
                  try {
                    await archiveBranch(id);
                    toast.success('Branch archived');
                    setArchiveId(null);
                    router.refresh();
                  } catch (err) {
                    toast.error(formError(err));
                  }
                });
              }}
            >
              {pending ? 'Archiving…' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
