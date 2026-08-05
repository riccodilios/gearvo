import { PrismaClient } from '@prisma/client';
import { seedDemoCompany } from '../src/server/demo-seed';

const prisma = new PrismaClient();

async function main() {
  const result = await seedDemoCompany(prisma);
  console.log('Demo seed complete:', result);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
