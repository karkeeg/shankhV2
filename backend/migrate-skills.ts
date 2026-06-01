import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting migration from SkillBundles to SkillTopics...");

  // 1. Fetch all legacy bundles with their professions and items
  const legacyBundles = await prisma.skillBundle.findMany({
    include: {
      professions: true, // Links to Profession via SkillBundleProfession
      items: true,       // The actual lessons (SkillBundleItem)
    }
  });

  let topicsCreated = 0;
  let lessonsCreated = 0;

  for (const bundle of legacyBundles) {
    // A bundle can belong to multiple professions, so we create a SkillTopic for each
    for (const bundleProf of bundle.professions) {
      
      // Check if topic already exists to prevent duplicate runs
      const existingTopic = await prisma.skillTopic.findFirst({
        where: {
          professionId: bundleProf.professionId,
          name: bundle.name
        }
      });

      let topicId = existingTopic?.id;

      if (!existingTopic) {
        // 2. Create the new SkillTopic
        const newTopic = await prisma.skillTopic.create({
          data: {
            professionId: bundleProf.professionId,
            name: bundle.name,
            description: bundle.description,
            level: bundle.level,
            durationWeeks: bundle.durationWeeks,
            orderIndex: bundle.orderIndex,
            isActive: bundle.isActive,
          }
        });
        topicId = newTopic.id;
        topicsCreated++;
      } else {
        console.log(`Topic '${bundle.name}' already exists, skipping creation.`);
      }

      if (!topicId) continue;

      // 3. Migrate the bundle's items into the new SkillTopic as SkillLessons
      for (const item of bundle.items) {
        // Prevent duplicate lessons
        const existingLesson = await prisma.skillLesson.findFirst({
          where: {
            skillTopicId: topicId,
            lessonId: item.lessonId
          }
        });

        if (!existingLesson) {
          await prisma.skillLesson.create({
            data: {
              skillTopicId: topicId,
              lessonId: item.lessonId,
              name: item.label,
              description: item.description,
              orderIndex: item.orderIndex,
              // default difficulty is 'easy' in schema
            }
          });
          lessonsCreated++;
        }
      }
    }
  }

  console.log(`Migration Complete!`);
  console.log(`Created ${topicsCreated} new SkillTopics.`);
  console.log(`Created ${lessonsCreated} new SkillLessons.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
