const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const c = await p.company.findUnique({ where: { slug: 'demo-auto' } });
  if (!c) {
    console.log('no company');
    await p.$disconnect();
    return;
  }
  const rows = await p.$queryRaw`
    SELECT rp.id, rp."repairOrderId", rp."carPartId", ro."companyId" as ro_company, cp."companyId" as part_company
    FROM "RepairOrderPart" rp
    JOIN "CarPart" cp ON cp.id = rp."carPartId"
    LEFT JOIN "RepairOrder" ro ON ro.id = rp."repairOrderId"
    WHERE cp."companyId" = ${c.id} OR ro."companyId" = ${c.id}
  `;
  console.log('rows', rows);
  const allRp = await p.$queryRaw`SELECT count(*)::int as n FROM "RepairOrderPart"`;
  console.log('all RepairOrderPart', allRp);
  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});
