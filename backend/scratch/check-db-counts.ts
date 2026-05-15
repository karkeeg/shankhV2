import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const studyPlanCount = await prisma.studyPlan.count();
  const moduleCount = await prisma.module.count();
  const topicCount = await prisma.topic.count();
  const levelCount = await prisma.level.count();
  const activityCount = await prisma.activity.count();

  console.log('--- Database Status ---');
  console.log('Study Plans:', studyPlanCount);
  console.log('Modules:', moduleCount);
  console.log('Topics:', topicCount);
  console.log('Levels:', levelCount);
  console.log('Activities:', activityCount);

  if (moduleCount > 0) {
    const modules = await prisma.module.findMany({
      include: {
        _count: {
          select: { topics: true }
        }
      }
    });
    console.log('\n--- Modules ---');
    modules.forEach(m => {
      console.log(`- ${m.title} (${m.stage}) [Tags: ${m.skillTags.join(', ')}]`);
    });
  }

  const activities = await prisma.activity.findMany({
    select: { type: true, slug: true },
    distinct: ['type', 'slug']
  });
  console.log('\n--- Activity Types & Slugs ---');
  activities.forEach(a => {
    console.log(`- Type: ${a.type}, Slug: ${a.slug}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
