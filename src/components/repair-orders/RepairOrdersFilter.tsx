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
import { useI18n } from '@/i18n/provider';

export function RepairOrdersFilter() {
  const { t } = useI18n();
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
        <SelectValue placeholder={t.ui.filterByStatus} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t.ui.allStatuses}</SelectItem>
        <SelectItem value="PENDING">{t.ui.statusPending}</SelectItem>
        <SelectItem value="IN_PROGRESS">{t.ui.statusInProgress}</SelectItem>
        <SelectItem value="WAITING_PARTS">{t.ui.statusWaitingParts}</SelectItem>
        <SelectItem value="COMPLETED">{t.ui.statusCompleted}</SelectItem>
        <SelectItem value="DELIVERED">{t.ui.statusDelivered}</SelectItem>
        <SelectItem value="CANCELLED">{t.ui.statusCancelled}</SelectItem>
      </SelectContent>
    </Select>
  );
}
