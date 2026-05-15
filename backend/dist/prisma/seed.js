import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    const user = await prisma.user.upsert({
        where: { email: "dev@shankh.local" },
        update: {},
        create: { email: "dev@shankh.local", name: "Dev User" },
    });
    const studyPlan = await prisma.studyPlan.upsert({
        where: { slug: "financial-statement-fundamentals" },
        update: {},
        create: {
            slug: "financial-statement-fundamentals",
            title: "Financial Statement Fundamentals",
            description: "Core accounting and finance practice path.",
            position: 1,
        },
    });
    const moduleRow = await prisma.module.upsert({
        where: {
            studyPlanId_slug: {
                studyPlanId: studyPlan.id,
                slug: "income-statement-module",
            },
        },
        update: {
            title: "Income Statement Modeling",
            description: "Understand revenue-to-net-income structure.",
            position: 1,
        },
        create: {
            studyPlanId: studyPlan.id,
            slug: "income-statement-module",
            title: "Income Statement Modeling",
            description: "Understand revenue-to-net-income structure.",
            position: 1,
        },
    });
    const topic = await prisma.topic.upsert({
        where: {
            moduleId_slug: {
                moduleId: moduleRow.id,
                slug: "income-statement-practice",
            },
        },
        update: {
            title: "Income Statement Practice",
            description: "Hands-on input and reconciliation exercises.",
            position: 1,
        },
        create: {
            moduleId: moduleRow.id,
            slug: "income-statement-practice",
            title: "Income Statement Practice",
            description: "Hands-on input and reconciliation exercises.",
            position: 1,
        },
    });
    const level = await prisma.level.upsert({
        where: {
            topicId_difficulty: {
                topicId: topic.id,
                difficulty: "easy",
            },
        },
        update: {
            title: "Easy",
            description: "Foundational income statement computations.",
            position: 1,
        },
        create: {
            topicId: topic.id,
            difficulty: "easy",
            title: "Easy",
            description: "Foundational income statement computations.",
            position: 1,
        },
    });
    const spreadsheetActivity = await prisma.activity.upsert({
        where: {
            levelId_slug: {
                levelId: level.id,
                slug: "income-statement-easy-grid",
            },
        },
        update: {
            title: "Income Statement Grid Practice",
            instructions: "Fill missing values to compute gross profit and EBIT.",
            type: "spreadsheet",
            position: 1,
        },
        create: {
            levelId: level.id,
            slug: "income-statement-easy-grid",
            title: "Income Statement Grid Practice",
            instructions: "Fill missing values to compute gross profit and EBIT.",
            type: "spreadsheet",
            position: 1,
        },
    });
    const canvasActivity = await prisma.activity.upsert({
        where: {
            levelId_slug: {
                levelId: level.id,
                slug: "income-statement-canvas-easy",
            },
        },
        update: {
            title: "Income Statement Canvas Mapping",
            instructions: "Place all required nodes to map revenue to net income flow.",
            type: "canvas",
            position: 2,
        },
        create: {
            levelId: level.id,
            slug: "income-statement-canvas-easy",
            title: "Income Statement Canvas Mapping",
            instructions: "Place all required nodes to map revenue to net income flow.",
            type: "canvas",
            position: 2,
        },
    });
    await prisma.activityVersion.upsert({
        where: {
            activityId_version: {
                activityId: spreadsheetActivity.id,
                version: 1,
            },
        },
        update: {
            isPublished: true,
            contentJson: {
                question: "Complete Gross Profit and EBIT",
                table: [
                    ["Line Item", "Amount"],
                    ["Revenue", 100000],
                    ["COGS", 40000],
                    ["Gross Profit", null],
                    ["Operating Expenses", 20000],
                    ["EBIT", null],
                ],
            },
            validationRulesJson: {
                type: "spreadsheet",
                inputs: [
                    { row: 3, col: 1, correctValue: 60000, mode: "exact" },
                    { row: 5, col: 1, correctValue: 40000, mode: "exact" },
                ],
            },
        },
        create: {
            activityId: spreadsheetActivity.id,
            version: 1,
            isPublished: true,
            contentJson: {
                question: "Complete Gross Profit and EBIT",
                table: [
                    ["Line Item", "Amount"],
                    ["Revenue", 100000],
                    ["COGS", 40000],
                    ["Gross Profit", null],
                    ["Operating Expenses", 20000],
                    ["EBIT", null],
                ],
            },
            validationRulesJson: {
                type: "spreadsheet",
                inputs: [
                    { row: 3, col: 1, correctValue: 60000, mode: "exact" },
                    { row: 5, col: 1, correctValue: 40000, mode: "exact" },
                ],
            },
        },
    });
    await prisma.activityVersion.upsert({
        where: {
            activityId_version: {
                activityId: canvasActivity.id,
                version: 1,
            },
        },
        update: {
            isPublished: true,
            contentJson: {
                question: "Map the statement flow",
                requiredNodes: ["rev", "cogs", "gp", "opex", "ebit", "ni"],
            },
            validationRulesJson: {
                type: "canvas",
                requiredNodeIds: ["rev", "cogs", "gp", "opex", "ebit", "ni"],
            },
        },
        create: {
            activityId: canvasActivity.id,
            version: 1,
            isPublished: true,
            contentJson: {
                question: "Map the statement flow",
                requiredNodes: ["rev", "cogs", "gp", "opex", "ebit", "ni"],
            },
            validationRulesJson: {
                type: "canvas",
                requiredNodeIds: ["rev", "cogs", "gp", "opex", "ebit", "ni"],
            },
        },
    });
    console.log(`Seeded user: ${user.email}`);
}
main()
    .finally(async () => {
    await prisma.$disconnect();
})
    .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
});
