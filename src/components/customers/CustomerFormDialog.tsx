'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createCustomer, updateCustomer } from '@/app/actions/customers';
import { formError } from '@/lib/form-error';
import { toast } from '@/lib/mutation-toast';
import { useSubmitGuard } from '@/hooks/use-submit-guard';

/** Serializable customer fields for edit form (no Decimal/Date). */
export type CustomerFormInitial = {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  address?: string;
  tags: string[];
  notes?: string;
};

interface CustomerFormDialogProps {
  trigger: React.ReactNode;
  customer?: CustomerFormInitial | null;
}

export function CustomerFormDialog({ trigger, customer }: CustomerFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loading, run } = useSubmitGuard();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);

    await run(async () => {
      const data = {
        fullName: formData.get('fullName') as string,
        phone: (formData.get('phone') as string) || undefined,
        email: (formData.get('email') as string) || undefined,
        address: (formData.get('address') as string) || undefined,
        tags:
          (formData.get('tags') as string)
            ?.split(',')
            .map((t) => t.trim())
            .filter(Boolean) ?? [],
        notes: (formData.get('notes') as string) || undefined,
      };

      try {
        if (customer) {
          await updateCustomer(customer.id, data);
          toast.success('Customer updated');
          setOpen(false);
          router.refresh();
        } else {
          const created = await createCustomer(data);
          toast.success('Customer created');
          setOpen(false);
          router.refresh();
          router.push(`/customers/${created.id}`);
        }
      } catch (err) {
        const msg = formError(err);
        if (msg.includes('Database is not connected')) {
          setError('setup');
        } else {
          setError(msg);
          toast.error(msg);
        }
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (loading) return;
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        onPointerDownOutside={(e) => loading && e.preventDefault()}
        onEscapeKeyDown={(e) => loading && e.preventDefault()}
        className="sm:max-w-[425px]"
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{customer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-4 text-sm">
                {error === 'setup' ? (
                  <>
                    <p className="text-amber-200">
                      Database is not connected. To save customers, connect PostgreSQL and
                      create your shop.
                    </p>
                    <Link
                      href="/welcome/setup"
                      className="mt-2 inline-block font-medium text-amber-500 underline hover:text-amber-400"
                    >
                      Set up my shop →
                    </Link>
                  </>
                ) : (
                  <p className="text-red-400">{error}</p>
                )}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                name="fullName"
                defaultValue={customer?.fullName ?? ''}
                required
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={customer?.phone ?? ''}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={customer?.email ?? ''}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                defaultValue={customer?.address ?? ''}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                name="tags"
                placeholder="VIP, Frequent buyer"
                defaultValue={customer?.tags?.join(', ') ?? ''}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                name="notes"
                defaultValue={customer?.notes ?? ''}
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
              {loading ? 'Saving…' : customer ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
