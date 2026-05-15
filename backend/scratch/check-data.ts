import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.studyPlan.count();
  const modules = await prisma.module.count();
  const topics = await prisma.topic.count();
  const levels = await prisma.level.count();
  const activities = await prisma.activity.count();

  console.log({
    plans,
    modules,
    topics,
    levels,
    activities
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
