'use client';

import { useState } from 'react';
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
import { createVehicle } from '@/app/actions/vehicles';
import { Car } from 'lucide-react';

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 30 }, (_, i) => currentYear - i);

interface AddVehicleDialogProps {
  customerId: string;
  trigger: React.ReactNode;
}

export function AddVehicleDialog({ customerId, trigger }: AddVehicleDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
      const year = Number(formData.get('year'));
      await createVehicle({
        customerId,
        make: (formData.get('make') as string).trim(),
        model: (formData.get('model') as string).trim(),
        year: Number.isNaN(year) ? currentYear : year,
        color: (formData.get('color') as string)?.trim() || undefined,
        licensePlate: (formData.get('licensePlate') as string)?.trim() || undefined,
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Add vehicle
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="make">Make *</Label>
              <Input
                id="make"
                name="make"
                placeholder="e.g. Toyota"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                name="model"
                placeholder="e.g. Camry"
                required
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="year">Year *</Label>
              <select
                id="year"
                name="year"
                required
                defaultValue={currentYear}
                className="mt-1 flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1 text-sm text-zinc-50"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                name="color"
                placeholder="e.g. Silver"
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="licensePlate">License plate</Label>
            <Input
              id="licensePlate"
              name="licensePlate"
              placeholder="e.g. ABC 1234"
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add vehicle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
