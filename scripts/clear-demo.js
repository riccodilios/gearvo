const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const c = await p.company.findUnique({ where: { slug: 'demo-auto' } });
  console.log('company', c?.id);
  if (!c) {
    await p.$disconnect();
    return;
  }
  const ros = await p.repairOrder.count({ where: { companyId: c.id } });
  const parts = await p.carPart.count({ where: { companyId: c.id } });
  const roParts = await p.repairOrderPart.count({ where: { carPart: { companyId: c.id } } });
  console.log({ ros, parts, roParts });
  const deleted = await p.repairOrderPart.deleteMany({ where: { carPart: { companyId: c.id } } });
  console.log('deleted ro parts', deleted);
  const poLines = await p.purchaseOrderLine.deleteMany({ where: { carPart: { companyId: c.id } } });
  console.log('deleted po lines', poLines);
  await p.company.delete({ where: { id: c.id } });
  console.log('company deleted');
  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});
