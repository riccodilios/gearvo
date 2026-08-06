'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFilterPending } from '@/components/ui/filter-pending';

export function RepairOrdersFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startTransition } = useFilterPending();
  const status = searchParams.get('status') ?? 'all';

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('status');
    } else {
      params.set('status', value);
    }
    startTransition(() => {
      router.push(`/repair-orders?${params.toString()}`);
    });
  };

  return (
    <Select value={status} onValueChange={handleChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filter by status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Status</SelectItem>
        <SelectItem value="PENDING">Pending</SelectItem>
        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
        <SelectItem value="WAITING_PARTS">Waiting Parts</SelectItem>
        <SelectItem value="COMPLETED">Completed</SelectItem>
        <SelectItem value="DELIVERED">Delivered</SelectItem>
        <SelectItem value="CANCELLED">Cancelled</SelectItem>
      </SelectContent>
    </Select>
  );
}
