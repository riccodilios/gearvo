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

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
        <CardContent className="p-0">
          <div className="table-scroll px-4 sm:px-6">
            <table className="w-full min-w-[16rem] text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="py-3 text-start font-medium">Month</th>
                  <th className="py-3 text-end font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {revenueTrend.map((row) => (
                  <tr key={row.month} className="border-b border-zinc-800/50">
                    <td className="py-3">{row.month}</td>
                    <td className="py-3 text-end font-medium tabular-nums text-emerald-500">
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
            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {branchCompare.map((b) => (
                <div
                  key={b.branchId}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
                >
                  <p className="font-medium text-zinc-50">{b.branchName}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-[11px] text-zinc-500">Revenue</p>
                      <p className="mt-0.5 font-medium tabular-nums text-emerald-500">
                        {formatCurrency(b.revenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-zinc-500">Repairs</p>
                      <p className="mt-0.5 tabular-nums text-zinc-200">{b.repairs}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-zinc-500">Customers</p>
                      <p className="mt-0.5 tabular-nums text-zinc-200">{b.customers}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden table-scroll md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="py-3 text-start">Branch</th>
                    <th className="py-3 text-end">Revenue</th>
                    <th className="py-3 text-end">Repairs</th>
                    <th className="py-3 text-end">Customers</th>
                  </tr>
                </thead>
                <tbody>
                  {branchCompare.map((b) => (
                    <tr key={b.branchId} className="border-b border-zinc-800/50">
                      <td className="py-3">{b.branchName}</td>
                      <td className="py-3 text-end tabular-nums text-emerald-500">
                        {formatCurrency(b.revenue)}
                      </td>
                      <td className="py-3 text-end tabular-nums">{b.repairs}</td>
                      <td className="py-3 text-end tabular-nums">{b.customers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
