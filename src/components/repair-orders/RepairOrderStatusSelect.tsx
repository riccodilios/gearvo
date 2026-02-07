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
import { updateRepairOrderStatus } from '@/app/actions/repair-orders';

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

export function RepairOrderStatusSelect({ orderId, currentStatus }: RepairOrderStatusSelectProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = async (value: string) => {
    setLoading(true);
    try {
      await updateRepairOrderStatus(orderId, value as Status);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select
      value={currentStatus}
      onValueChange={handleChange}
      disabled={loading}
    >
      <SelectTrigger className="w-[140px] h-8">
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
  );
}
