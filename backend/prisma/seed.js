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
    const moduleRow = await prisma.module.create({
        data: {
            studyPlanId: studyPlan.id,
            slug: "income-statement-module",
            title: "Income Statement Modeling",
            description: "Understand revenue-to-net-income structure.",
            position: 1,
        },
    });
    const topic = await prisma.topic.create({
        data: {
            moduleId: moduleRow.id,
            slug: "income-statement-practice",
            title: "Income Statement Practice",
            description: "Hands-on input and reconciliation exercises.",
            position: 1,
        },
    });
    const level = await prisma.level.create({
        data: {
            topicId: topic.id,
            difficulty: "easy",
            title: "Easy",
            description: "Foundational income statement computations.",
            position: 1,
        },
    });
    const activity = await prisma.activity.create({
        data: {
            levelId: level.id,
            slug: "income-statement-easy-grid",
            title: "Income Statement Grid Practice",
            instructions: "Fill missing values to compute gross profit and EBIT.",
            type: "spreadsheet",
            position: 1,
        },
    });
    await prisma.activityVersion.create({
        data: {
            activityId: activity.id,
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
