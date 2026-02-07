'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPurchaseOrder } from '@/app/actions/marketplace';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';

type Part = {
  id: string;
  name: string;
  partNumber: string | null;
  costPrice: unknown;
  retailPrice: unknown;
  stockQuantity: number;
  minStockLevel: number;
};

type Supplier = {
  id: string;
  name: string;
  carParts: Part[];
};

export function MarketplaceSupplierOrder({ supplier }: { supplier: Supplier }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toNum = (v: unknown): number =>
    typeof v === 'number' ? v : Number(String(v));

  const lines = supplier.carParts
    .map((p) => ({ part: p, qty: quantities[p.id] ?? 0 }))
    .filter((l) => l.qty > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      setError('Add at least one quantity.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await createPurchaseOrder({
        supplierId: supplier.id,
        lines: lines.map((l) => ({
          carPartId: l.part.id,
          quantity: l.qty,
          unitCost: toNum(l.part.costPrice),
        })),
      });
      setQuantities({});
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{supplier.name}</CardTitle>
        <p className="text-xs text-zinc-500">
          {supplier.carParts.length} part(s) available
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded bg-red-950/30 p-2 text-sm text-red-400">{error}</p>
          )}
          <div className="space-y-3">
            {supplier.carParts.map((part) => (
              <div
                key={part.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-zinc-800 bg-zinc-900/50 p-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-200">{part.name}</p>
                  <p className="text-xs text-zinc-500">
                    {part.partNumber ?? '—'} · {formatCurrency(toNum(part.costPrice))} each
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`qty-${part.id}`} className="sr-only">
                    Quantity
                  </Label>
                  <Input
                    id={`qty-${part.id}`}
                    type="number"
                    min={0}
                    className="w-20"
                    value={quantities[part.id] ?? ''}
                    onChange={(e) =>
                      setQuantities((prev) => ({
                        ...prev,
                        [part.id]: Math.max(0, parseInt(e.target.value, 10) || 0),
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <Button
            type="submit"
            disabled={loading || lines.length === 0}
            className="w-full"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {loading ? 'Placing order...' : `Place order (${lines.length} lines)`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
