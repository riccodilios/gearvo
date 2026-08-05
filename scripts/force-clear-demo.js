const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const c = await p.company.findUnique({ where: { slug: 'demo-auto' } });
  if (!c) {
    console.log('gone');
    await p.$disconnect();
    return;
  }
  await p.$executeRawUnsafe(
    `DELETE FROM "RepairOrderPart" WHERE "carPartId" IN (SELECT id FROM "CarPart" WHERE "companyId" = $1)`,
    c.id
  );
  await p.$executeRawUnsafe(
    `DELETE FROM "PurchaseOrderLine" WHERE "carPartId" IN (SELECT id FROM "CarPart" WHERE "companyId" = $1)`,
    c.id
  );
  await p.company.delete({ where: { id: c.id } });
  console.log('ok deleted');
  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});
