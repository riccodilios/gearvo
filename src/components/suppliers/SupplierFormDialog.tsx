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
import { createSupplier, updateSupplier } from '@/app/actions/suppliers';
import { formError } from '@/lib/form-error';

interface SupplierFormInitial {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

interface SupplierFormDialogProps {
  trigger?: React.ReactNode;
  supplier?: SupplierFormInitial | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SupplierFormDialog({ trigger, supplier, open: controlledOpen, onOpenChange }: SupplierFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
      const data = {
        name: formData.get('name') as string,
        contactPerson: (formData.get('contactPerson') as string) || undefined,
        phone: (formData.get('phone') as string) || undefined,
        email: (formData.get('email') as string) || undefined,
        address: (formData.get('address') as string) || undefined,
        notes: (formData.get('notes') as string) || undefined,
      };

      if (supplier) {
        await updateSupplier(supplier.id, data);
      } else {
        await createSupplier(data);
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      const msg = formError(err);
      if (msg.includes('Database is not connected')) {
        setError('setup');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {supplier ? 'Edit Supplier' : 'Add Supplier'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-4 text-sm">
                {error === 'setup' ? (
                  <>
                    <p className="text-amber-200">Database is not connected. To save suppliers, connect PostgreSQL and create your shop.</p>
                    <Link href="/welcome/setup" className="mt-2 inline-block font-medium text-amber-500 underline hover:text-amber-400">
                      Set up my shop →
                    </Link>
                  </>
                ) : (
                  <p className="text-red-400">{error}</p>
                )}
              </div>
            )}
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input
                name="name"
                defaultValue={supplier?.name ?? ''}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Contact Person</Label>
              <Input
                name="contactPerson"
                defaultValue={supplier?.contactPerson ?? ''}
              />
            </div>
            <div className="grid gap-2">
              <Label>Phone</Label>
              <Input
                name="phone"
                type="tel"
                defaultValue={supplier?.phone ?? ''}
              />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                name="email"
                type="email"
                defaultValue={supplier?.email ?? ''}
              />
            </div>
            <div className="grid gap-2">
              <Label>Address</Label>
              <Input
                name="address"
                defaultValue={supplier?.address ?? ''}
              />
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Input name="notes" defaultValue={supplier?.notes ?? ''} />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : supplier ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
