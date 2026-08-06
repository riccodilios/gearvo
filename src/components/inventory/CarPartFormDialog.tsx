'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createCarPart, updateCarPart } from '@/app/actions/inventory';
import { getSuppliersForSelect } from '@/app/actions/suppliers';
import { formError } from '@/lib/form-error';
import { toast } from '@/lib/mutation-toast';

/** Serializable part fields for edit form (no Decimal/Date). */
export type CarPartFormInitial = {
  id: string;
  name: string;
  partNumber: string | null;
  supplierId: string | null;
  costPrice: number;
  retailPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  category: string | null;
};

interface CarPartFormDialogProps {
  trigger: React.ReactNode;
  part?: CarPartFormInitial | null;
}

export function CarPartFormDialog({ trigger, part }: CarPartFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [supplierId, setSupplierId] = useState<string | null>(part?.supplierId ?? null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setSupplierId(part?.supplierId ?? null);
      getSuppliersForSelect()
        .then((s) => setSuppliers(Array.isArray(s) ? s : []))
        .catch(() => setSuppliers([]));
    }
  }, [open, part?.supplierId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
      const data = {
        name: formData.get('name') as string,
        partNumber: (formData.get('partNumber') as string) || undefined,
        supplierId: supplierId || null,
        costPrice: parseFloat(formData.get('costPrice') as string) || 0,
        retailPrice: parseFloat(formData.get('retailPrice') as string) || 0,
        stockQuantity: parseInt(formData.get('stockQuantity') as string) || 0,
        minStockLevel: parseInt(formData.get('minStockLevel') as string) || 5,
        category: (formData.get('category') as string) || undefined,
      };

      if (part) {
        await updateCarPart(part.id, data);
      } else {
        await createCarPart(data);
      }
      toast.success(part ? 'Part updated' : 'Part created');
      setOpen(false);
      router.refresh();
    } catch (err) {
      const msg = formError(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (loading) return;
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="sm:max-w-[500px]"
        onPointerDownOutside={(e) => loading && e.preventDefault()}
        onEscapeKeyDown={(e) => loading && e.preventDefault()}
      >        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{part ? 'Edit Part' : 'Add Part'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input
                name="name"
                defaultValue={part?.name ?? ''}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Part Number</Label>
              <Input name="partNumber" defaultValue={part?.partNumber ?? ''} />
            </div>
            <div className="grid gap-2">
              <Label>Supplier</Label>
              <Select
                value={supplierId ?? '__none__'}
                onValueChange={(v) => setSupplierId(v === '__none__' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Cost Price *</Label>
                <Input
                  name="costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={part ? part.costPrice : ''}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Retail Price *</Label>
                <Input
                  name="retailPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={part ? part.retailPrice : ''}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Stock Quantity</Label>
                <Input
                  name="stockQuantity"
                  type="number"
                  min="0"
                  defaultValue={part?.stockQuantity ?? 0}
                />
              </div>
              <div className="grid gap-2">
                <Label>Min Stock Level</Label>
                <Input
                  name="minStockLevel"
                  type="number"
                  min="0"
                  defaultValue={part?.minStockLevel ?? 5}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Input name="category" defaultValue={part?.category ?? ''} />
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
              {loading ? 'Saving...' : part ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
