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
import { toast } from '@/lib/mutation-toast';
import { Plus, Trash2 } from 'lucide-react';

type CustomerSelect = { id: string; fullName: string };
type VehicleSelect = {
  id: string;
  customerId: string;
  year: number;
  make: string;
  model: string;
  licensePlate: string | null;
};
type PartSelect = {
  id: string;
  name: string;
  stockQuantity: number;
  costPrice: number;
  retailPrice: number;
};

type PartLine = {
  carPartId: string;
  quantity: number;
  costPrice: number;
  retailPrice: number;
};

interface RepairOrderFormDialogProps {
  trigger: React.ReactNode;
  /** Prefill customer when opening from a customer profile */
  defaultCustomerId?: string;
}

export function RepairOrderFormDialog({
  trigger,
  defaultCustomerId,
}: RepairOrderFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerSelect[]>([]);
  const [vehicles, setVehicles] = useState<VehicleSelect[]>([]);
  const [parts, setParts] = useState<PartSelect[]>([]);
  const [customerId, setCustomerId] = useState(defaultCustomerId ?? '');
  const [vehicleId, setVehicleId] = useState('');
  const [partsUsed, setPartsUsed] = useState<PartLine[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    setOptionsLoading(true);
    setCustomerId(defaultCustomerId ?? '');
    setVehicleId('');
    setPartsUsed([]);
    setError(null);
    Promise.all([
      getCustomersForSelect(),
      getVehiclesForSelect(),
      getCarPartsForSelect(),
    ])
      .then(([c, v, p]) => {
        setCustomers(c);
        setVehicles(v);
        setParts(p);
      })
      .finally(() => setOptionsLoading(false));
  }, [open, defaultCustomerId]);

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
      partsUsed.map((p, i) => (i === index ? { ...p, ...updates } : p)) as PartLine[]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const laborCost = parseFloat((formData.get('laborCost') as string) || '0');

    try {
      const validParts = partsUsed.filter(
        (p) => p.carPartId && p.quantity > 0 && p.costPrice >= 0 && p.retailPrice >= 0
      );
      if (validParts.length === 0 && laborCost <= 0) {
        throw new Error('Add labor cost or at least one part');
      }
      if (!customerId || !vehicleId) {
        throw new Error('Select customer and vehicle');
      }
      const order = await createRepairOrder({
        customerId,
        vehicleId,
        description: (formData.get('description') as string) || undefined,
        laborCost,
        parts: validParts.map((p) => ({
          carPartId: p.carPartId,
          quantity: p.quantity,
          costPrice: p.costPrice,
          retailPrice: p.retailPrice,
        })),
        notes: (formData.get('notes') as string) || undefined,
      });
      toast.success('Repair order created');
      setOpen(false);
      router.refresh();
      if (order?.id) router.push(`/repair-orders/${order.id}`);
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
        className="max-h-[min(92dvh,100%)] overflow-y-auto sm:max-w-[600px]"
        onPointerDownOutside={(e) => loading && e.preventDefault()}
        onEscapeKeyDown={(e) => loading && e.preventDefault()}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Repair Order</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && <p className="text-sm text-red-500">{error}</p>}
            {optionsLoading && (
              <p className="text-sm text-zinc-500">Loading customers & parts…</p>
            )}
            <div className="grid gap-2">
              <Label>Customer *</Label>
              <Select
                value={customerId}
                onValueChange={(v) => {
                  setCustomerId(v);
                  setVehicleId('');
                }}
                disabled={optionsLoading || loading}
              >
                <SelectTrigger className="h-11 touch-manipulation">
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
              <Select
                value={vehicleId}
                onValueChange={setVehicleId}
                disabled={!customerId || optionsLoading || loading}
              >
                <SelectTrigger className="h-11 touch-manipulation">
                  <SelectValue
                    placeholder={
                      customerId ? 'Select vehicle' : 'Select a customer first'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {customerVehicles.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      No vehicles for this customer
                    </SelectItem>
                  ) : (
                    customerVehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.year} {v.make} {v.model}
                        {v.licensePlate ? ` (${v.licensePlate})` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input
                name="description"
                placeholder="e.g. Oil change, brake pads, diagnosis"
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label>Labor Cost</Label>
              <Input
                name="laborCost"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0"
                disabled={loading}
                className="h-11"
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <Label>Parts</Label>
                  <p className="text-xs text-zinc-500">Optional — labor-only jobs are fine</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPart}
                  disabled={loading || optionsLoading}
                  className="touch-manipulation"
                >
                  <Plus className="me-1 h-4 w-4" />
                  Add part
                </Button>
              </div>
              {partsUsed.length === 0 ? (
                <p className="rounded-xl border border-dashed border-zinc-800 px-3 py-4 text-center text-sm text-zinc-500">
                  No parts yet. Add parts from inventory, or continue with labor only.
                </p>
              ) : (
                <div className="space-y-3">
                  {partsUsed.map((p, i) => (
                    <div
                      key={i}
                      className="space-y-3 rounded-xl border border-zinc-800 p-3 sm:space-y-0 sm:flex sm:items-end sm:gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <Label className="text-xs">Part</Label>
                        <Select
                          value={p.carPartId}
                          onValueChange={(v) => updatePart(i, 'carPartId', v)}
                          disabled={loading}
                        >
                          <SelectTrigger className="h-11 touch-manipulation">
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
                      <div className="grid grid-cols-3 gap-2 sm:contents">
                        <div className="sm:w-20">
                          <Label className="text-xs">Qty</Label>
                          <Input
                            type="number"
                            min="1"
                            className="h-11"
                            value={p.quantity}
                            onChange={(e) =>
                              updatePart(i, 'quantity', parseInt(e.target.value) || 1)
                            }
                            disabled={loading}
                          />
                        </div>
                        <div className="sm:w-24">
                          <Label className="text-xs">Cost</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="h-11"
                            value={p.costPrice || ''}
                            onChange={(e) =>
                              updatePart(i, 'costPrice', parseFloat(e.target.value) || 0)
                            }
                            disabled={loading}
                          />
                        </div>
                        <div className="sm:w-24">
                          <Label className="text-xs">Retail</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="h-11"
                            value={p.retailPrice || ''}
                            onChange={(e) =>
                              updatePart(
                                i,
                                'retailPrice',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            disabled={loading}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 shrink-0 touch-manipulation"
                        onClick={() => removePart(i)}
                        disabled={loading}
                        aria-label="Remove part"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Input name="notes" disabled={loading} />
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
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={loading || optionsLoading}
            >
              {loading ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
