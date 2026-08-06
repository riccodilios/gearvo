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
import { useI18n } from '@/i18n/provider';

const STATUS_VALUES = [
  'PENDING',
  'IN_PROGRESS',
  'WAITING_PARTS',
  'COMPLETED',
  'DELIVERED',
  'CANCELLED',
] as const;

type Status = (typeof STATUS_VALUES)[number];

interface RepairOrderStatusSelectProps {
  orderId: string;
  currentStatus: string;
}

export function RepairOrderStatusSelect({
  orderId,
  currentStatus,
}: RepairOrderStatusSelectProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    currentStatus,
    (_current, next: string) => next
  );

  const statusLabels: Record<Status, string> = {
    PENDING: t.ui.statusPending,
    IN_PROGRESS: t.ui.statusInProgress,
    WAITING_PARTS: t.ui.statusWaitingParts,
    COMPLETED: t.ui.statusCompleted,
    DELIVERED: t.ui.statusDelivered,
    CANCELLED: t.ui.statusCancelled,
  };

  const applyStatus = (value: string) => {
    startTransition(async () => {
      setOptimisticStatus(value);
      const ok = await runMutation(
        () => updateRepairOrderStatus(orderId, value as Status),
        {
          success:
            value === 'CANCELLED' ? t.ui.orderCancelledToast : t.ui.statusUpdated,
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
          {STATUS_VALUES.map((value) => (
            <SelectItem key={value} value={value}>
              {statusLabels[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.ui.cancelOrderTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.ui.cancelOrderDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="w-full sm:w-auto">
              {t.ui.keepOpen}
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full bg-red-600 hover:bg-red-700 sm:w-auto"
              onClick={() => applyStatus('CANCELLED')}
            >
              {t.ui.cancelOrder}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
