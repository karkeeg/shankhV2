import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const plans = await prisma.studyPlan.findMany({
    select: { id: true, title: true, slug: true, _count: { select: { modules: true } } }
  });
  console.log('Plans:', plans);
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
