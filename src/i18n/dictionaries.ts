export type Locale = 'en' | 'ar';

const en = {
  brand: 'Gearvo',
  tagline: 'Automotive Business Operating System',
  nav: {
    features: 'Features',
    pricing: 'Pricing',
    about: 'About',
    contact: 'Contact',
    faq: 'FAQ',
    blog: 'Blog',
    bookDemo: 'Book demo',
    freeTrial: 'Start free trial',
    signIn: 'Sign in',
    menu: 'Menu',
    close: 'Close',
  },
  footer: {
    privacy: 'Privacy',
    terms: 'Terms',
  },
  home: {
    hero: 'Run every workshop like a modern business',
    heroAccent: 'Operating System',
    heroLead: 'Automotive Business',
    sub: 'Multi-branch workshops, bilingual Arabic & English, SAR & VAT-ready — customers, repairs, inventory, payments, and analytics in one secure workspace.',
    ctaTrial: 'Start free trial',
    ctaDemo: 'Book a demo',
    sectionTitle: 'Built for workshops that grow',
    features: {
      crm: { title: 'CRM & vehicles', desc: 'Customers, VIN, plates, mileage, and full service history.' },
      repairs: { title: 'Repair & job cards', desc: 'Parts, labor, profit per job, status workflows.' },
      inventory: { title: 'Inventory & POs', desc: 'Stock integrity, suppliers, marketplace orders.' },
      invoices: { title: 'Invoices & installments', desc: 'Partial payments, plans, SAR receipts.' },
      branches: { title: 'Multi-branch', desc: 'One company, many locations, clear permissions.' },
      analytics: { title: 'Analytics', desc: 'Revenue, profit, and stock health at a glance.' },
    },
    closing: 'Ready for your first branch — or your tenth.',
  },
  app: {
    dashboard: 'Dashboard',
    customers: 'Customers',
    repairOrders: 'Repair Orders',
    inventory: 'Inventory',
    marketplace: 'Marketplace',
    invoices: 'Invoices',
    suppliers: 'Suppliers',
    employees: 'Employees',
    analytics: 'Analytics',
    activity: 'Activity',
    settings: 'Settings',
    platform: 'Platform',
    signOut: 'Sign out',
    signingOut: 'Signing out...',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    save: 'Save',
    cancel: 'Cancel',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search',
    loading: 'Loading...',
    empty: 'Nothing here yet',
    actions: 'Actions',
  },
  common: {
    currency: 'SAR',
    back: 'Back',
    viewAll: 'View all',
    required: 'Required',
  },
  pages: {
    features: {
      title: 'Features',
      intro:
        'Everything a workshop needs to operate as a business — not just a garage notebook.',
      items: [
        { title: 'CRM', desc: 'Customers, vehicles, service history, and lifetime value.' },
        { title: 'Repair orders', desc: 'Job cards, parts, labor, profit per job.' },
        { title: 'Inventory', desc: 'Stock levels, suppliers, purchase orders, low-stock alerts.' },
        { title: 'Payments', desc: 'Invoices, partial payments, installments, SAR-ready.' },
        { title: 'Multi-branch', desc: 'Isolated branch data with company-wide oversight.' },
        { title: 'Analytics', desc: 'Revenue, profit, branch comparison, forecasts.' },
        { title: 'RBAC', desc: 'Roles from cashier to company owner to platform admin.' },
        { title: 'Integrations', desc: 'Stripe, WhatsApp, email, SMS, calendars, ZATCA-ready.' },
      ],
    },
    pricing: {
      title: 'Pricing',
      intro: 'Feature modules unlock by plan. Switch anytime as your workshop grows.',
      choose: 'Choose',
      plans: [
        { name: 'Trial', price: 'Free', desc: '14 days · full core modules', cta: '/free-trial' },
        { name: 'Basic', price: '299 SAR/mo', desc: 'CRM, inventory, analytics, employees', cta: '/book-demo' },
        { name: 'Pro', price: '599 SAR/mo', desc: 'Marketplace, installments, WhatsApp, multi-branch', cta: '/book-demo' },
        { name: 'Enterprise', price: 'Custom', desc: 'Platform controls, SSO, dedicated support', cta: '/contact' },
      ],
    },
    about: {
      title: 'About',
      body: 'Gearvo is built for Saudi workshops that want modern operations without losing the craft of the garage floor — multi-branch, bilingual, and commercially serious.',
    },
    contact: {
      title: 'Contact',
      body: 'Tell us about your workshops. We will respond within one business day.',
      email: 'hello@gearvo.app',
    },
    faq: {
      title: 'FAQ',
      items: [
        {
          q: 'Is Gearvo available in Arabic?',
          a: 'Yes. The product is designed bilingual with proper RTL and Arabic typography.',
        },
        {
          q: 'Can I run multiple branches?',
          a: 'Yes. Each branch is isolated; company owners can oversee all locations.',
        },
        {
          q: 'Do you support SAR and VAT?',
          a: 'Yes. Pricing, invoices, and receipts are SAR-first with VAT-ready fields.',
        },
      ],
    },
  },
};

