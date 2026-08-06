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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { recordPayment } from '@/app/actions/invoices';
import { formError } from '@/lib/form-error';
import { toast } from '@/lib/mutation-toast';
import { useSubmitGuard } from '@/hooks/use-submit-guard';
import { formatCurrency } from '@/lib/utils';

interface PaymentDialogProps {
  invoiceId: string;
  remainingBalance: number;
  trigger: React.ReactNode;
  defaultOpen?: boolean;
}

export function PaymentDialog({
  invoiceId,
  remainingBalance,
  trigger,
  defaultOpen = false,
}: PaymentDialogProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState('CASH');
  const [amount, setAmount] = useState(
    remainingBalance > 0 ? remainingBalance.toFixed(2) : ''
  );
  const { loading, run } = useSubmitGuard();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const paid = parseFloat(formData.get('amount') as string) || 0;

    await run(async () => {
      try {
        await recordPayment({
          invoiceId,
          amount: paid,
          method,
          notes: (formData.get('notes') as string) || undefined,
        });
        const remaining = Math.max(0, remainingBalance - paid);
        toast.success(
          remaining > 0
            ? `Payment recorded · ${formatCurrency(remaining)} remaining`
            : 'Payment recorded · Invoice paid in full'
        );
        setOpen(false);
        router.refresh();
      } catch (err) {
        const msg = formError(err);
        setError(msg);
        toast.error(msg);
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (loading) return;
        setOpen(next);
        if (next) {
          setAmount(remainingBalance > 0 ? remainingBalance.toFixed(2) : '');
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="sm:max-w-[400px]"
        onPointerDownOutside={(e) => loading && e.preventDefault()}
        onEscapeKeyDown={(e) => loading && e.preventDefault()}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Amount *</Label>
                {remainingBalance > 0 && (
                  <button
                    type="button"
                    className="text-xs font-medium text-amber-500 hover:underline"
                    onClick={() => setAmount(remainingBalance.toFixed(2))}
                    disabled={loading}
                  >
                    Pay full balance
                  </button>
                )}
              </div>
              <Input
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={remainingBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
              <p className="text-xs text-zinc-500">
                Balance: {formatCurrency(remainingBalance)}
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Method *</Label>
              <Select value={method} onValueChange={setMethod} disabled={loading}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CHECK">Check</SelectItem>
                  <SelectItem value="STRIPE">Stripe</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
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
            <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
              {loading ? 'Recording…' : 'Record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
