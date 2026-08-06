import {
  getDashboardStats,
  getRevenueTrend,
  getRecentRepairOrders,
} from '@/app/actions/dashboard';
import { StatCard } from '@/components/StatCard';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  Users,
  Package,
  AlertTriangle,
  Calendar,
  Wrench,
} from 'lucide-react';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { LowStockAlerts } from '@/components/dashboard/LowStockAlerts';

export default async function DashboardPage() {
  const [stats, revenueTrend, recentOrders] = await Promise.all([
    getDashboardStats(),
    getRevenueTrend(6),
    getRecentRepairOrders(5),
  ]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your mechanic shop performance"
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(stats.revenueToday)}
          icon={DollarSign}
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats.revenueMonth)}
          icon={TrendingUp}
        />
        <StatCard
          title="Monthly Profit"
          value={formatCurrency(stats.profitMonth)}
          description="From completed repairs"
          icon={DollarSign}
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(stats.outstanding)}
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Repairs</CardTitle>
            <Wrench className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openRepairs}</div>
            <Link
              href="/repair-orders"
              className="text-xs text-amber-500 hover:underline"
            >
              View all
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customersCount}</div>
            <Link
              href="/customers"
              className="text-xs text-amber-500 hover:underline"
            >
              View all
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStockCount}</div>
            <Link
              href="/inventory"
              className="text-xs text-amber-500 hover:underline"
            >
              Manage
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Installments
            </CardTitle>
            <Calendar className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.upcomingInstallments)}
            </div>
            <p className="text-xs text-zinc-500">Next 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Next Month Forecast
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.forecastNextMonth)}
            </div>
            <p className="text-xs text-zinc-500">Based on current trend</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <p className="text-sm text-zinc-400">Last 6 months</p>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueTrend} />
          </CardContent>
        </Card>
        <div className="space-y-4">
          <LowStockAlerts />
          <Card>
            <CardHeader>
              <CardTitle>Recent Repair Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-6 text-center">
                    <p className="text-sm text-zinc-500">No recent repair orders</p>
                    <Link
                      href="/repair-orders"
                      className="mt-2 inline-block text-sm font-medium text-amber-500 hover:underline"
                    >
                      Create a repair order
                    </Link>
                  </div>
                ) : (
                  recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/repair-orders/${order.id}`}
                      className="flex flex-col gap-2 rounded-lg border border-zinc-800 p-3 transition-colors active:bg-zinc-800/50 hover:bg-zinc-800/50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{order.orderNumber}</p>
                        <p className="truncate text-sm text-zinc-500">
                          {order.customer.fullName} • {order.vehicle.make}{' '}
                          {order.vehicle.model}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:text-right">
                        <p className="font-medium">
                          {formatCurrency(Number(order.totalPrice))}
                        </p>
                        <StatusBadge status={order.status} />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    'default' | 'secondary' | 'success' | 'warning'
  > = {
    PENDING: 'secondary',
    IN_PROGRESS: 'default',
    WAITING_PARTS: 'warning',
    COMPLETED: 'success',
    DELIVERED: 'success',
    CANCELLED: 'secondary',
  };
  return (
    <Badge variant={variants[status] ?? 'secondary'} className="mt-1">
      {status.replace('_', ' ')}
    </Badge>
  );
}
