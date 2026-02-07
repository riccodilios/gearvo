'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updatePaymentMethod } from '@/app/actions/invoices';

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

export function PaymentMethodSelect({ paymentId, currentMethod }: PaymentMethodSelectProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = async (value: string) => {
    setLoading(true);
    try {
      await updatePaymentMethod(paymentId, value as (typeof METHODS)[number]['value']);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const label = METHODS.find((m) => m.value === currentMethod)?.label ?? currentMethod;

  return (
    <Select
      value={currentMethod}
      onValueChange={handleChange}
      disabled={loading}
    >
      <SelectTrigger className="w-[130px] h-8">
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
