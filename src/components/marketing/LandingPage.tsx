'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Users,
  Package,
  Wrench,
  FileText,
  GitBranch,
  BarChart3,
  Shield,
  Smartphone,
  Languages,
  CreditCard,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useI18n } from '@/i18n/provider';
import { GearvoMark } from '@/components/brand/GearvoLogo';
import { MarketingFooter, MarketingNav } from '@/components/marketing/MarketingChrome';

function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function FadeIn({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function ProductMockup({ tab, ar }: { tab: string; ar: boolean }) {
  const nav = ar
    ? ['لوحة التحكم', 'العملاء', 'الإصلاحات', 'المخزون', 'الفواتير']
    : ['Dashboard', 'Customers', 'Repairs', 'Inventory', 'Invoices'];
  const panels: Record<string, ReactNode> = {
    dashboard: (
      <>
        <div className="grid grid-cols-3 gap-2">
          {[
            [ar ? 'اليوم' : 'Today', '12,480'],
            [ar ? 'الشهر' : 'Month', '186,920'],
            [ar ? 'المستحق' : 'Outstanding', '24,350'],
          ].map(([l, v]) => (
            <div key={l} className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">{l}</p>
              <p className="mt-1 font-semibold text-amber-400">
                {v}{' '}
                <span className="text-[10px] text-zinc-500">{ar ? 'ر.س' : 'SAR'}</span>
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 h-28 rounded-lg border border-zinc-800 bg-gradient-to-t from-amber-500/20 via-zinc-900 to-zinc-900 p-3">
          <div className="flex h-full items-end gap-1">
            {[40, 55, 48, 70, 62, 85, 78, 92, 88, 95].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-amber-500/80"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </>
    ),
    repairs: (
      <div className="space-y-2">
        {[
          ['RO-10482', ar ? 'تويوتا كامري · تغيير زيت' : 'Toyota Camry · Oil service', ar ? 'قيد التنفيذ' : 'IN_PROGRESS', 'bg-amber-500/10 text-amber-400'],
          ['RO-10479', ar ? 'لكزس LX · فحمات فرامل' : 'Lexus LX · Brake pads', ar ? 'مكتمل' : 'COMPLETED', 'bg-emerald-500/10 text-emerald-400'],
          ['RO-10471', ar ? 'نيسان باترول · تشخيص' : 'Nissan Patrol · Diagnostics', ar ? 'قيد الانتظار' : 'PENDING', 'bg-zinc-500/10 text-zinc-400'],
        ].map(([id, desc, st, badge]) => (
          <div key={id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2.5">
            <div>
              <p className="text-xs font-medium text-zinc-200">{id}</p>
              <p className="text-[11px] text-zinc-500">{desc}</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge}`}>
              {st}
            </span>
          </div>
        ))}
      </div>
    ),
    inventory: (
      <div className="space-y-2">
        {[
          [ar ? 'زيت محرك 5W-30' : 'Engine Oil 5W-30', '142', 'ok'],
          [ar ? 'فحمات أمامية' : 'Brake Pads Front', '8', 'low'],
          [ar ? 'فلتر مقصورة' : 'Cabin Filter', '64', 'ok'],
          [ar ? 'بطارية 70Ah' : 'Battery 70Ah', '3', 'low'],
        ].map(([name, qty, state]) => (
          <div key={name} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2">
            <p className="text-xs text-zinc-300">{name}</p>
            <p className={`text-xs font-semibold ${state === 'low' ? 'text-red-400' : 'text-emerald-400'}`}>
              {qty} {ar ? 'وحدة' : 'units'}
            </p>
          </div>
        ))}
      </div>
    ),
    finance: (
      <div className="space-y-2">
        {[
          ['INV-2091', ar ? 'مدفوع' : 'Paid', '3,450'],
          ['INV-2088', ar ? 'جزئي' : 'Partial', '1,200 / 4,800'],
          ['INV-2074', ar ? 'متأخر' : 'Overdue', '2,150'],
          [ar ? 'خطة · العتيبي' : 'Plan · Al-Otaibi', ar ? '٣ متبقي' : '3 left', ar ? '٩٠٠ / شهر' : '900 / mo'],
        ].map(([a, b, c]) => (
          <div key={a} className="grid grid-cols-3 gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs">
            <span className="text-zinc-300">{a}</span>
            <span className="text-zinc-500">{b}</span>
            <span className="text-end font-medium text-amber-400">{c}</span>
          </div>
        ))}
      </div>
    ),
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-amber-500/5">
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/80 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        </div>
        <div className="ms-2 flex flex-1 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-[11px] text-zinc-500">
          <GearvoMark className="h-3.5 w-3.5" />
          app.gearvo / {tab}
        </div>
      </div>
      <div className="grid gap-0 md:grid-cols-[140px_1fr]">
        <aside className="hidden border-e border-zinc-800 bg-zinc-900/40 p-3 md:block">
          {nav.map((item, i) => (
            <div
              key={item}
              className={`mb-1 rounded-md px-2 py-1.5 text-[11px] ${
                i === 0 ? 'bg-amber-500/10 text-amber-400' : 'text-zinc-500'
              }`}
            >
              {item}
            </div>
          ))}
        </aside>
        <div className="p-4">{panels[tab] ?? panels.dashboard}</div>
      </div>
    </div>
  );
}

const FEATURE_BLOCKS = [
  {
    id: 'crm',
    icon: Users,
    en: {
      title: 'Customer management',
      body: 'Profiles, tags (VIP, fleet, late payer), vehicles, notes, and lifetime value — so advisors know every customer before they arrive.',
    },
    ar: {
      title: 'إدارة العملاء',
      body: 'ملفات وتصنيفات (VIP، أساطيل، متأخرون) ومركبات وملاحظات وقيمة مدى الحياة — ليعرف المستشار العميل قبل وصوله.',
    },
  },
  {
    id: 'inventory',
    icon: Package,
    en: {
      title: 'Inventory management',
      body: 'Real-time stock, cost vs retail, low-stock alerts, supplier lead times, and purchase orders that keep shelves honest.',
    },
    ar: {
      title: 'إدارة المخزون',
      body: 'مخزون لحظي، تكلفة مقابل بيع، تنبيهات النقص، مدد التوريد، وأوامر شراء تحافظ على دقة الرفوف.',
    },
  },
  {
    id: 'repairs',
    icon: Wrench,
    en: {
      title: 'Repair management',
      body: 'Job cards with parts, labor, profit per job, technician assignment, and status workflows from intake to delivery.',
    },
    ar: {
      title: 'إدارة الإصلاحات',
      body: 'بطاقات عمل بالقطع والعمالة وربح الأمر وتعيين الفني ومسارات الحالة من الاستلام حتى التسليم.',
    },
  },
  {
    id: 'finance',
    icon: FileText,
    en: {
      title: 'Financial management',
      body: 'Invoices in SAR, partial payments, cash/card/transfer, VAT-ready fields, and a clear picture of what you are owed.',
    },
    ar: {
      title: 'الإدارة المالية',
      body: 'فواتير بالريال، مدفوعات جزئية، نقد/بطاقة/تحويل، حقول جاهزة للضريبة، وصورة واضحة لما يُستحق لك.',
    },
  },
  {
    id: 'installments',
    icon: CreditCard,
    en: {
      title: 'Installment payments',
      body: 'Structured plans, upcoming dues, and overdue tracking — without spreadsheets or forgotten promises.',
    },
    ar: {
      title: 'الأقساط',
      body: 'خطط منظمة، استحقاقات قادمة، ومتابعة المتأخرات — بلا جداول ولا وعود منسية.',
    },
  },
  {
    id: 'analytics',
    icon: BarChart3,
    en: {
      title: 'Analytics & reporting',
      body: 'Revenue, profit, branch comparison, top customers and parts, inventory value, and cash-flow trends that actually move decisions.',
    },
    ar: {
      title: 'التحليلات والتقارير',
      body: 'الإيرادات والأرباح ومقارنة الفروع وأفضل العملاء والقطع وقيمة المخزون واتجاهات التدفق النقدي لاتخاذ قرار.',
    },
  },
  {
    id: 'branches',
    icon: GitBranch,
    en: {
      title: 'Multi-branch management',
      body: 'One company, many locations. Branch isolation with company-wide oversight and role-based access.',
    },
    ar: {
      title: 'تعدد الفروع',
      body: 'شركة واحدة ومواقع متعددة. عزل على مستوى الفرع مع إشراف على مستوى الشركة وصلاحيات حسب الدور.',
    },
  },
  {
    id: 'i18n',
    icon: Languages,
    en: {
      title: 'Arabic & English',
      body: 'Designed bilingual with proper RTL, Arabic typography, and SAR-first formatting — not an afterthought translation.',
    },
    ar: {
      title: 'العربية والإنجليزية',
      body: 'مصمم ثنائي اللغة مع RTL صحيح وخطوط عربية وتنسيق بالريال أولاً — وليس ترجمة لاحقة.',
    },
  },
  {
    id: 'pwa',
    icon: Smartphone,
    en: {
      title: 'Mobile & PWA',
      body: 'A responsive dashboard and installable PWA so managers and advisors stay productive on the floor.',
    },
    ar: {
      title: 'الجوال وPWA',
      body: 'لوحة متجاوبة وتطبيق قابل للتثبيت ليبقى المدراء والمستشارون منتجين على أرض الورشة.',
    },
  },
  {
    id: 'security',
    icon: Shield,
    en: {
      title: 'Security & reliability',
      body: 'Tenant isolation, branch-aware RBAC, audit activity, rate limits, and production-grade auth — ready for real customers.',
    },
    ar: {
      title: 'الأمان والموثوقية',
      body: 'عزل للمستأجرين، صلاحيات واعية بالفرع، سجل تدقيق، حدود معدل، ومصادقة جاهزة للإنتاج.',
    },
  },
];

export function LandingPage() {
  const { locale } = useI18n();
  const ar = locale === 'ar';
  const [tab, setTab] = useState('dashboard');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const tabs = [
    { id: 'dashboard', en: 'Dashboard', ar: 'لوحة التحكم' },
    { id: 'repairs', en: 'Repairs', ar: 'الإصلاحات' },
    { id: 'inventory', en: 'Inventory', ar: 'المخزون' },
    { id: 'finance', en: 'Finance', ar: 'المالية' },
  ];

  const faq = [
    {
      q: ar ? 'هل جيرفو مناسب لورشة واحدة أم لسلسلة فروع؟' : 'Is Gearvo for a single workshop or a multi-branch group?',
      a: ar
        ? 'للاثنين. ابدأ بفرع واحد ثم أضف فروعاً مع عزل البيانات وصلاحيات واضحة.'
        : 'Both. Start with one location, then add branches with data isolation and clear permissions.',
    },
    {
      q: ar ? 'هل الواجهة عربية بالكامل؟' : 'Is the product available in Arabic?',
      a: ar
        ? 'نعم. الواجهة ثنائية اللغة مع دعم RTL وخطوط عربية وتنسيق بالريال.'
        : 'Yes. The product is bilingual with RTL, Arabic typography, and SAR-first formatting.',
    },
    {
      q: ar ? 'كيف أجرب النظام قبل الشراء؟' : 'How can we evaluate Gearvo before buying?',
      a: ar
        ? 'استخدم البيئة التجريبية الجاهزة، أو احجز عرضاً، أو ابدأ تجربة مجانية.'
        : 'Use the live presentation demo, book a walkthrough, or start a free trial.',
    },
    {
      q: ar ? 'هل تدعمون ضريبة القيمة المضافة والسجل التجاري؟' : 'Do you support VAT and Commercial Registration?',
      a: ar
        ? 'نعم. ملفات الشركة تدعم رقم السجل الضريبي والسجل التجاري، والفواتير جاهزة للحقول الضريبية.'
        : 'Yes. Company profiles support CR and VAT numbers, and invoices are VAT-ready.',
    },
  ];

  const plans = [
    {
      name: ar ? 'تجريبي' : 'Trial',
      price: ar ? 'مجاناً' : 'Free',
      desc: ar ? '١٤ يوماً · الوحدات الأساسية' : '14 days · full core modules',
      cta: '/free-trial',
      highlight: false,
    },
    {
      name: ar ? 'أساسي' : 'Basic',
      price: ar ? '٢٩٩ ر.س' : '299 SAR',
      period: ar ? '/شهر' : '/mo',
      desc: ar ? 'العملاء والمخزون والتحليلات والموظفون' : 'CRM, inventory, analytics, employees',
      cta: '/book-demo',
      highlight: false,
    },
    {
      name: ar ? 'احترافي' : 'Pro',
      price: ar ? '٥٩٩ ر.س' : '599 SAR',
      period: ar ? '/شهر' : '/mo',
      desc: ar ? 'السوق والأقساط وواتساب وتعدد الفروع' : 'Marketplace, installments, WhatsApp, multi-branch',
      cta: '/book-demo',
      highlight: true,
    },
    {
      name: ar ? 'مؤسسي' : 'Enterprise',
      price: ar ? 'مخصص' : 'Custom',
      desc: ar ? 'تحكم بالمنصة ودعم مخصص' : 'Platform controls & dedicated support',
      cta: '/contact',
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.10),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(39,39,42,0.8),_transparent_45%)]" />
      <MarketingNav />

      {/* Hero — brand first, one composition */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-2 lg:pb-24 lg:pt-16">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <GearvoMark className="h-11 w-11" />
              <span className="font-display text-2xl font-bold tracking-tight">Gearvo</span>
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              {ar ? (
                <>
                  نظام تشغيل الورشة
                  <span className="text-amber-400"> الحديث</span>
                </>
              ) : (
                <>
                  The operating system
                  <span className="text-amber-400"> for modern workshops</span>
                </>
              )}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
              {ar
                ? 'عملاء، إصلاحات، مخزون، فواتير، أقساط وتحليلات — لورش السعودية والخليج، بالعربية والإنجليزية، جاهز لتعدد الفروع.'
                : 'Customers, repairs, inventory, invoices, installments, and analytics — built for Saudi and GCC workshops, bilingual, multi-branch ready.'}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/free-trial"
                className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
              >
                {ar ? 'ابدأ تجربة مجانية' : 'Start free trial'}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
              >
                {ar ? 'شاهد العرض التجريبي' : 'Explore live demo'}
              </Link>
            </div>
            <p className="mt-4 text-xs text-zinc-600">
              {ar ? 'بدون بطاقة · إعداد خلال دقائق · بيانات تجريبية جاهزة' : 'No card required · minutes to set up · presentation-ready demo'}
            </p>
          </div>
          <FadeIn className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-amber-500/20 via-transparent to-transparent blur-2xl" />
            <ProductMockup tab="dashboard" ar={ar} />
          </FadeIn>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-zinc-900 bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 py-8 text-center text-xs font-medium uppercase tracking-wider text-zinc-600 sm:px-6">
          {(ar
            ? ['متعدد الفروع', 'عربي / English', 'الريال والضريبة', 'صلاحيات دقيقة', 'جاهز للعروض']
            : ['Multi-branch', 'Arabic / English', 'SAR & VAT-ready', 'Role-based access', 'Demo-ready']
          ).map((item) => (
            <span key={item} className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-500/80" />
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* Product overview + interactive screenshots */}
      <section id="product" className="scroll-mt-20 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeIn>
            <p className="text-sm font-medium text-amber-500">
              {ar ? 'نظرة على المنتج' : 'Product overview'}
            </p>
            <h2 className="font-display mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              {ar
                ? 'كل ما تحتاجه الورشة في مساحة عمل واحدة'
                : 'Everything your workshop needs in one workspace'}
            </h2>
            <p className="mt-4 max-w-2xl text-zinc-400">
              {ar
                ? 'من استقبال العميل إلى تسليم المركبة وتحصيل المستحقات — مسارات واضحة، بيانات حية، وتحكم على مستوى الفرع.'
                : 'From customer intake to vehicle delivery and collections — clear workflows, live data, and branch-aware control.'}
            </p>
          </FadeIn>

          <div className="mt-10 flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  tab === t.id
                    ? 'bg-amber-500 text-zinc-950'
                    : 'border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                }`}
              >
                {ar ? t.ar : t.en}
              </button>
            ))}
          </div>
          <FadeIn className="mt-8" delay={80}>
            <ProductMockup tab={tab} ar={ar} />
          </FadeIn>
        </div>
      </section>

      {/* Core features */}
      <section id="features" className="scroll-mt-20 border-t border-zinc-900 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeIn>
            <p className="text-sm font-medium text-amber-500">{ar ? 'الميزات' : 'Core features'}</p>
            <h2 className="font-display mt-2 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              {ar ? 'مصمم لعمليات الورشة الحقيقية' : 'Built for real workshop operations'}
            </h2>
          </FadeIn>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:mt-14 sm:gap-10 lg:grid-cols-3">
            {FEATURE_BLOCKS.map((f, i) => {
              const copy = ar ? f.ar : f.en;
              return (
                <FadeIn key={f.id} delay={i * 40}>
                  <div className="group">
                    <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-amber-400 transition group-hover:border-amber-500/40 sm:mb-4 sm:h-10 sm:w-10 sm:rounded-xl">
                      <f.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <h3 className="text-sm font-semibold leading-snug text-zinc-50 sm:text-lg">
                      {copy.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-400 sm:mt-2 sm:text-sm">
                      {copy.body}
                    </p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Gearvo */}
      <section className="border-t border-zinc-900 bg-zinc-900/30 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeIn>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {ar ? 'لماذا جيرفو؟' : 'Why choose Gearvo'}
            </h2>
            <p className="mt-4 max-w-2xl text-zinc-400">
              {ar
                ? 'لسنا دفتراً رقمياً. نحن نظام تشغيل يربط العملاء والمخزون والمالية والفروع في قرار واحد يومي.'
                : 'Not a digital notebook. An operating system that connects customers, stock, finance, and branches into one daily decision surface.'}
            </p>
          </FadeIn>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {(ar
              ? [
                  ['مصمم للسوق المحلي', 'ريال، ضريبة، سجل تجاري، وعربية أولاً — مع جاهزية للتوسع دولياً.'],
                  ['عزل ووضوح', 'كل فرع يرى بياناته. المالكون يرون الكل. الأدوار تمنع الأخطاء المكلفة.'],
                  ['جاهز للعروض', 'بيئة تجريبية غنية وقابلة لإعادة التعيين — اعرض القيمة خلال دقائق.'],
                ]
              : [
                  ['Local-first, globally ready', 'SAR, VAT, CR, and Arabic-first — with a foundation ready for international expansion.'],
                  ['Isolation with clarity', 'Branches see their data. Owners see everything. Roles prevent expensive mistakes.'],
                  ['Presentation-ready', 'A rich, resettable demo environment — show value in minutes, not weeks.'],
                ]
            ).map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
                <h3 className="font-semibold text-zinc-50">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 border-t border-zinc-900 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeIn>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {ar ? 'أسعار واضحة تنمو معك' : 'Straightforward pricing that scales'}
            </h2>
            <p className="mt-4 max-w-xl text-zinc-400">
              {ar
                ? 'فعّل الوحدات حسب الباقة. غيّر خطتك عندما تنمو ورشتك.'
                : 'Unlock modules by plan. Change as your workshop network grows.'}
            </p>
          </FadeIn>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`flex flex-col rounded-2xl border p-6 ${
                  p.highlight
                    ? 'border-amber-500/50 bg-amber-500/5 shadow-lg shadow-amber-500/5'
                    : 'border-zinc-800 bg-zinc-950/40'
                }`}
              >
                {p.highlight && (
                  <span className="mb-3 w-fit rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-950">
                    {ar ? 'الأكثر اختياراً' : 'Most popular'}
                  </span>
                )}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="mt-3 text-3xl font-bold text-amber-400">
                  {p.price}
                  {p.period && <span className="text-sm font-normal text-zinc-500">{p.period}</span>}
                </p>
                <p className="mt-3 flex-1 text-sm text-zinc-400">{p.desc}</p>
                <Link
                  href={p.cta}
                  className={`mt-6 rounded-full px-4 py-2.5 text-center text-sm font-semibold transition ${
                    p.highlight
                      ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                      : 'border border-zinc-700 text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  {ar ? 'اختر' : 'Choose'} {p.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-t border-zinc-900 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-display text-center text-3xl font-bold tracking-tight">
            {ar ? 'أسئلة شائعة' : 'Frequently asked questions'}
          </h2>
          <div className="mt-10 divide-y divide-zinc-800 border-y border-zinc-800">
            {faq.map((item, i) => (
              <div key={item.q}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 py-5 text-start"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span className="font-medium text-zinc-100">{item.q}</span>
                  <span className="text-zinc-500">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <p className="pb-5 text-sm leading-relaxed text-zinc-400">{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="contact" className="border-t border-zinc-900 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <GearvoMark className="mx-auto h-12 w-12" />
          <h2 className="font-display mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            {ar ? 'جاهز لعرض جيرفو لعملائك؟' : 'Ready to show Gearvo to your next customer?'}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-400">
            {ar
              ? 'ادخل البيئة التجريبية، احجز عرضاً، أو ابدأ تجربة مجانية — بنفس الجودة التي تتوقعها من منتج مؤسسي.'
              : 'Enter the presentation demo, book a walkthrough, or start a free trial — with the polish enterprise buyers expect.'}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/demo"
              className="rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
            >
              {ar ? 'البيئة التجريبية' : 'Open demo environment'}
            </Link>
            <Link
              href="/book-demo"
              className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium hover:bg-zinc-900"
            >
              {ar ? 'احجز عرضاً' : 'Book a demo'}
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium hover:bg-zinc-900"
            >
              {ar ? 'تواصل معنا' : 'Contact us'}
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
