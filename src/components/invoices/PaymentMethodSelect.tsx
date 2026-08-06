'use client';

import { useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updatePaymentMethod } from '@/app/actions/invoices';
import { runMutation } from '@/lib/mutation-toast';
import { cn } from '@/lib/utils';

const METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHECK', label: 'Check' },
  { value: 'STRIPE', label: 'Stripe' },
  { value: 'OTHER', label: 'Other' },
] as const;

interface PaymentMethodSelectProps {
  paymentId: string;
  currentMethod: string;
}

export function PaymentMethodSelect({
  paymentId,
  currentMethod,
}: PaymentMethodSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticMethod, setOptimisticMethod] = useOptimistic(
    currentMethod,
    (_current, next: string) => next
  );

  const handleChange = (value: string) => {
    if (value === optimisticMethod) return;
    startTransition(async () => {
      setOptimisticMethod(value);
      const ok = await runMutation(
        () =>
          updatePaymentMethod(
            paymentId,
            value as (typeof METHODS)[number]['value']
          ),
        { success: 'Payment method updated' }
      );
      if (!ok) {
        router.refresh();
        return;
      }
      router.refresh();
    });
  };

  const label =
    METHODS.find((m) => m.value === optimisticMethod)?.label ?? optimisticMethod;

  return (
    <Select
      value={optimisticMethod}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger
        className={cn('h-8 w-[130px] transition-opacity', isPending && 'opacity-60')}
      >
        <SelectValue>{label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {METHODS.map((m) => (
          <SelectItem key={m.value} value={m.value}>
            {m.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
