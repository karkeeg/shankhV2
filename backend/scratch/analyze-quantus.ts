import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const quantusActivities = await prisma.activity.findMany({
    where: { type: 'spreadsheet' },
    include: {
      versions: {
        where: { isPublished: true },
        orderBy: { version: 'desc' },
        take: 1
      },
      level: {
        include: {
          topic: {
            include: {
              module: true
            }
          }
        }
      }
    }
  });

  console.log('--- Quantus Activities Analysis ---');
  quantusActivities.forEach(a => {
    const version = a.versions[0];
    const content = version?.contentJson as any;
    console.log(`\nModule: ${a.level.topic.module.title}`);
    console.log(`Activity: ${a.title} (${a.slug})`);
    console.log(`Prompt: ${content?.prompt}`);
    console.log(`Inputs: ${content?.inputs}`);
    console.log(`Expected Formula: ${content?.expectedFormula}`);
    console.log(`Expected Answer: ${content?.expectedAnswer}`);
    console.log(`Difficulty: ${content?.difficulty}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
