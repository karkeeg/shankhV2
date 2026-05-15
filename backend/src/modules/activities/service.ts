import { prisma } from "../../prisma.js";

export async function fetchPublishedActivity(activityId: string) {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      level: {
        include: {
          topic: {
            include: {
              module: {
                include: {
                  studyPlan: true,
                },
              },
            },
          },
        },
      },
      versions: {
        where: { isPublished: true },
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  return formatActivityResponse(activity);
}

export async function fetchPublishedActivityBySlug(slug: string) {
  const activity = await prisma.activity.findFirst({
    where: { id: slug }, // Fallback if id is used as slug
    include: {
      level: {
        include: {
          topic: {
            include: {
              module: {
                include: {
                  studyPlan: true,
                },
              },
            },
          },
        },
      },
      versions: {
        where: { isPublished: true },
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  if (activity) return formatActivityResponse(activity);

  // If not found by ID, we might need a slug field, but schema doesn't have it.
  // For now, assume slug is ID or we find it some other way.
  return null;
}

function formatActivityResponse(activity: any) {
  if (!activity || activity.versions.length === 0) return null;
  const [latestVersion] = activity.versions;

  return {
    id: activity.id,
    title: activity.title,
    type: activity.type,
    instructions: activity.instructions,
    content: latestVersion.contentJson,
    validationRules: latestVersion.validationRulesJson,
    version: latestVersion.version,
    taxonomy: {
      levelDifficulty: activity.level.difficulty,
      topicTitle: activity.level.topic.title,
      moduleTitle: activity.level.topic.module.title,
      moduleLearningObjective: activity.level.topic.module.learningObjective,
      moduleCaseContext: activity.level.topic.module.caseContext,
      studyPlanTitle: activity.level.topic.module.studyPlan.title,
      studyPlanId: activity.level.topic.module.studyPlanId,
    },
  };
}

