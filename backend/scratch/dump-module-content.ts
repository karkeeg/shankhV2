import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const module = await prisma.module.findFirst({
    where: { title: 'Introduction to Assets' },
    include: {
      topics: {
        include: {
          levels: {
            include: {
              activities: {
                include: {
                  versions: {
                    where: { isPublished: true },
                    orderBy: { version: 'desc' },
                    take: 1
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!module) {
    console.log('Module not found');
    return;
  }

  console.log('--- Module Content: Introduction to Assets ---');
  console.log('Title:', module.title);
  console.log('Stage:', module.stage);
  console.log('Tags:', module.skillTags);

  for (const topic of module.topics) {
    for (const level of topic.levels) {
      for (const activity of level.activities) {
        console.log(`\n--- Activity: ${activity.title} (${activity.type}) ---`);
        const version = activity.versions[0];
        if (version) {
          console.log(JSON.stringify(version.contentJson, null, 2));
        }
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
