import {
  getDashboardStats,
  getRevenueTrend,
  getDailyRevenue,
  getPaymentMethodsStats,
  getRevenueByCategory,
  getBranchComparison,
} from '@/app/actions/dashboard';
import { gatePage } from '@/server/page-gate';
import { FeatureModule } from '@prisma/client';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { RevenueVsProfitChart } from '@/components/analytics/RevenueVsProfitChart';
import { DailyRevenueChart } from '@/components/analytics/DailyRevenueChart';
import { PaymentMethodsChart } from '@/components/analytics/PaymentMethodsChart';
import { RevenueByCategoryChart } from '@/components/analytics/RevenueByCategoryChart';

export default async function AnalyticsPage() {
  await gatePage('analytics:read', FeatureModule.ANALYTICS);
  const [stats, revenueTrend, dailyRevenue, paymentMethods, revenueByCategory, branchCompare] =
    await Promise.all([
      getDashboardStats(),
      getRevenueTrend(12),
      getDailyRevenue(),
      getPaymentMethodsStats(),
      getRevenueByCategory(),
      getBranchComparison(),
    ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="Business intelligence and projections"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="This Month Revenue"
          value={formatCurrency(stats.revenueMonth)}
          icon={DollarSign}
        />
        <StatCard
          title="Monthly Profit"
          value={formatCurrency(stats.profitMonth)}
          icon={TrendingUp}
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(stats.outstanding)}
          icon={BarChart3}
        />
        <StatCard
          title="Next Month Forecast"
          value={formatCurrency(stats.forecastNextMonth)}
          icon={TrendingUp}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue vs Profit (Last 12 Months)</CardTitle>
          <p className="text-sm text-zinc-400">
            Monthly comparison
          </p>
        </CardHeader>
        <CardContent>
          <RevenueVsProfitChart data={revenueTrend} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Revenue</CardTitle>
            <p className="text-sm text-zinc-400">Current month</p>
          </CardHeader>
          <CardContent>
            <DailyRevenueChart
              data={dailyRevenue.map((d) => ({ day: d.date, revenue: d.revenue }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <p className="text-sm text-zinc-400">Revenue by payment type</p>
          </CardHeader>
          <CardContent>
            <PaymentMethodsChart
              data={paymentMethods.map((p) => ({
                name: p.method,
                value: p.amount,
              }))}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by Part Category</CardTitle>
          <p className="text-sm text-zinc-400">Retail revenue from repair orders</p>
        </CardHeader>
        <CardContent>
          <RevenueByCategoryChart
            data={revenueByCategory.map((c) => ({
              name: c.category,
              value: c.amount,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <p className="text-sm text-zinc-400">Monthly revenue over time</p>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="py-3 text-left font-medium">Month</th>
                  <th className="py-3 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {revenueTrend.map((row) => (
                  <tr key={row.month} className="border-b border-zinc-800/50">
                    <td className="py-3">{row.month}</td>
                    <td className="py-3 text-right font-medium text-emerald-500">
                      {formatCurrency(row.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {branchCompare.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Branch comparison (this month)</CardTitle>
            <p className="text-sm text-zinc-400">Company-wide view</p>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="py-3 text-left">Branch</th>
                  <th className="py-3 text-right">Revenue</th>
                  <th className="py-3 text-right">Repairs</th>
                  <th className="py-3 text-right">Customers</th>
                </tr>
              </thead>
              <tbody>
                {branchCompare.map((b) => (
                  <tr key={b.branchId} className="border-b border-zinc-800/50">
                    <td className="py-3">{b.branchName}</td>
                    <td className="py-3 text-right text-emerald-500">
                      {formatCurrency(b.revenue)}
                    </td>
                    <td className="py-3 text-right">{b.repairs}</td>
                    <td className="py-3 text-right">{b.customers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
