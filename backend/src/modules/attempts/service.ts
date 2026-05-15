import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";
import { validateCanvasAttempt, validateSpreadsheetAttempt } from "../practice-engine/validators.js";

interface CreateAttemptInput {
  activityId?: string;
  activitySlug?: string;
  userId: string;
}

interface SubmitAttemptInput {
  attemptId: string;
  answers: Record<string, string | number> | { nodeIds: string[]; edges?: Array<{ from: string; to: string }> };
}

export async function createPracticeAttempt(input: CreateAttemptInput) {
  let user = await prisma.user.findUnique({
    where: { id: input.userId },
  });

  if (!user) {
    user = await prisma.user.upsert({
      where: { email: `${input.userId}@shankh.local` },
      update: {},
      create: {
        email: `${input.userId}@shankh.local`,
        name: "Dev User",
      },
    });
  }

  const activity = await prisma.activity.findFirst({
    where: input.activityId
      ? { id: input.activityId }
      : input.activitySlug
        ? { slug: input.activitySlug }
        : undefined,
    include: {
      versions: {
        where: { isPublished: true },
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  if (!activity || activity.versions.length === 0) return null;
  const [version] = activity.versions;

  const attempt = await prisma.attempt.create({
    data: {
      userId: user.id,
      activityId: activity.id,
      activityVersionId: version.id,
      status: "in_progress",
    },
  });

  return attempt;
}

export async function submitPracticeAttempt(input: SubmitAttemptInput) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: input.attemptId },
    include: { activityVersion: true, activity: true },
  });
  if (!attempt) return null;

  const rules = attempt.activityVersion.validationRulesJson as {
    type?: string;
    inputs?: { row: number; col: number; correctValue: string | number; mode?: "exact" }[];
    requiredNodeIds?: string[];
    requiredEdges?: Array<{ from: string; to: string }>;
  };
  let result;
  if (rules.type === "spreadsheet" && Array.isArray(rules.inputs)) {
    result = validateSpreadsheetAttempt(input.answers as Record<string, string | number>, {
      type: "spreadsheet",
      inputs: rules.inputs as { row: number; col: number; correctValue: string | number; mode?: "exact" }[],
    });
  } else if (rules.type === "canvas" && Array.isArray(rules.requiredNodeIds)) {
    const submission = input.answers as {
      nodeIds: string[];
      edges?: Array<{ from: string; to: string }>;
    };
    result = validateCanvasAttempt(submission, {
      type: "canvas",
      requiredNodeIds: rules.requiredNodeIds,
      requiredEdges: rules.requiredEdges,
    });
  } else {
    throw new Error("Unsupported activity type for MVP validator.");
  }

  await prisma.$transaction([
    prisma.attemptAnswer.create({
      data: {
        attemptId: attempt.id,
        payload: input.answers,
      },
    }),
    prisma.attempt.update({
      where: { id: attempt.id },
      data: {
        status: "graded",
        scorePercent: result.validationSummary.scorePercent,
        submittedAt: new Date(),
        gradedAt: new Date(),
      },
    }),
    prisma.attemptResult.upsert({
      where: { attemptId: attempt.id },
      create: {
        attemptId: attempt.id,
        validationSummary: result.validationSummary as unknown as Prisma.InputJsonValue,
        fieldFeedback: result.fieldFeedback as unknown as Prisma.InputJsonValue,
      },
      update: {
        validationSummary: result.validationSummary as unknown as Prisma.InputJsonValue,
        fieldFeedback: result.fieldFeedback as unknown as Prisma.InputJsonValue,
      },
    }),
  ]);

  return result;
}

export async function fetchAttempt(attemptId: string) {
  return prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      result: true,
    },
  });
}