const ar: typeof en = {
  brand: 'جيرفو',
  tagline: 'نظام تشغيل أعمال السيارات',
  nav: {
    features: 'الميزات',
    pricing: 'الأسعار',
    about: 'عنّا',
    contact: 'تواصل',
    faq: 'الأسئلة',
    blog: 'المدونة',
    bookDemo: 'احجز عرضاً',
    freeTrial: 'ابدأ تجربة مجانية',
    signIn: 'تسجيل الدخول',
    menu: 'القائمة',
    close: 'إغلاق',
  },
  footer: {
    privacy: 'الخصوصية',
    terms: 'الشروط',
  },
  home: {
    hero: 'أدِر ورشتك كعمل حديث',
    heroAccent: 'نظام التشغيل',
    heroLead: 'أعمال السيارات',
    sub: 'ورش متعددة الفروع، عربي وإنجليزي، جاهزة للريال وضريبة القيمة المضافة — العملاء والإصلاحات والمخزون والمدفوعات والتحليلات في مساحة عمل آمنة واحدة.',
    ctaTrial: 'ابدأ تجربة مجانية',
    ctaDemo: 'احجز عرضاً',
    sectionTitle: 'مصمم للورش التي تنمو',
    features: {
      crm: { title: 'العملاء والمركبات', desc: 'العملاء، رقم الهيكل، اللوحات، العداد، وسجل الصيانة الكامل.' },
      repairs: { title: 'أوامر الإصلاح', desc: 'قطع وعمالة وربح لكل أمر، مع مسارات حالة واضحة.' },
      inventory: { title: 'المخزون والمشتريات', desc: 'سلامة المخزون، الموردون، وطلبات السوق.' },
      invoices: { title: 'الفواتير والأقساط', desc: 'مدفوعات جزئية وخطط تقسيط وإيصالات بالريال.' },
      branches: { title: 'تعدد الفروع', desc: 'شركة واحدة، مواقع متعددة، صلاحيات واضحة.' },
      analytics: { title: 'التحليلات', desc: 'الإيرادات والأرباح وصحة المخزون بنظرة واحدة.' },
    },
    closing: 'جاهز لفرعك الأول — أو عاشر فرع.',
  },
  app: {
    dashboard: 'لوحة التحكم',
    customers: 'العملاء',
    repairOrders: 'أوامر الإصلاح',
    inventory: 'المخزون',
    marketplace: 'السوق',
    invoices: 'الفواتير',
    suppliers: 'الموردون',
    employees: 'الموظفون',
    analytics: 'التحليلات',
    activity: 'النشاط',
    settings: 'الإعدادات',
    platform: 'المنصة',
    signOut: 'تسجيل الخروج',
    signingOut: 'جارٍ الخروج...',
    openMenu: 'فتح القائمة',
    closeMenu: 'إغلاق القائمة',
    save: 'حفظ',
    cancel: 'إلغاء',
    create: 'إنشاء',
    edit: 'تعديل',
    delete: 'حذف',
    search: 'بحث',
    loading: 'جارٍ التحميل...',
    empty: 'لا يوجد شيء هنا بعد',
    actions: 'إجراءات',
  },
  common: {
    currency: 'ر.س',
    back: 'رجوع',
    viewAll: 'عرض الكل',
    required: 'مطلوب',
  },
  pages: {
    features: {
      title: 'الميزات',
      intro: 'كل ما تحتاجه الورشة لتعمل كمنشأة حديثة — وليس مجرد دفتر ورشة.',
      items: [
        { title: 'إدارة العملاء', desc: 'العملاء والمركبات وسجل الصيانة والقيمة مدى الحياة.' },
        { title: 'أوامر الإصلاح', desc: 'بطاقات عمل، قطع، عمالة، وربح لكل أمر.' },
        { title: 'المخزون', desc: 'مستويات المخزون، الموردون، أوامر الشراء، وتنبيهات النقص.' },
        { title: 'المدفوعات', desc: 'فواتير ومدفوعات جزئية وأقساط جاهزة للريال.' },
        { title: 'تعدد الفروع', desc: 'بيانات معزولة لكل فرع مع إشراف على مستوى الشركة.' },
        { title: 'التحليلات', desc: 'الإيرادات والأرباح ومقارنة الفروع والتوقعات.' },
        { title: 'الصلاحيات', desc: 'أدوار من الكاشير إلى مالك الشركة إلى مسؤول المنصة.' },
        { title: 'التكاملات', desc: 'Stripe وواتساب والبريد والرسائل والتقويمات وجاهزية الزكاة.' },
      ],
    },
    pricing: {
      title: 'الأسعار',
      intro: 'تُفعَّل الوحدات حسب الباقة. غيّر باقتك متى نمت ورشتك.',
      choose: 'اختر',
      plans: [
        { name: 'تجريبي', price: 'مجاناً', desc: '١٤ يوماً · الوحدات الأساسية كاملة', cta: '/free-trial' },
        { name: 'أساسي', price: '٢٩٩ ر.س/شهر', desc: 'العملاء والمخزون والتحليلات والموظفون', cta: '/book-demo' },
        { name: 'احترافي', price: '٥٩٩ ر.س/شهر', desc: 'السوق والأقساط وواتساب وتعدد الفروع', cta: '/book-demo' },
        { name: 'مؤسسي', price: 'مخصص', desc: 'تحكم بالمنصة وSSO ودعم مخصص', cta: '/contact' },
      ],
    },
    about: {
      title: 'عنّا',
      body: 'جيرفو مبني لورش السعودية التي تريد عمليات حديثة دون أن تفقد حرفية أرض الورشة — متعدد الفروع، ثنائي اللغة، وجاد تجارياً.',
    },
    contact: {
      title: 'تواصل',
      body: 'أخبرنا عن ورشك. نرد خلال يوم عمل واحد.',
      email: 'hello@gearvo.app',
    },
    faq: {
      title: 'الأسئلة الشائعة',
      items: [
        {
          q: 'هل جيرفو متوفر بالعربية؟',
          a: 'نعم. المنتج مصمم ثنائي اللغة مع اتجاه RTL وخطوط عربية مناسبة.',
        },
        {
          q: 'هل يمكن تشغيل عدة فروع؟',
          a: 'نعم. كل فرع معزول، ويمكن لمالكي الشركة الإشراف على كل المواقع.',
        },
        {
          q: 'هل تدعمون الريال وضريبة القيمة المضافة؟',
          a: 'نعم. التسعير والفواتير والإيصالات بالريال أولاً مع حقول جاهزة للضريبة.',
        },
      ],
    },
  },
};

export const dictionaries = { en, ar } as const;

export type Dictionary = typeof en;

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.en;
}
