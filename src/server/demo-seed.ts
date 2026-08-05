/**
 * Presentation-grade demo company seed.
 * Used by `prisma/seed.ts` and server action `resetAndReseedDemo`.
 */
import type { PrismaClient } from '@prisma/client';
import { FeatureModule, IntegrationStatus } from '@prisma/client';

import {
  DEMO_PRESENTATION_ACCOUNTS,
  linkDemoClerkAccounts,
  resolveDemoStaffUser,
} from '@/server/demo-clerk-link';

export const DEMO_COMPANY_SLUG = 'demo-auto';
export const DEMO_OWNER_CLERK_ID = 'dev_clerk_owner';
/** Presentation login email (Clerk). Local placeholder seeds may still use *.gearvo.local. */
export const DEMO_OWNER_EMAIL = 'demo.owner@gearvo.app';

const ALL_FEATURES = Object.values(FeatureModule);

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10 + (n % 8), (n * 7) % 60, 0, 0);
  return d;
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = [
  'Ahmed', 'Mohammed', 'Sara', 'Fatima', 'Omar', 'Layla', 'Khalid', 'Noura', 'Yousef', 'Huda',
  'Faisal', 'Reem', 'Abdullah', 'Maha', 'Sultan', 'Dana', 'Turki', 'Lina', 'Majed', 'Aisha',
  'Hassan', 'Rana', 'Ibrahim', 'Jude', 'Saad', 'Mona', 'Waleed', 'Hind', 'Badr', 'Amal',
];
const LAST = [
  'Al-Rashid', 'Al-Qahtani', 'Al-Otaibi', 'Al-Harbi', 'Al-Ghamdi', 'Al-Zahrani', 'Al-Dosari',
  'Al-Mutairi', 'Al-Shehri', 'Al-Anazi', 'Al-Harthi', 'Al-Shammari', 'Al-Qahtani', 'Hassan',
  'Abdullah', 'Mansour', 'Saleh', 'Faris', 'Nasser', 'Jabri',
];
const TAGS = ['VIP', 'Frequent', 'Late Payer', 'Fleet', 'Corporate', 'Walk-in', 'Warranty'];
const MAKES = [
  { make: 'Toyota', models: ['Camry', 'Corolla', 'Land Cruiser', 'Hilux', 'RAV4'] },
  { make: 'Lexus', models: ['RX 350', 'ES 350', 'LX 600', 'IS 300'] },
  { make: 'Nissan', models: ['Patrol', 'Altima', 'X-Terra', 'Sunny'] },
  { make: 'Hyundai', models: ['Sonata', 'Tucson', 'Elantra', 'Palisade'] },
  { make: 'Kia', models: ['Sportage', 'Sorento', 'K5', 'Telluride'] },
  { make: 'Mercedes-Benz', models: ['C 200', 'E 300', 'GLE 450', 'S 500'] },
  { make: 'BMW', models: ['320i', 'X5', '530i', 'X3'] },
  { make: 'Honda', models: ['Accord', 'CR-V', 'Civic'] },
  { make: 'Ford', models: ['Explorer', 'F-150', 'Edge'] },
  { make: 'Chevrolet', models: ['Tahoe', 'Malibu', 'Traverse'] },
];

