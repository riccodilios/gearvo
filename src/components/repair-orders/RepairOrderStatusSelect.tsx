'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { updateRepairOrderStatus } from '@/app/actions/repair-orders';
import { runMutation } from '@/lib/mutation-toast';
import { cn } from '@/lib/utils';

const STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'WAITING_PARTS', label: 'Waiting Parts' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

type Status = (typeof STATUSES)[number]['value'];

interface RepairOrderStatusSelectProps {
  orderId: string;
  currentStatus: string;
}

export function RepairOrderStatusSelect({
  orderId,
  currentStatus,
}: RepairOrderStatusSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    currentStatus,
    (_current, next: string) => next
  );

  const applyStatus = (value: string) => {
    startTransition(async () => {
      setOptimisticStatus(value);
      const ok = await runMutation(
        () => updateRepairOrderStatus(orderId, value as Status),
        {
          success:
            value === 'CANCELLED' ? 'Repair order cancelled' : 'Status updated',
        }
      );
      router.refresh();
      if (!ok) return;
    });
  };

  const handleChange = (value: string) => {
    if (value === optimisticStatus) return;
    if (value === 'CANCELLED') {
      setConfirmCancel(true);
      return;
    }
    applyStatus(value);
  };

  return (
    <>
      <Select
        value={optimisticStatus}
        onValueChange={handleChange}
        disabled={isPending}
      >
        <SelectTrigger
          className={cn(
            'h-10 min-h-10 w-[min(100%,11rem)] touch-manipulation transition-opacity sm:h-8 sm:min-h-8 sm:w-[140px]',
            isPending && 'opacity-60'
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this repair order?</AlertDialogTitle>
            <AlertDialogDescription>
              Cancelling restores reserved stock and cannot be undone from this
              screen. The order will be marked Cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="w-full sm:w-auto">Keep open</AlertDialogCancel>
            <AlertDialogAction
              className="w-full bg-red-600 hover:bg-red-700 sm:w-auto"
              onClick={() => applyStatus('CANCELLED')}
            >
              Cancel order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
