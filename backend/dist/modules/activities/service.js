import { prisma } from "../../prisma.js";
export async function fetchPublishedActivity(activityId) {
    const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        include: {
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
        title: activity.title,
        type: activity.type,
        instructions: activity.instructions,
        content: latestVersion.contentJson,
        version: latestVersion.version,
    };
}
