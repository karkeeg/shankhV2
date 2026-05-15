import { prisma } from "../../prisma.js";
export async function listStudyPlans() {
    return prisma.studyPlan.findMany({
        orderBy: { position: "asc" },
        select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            position: true,
        },
    });
}
export async function fetchStudyPlanTree(planId) {
    return prisma.studyPlan.findUnique({
        where: { id: planId },
        include: {
            modules: {
                orderBy: { position: "asc" },
                include: {
                    topics: {
                        orderBy: { position: "asc" },
                        include: {
                            levels: {
                                orderBy: { position: "asc" },
                                include: {
                                    activities: {
                                        orderBy: { position: "asc" },
                                        select: {
                                            id: true,
                                            slug: true,
                                            title: true,
                                            type: true,
                                            instructions: true,
                                            position: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    });
}
