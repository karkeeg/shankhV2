import { prisma } from "../../prisma.js";
import { validateCanvasAttempt, validateSpreadsheetAttempt } from "../practice-engine/validators.js";
export async function createPracticeAttempt(input) {
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
    if (!activity || activity.versions.length === 0)
        return null;
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
export async function submitPracticeAttempt(input) {
    const attempt = await prisma.attempt.findUnique({
        where: { id: input.attemptId },
        include: { activityVersion: true, activity: true },
    });
    if (!attempt)
        return null;
    const rules = attempt.activityVersion.validationRulesJson;
    let result;
    if (rules.type === "spreadsheet" && Array.isArray(rules.inputs)) {
        result = validateSpreadsheetAttempt(input.answers, {
            type: "spreadsheet",
            inputs: rules.inputs,
        });
    }
    else if (rules.type === "canvas" && Array.isArray(rules.requiredNodeIds)) {
        const submission = input.answers;
        result = validateCanvasAttempt(submission, {
            type: "canvas",
            requiredNodeIds: rules.requiredNodeIds,
            requiredEdges: rules.requiredEdges,
        });
    }
    else {
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
                validationSummary: result.validationSummary,
                fieldFeedback: result.fieldFeedback,
            },
            update: {
                validationSummary: result.validationSummary,
                fieldFeedback: result.fieldFeedback,
            },
        }),
    ]);
    return result;
}
export async function fetchAttempt(attemptId) {
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
