'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { updatePurchaseOrderStatus } from '@/app/actions/marketplace';
import { toast } from '@/lib/mutation-toast';
import { formError } from '@/lib/form-error';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/provider';

type Line = {
  id: string;
  quantity: number;
  unitCost: unknown;
  carPart: { id: string; name: string };
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  supplier: { name: string };
  lines: Line[];
};

export function PurchaseOrdersList({ orders }: { orders: Order[] }) {
  const { t } = useI18n();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const router = useRouter();

  const toNum = (v: unknown): number =>
    typeof v === 'number' ? v : Number(String(v));

  const handleStatus = async (id: string, status: 'ORDERED' | 'RECEIVED') => {
    setUpdatingId(id);
    try {
      await updatePurchaseOrderStatus(id, status);
      toast.success(status === 'ORDERED' ? t.ui.markedOrdered : t.ui.markedReceived);
      router.refresh();
    } catch (err) {
      toast.error(formError(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const statusBadge = (status: string) => {
    const v = status.toLowerCase();
    if (v === 'pending') return <Badge variant="secondary">{t.ui.poDraft}</Badge>;
    if (v === 'ordered')
      return <Badge className="bg-amber-600/20 text-amber-400">{t.ui.poOrdered}</Badge>;
    if (v === 'received')
      return (
        <Badge className="bg-emerald-600/20 text-emerald-400">{t.ui.poReceived}</Badge>
      );
    return <Badge variant="outline">{status}</Badge>;
  };

  const actionButton = (order: Order, isUpdating: boolean) => {
    if (order.status === 'PENDING') {
      return (
        <Button
          variant="outline"
          size="sm"
          className="min-h-10 w-full touch-manipulation sm:w-auto"
          disabled={isUpdating}
          onClick={() => handleStatus(order.id, 'ORDERED')}
        >
          {isUpdating ? '…' : t.ui.markOrdered}
        </Button>
      );
    }
    if (order.status === 'ORDERED') {
      return (
        <Button
          variant="default"
          size="sm"
          className="min-h-10 w-full touch-manipulation sm:w-auto"
          disabled={isUpdating}
          onClick={() => handleStatus(order.id, 'RECEIVED')}
        >
          {isUpdating ? '…' : t.ui.markReceived}
        </Button>
      );
    }
    if (order.status === 'RECEIVED') {
      return <span className="text-xs text-zinc-500">{t.ui.stockUpdated}</span>;
    }
    return null;
  };

  return (
    <>
      <div className="space-y-3 md:hidden">
        {orders.map((order) => {
          const total = order.lines.reduce(
            (sum, l) => sum + l.quantity * toNum(l.unitCost),
            0
          );
          const isUpdating = updatingId === order.id;
          return (
            <div
              key={order.id}
              className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-50">{order.orderNumber}</p>
                  <p className="mt-0.5 truncate text-sm text-zinc-400">
                    {order.supplier.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {t.ui.itemsCount.replace('{count}', String(order.lines.length))} ·{' '}
                    {formatCurrency(total)}
                  </p>
                </div>
                {statusBadge(order.status)}
              </div>
              <div className="mt-3">{actionButton(order, isUpdating)}</div>
            </div>
          );
        })}
      </div>

      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.ui.colOrder}</TableHead>
                <TableHead>{t.ui.colSupplier}</TableHead>
                <TableHead>{t.ui.colStatus}</TableHead>
                <TableHead>{t.ui.colLines}</TableHead>
                <TableHead className="text-right">{t.ui.colTotal}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const total = order.lines.reduce(
                  (sum, l) => sum + l.quantity * toNum(l.unitCost),
                  0
                );
                const isUpdating = updatingId === order.id;
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.supplier.name}</TableCell>
                    <TableCell>{statusBadge(order.status)}</TableCell>
                    <TableCell>
                      {t.ui.itemsCount.replace('{count}', String(order.lines.length))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(total)}
                    </TableCell>
                    <TableCell className="text-right">
                      {actionButton(order, isUpdating)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
