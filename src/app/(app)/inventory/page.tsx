import { getCarParts } from '@/app/actions/inventory';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Package, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CarPartFormDialog } from '@/components/inventory/CarPartFormDialog';
import { InventorySearchFilter } from '@/components/inventory/InventorySearchFilter';
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
    cost > 0 ? ((retail - cost) / cost * 100).toFixed(1) : '0';
  const isLowStock = (qty: number, min: number) => qty <= min;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Inventory"
        description="Manage car parts and stock levels"
        actions={
          <CarPartFormDialog
            trigger={
              <Button>
                <Plus className="me-2 h-4 w-4" />
                Add Part
              </Button>
            }
          />
        }
      />

      <InventorySearchFilter categories={categories} />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="No parts in inventory"
          description="Add car parts to get started"
          action={
            <CarPartFormDialog trigger={<Button>Add Part</Button>} />
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Part #</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Retail</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
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
                    <TableCell>
                      {part.supplier?.name ?? '-'}
                    </TableCell>
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
                      part={{
                        id: part.id,
                        name: part.name,
                        partNumber: part.partNumber,
                        supplierId: part.supplierId,
                        costPrice: Number(part.costPrice),
                        retailPrice: Number(part.retailPrice),
                        stockQuantity: part.stockQuantity,
                        minStockLevel: part.minStockLevel,
                        category: part.category,
                      }}
                      trigger={<Button variant="ghost" size="sm">Edit</Button>}
                    />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
