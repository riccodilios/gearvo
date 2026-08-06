import { getLowStockParts } from '@/app/actions/inventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { getT } from '@/i18n/server';

export async function LowStockAlerts() {
  const [t, parts] = await Promise.all([getT(), getLowStockParts()]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.ui.lowStockAlerts}</CardTitle>
        <p className="text-sm text-zinc-400">{t.ui.partsBelowMin}</p>
      </CardHeader>
      <CardContent>
        {parts.length === 0 ? (
          <p className="text-sm text-zinc-500">{t.ui.allPartsStocked}</p>
        ) : (
          <div className="space-y-3">
            {parts.slice(0, 5).map((part) => (
              <Link
                key={part.id}
                href="/inventory"
                className="block rounded-lg border border-zinc-800 p-3 transition-colors hover:bg-zinc-800/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{part.name}</p>
                    <p className="text-sm text-zinc-500">
                      {part.stockQuantity} / {part.minStockLevel} {t.ui.minAbbrev}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-amber-500">
                    {formatCurrency(Number(part.retailPrice))}
                  </p>
                </div>
              </Link>
            ))}
            {parts.length > 5 && (
              <Link
                href="/inventory"
                className="block text-center text-sm text-amber-500 hover:underline"
              >
                +{parts.length - 5} {t.ui.more}
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
