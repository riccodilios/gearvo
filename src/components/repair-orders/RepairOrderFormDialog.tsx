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
import { createRepairOrder } from '@/app/actions/repair-orders';
import { getCustomersForSelect } from '@/app/actions/customers';
import { getVehiclesForSelect } from '@/app/actions/vehicles';
import { getCarPartsForSelect } from '@/app/actions/inventory';
import { formError } from '@/lib/form-error';
import { Plus, Trash2 } from 'lucide-react';

type CustomerSelect = { id: string; fullName: string };
type VehicleSelect = { id: string; customerId: string; year: number; make: string; model: string; licensePlate: string | null };
type PartSelect = { id: string; name: string; stockQuantity: number; costPrice: number; retailPrice: number };

interface RepairOrderFormDialogProps {
  trigger: React.ReactNode;
}

export function RepairOrderFormDialog({ trigger }: RepairOrderFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerSelect[]>([]);
  const [vehicles, setVehicles] = useState<VehicleSelect[]>([]);
  const [parts, setParts] = useState<PartSelect[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [partsUsed, setPartsUsed] = useState<
    { carPartId: string; quantity: number; costPrice: number; retailPrice: number }[]
  >([{ carPartId: '', quantity: 1, costPrice: 0, retailPrice: 0 }]);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      Promise.all([
        getCustomersForSelect(),
        getVehiclesForSelect(),
        getCarPartsForSelect(),
      ]).then(([c, v, p]) => {
        setCustomers(c);
        setVehicles(v);
        setParts(p);
      });
    }
  }, [open]);

  const customerVehicles = vehicles.filter((v) => v.customerId === customerId);

  const addPart = () => {
    setPartsUsed([
      ...partsUsed,
      { carPartId: '', quantity: 1, costPrice: 0, retailPrice: 0 },
    ]);
  };

  const removePart = (index: number) => {
    setPartsUsed(partsUsed.filter((_, i) => i !== index));
  };

  const updatePart = (index: number, field: string, value: string | number) => {
    const part = parts.find((p) => p.id === value);
    const updates: Record<string, string | number> = { [field]: value };
    if (field === 'carPartId' && part) {
      updates.costPrice = part.costPrice;
      updates.retailPrice = part.retailPrice;
    }
    setPartsUsed(
      partsUsed.map((p, i) =>
        i === index ? { ...p, ...updates } : p
      ) as typeof partsUsed
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
      const validParts = partsUsed.filter(
        (p) => p.carPartId && p.quantity > 0 && p.costPrice >= 0 && p.retailPrice >= 0
      );
      if (validParts.length === 0) {
        throw new Error('Add at least one part');
      }

      if (!customerId || !vehicleId) {
        throw new Error('Select customer and vehicle');
      }
      await createRepairOrder({
        customerId,
        vehicleId,
        description: (formData.get('description') as string) || undefined,
        laborCost: parseFloat((formData.get('laborCost') as string) || '0'),
        parts: validParts.map((p) => ({
          carPartId: p.carPartId,
          quantity: p.quantity,
          costPrice: p.costPrice,
          retailPrice: p.retailPrice,
        })),
        notes: (formData.get('notes') as string) || undefined,
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(formError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Repair Order</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="grid gap-2">
              <Label>Customer *</Label>
              <Select
                value={customerId}
                onValueChange={(v) => {
                  setCustomerId(v);
                  setVehicleId('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Vehicle *</Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {customerVehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model}
                      {v.licensePlate ? ` (${v.licensePlate})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input name="description" placeholder="Repair description" />
            </div>
            <div className="grid gap-2">
              <Label>Labor Cost</Label>
              <Input
                name="laborCost"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0"
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Parts Used *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPart}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {partsUsed.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-end gap-2 rounded-lg border border-zinc-800 p-3"
                  >
                    <div className="flex-1">
                      <Label className="text-xs">Part</Label>
                      <Select
                        value={p.carPartId}
                        onValueChange={(v) => updatePart(i, 'carPartId', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select part" />
                        </SelectTrigger>
                        <SelectContent>
                          {parts.map((part) => (
                            <SelectItem
                              key={part.id}
                              value={part.id}
                              disabled={
                                part.stockQuantity <= 0 ||
                                (p.quantity > 0 && part.stockQuantity < p.quantity)
                              }
                            >
                              {part.name} ({part.stockQuantity} in stock)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-20">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        value={p.quantity}
                        onChange={(e) =>
                          updatePart(i, 'quantity', parseInt(e.target.value) || 1)
                        }
                      />
                    </div>
                    <div className="w-24">
                      <Label className="text-xs">Cost</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={p.costPrice || ''}
                        onChange={(e) =>
                          updatePart(i, 'costPrice', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="w-24">
                      <Label className="text-xs">Retail</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={p.retailPrice || ''}
                        onChange={(e) =>
                          updatePart(i, 'retailPrice', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePart(i)}
                      disabled={partsUsed.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Input name="notes" />
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
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
