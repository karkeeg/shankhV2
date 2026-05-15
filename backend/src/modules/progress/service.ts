import { prisma } from "../../prisma.js";

export async function getUserProgress(userId: string, studyPlanId?: string) {
  // 1. Fetch all graded attempts for the user
  const attempts = await prisma.attempt.findMany({
    where: { 
      userId, 
      status: "graded",
      ...(studyPlanId ? {
        activity: {
          level: {
            topic: {
              module: {
                studyPlanId
              }
            }
          }
        }
      } : {})
    },
    include: {
      activity: {
        include: {
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
      }
    },
    orderBy: { submittedAt: "desc" }
  });

  // 2. Aggregate Skills for Radar
  const skillMap: Record<string, { totalScore: number; count: number }> = {};

  attempts.forEach(attempt => {
    const tags = attempt.activity.level.topic.module.skillTags;
    const score = attempt.scorePercent || 0;

    tags.forEach(tag => {
      if (!skillMap[tag]) {
        skillMap[tag] = { totalScore: 0, count: 0 };
      }
      skillMap[tag].totalScore += score;
      skillMap[tag].count += 1;
    });
  });

  const skillRadar = Object.entries(skillMap).map(([name, data]) => ({
    name: name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    value: Math.round(data.totalScore / data.count)
  })).slice(0, 6); // Top 6 skills

  // 3. Calculate Independence Score
  // Logic: Base 100, -2 per check, -5 per hint
  let totalIndependence = 0;
  if (attempts.length > 0) {
    const indScores = attempts.map(a => {
      const base = 100;
      const penalty = (a.checkCount * 2) + (a.hintsUsedCount * 5);
      return Math.max(0, base - penalty);
    });
    totalIndependence = Math.round(indScores.reduce((a, b) => a + b, 0) / indScores.length);
  } else {
    totalIndependence = 100; // Fresh start
  }

  // 4. Recent Activity
  const recentActivity = attempts.slice(0, 5).map(a => ({
    title: a.activity.level.topic.module.title,
    score: a.scorePercent,
    independence: Math.max(0, 100 - ((a.checkCount * 2) + (a.hintsUsedCount * 5))),
    date: a.submittedAt
  }));

  // 5. XP and Mastery (Progress)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true }
  });

  const totalActivities = await prisma.activity.count({
    where: studyPlanId ? {
      level: {
        topic: {
          module: {
            studyPlanId
          }
        }
      }
    } : {}
  });
  const completedActivitiesCount = new Set(attempts.map(a => a.activityId)).size;
  const mastery = totalActivities > 0 ? Math.round((completedActivitiesCount / totalActivities) * 100) : 0;
  
  // XP Calculation: 100 * (score/100) - penalties
  const totalXP = attempts.reduce((acc, a) => {
    const base = 100 * ((a.scorePercent || 0) / 100);
    const penalties = (a.checkCount * 2) + (a.hintsUsedCount * 5);
    return acc + Math.max(0, Math.round(base - penalties));
  }, 0);

  return {
    userName: user?.name || "User",
    skillRadar: skillRadar.length > 0 ? skillRadar : [
        { name: "Accounting", value: 0 },
        { name: "Modelling", value: 0 },
        { name: "Valuation", value: 0 },
        { name: "Strategy", value: 0 },
        { name: "Analysis", value: 0 }
    ],
    independenceScore: totalIndependence,
    recentActivity,
    mastery,
    totalXP
  };
}

export async function recordAttempt(data: {
  userId: string;
  activityId: string;
  scorePercent?: number;
  checkCount?: number;
  hintsUsedCount?: number;
  status: "in_progress" | "graded" | "submitted";
  studyPlanId?: string;
  answers?: any[];
}) {
  // Find the latest published version of this activity
  const version = await prisma.activityVersion.findFirst({
    where: { activityId: data.activityId, isPublished: true },
    orderBy: { version: "desc" }
  });

  if (!version) {
    throw new Error("No published version found for this activity");
  }

  // Look for an existing in_progress attempt
  const existingAttempt = await prisma.attempt.findFirst({
    where: { 
      userId: data.userId, 
      activityId: data.activityId, 
      status: "in_progress" 
    },
    orderBy: { startedAt: "desc" }
  });

  let attempt;
  if (existingAttempt) {
    attempt = await prisma.attempt.update({
      where: { id: existingAttempt.id },
      data: {
        scorePercent: data.scorePercent ?? existingAttempt.scorePercent,
        checkCount: data.checkCount ?? existingAttempt.checkCount,
        hintsUsedCount: data.hintsUsedCount ?? existingAttempt.hintsUsedCount,
        status: data.status as any,
        submittedAt: data.status === "graded" || data.status === "submitted" ? new Date() : existingAttempt.submittedAt,
        gradedAt: data.status === "graded" ? new Date() : existingAttempt.gradedAt,
      }
    });
  } else {
    attempt = await prisma.attempt.create({
      data: {
        userId: data.userId,
        activityId: data.activityId,
        activityVersionId: version.id,
        scorePercent: data.scorePercent || 0,
        checkCount: data.checkCount || 0,
        hintsUsedCount: data.hintsUsedCount || 0,
        status: data.status as any,
        startedAt: new Date(),
        submittedAt: data.status === "graded" || data.status === "submitted" ? new Date() : null,
        gradedAt: data.status === "graded" ? new Date() : null,
      }
    });
  }

  // Save answers if provided
  if (data.answers && data.answers.length > 0) {
    // Clear previous answers for this attempt to avoid duplicates during incremental save
    await prisma.attemptAnswer.deleteMany({ where: { attemptId: attempt.id } });
    
    await prisma.attemptAnswer.createMany({
      data: data.answers.map(ans => ({
        attemptId: attempt.id,
        payload: ans
      }))
    });
  }

  // Return the updated progress
  return await getUserProgress(data.userId, data.studyPlanId);
}


