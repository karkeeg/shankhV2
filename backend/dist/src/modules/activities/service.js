import { prisma } from "../../prisma.js";
export async function fetchPublishedActivity(activityId) {
    return fetchPublishedActivityInternal({ id: activityId });
}
export async function fetchPublishedActivityBySlug(activitySlug) {
    return fetchPublishedActivityInternal({ slug: activitySlug });
}
async function fetchPublishedActivityInternal(where) {
    const activity = await prisma.activity.findFirst({
        where,
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
    if (!activity || activity.versions.length === 0)
        return null;
    const [latestVersion] = activity.versions;
    return {
        id: activity.id,
        slug: activity.slug,
        title: activity.title,
        type: activity.type,
        instructions: activity.instructions,
        content: latestVersion.contentJson,
        validationRules: latestVersion.validationRulesJson,
        version: latestVersion.version,
        taxonomy: {
            levelDifficulty: activity.level.difficulty,
            topicSlug: activity.level.topic.slug,
            topicTitle: activity.level.topic.title,
            moduleSlug: activity.level.topic.module.slug,
            moduleTitle: activity.level.topic.module.title,
            studyPlanSlug: activity.level.topic.module.studyPlan.slug,
            studyPlanTitle: activity.level.topic.module.studyPlan.title,
        },
    };
}
