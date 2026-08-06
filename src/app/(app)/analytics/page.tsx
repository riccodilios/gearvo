import { Suspense } from 'react';
import {
  getAnalyticsSummary,
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
import { Skeleton } from '@/components/skeletons/PageSkeletons';
import { getT } from '@/i18n/server';

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}

function ChartCardSkeleton({ className }: { className?: string }) {
  return <Skeleton className={`h-[280px] w-full rounded-xl ${className ?? ''}`} />;
}

async function AnalyticsStats() {
  const [t, stats] = await Promise.all([getT(), getAnalyticsSummary()]);
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatCard
        title={t.ui.analyticsRevenueMonth}
        value={formatCurrency(stats.revenueMonth)}
        icon={DollarSign}
      />
      <StatCard
        title={t.ui.analyticsProfitMonth}
        value={formatCurrency(stats.profitMonth)}
        icon={TrendingUp}
      />
      <StatCard
        title={t.ui.analyticsOutstanding}
        value={formatCurrency(stats.outstanding)}
        icon={BarChart3}
      />
      <StatCard
        title={t.ui.analyticsForecast}
        value={formatCurrency(stats.forecastNextMonth)}
        icon={TrendingUp}
      />
    </div>
  );
}

async function RevenueProfitSection() {
  const [t, revenueTrend] = await Promise.all([getT(), getRevenueTrend(12)]);
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t.ui.revenueVsProfit}</CardTitle>
          <p className="text-sm text-zinc-400">{t.ui.monthlyComparison}</p>
        </CardHeader>
        <CardContent>
          <RevenueVsProfitChart data={revenueTrend} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.ui.revenueTrendTable}</CardTitle>
          <p className="text-sm text-zinc-400">{t.ui.monthlyOverTime}</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="table-scroll px-4 sm:px-6">
            <table className="w-full min-w-[16rem] text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="py-3 text-start font-medium">{t.ui.month}</th>
                  <th className="py-3 text-end font-medium">{t.ui.revenue}</th>
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
    </>
  );
}

async function DailyAndMethodsSection() {
  const [t, dailyRevenue, paymentMethods] = await Promise.all([
    getT(),
    getDailyRevenue(),
    getPaymentMethodsStats(),
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t.ui.dailyRevenue}</CardTitle>
          <p className="text-sm text-zinc-400">{t.ui.currentMonth}</p>
        </CardHeader>
        <CardContent>
          <DailyRevenueChart
            data={dailyRevenue.map((d) => ({ day: d.date, revenue: d.revenue }))}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t.ui.paymentMethods}</CardTitle>
          <p className="text-sm text-zinc-400">{t.ui.revenueByPaymentType}</p>
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
  );
}

async function CategorySection() {
  const [t, revenueByCategory] = await Promise.all([getT(), getRevenueByCategory()]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.ui.revenueByCategory}</CardTitle>
        <p className="text-sm text-zinc-400">{t.ui.retailFromRepairs}</p>
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
  );
}

async function BranchSection() {
  const [t, branchCompare] = await Promise.all([getT(), getBranchComparison()]);
  if (branchCompare.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.ui.branchComparison}</CardTitle>
        <p className="text-sm text-zinc-400">{t.ui.companyWideView}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 md:hidden">
          {branchCompare.map((b) => (
            <div
              key={b.branchId}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
            >
              <p className="font-medium text-zinc-50">{b.branchName}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-[11px] text-zinc-500">{t.ui.revenue}</p>
                  <p className="mt-0.5 font-medium tabular-nums text-emerald-500">
                    {formatCurrency(b.revenue)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500">{t.ui.repairs}</p>
                  <p className="mt-0.5 tabular-nums text-zinc-200">{b.repairs}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500">{t.app.customers}</p>
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
                <th className="py-3 text-start">{t.ui.branch}</th>
                <th className="py-3 text-end">{t.ui.revenue}</th>
                <th className="py-3 text-end">{t.ui.repairs}</th>
                <th className="py-3 text-end">{t.app.customers}</th>
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
  );
}

export default async function AnalyticsPage() {
  await gatePage('analytics:read', FeatureModule.ANALYTICS);
  const t = await getT();

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader title={t.app.analytics} description={t.ui.analyticsDesc} />

      <Suspense fallback={<StatsSkeleton />}>
        <AnalyticsStats />
      </Suspense>

      <Suspense
        fallback={
          <div className="space-y-6">
            <ChartCardSkeleton className="h-[320px]" />
            <ChartCardSkeleton className="h-48" />
          </div>
        }
      >
        <div className="space-y-6 sm:space-y-8">
          <RevenueProfitSection />
        </div>
      </Suspense>

      <Suspense
        fallback={
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCardSkeleton />
            <ChartCardSkeleton />
          </div>
        }
      >
        <DailyAndMethodsSection />
      </Suspense>

      <Suspense fallback={<ChartCardSkeleton />}>
        <CategorySection />
      </Suspense>

      <Suspense fallback={null}>
        <BranchSection />
      </Suspense>
    </div>
  );
}
