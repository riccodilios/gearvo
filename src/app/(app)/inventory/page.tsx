import { getCarParts } from '@/app/actions/inventory';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Package, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CarPartFormDialog } from '@/components/inventory/CarPartFormDialog';
import { InventorySearchFilter } from '@/components/inventory/InventorySearchFilter';
import { AppLabel, Ui } from '@/i18n/T';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const category = params.category ?? 'all';
  const query = params.q ?? '';
  const { items: parts } = await getCarParts({ category, q: query, pageSize: 100 });
  const categories = [...new Set(parts.map((p) => p.category).filter(Boolean))] as string[];
  const filtered = parts;

  const margin = (retail: number, cost: number) =>
    cost > 0 ? (((retail - cost) / cost) * 100).toFixed(1) : '0';
  const isLowStock = (qty: number, min: number) => qty <= min;

  const partEditPayload = (part: (typeof filtered)[number]) => ({
    id: part.id,
    name: part.name,
    partNumber: part.partNumber,
    supplierId: part.supplierId,
    costPrice: Number(part.costPrice),
    retailPrice: Number(part.retailPrice),
    stockQuantity: part.stockQuantity,
    minStockLevel: part.minStockLevel,
    category: part.category,
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title={<AppLabel k="inventory" />}
        description={<Ui k="inventoryDesc" />}
        actions={
          <CarPartFormDialog
            trigger={
              <Button className="w-full touch-manipulation sm:w-auto">
                <Plus className="me-2 h-4 w-4" />
                <Ui k="addPart" />
              </Button>
            }
          />
        }
      />

      <InventorySearchFilter categories={categories} />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title={<Ui k="noPartsInInventory" />}
          description={<Ui k="addPartsToStart" />}
          action={
            <CarPartFormDialog trigger={<Button><Ui k="addPart" /></Button>} />
          }
        />
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((part) => {
              const low = isLowStock(part.stockQuantity, part.minStockLevel);
              return (
                <div
                  key={part.id}
                  className={`rounded-xl border p-4 ${
                    low
                      ? 'border-amber-500/40 bg-amber-950/20'
                      : 'border-zinc-800 bg-zinc-950/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-50">{part.name}</p>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {[part.partNumber, part.category, part.supplier?.name]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </p>
                    </div>
                    <CarPartFormDialog
                      part={partEditPayload(part)}
                      trigger={
                        <Button variant="ghost" size="sm" className="min-h-10 shrink-0 touch-manipulation">
                          <AppLabel k="edit" />
                        </Button>
                      }
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-[11px] text-zinc-500"><Ui k="colStock" /></p>
                      <p
                        className={`mt-0.5 flex items-center gap-1 font-medium tabular-nums ${
                          low ? 'text-amber-500' : 'text-zinc-200'
                        }`}
                      >
                        {low && <AlertTriangle className="h-3.5 w-3.5" />}
                        {part.stockQuantity}/{part.minStockLevel}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-zinc-500"><Ui k="colRetail" /></p>
                      <p className="mt-0.5 font-medium tabular-nums text-zinc-200">
                        {formatCurrency(Number(part.retailPrice))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-zinc-500"><Ui k="colMargin" /></p>
                      <p className="mt-0.5 font-medium tabular-nums text-emerald-500">
                        {margin(Number(part.retailPrice), Number(part.costPrice))}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><Ui k="colName" /></TableHead>
                    <TableHead><Ui k="colPartNumber" /></TableHead>
                    <TableHead><Ui k="colCategory" /></TableHead>
                    <TableHead><Ui k="colSupplier" /></TableHead>
                    <TableHead className="text-right"><Ui k="colStock" /></TableHead>
                    <TableHead className="text-right"><Ui k="colCost" /></TableHead>
                    <TableHead className="text-right"><Ui k="colRetail" /></TableHead>
                    <TableHead className="text-right"><Ui k="colMargin" /></TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((part) => (
                    <TableRow
                      key={part.id}
                      className={
                        isLowStock(part.stockQuantity, part.minStockLevel)
                          ? 'bg-amber-950/20'
                          : ''
                      }
                    >
                      <TableCell className="font-medium">{part.name}</TableCell>
                      <TableCell className="text-zinc-500">
                        {part.partNumber ?? '-'}
                      </TableCell>
                      <TableCell>{part.category ?? '-'}</TableCell>
                      <TableCell>{part.supplier?.name ?? '-'}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            isLowStock(part.stockQuantity, part.minStockLevel)
                              ? 'flex items-center justify-end gap-1 font-medium text-amber-500'
                              : ''
                          }
                        >
                          {isLowStock(part.stockQuantity, part.minStockLevel) && (
                            <AlertTriangle className="h-4 w-4" />
                          )}
                          {part.stockQuantity} / {part.minStockLevel}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(part.costPrice))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(part.retailPrice))}
                      </TableCell>
                      <TableCell className="text-right text-emerald-500">
                        {margin(Number(part.retailPrice), Number(part.costPrice))}%
                      </TableCell>
                      <TableCell>
                        <CarPartFormDialog
                          part={partEditPayload(part)}
                          trigger={
                            <Button variant="ghost" size="sm">
                              <AppLabel k="edit" />
                            </Button>
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
