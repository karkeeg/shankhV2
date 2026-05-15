import { prisma } from "../../prisma.js";
import { validateSpreadsheetAttempt } from "../practice-engine/validators.js";
export async function createPracticeAttempt(input) {
    const activity = await prisma.activity.findUnique({
        where: { id: input.activityId },
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
            userId: input.userId,
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
    if (rules.type !== "spreadsheet" || !Array.isArray(rules.inputs)) {
        throw new Error("Unsupported activity type for MVP validator.");
    }
    const result = validateSpreadsheetAttempt(input.answers, {
        type: "spreadsheet",
        inputs: rules.inputs,
    });
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
