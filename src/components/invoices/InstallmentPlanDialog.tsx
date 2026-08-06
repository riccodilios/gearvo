'use client';

import { useState, useTransition } from 'react';
import { createInstallmentPlan, markInstallmentPaid } from '@/app/actions/invoices';
import { formError } from '@/lib/form-error';
import { toast } from '@/lib/mutation-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useRouter } from 'next/navigation';

export function InstallmentPlanDialog({
  invoiceId,
  remainingBalance,
  trigger,
}: {
  invoiceId: string;
  remainingBalance: number;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(3);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create installment plan</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const amounts: number[] = [];
            const dueDates: Date[] = [];
            const each = Math.round((remainingBalance / count) * 100) / 100;
            let allocated = 0;
            for (let i = 0; i < count; i++) {
              const amount =
                i === count - 1
                  ? Math.round((remainingBalance - allocated) * 100) / 100
                  : each;
              amounts.push(amount);
              allocated += amount;
              const d = new Date();
              d.setDate(d.getDate() + 14 * (i + 1));
              dueDates.push(d);
            }
            startTransition(async () => {
              try {
                await createInstallmentPlan({ invoiceId, amounts, dueDates });
                toast.success('Installment plan created');
                setOpen(false);
                router.refresh();
              } catch (err) {
                const msg = formError(err);
                setError(msg);
                toast.error(msg);
              }
            });
          }}
        >
          <p className="text-sm text-zinc-400">
            Remaining balance: {remainingBalance.toFixed(2)} SAR — split equally
            across installments (bi-weekly).
          </p>
          <div className="space-y-2">
            <Label htmlFor="count">Number of installments</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={12}
              value={count}
              onChange={(e) => setCount(Number(e.target.value) || 1)}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={pending || remainingBalance <= 0}>
            {pending ? 'Creating…' : 'Create plan'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MarkInstallmentPaidButton({ installmentId }: { installmentId: string }) {
  const [pending, startTransition] = useTransition();
  const [paid, setPaid] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();

  if (paid) {
    return (
      <span className="text-xs font-medium text-emerald-500 animate-in fade-in">Paid</span>
    );
  }

  const confirmPaid = () => {
    startTransition(async () => {
      setPaid(true);
      setConfirmOpen(false);
      try {
        await markInstallmentPaid(installmentId);
        toast.success('Installment marked paid');
        router.refresh();
      } catch (err) {
        setPaid(false);
        toast.error(formError(err));
      }
    });
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        className="min-h-10 touch-manipulation"
        onClick={() => setConfirmOpen(true)}
      >
        {pending ? '…' : 'Mark paid'}
      </Button>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark installment as paid?</AlertDialogTitle>
            <AlertDialogDescription>
              This records the installment payment. Make sure the customer has paid
              before confirming.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction className="w-full sm:w-auto" onClick={confirmPaid}>
              Mark paid
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
