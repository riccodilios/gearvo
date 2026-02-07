import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  let tenant = await prisma.tenant.findFirst({ where: { slug: 'demo-shop' } });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Demo Auto Shop',
        slug: 'demo-shop',
        email: 'demo@gearvo.com',
        phone: '+1 555-0100',
        address: '123 Main St, City, State 12345',
        plan: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });
  }

  let supplier = await prisma.supplier.findFirst({
    where: { tenantId: tenant.id, name: 'Auto Parts Wholesale' },
  });
  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: {
        tenantId: tenant.id,
        name: 'Auto Parts Wholesale',
        contactPerson: 'John Smith',
        phone: '+1 555-0200',
        email: 'orders@autopartswholesale.com',
        address: '456 Supplier Ave',
      },
    });
  }

  let customer1 = await prisma.customer.findFirst({
    where: { tenantId: tenant.id, email: 'alice@example.com' },
  });
  if (!customer1) {
    customer1 = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        fullName: 'Alice Johnson',
        phone: '+1 555-1001',
        email: 'alice@example.com',
        address: '100 Customer St',
        tags: ['VIP', 'Frequent buyer'],
      },
    });
  }

  let customer2 = await prisma.customer.findFirst({
    where: { tenantId: tenant.id, email: 'bob@example.com' },
  });
  if (!customer2) {
    customer2 = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        fullName: 'Bob Williams',
        phone: '+1 555-1002',
        email: 'bob@example.com',
        tags: ['Frequent buyer'],
      },
    });
  }

  let vehicle1 = await prisma.vehicle.findFirst({
    where: { tenantId: tenant.id, customerId: customer1.id, licensePlate: 'ABC-1234' },
  });
  if (!vehicle1) {
    vehicle1 = await prisma.vehicle.create({
      data: {
        tenantId: tenant.id,
        customerId: customer1.id,
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC-1234',
        mileage: 45000,
      },
    });
  }

  let vehicle2 = await prisma.vehicle.findFirst({
    where: { tenantId: tenant.id, customerId: customer2.id },
  });
  if (!vehicle2) {
    vehicle2 = await prisma.vehicle.create({
      data: {
        tenantId: tenant.id,
        customerId: customer2.id,
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        mileage: 52000,
      },
    });
  }

  let part1 = await prisma.carPart.findFirst({
    where: { tenantId: tenant.id, partNumber: 'BP-F-001' },
  });
  if (!part1) {
    part1 = await prisma.carPart.create({
      data: {
        tenantId: tenant.id,
        supplierId: supplier.id,
        name: 'Brake Pads (Front)',
        partNumber: 'BP-F-001',
        costPrice: 45,
        retailPrice: 89,
        stockQuantity: 20,
        minStockLevel: 5,
        category: 'Brakes',
      },
    });
  }

  let part2 = await prisma.carPart.findFirst({
    where: { tenantId: tenant.id, partNumber: 'OF-001' },
  });
  if (!part2) {
    part2 = await prisma.carPart.create({
      data: {
        tenantId: tenant.id,
        supplierId: supplier.id,
        name: 'Oil Filter',
        partNumber: 'OF-001',
        costPrice: 8,
        retailPrice: 18,
        stockQuantity: 50,
        minStockLevel: 10,
        category: 'Engine',
      },
    });
  }

  let part3 = await prisma.carPart.findFirst({
    where: { tenantId: tenant.id, partNumber: 'SP-001' },
  });
  if (!part3) {
    part3 = await prisma.carPart.create({
      data: {
        tenantId: tenant.id,
        name: 'Spark Plugs (Set of 4)',
        partNumber: 'SP-001',
        costPrice: 25,
        retailPrice: 55,
        stockQuantity: 3,
        minStockLevel: 5,
        category: 'Engine',
      },
    });
  }

  const existingOrder = await prisma.repairOrder.findFirst({
    where: { tenantId: tenant.id, orderNumber: 'RO-00001' },
  });

  if (!existingOrder) {
    const repairOrder = await prisma.repairOrder.create({
      data: {
        tenantId: tenant.id,
        customerId: customer1.id,
        vehicleId: vehicle1.id,
        orderNumber: 'RO-00001',
        description: 'Brake pad replacement and oil change',
        status: 'COMPLETED',
        laborCost: 150,
        partsCostTotal: 53,
        partsRetailTotal: 107,
        totalPrice: 257,
        profit: 54,
      },
    });

    await prisma.repairOrderPart.createMany({
      data: [
        { repairOrderId: repairOrder.id, carPartId: part1.id, quantity: 1, costPrice: 45, retailPrice: 89 },
        { repairOrderId: repairOrder.id, carPartId: part2.id, quantity: 1, costPrice: 8, retailPrice: 18 },
      ],
    });

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        repairOrderId: repairOrder.id,
        customerId: customer1.id,
        invoiceNumber: 'INV-00001',
        totalAmount: 257,
        paidAmount: 100,
        remainingBalance: 157,
        status: 'PARTIAL',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.invoiceItem.createMany({
      data: [
        { invoiceId: invoice.id, description: 'Brake Pads (Front) x1', quantity: 1, unitPrice: 89, total: 89 },
        { invoiceId: invoice.id, description: 'Oil Filter x1', quantity: 1, unitPrice: 18, total: 18 },
        { invoiceId: invoice.id, description: 'Labor', quantity: 1, unitPrice: 150, total: 150 },
      ],
    });

    await prisma.payment.create({
      data: {
        tenantId: tenant.id,
        invoiceId: invoice.id,
        customerId: customer1.id,
        amount: 100,
        method: 'CARD',
      },
    });

    await prisma.customer.update({
      where: { id: customer1.id },
      data: { totalSpent: 100, outstandingBalance: 157 },
    });
  }

  console.log('Seed completed successfully');
  console.log('Tenant:', tenant.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
