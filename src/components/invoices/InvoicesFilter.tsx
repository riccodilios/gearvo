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

export function InvoicesFilter() {
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
      router.push(`/invoices?${params.toString()}`);
    });
  };

  return (
    <Select value={status} onValueChange={handleChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={t.ui.filterByStatus} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t.ui.allStatuses}</SelectItem>
        <SelectItem value="UNPAID">{t.ui.statusUnpaid}</SelectItem>
        <SelectItem value="PARTIAL">{t.ui.statusPartial}</SelectItem>
        <SelectItem value="PAID">{t.ui.statusPaid}</SelectItem>
        <SelectItem value="OVERDUE">{t.ui.statusOverdue}</SelectItem>
      </SelectContent>
    </Select>
  );
}