const PART_CATALOG: { category: string; names: string[]; cost: [number, number]; retailMul: number }[] = [
  { category: 'Filters', names: ['Oil Filter', 'Air Filter', 'Cabin Filter', 'Fuel Filter', 'Transmission Filter'], cost: [20, 55], retailMul: 2.2 },
  { category: 'Brakes', names: ['Brake Pads Front', 'Brake Pads Rear', 'Brake Disc Front', 'Brake Disc Rear', 'Brake Fluid DOT4'], cost: [45, 220], retailMul: 2.3 },
  { category: 'Fluids', names: ['Engine Oil 5W-30 5L', 'Engine Oil 0W-20 4L', 'Coolant 4L', 'ATF Fluid', 'Power Steering Fluid'], cost: [35, 120], retailMul: 1.9 },
  { category: 'Ignition', names: ['Spark Plugs Set', 'Ignition Coil', 'Spark Plug Wire Set'], cost: [40, 180], retailMul: 2.1 },
  { category: 'Electrical', names: ['Battery 60Ah', 'Battery 70Ah', 'Battery 90Ah', 'Alternator', 'Starter Motor', 'Fuse Kit'], cost: [80, 450], retailMul: 1.85 },
  { category: 'Engine', names: ['Timing Belt Kit', 'Serpentine Belt', 'Water Pump', 'Thermostat', 'Valve Cover Gasket'], cost: [60, 400], retailMul: 2.0 },
  { category: 'Suspension', names: ['Shock Absorber Front', 'Shock Absorber Rear', 'Control Arm', 'Ball Joint', 'Stabilizer Link'], cost: [70, 350], retailMul: 2.15 },
  { category: 'AC', names: ['AC Compressor', 'AC Condenser', 'Cabin AC Filter', 'AC Gas R134a'], cost: [50, 800], retailMul: 1.9 },
  { category: 'Accessories', names: ['Wiper Blades Pair', 'Floor Mats Set', 'LED Headlight Bulb', 'Horn Kit'], cost: [25, 150], retailMul: 2.4 },
  { category: 'Tires', names: ['Tire 225/55R17', 'Tire 265/65R17', 'Tire 235/55R18', 'TPMS Sensor'], cost: [90, 420], retailMul: 1.7 },
];

const LABOR_TYPES = [
  { desc: 'Oil change & inspection', labor: 120, hours: 1 },
  { desc: 'Brake service', labor: 350, hours: 2.5 },
  { desc: 'Full diagnostics', labor: 200, hours: 1.5 },
  { desc: 'AC recharge & leak test', labor: 280, hours: 2 },
  { desc: 'Battery replacement', labor: 80, hours: 0.5 },
  { desc: 'Suspension repair', labor: 450, hours: 3 },
  { desc: 'Major service 60k', labor: 600, hours: 4 },
  { desc: 'Electrical troubleshooting', labor: 320, hours: 2.5 },
];

export async function clearDemoCompany(prisma: PrismaClient) {
  const existing = await prisma.company.findUnique({ where: { slug: DEMO_COMPANY_SLUG } });
  if (!existing) return;
  const id = existing.id;

  const repairOrders = await prisma.repairOrder.findMany({
    where: { companyId: id },
    select: { id: true },
  });
  const roIds = repairOrders.map((r) => r.id);
  if (roIds.length) {
    await prisma.repairOrderPart.deleteMany({ where: { repairOrderId: { in: roIds } } });
  }

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: { companyId: id },
    select: { id: true },
  });
  const poIds = purchaseOrders.map((p) => p.id);
  if (poIds.length) {
    await prisma.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: { in: poIds } } });
  }

  const invoices = await prisma.invoice.findMany({
    where: { companyId: id },
    select: { id: true },
  });
  const invIds = invoices.map((i) => i.id);
  if (invIds.length) {
    await prisma.receipt.deleteMany({ where: { invoiceId: { in: invIds } } });
  }

  // Also delete by carPart ownership (covers race / partial seeds)
  await prisma.repairOrderPart.deleteMany({ where: { carPart: { companyId: id } } });
  await prisma.purchaseOrderLine.deleteMany({ where: { carPart: { companyId: id } } });

  await prisma.company.delete({ where: { id } });
}

