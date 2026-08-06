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
import { AppLabel, CommonLabel, Ui } from '@/i18n/T';

export default async function DashboardPage() {
  const [stats, revenueTrend, recentOrders] = await Promise.all([
    getDashboardStats(),
    getRevenueTrend(6),
    getRecentRepairOrders(5),
  ]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader title={<AppLabel k="dashboard" />} description={<Ui k="dashboardOverview" />} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          title={<Ui k="revenueToday" />}
          value={formatCurrency(stats.revenueToday)}
          icon={DollarSign}
        />
        <StatCard
          title={<Ui k="revenueMonth" />}
          value={formatCurrency(stats.revenueMonth)}
          icon={TrendingUp}
        />
        <StatCard
          title={<Ui k="profitMonth" />}
          value={formatCurrency(stats.profitMonth)}
          description={<Ui k="fromCompletedRepairs" />}
          icon={DollarSign}
        />
        <StatCard
          title={<Ui k="outstandingBalance" />}
          value={formatCurrency(stats.outstanding)}
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium"><Ui k="activeRepairs" /></CardTitle>
            <Wrench className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openRepairs}</div>
            <Link
              href="/repair-orders"
              className="text-xs text-amber-500 hover:underline"
            >
              <CommonLabel k="viewAll" />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium"><Ui k="totalCustomers" /></CardTitle>
            <Users className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customersCount}</div>
            <Link href="/customers" className="text-xs text-amber-500 hover:underline">
              <CommonLabel k="viewAll" />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium"><Ui k="lowStockItems" /></CardTitle>
            <Package className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStockCount}</div>
            <Link href="/inventory" className="text-xs text-amber-500 hover:underline">
              <Ui k="manage" />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium"><Ui k="upcomingInstallments" /></CardTitle>
            <Calendar className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.upcomingInstallments)}
            </div>
            <p className="text-xs text-zinc-500"><Ui k="next30Days" /></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium"><Ui k="nextMonthForecast" /></CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.forecastNextMonth)}
            </div>
            <p className="text-xs text-zinc-500"><Ui k="basedOnTrend" /></p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle><Ui k="revenueTrend" /></CardTitle>
            <p className="text-sm text-zinc-400"><Ui k="last6Months" /></p>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueTrend} />
          </CardContent>
        </Card>
        <div className="space-y-4">
          <LowStockAlerts />
          <Card>
            <CardHeader>
              <CardTitle><Ui k="recentRepairOrders" /></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-6 text-center">
                    <p className="text-sm text-zinc-500"><Ui k="noRecentRepairOrders" /></p>
                    <Link
                      href="/repair-orders"
                      className="mt-2 inline-block text-sm font-medium text-amber-500 hover:underline"
                    >
                      <Ui k="createRepairOrder" />
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
                      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:text-end">
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
  const variants: Record<string, 'default' | 'secondary' | 'success' | 'warning'> = {
    PENDING: 'secondary',
    IN_PROGRESS: 'default',
    WAITING_PARTS: 'warning',
    COMPLETED: 'success',
    DELIVERED: 'success',
    CANCELLED: 'secondary',
  };
  const keys = {
    PENDING: 'statusPending',
    IN_PROGRESS: 'statusInProgress',
    WAITING_PARTS: 'statusWaitingParts',
    COMPLETED: 'statusCompleted',
    DELIVERED: 'statusDelivered',
    CANCELLED: 'statusCancelled',
  } as const;
  const key = keys[status as keyof typeof keys];
  return (
    <Badge variant={variants[status] ?? 'secondary'} className="mt-1">
      {key ? <Ui k={key} /> : status.replace(/_/g, ' ')}
    </Badge>
  );
}
