import { getSuppliersWithParts, getPurchaseOrders } from '@/app/actions/marketplace';
import { gatePage } from '@/server/page-gate';
import { FeatureModule } from '@prisma/client';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { ShoppingCart, Package } from 'lucide-react';
import { MarketplaceSupplierOrder } from '@/components/marketplace/MarketplaceSupplierOrder';
import { PurchaseOrdersList } from '@/components/marketplace/PurchaseOrdersList';

function toNum(v: unknown): number {
  return typeof v === 'number' ? v : Number(String(v));
}

export default async function MarketplacePage() {
  await gatePage('marketplace:read', FeatureModule.MARKETPLACE);
  const [suppliersWithParts, ordersResult] = await Promise.all([
    getSuppliersWithParts(),
    getPurchaseOrders(),
  ]);
  const orders = ordersResult.items;

  const suppliersWithPartsToOrder = suppliersWithParts.filter((s) => s.carParts.length > 0);

  const serializedSuppliers = suppliersWithPartsToOrder.map((s) => ({
    id: s.id,
    name: s.name,
    carParts: s.carParts.map((p) => ({
      id: p.id,
      name: p.name,
      partNumber: p.partNumber,
      costPrice: toNum(p.costPrice),
      retailPrice: toNum(p.retailPrice),
      stockQuantity: p.stockQuantity,
      minStockLevel: p.minStockLevel,
    })),
  }));

  const serializedOrders = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    supplier: { name: o.supplier.name },
    lines: o.lines.map((l) => ({
      id: l.id,
      quantity: l.quantity,
      unitCost: toNum(l.unitCost),
      carPart: { id: l.carPart.id, name: l.carPart.name },
    })),
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Order parts"
        description="Order parts from your suppliers and track purchase orders"
      />

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">Order from suppliers</h2>
        {serializedSuppliers.length === 0 ? (
          <EmptyState
            icon={<Package className="h-6 w-6" />}
            title="No parts linked to suppliers"
            description="Add suppliers and assign parts to them in Inventory to order here."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {serializedSuppliers.map((supplier) => (
              <MarketplaceSupplierOrder key={supplier.id} supplier={supplier} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">Your purchase orders</h2>
        {serializedOrders.length === 0 ? (
          <EmptyState
            compact
            icon={<ShoppingCart className="h-5 w-5" />}
            title="No purchase orders yet"
            description="Place an order from a supplier above to track it here."
          />
        ) : (
          <PurchaseOrdersList orders={serializedOrders} />
        )}
      </section>
    </div>
  );
}