export async function seedDemoCompany(prisma: PrismaClient) {
  await clearDemoCompany(prisma);
  const rnd = mulberry32(20260805);

  const presentationByPlaceholder = Object.fromEntries(
    DEMO_PRESENTATION_ACCOUNTS.map((a) => [a.placeholderClerkId, a])
  ) as Record<string, (typeof DEMO_PRESENTATION_ACCOUNTS)[number]>;

  const staffDefs = [
    {
      clerkId: DEMO_OWNER_CLERK_ID,
      email: DEMO_OWNER_EMAIL,
      fullName: 'Ahmed Al-Rashid',
      isPlatformAdmin: true,
      role: 'COMPANY_OWNER' as const,
      branch: null as 'main' | 'north' | null,
    },
    {
      clerkId: 'dev_clerk_manager',
      email: 'demo.manager@gearvo.app',
      fullName: 'Sara Al-Harbi',
      isPlatformAdmin: false,
      role: 'BRANCH_MANAGER' as const,
      branch: 'main' as const,
    },
    {
      clerkId: 'dev_clerk_advisor',
      email: 'advisor@demo.gearvo.local',
      fullName: 'Yousef Al-Mutairi',
      isPlatformAdmin: false,
      role: 'SERVICE_ADVISOR' as const,
      branch: 'main' as const,
    },
    {
      clerkId: 'dev_clerk_tech',
      email: 'tech@demo.gearvo.local',
      fullName: 'Hassan Al-Ghamdi',
      isPlatformAdmin: false,
      role: 'TECHNICIAN' as const,
      branch: 'main' as const,
    },
    {
      clerkId: 'dev_clerk_cashier',
      email: 'cashier@demo.gearvo.local',
      fullName: 'Reem Al-Dosari',
      isPlatformAdmin: false,
      role: 'CASHIER' as const,
      branch: 'main' as const,
    },
    {
      clerkId: 'dev_clerk_inventory',
      email: 'inventory@demo.gearvo.local',
      fullName: 'Khalid Al-Zahrani',
      isPlatformAdmin: false,
      role: 'INVENTORY_MANAGER' as const,
      branch: 'main' as const,
    },
    {
      clerkId: 'dev_clerk_north_mgr',
      email: 'north@demo.gearvo.local',
      fullName: 'Noura Al-Shehri',
      isPlatformAdmin: false,
      role: 'BRANCH_MANAGER' as const,
      branch: 'north' as const,
    },
  ];

  const users = [];
  for (const s of staffDefs) {
    const presentation = presentationByPlaceholder[s.clerkId];
    if (presentation) {
      users.push(await resolveDemoStaffUser(prisma, presentation));
      continue;
    }
    users.push(
      await prisma.user.upsert({
        where: { clerkId: s.clerkId },
        create: {
          clerkId: s.clerkId,
          email: s.email,
          fullName: s.fullName,
          isPlatformAdmin: s.isPlatformAdmin,
        },
        update: {
          email: s.email,
          fullName: s.fullName,
          isPlatformAdmin: s.isPlatformAdmin,
        },
      })
    );
  }

  const company = await prisma.company.create({
    data: {
      name: 'Al-Noor Auto Care',
      slug: DEMO_COMPANY_SLUG,
      email: 'hello@alnoor-auto.sa',
      phone: '+966 11 456 7890',
      address: 'King Fahd Road, Olaya, Riyadh 12271, Saudi Arabia',
      logoUrl: '/brand/gearvo-mark.svg',
      commercialRegNumber: '1010123456',
      vatNumber: '300012345600003',
      currency: 'SAR',
      locale: 'en',
      timezone: 'Asia/Riyadh',
      plan: 'PRO',
      status: 'ACTIVE',
      trialEndsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      createdAt: daysAgo(900),
    },
  });

  const mainBranch = await prisma.branch.create({
    data: {
      companyId: company.id,
      name: 'Riyadh Main',
      slug: 'riyadh-main',
      phone: '+966 11 456 7890',
      address: 'King Fahd Road, Olaya, Riyadh',
      isDefault: true,
      createdAt: daysAgo(900),
    },
  });

  const northBranch = await prisma.branch.create({
    data: {
      companyId: company.id,
      name: 'Riyadh North',
      slug: 'riyadh-north',
      phone: '+966 11 456 7891',
      address: 'Northern Ring Road, Al-Narjis, Riyadh',
      createdAt: daysAgo(400),
    },
  });

  const branchByKey = { main: mainBranch, north: northBranch };

  for (let i = 0; i < staffDefs.length; i++) {
    const s = staffDefs[i];
    await prisma.membership.create({
      data: {
        userId: users[i].id,
        companyId: company.id,
        branchId: s.branch ? branchByKey[s.branch].id : null,
        role: s.role,
      },
    });
  }

  await prisma.companyFeatureFlag.createMany({
    data: ALL_FEATURES.map((feature) => ({
      companyId: company.id,
      feature,
      enabled: feature !== FeatureModule.AI,
    })),
  });

  const providers = [
    'STRIPE', 'WHATSAPP', 'EMAIL', 'SMS', 'GOOGLE_CALENDAR', 'OUTLOOK_CALENDAR', 'ACCOUNTING', 'ZATCA',
  ] as const;
  await prisma.companyIntegration.createMany({
    data: providers.map((provider) => ({
      companyId: company.id,
      provider,
      status:
        provider === 'EMAIL' || provider === 'WHATSAPP'
          ? IntegrationStatus.CONNECTED
          : IntegrationStatus.DISCONNECTED,
    })),
  });

  const supplierDefs = [
    { name: 'Gulf Auto Parts Co.', contactPerson: 'Khalid Mansour', phone: '+966 12 333 4444', email: 'orders@gulfparts.sa', address: 'Jeddah Industrial City', branchId: mainBranch.id },
    { name: 'Riyadh Brake & Oil', contactPerson: 'Noura Saeed', phone: '+966 11 222 3333', email: 'sales@riyadhbrake.sa', address: 'Second Industrial City, Riyadh', branchId: mainBranch.id },
    { name: 'Najd Electrical Supply', contactPerson: 'Faisal Nasser', phone: '+966 11 444 5555', email: 'info@najdelec.sa', address: 'Exit 10, Riyadh', branchId: mainBranch.id },
    { name: 'Eastern Tire Hub', contactPerson: 'Saad Al-Jabri', phone: '+966 13 666 7777', email: 'east@tirehub.sa', address: 'Dammam', branchId: mainBranch.id },
    { name: 'North Ring Parts', contactPerson: 'Maha Faris', phone: '+966 11 888 9999', email: 'north@ringparts.sa', address: 'Al-Narjis, Riyadh', branchId: northBranch.id },
  ];

  const suppliers = [];
  for (const s of supplierDefs) {
    suppliers.push(await prisma.supplier.create({ data: { companyId: company.id, ...s } }));
  }

  // ~200 parts via batch insert
  const partRows: {
    companyId: string;
    branchId: string;
    name: string;
    partNumber: string;
    costPrice: number;
    retailPrice: number;
    stockQuantity: number;
    minStockLevel: number;
    category: string;
    supplierId: string;
  }[] = [];
  let partSeq = 1000;
  for (const cat of PART_CATALOG) {
    for (const baseName of cat.names) {
      for (let variant = 0; variant < 4; variant++) {
        const cost = Math.round(cat.cost[0] + rnd() * (cat.cost[1] - cat.cost[0]));
        const retail = Math.round(cost * cat.retailMul);
        const minStock = 5 + Math.floor(rnd() * 15);
        let stock = Math.floor(rnd() * 120);
        stock = stock < minStock && rnd() > 0.55 ? stock : Math.max(stock, minStock + Math.floor(rnd() * 40));
        if (rnd() > 0.88) stock = Math.max(0, Math.floor(minStock * rnd()));
        const branch = rnd() > 0.25 ? mainBranch : northBranch;
        const supplier =
          suppliers[Math.floor(rnd() * (branch.id === northBranch.id ? suppliers.length : 4))];
        partRows.push({
          companyId: company.id,
          branchId: branch.id,
          name: `${baseName}${variant ? ` ${['OEM', 'Premium', 'Economy', 'Heavy-Duty'][variant]}` : ''}`,
          partNumber: `AN-${cat.category.slice(0, 3).toUpperCase()}-${partSeq++}`,
          costPrice: cost,
          retailPrice: retail,
          stockQuantity: stock,
          minStockLevel: minStock,
          category: cat.category,
          supplierId: supplier.id,
        });
      }
    }
  }
  await prisma.carPart.createMany({ data: partRows });
  const parts = (await prisma.carPart.findMany({ where: { companyId: company.id } })).map((p) => ({
    id: p.id,
    costPrice: Number(p.costPrice),
    retailPrice: Number(p.retailPrice),
    branchId: p.branchId,
    name: p.name,
  }));

  // Customers (~48)
  const customerRows = Array.from({ length: 48 }, (_, i) => {
    const branch = i % 5 === 0 ? northBranch : mainBranch;
    const fullName = `${FIRST[i % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`;
    const tagCount = 1 + Math.floor(rnd() * 2);
    const tags = [...new Set(Array.from({ length: tagCount }, (_, t) => TAGS[(i + t * 3) % TAGS.length]))];
    return {
      companyId: company.id,
      branchId: branch.id,
      fullName,
      phone: `+966 5${Math.floor(rnd() * 9)} ${String(100 + Math.floor(rnd() * 800)).padStart(3, '0')} ${String(1000 + Math.floor(rnd() * 8000))}`,
      email: `customer${i + 1}@demo.gearvo.local`,
      address: branch.id === mainBranch.id ? 'Riyadh · Olaya / Al-Malaz' : 'Riyadh · Al-Narjis / Al-Yasmin',
      tags,
      notes: tags.includes('VIP')
        ? 'Prefers appointment mornings. High lifetime value.'
        : tags.includes('Late Payer')
          ? 'Follow up on outstanding balance before scheduling large jobs.'
          : tags.includes('Fleet')
            ? 'Fleet account — invoice monthly to accounts payable.'
            : 'Regular walk-in customer.',
      totalSpent: 0,
      outstandingBalance: 0,
      createdAt: daysAgo(800 - i * 12),
    };
  });
  await prisma.customer.createMany({ data: customerRows });
  const customers = (await prisma.customer.findMany({ where: { companyId: company.id } })).map((c) => ({
    id: c.id,
    branchId: c.branchId,
    tags: c.tags,
    fullName: c.fullName,
  }));

  const vehicleRows: {
    companyId: string;
    branchId: string;
    customerId: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    vin: string;
    mileage: number;
    color: string;
    createdAt: Date;
  }[] = [];
  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    const vehicleCount =
      1 + (rnd() > 0.55 ? 1 : 0) + (customer.tags.includes('Fleet') ? 1 : 0);
    for (let v = 0; v < vehicleCount; v++) {
      const mk = MAKES[Math.floor(rnd() * MAKES.length)];
      const model = mk.models[Math.floor(rnd() * mk.models.length)];
      vehicleRows.push({
        companyId: company.id,
        branchId: customer.branchId,
        customerId: customer.id,
        make: mk.make,
        model,
        year: 2016 + Math.floor(rnd() * 9),
        licensePlate: `${String.fromCharCode(65 + Math.floor(rnd() * 26))}${String.fromCharCode(65 + Math.floor(rnd() * 26))}${String.fromCharCode(65 + Math.floor(rnd() * 26))} ${1000 + Math.floor(rnd() * 8000)}`,
        vin: `JT${Math.floor(rnd() * 1e14)
          .toString()
          .padStart(14, '0')
          .slice(0, 14)}`,
        mileage: 15000 + Math.floor(rnd() * 140000),
        color: ['White', 'Black', 'Silver', 'Gray', 'Blue', 'Red'][Math.floor(rnd() * 6)],
        createdAt: daysAgo(700 - i * 10 - v),
      });
    }
  }
  await prisma.vehicle.createMany({ data: vehicleRows });
  const vehicles = (await prisma.vehicle.findMany({ where: { companyId: company.id } })).map((v) => ({
    id: v.id,
    customerId: v.customerId,
    branchId: v.branchId,
  }));

  const techUser = users[3];
  const advisorUser = users[2];
  const mainParts = parts.filter((p) => p.branchId === mainBranch.id);
  const northParts = parts.filter((p) => p.branchId === northBranch.id);

  let roSeq = 10001;
  let invSeq = 20001;

  const customerSpend = new Map<string, number>();
  const customerOutstanding = new Map<string, number>();

  const roJobs = Array.from({ length: 48 }, (_, i) => i);

  async function createOneRo(i: number) {
    const vehicle = vehicles[Math.floor(rnd() * vehicles.length)];
    const customer = customers.find((c) => c.id === vehicle.customerId)!;
    const branchId = vehicle.branchId;
    const pool = branchId === mainBranch.id ? mainParts : northParts;
    if (!pool.length) return;

    const age = Math.floor(rnd() * 300);
    const createdAt = daysAgo(age);
    const labor = LABOR_TYPES[Math.floor(rnd() * LABOR_TYPES.length)];
    const usedParts: typeof pool = [];
    const partCount = 1 + Math.floor(rnd() * 2);
    for (let p = 0; p < partCount; p++) {
      const candidate = pool[Math.floor(rnd() * pool.length)];
      if (!usedParts.find((u) => u.id === candidate.id)) usedParts.push(candidate);
    }

    let partsCost = 0;
    let partsRetail = 0;
    const lineParts = usedParts.map((p) => {
      const qty = 1;
      partsCost += p.costPrice * qty;
      partsRetail += p.retailPrice * qty;
      return {
        carPartId: p.id,
        quantity: qty,
        costPrice: p.costPrice,
        retailPrice: p.retailPrice,
      };
    });

    const laborCost = labor.labor;
    const totalPrice = partsRetail + laborCost;
    const profit = totalPrice - partsCost - laborCost * 0.35;

    let status: 'PENDING' | 'IN_PROGRESS' | 'WAITING_PARTS' | 'COMPLETED' | 'DELIVERED' =
      'COMPLETED';
    if (age < 5) status = rnd() > 0.4 ? 'IN_PROGRESS' : 'PENDING';
    else if (age < 12) status = rnd() > 0.5 ? 'WAITING_PARTS' : 'IN_PROGRESS';
    else if (age < 25) status = rnd() > 0.3 ? 'COMPLETED' : 'DELIVERED';
    else status = rnd() > 0.2 ? 'DELIVERED' : 'COMPLETED';

    const orderNumber = `RO-${10001 + i}`;
    const ro = await prisma.repairOrder.create({
      data: {
        companyId: company.id,
        branchId,
        customerId: customer.id,
        vehicleId: vehicle.id,
        orderNumber,
        status,
        description: labor.desc,
        laborCost,
        partsCostTotal: partsCost,
        partsRetailTotal: partsRetail,
        totalPrice,
        profit,
        notes: `Advisor: ${advisorUser.fullName} · Tech: ${techUser.fullName}`,
        createdAt,
        parts: { create: lineParts },
      },
    });

    if (status !== 'COMPLETED' && status !== 'DELIVERED') return;

    const roll = rnd();
    let invStatus: 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE' = 'PAID';
    let paidAmount = totalPrice;
    if (roll > 0.82) {
      invStatus = 'OVERDUE';
      paidAmount = 0;
    } else if (roll > 0.65) {
      invStatus = 'PARTIAL';
      paidAmount = Math.round(totalPrice * (0.3 + rnd() * 0.4));
    } else if (roll > 0.55) {
      invStatus = 'UNPAID';
      paidAmount = 0;
    }

    const remaining = Math.max(0, totalPrice - paidAmount);
    const invoice = await prisma.invoice.create({
      data: {
        companyId: company.id,
        branchId,
        customerId: customer.id,
        repairOrderId: ro.id,
        invoiceNumber: `INV-${20001 + i}`,
        status: invStatus,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: totalPrice,
        paidAmount,
        remainingBalance: remaining,
        dueDate: daysAgo(Math.max(0, age - 14)),
        createdAt: daysAgo(Math.max(0, age - 1)),
        items: {
          create: [
            {
              description: labor.desc,
              quantity: 1,
              unitPrice: laborCost,
              total: laborCost,
            },
            ...lineParts.map((lp, idx) => ({
              description: usedParts[idx].name,
              quantity: lp.quantity,
              unitPrice: lp.retailPrice,
              total: lp.quantity * lp.retailPrice,
            })),
          ],
        },
      },
    });

    customerSpend.set(customer.id, (customerSpend.get(customer.id) ?? 0) + paidAmount);
    customerOutstanding.set(
      customer.id,
      (customerOutstanding.get(customer.id) ?? 0) + remaining
    );

    if (paidAmount > 0) {
      const methods = ['CASH', 'CARD', 'BANK_TRANSFER'] as const;
      await prisma.payment.create({
        data: {
          companyId: company.id,
          branchId,
          invoiceId: invoice.id,
          customerId: customer.id,
          amount: paidAmount,
          method: methods[Math.floor(rnd() * methods.length)],
          paymentDate: daysAgo(Math.max(0, age - 1)),
          notes: 'Demo payment',
        },
      });
    }

    if ((invStatus === 'PARTIAL' || invStatus === 'UNPAID') && totalPrice > 1500 && rnd() > 0.5) {
      const months = 3;
      const installmentAmount = Math.round((remaining || totalPrice) / months);
      await prisma.installment.createMany({
        data: Array.from({ length: months }, (_, m) => {
          const due = new Date();
          due.setDate(due.getDate() + (m - 1) * 30);
          let st: 'PENDING' | 'PAID' | 'OVERDUE' = 'PENDING';
          if (due.getTime() < Date.now() - 3 * 86400000 && m === 0) st = 'OVERDUE';
          if (m === 0 && rnd() > 0.6) st = 'PAID';
          return {
            companyId: company.id,
            branchId,
            invoiceId: invoice.id,
            customerId: customer.id,
            amount: installmentAmount,
            dueDate: due,
            status: st,
            paidDate: st === 'PAID' ? daysAgo(2) : null,
            notes: `Installment ${m + 1} of ${months}`,
          };
        }),
      });
    }
  }

  for (let i = 0; i < roJobs.length; i += 6) {
    await Promise.all(roJobs.slice(i, i + 6).map((j) => createOneRo(j)));
  }
  roSeq = 10001 + roJobs.length;
  invSeq = 20001 + roJobs.length;

  await Promise.all(
    customers.map((c) =>
      prisma.customer.update({
        where: { id: c.id },
        data: {
          totalSpent: customerSpend.get(c.id) ?? 0,
          outstandingBalance: customerOutstanding.get(c.id) ?? 0,
        },
      })
    )
  );

  for (let i = 0; i < 8; i++) {
    const supplier = suppliers[i % suppliers.length];
    const branchId = supplier.branchId;
    const pool = parts.filter((p) => p.branchId === branchId).slice(0, 40);
    if (!pool.length) continue;
    const lines = Array.from({ length: 3 + Math.floor(rnd() * 4) }, () => {
      const p = pool[Math.floor(rnd() * pool.length)];
      const qty = 5 + Math.floor(rnd() * 20);
      return { partId: p.id, qty, cost: p.costPrice };
    });
    // unique carPartIds per PO
    const uniqueLines = new Map<string, { partId: string; qty: number; cost: number }>();
    for (const l of lines) uniqueLines.set(l.partId, l);

    await prisma.purchaseOrder.create({
      data: {
        companyId: company.id,
        branchId,
        supplierId: supplier.id,
        orderNumber: `PO-${3000 + i}`,
        status: i < 5 ? 'RECEIVED' : 'ORDERED',
        notes: `Lead time ${3 + Math.floor(rnd() * 10)} days`,
        createdAt: daysAgo(60 - i * 7),
        lines: {
          create: [...uniqueLines.values()].map((l) => ({
            carPartId: l.partId,
            quantity: l.qty,
            unitCost: l.cost,
          })),
        },
      },
    });
  }

  const expenseCats = ['Rent', 'Utilities', 'Salaries', 'Marketing', 'Insurance', 'Tools'];
  for (let i = 0; i < 24; i++) {
    await prisma.expense.create({
      data: {
        companyId: company.id,
        branchId: i % 4 === 0 ? northBranch.id : mainBranch.id,
        category: expenseCats[i % expenseCats.length],
        description: `${expenseCats[i % expenseCats.length]} · period ${i + 1}`,
        amount: 800 + Math.floor(rnd() * 12000),
        expenseDate: daysAgo(i * 12),
      },
    });
  }

  const year = new Date().getFullYear();
  await prisma.documentSequence.createMany({
    data: [
      { companyId: company.id, type: 'RO', year, lastValue: roSeq - 10001 },
      { companyId: company.id, type: 'INV', year, lastValue: invSeq - 20001 },
      { companyId: company.id, type: 'PO', year, lastValue: 8 },
    ],
  });

  await prisma.activityLog.createMany({
    data: [
      {
        companyId: company.id,
        branchId: mainBranch.id,
        userId: users[0].id,
        action: 'demo.seeded',
        entityType: 'Company',
        entityId: company.id,
        summary: 'Presentation demo environment populated',
      },
      {
        companyId: company.id,
        branchId: mainBranch.id,
        userId: users[1].id,
        action: 'branch.ready',
        entityType: 'Branch',
        entityId: mainBranch.id,
        summary: 'Riyadh Main ready for customer demos',
      },
    ],
  });

  // Keep presentation Clerk accounts attached after every seed/reset
  await linkDemoClerkAccounts(prisma);

  return {
    companyId: company.id,
    slug: DEMO_COMPANY_SLUG,
    ownerClerkId: DEMO_OWNER_CLERK_ID,
    ownerEmail: DEMO_OWNER_EMAIL,
    stats: {
      parts: parts.length,
      customers: customers.length,
      vehicles: vehicles.length,
      staff: users.length,
    },
  };
}
