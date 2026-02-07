import {
  getDashboardStats,
  getRevenueTrend,
  getDailyRevenue,
  getPaymentMethodsStats,
  getRevenueByCategory,
} from '@/app/actions/dashboard';
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
  const [stats, revenueTrend, dailyRevenue, paymentMethods, revenueByCategory] =
    await Promise.all([
      getDashboardStats(),
      getRevenueTrend(12),
      getDailyRevenue(),
      getPaymentMethodsStats(),
      getRevenueByCategory(),
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
          value={formatCurrency(stats.thisMonthRevenue)}
          trend={{
            value: stats.monthOverMonth,
            label: 'vs last month',
            positive: stats.monthOverMonth >= 0,
          }}
          icon={DollarSign}
        />
        <StatCard
          title="Total Profit"
          value={formatCurrency(stats.totalProfit)}
          icon={TrendingUp}
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(stats.outstandingBalance)}
          icon={BarChart3}
        />
        <StatCard
          title="Next Month Forecast"
          value={formatCurrency(stats.nextMonthForecast)}
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
            <DailyRevenueChart data={dailyRevenue} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <p className="text-sm text-zinc-400">Revenue by payment type</p>
          </CardHeader>
          <CardContent>
            <PaymentMethodsChart data={paymentMethods} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by Part Category</CardTitle>
          <p className="text-sm text-zinc-400">Retail revenue from repair orders</p>
        </CardHeader>
        <CardContent>
          <RevenueByCategoryChart data={revenueByCategory} />
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
    </div>
  );
}
