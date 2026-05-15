import { prisma } from "../../prisma.js";

export async function listStudyPlans() {
  return prisma.studyPlan.findMany({
    orderBy: { position: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      position: true,
    },
  });
}

export async function fetchStudyPlanTree(planId: string) {
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
export async function fetchDefaultStudyPlanTree() {
  const plan = await prisma.studyPlan.findFirst({
    orderBy: { position: "asc" },
  });
  if (!plan) return null;
  return fetchStudyPlanTree(plan.id);
}
