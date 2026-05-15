import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Horizon Apparel Group (Advanced Financial Modeling) activity...");

  // Find the FIRST study plan
  const studyPlan = await prisma.studyPlan.findFirst({
    orderBy: { position: "asc" },
  });

  if (!studyPlan) {
    console.error("No study plan found. Run the main seed first.");
    process.exit(1);
  }

  // Clean up any previous Apple/Horizon module
  const existing = await prisma.module.findFirst({
    where: { studyPlanId: studyPlan.id, title: "Horizon Apparel Group Modeling" },
  });
  if (existing) {
    await prisma.module.delete({ where: { id: existing.id } });
  }

  // Module
  const moduleRow = await prisma.module.create({
    data: {
      studyPlanId: studyPlan.id,
      title: "Horizon Apparel Group Modeling",
      description: "Advanced 3-statement financial modeling for a mid-cap apparel company.",
      position: 10,
      stage: "applied",
      skillTags: ["Financial Modeling", "3-Statement Model", "Forecasting", "Corporate Finance"],
      learningObjective: "Master full statement linkage and complex driver-based forecasting.",
      caseContext: "Horizon Apparel Group is a mid-cap branded clothing and lifestyle company generating billions in annual revenue.",
    },
  });

  // Topic
  const topic = await prisma.topic.create({
    data: {
      moduleId: moduleRow.id,
      title: "Advanced Forecasting",
      description: "Linking P&L, Balance Sheet, and Cash Flow.",
      position: 1,
    },
  });

  // Level - Medium (Intermediate)
  const level = await prisma.level.create({
    data: {
      topicId: topic.id,
      difficulty: "medium",
      title: "Advanced",
      description: "Complete 3-statement model with complex drivers.",
      position: 1,
    },
  });

  // Activity
  const activity = await prisma.activity.create({
    data: {
      levelId: level.id,
      title: "Financial Statements Modeling Advanced",
      instructions: "Use the Income Statement, Balance Sheet, and Cash Flow Statement from 2016–2018 to establish the basis for your assumptions and drivers. Apply these assumptions to project the P&L, Balance Sheet, and Cash Flow Statement for 2019–2023, completing all yellow-highlighted cells.\n\n1. Income Statement Drivers: Complete the highlighted cells. For Gross Margin, calculate the average rate of change over 2016–2018 and use it as a forecast assumption.\n2. Balance Sheet Drivers: Complete the highlighted cells. Calculate the average rate of change over 2016–2018 and use it as a forecast assumption.\n3. Cash Flow Statement Drivers: Complete the highlighted cells. Calculate the average rate of change over 2016–2018 and use it as a forecast assumption.\n4. Forecast Financial Statements: Project the IS, BS, and CFS for 2019–2023.\n5. Link Cash Balances: Ensure cash balances match ending cash from CFS.\n\n*Note: Circularity is allowed in this model.",
      type: "spreadsheet",
      position: 1,
    },
  });

  // Comprehensive table structure
  const table: (string | number | null)[][] = [
    [null, null, null, null, null, null, null, null, null],
    ["Assumptions", null, null, null, null, null, null, null, null],
    ["Annual Gross Margin Improvement", "0.45%", null, null, "Interest Rate on Debt", "4.00%", "Days in Year", 365, null],
    ["Effective Tax Rate", "30.00%", null, null, "Interest Rate on Cash", "0.50%", "Circ.", 1, null],
    [null, null, null, null, null, null, null, null, null],
    ["$ in million", null, "Historical", null, null, "Projected", null, null, null],
    ["Income Statement Drivers", 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    ["Revenue Growth %", null, null, null, "3.0%", "5.0%", "6.0%", "6.0%", "6.0%"],
    ["Gross Margin %", "39.4%", "40.1%", "41.1%", null, null, null, null, null],
    ["SG&A Revenue %", null, null, null, "18.0%", "17.5%", "17.5%", "17.0%", "17.0%"],
    ["Amortization of Intangible Assets", 250, 242, 231, 217, 196, 175, 153, 134],
    ["Impairment of Goodwill", 2, 3, 2, 0, 0, 0, 0, 0],
    ["Amortization of Original Debt %", null, null, null, "10.0%", "10.0%", "10.0%", "10.0%", "10.0%"],
    ["Beginning Debt Balance", null, null, null, null, null, null, null, null],
    ["  Amortization", null, null, null, null, null, null, null, null],
    ["  Ending Debt Balance", null, null, null, null, null, null, null, null],
    ["Interest Expense", null, "(239)", "(250)", "(226)", null, null, null, null],
    ["Interest Income", null, 72, 61, 78, null, null, null, null],
    [null, null, null, "Historical", null, null, "Projected", null, null],
    ["Balance Sheet Drivers", 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    ["Days Sales Outstanding", null, null, null, null, null, null, null, null],
    ["Days Sales Inventory", null, null, null, 50, 49, 49, 48, 48],
    ["Days Payable Outstanding", null, null, null, 20, 19, 19, 18, 18],
    ["Prepaid Expenses & Other % SG&A", null, null, null, "13.0%", "13.0%", "12.0%", "12.0%", "11.0%"],
    ["Other Long-Term Assets % Revenue", null, null, null, null, null, null, null, null],
    ["Accrued Expenses % SG&A", null, null, null, null, null, null, null, null],
    ["Other Current Liabilities % SG&A", null, null, null, "10.0%", "10.0%", "10.0%", "10.0%", "10.0%"],
    ["Other Long-Term Liabilities % SG&A", null, null, null, null, null, null, null, null],
    [null, null, null, "Historical", null, null, "Projected", null, null],
    ["Cash Flow Statement Drivers", 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    ["Capital Expenditures", "(368)", "(361)", "(284)", "(285)", "(325)", "(375)", "(425)", "(475)"],
    ["Depreciation % Revenue", null, null, null, "1.7%", "1.8%", "1.9%", "2.0%", "2.1%"],
    ["Stock-Based Compensation % Revenue", null, null, null, null, null, null, null, null],
    ["Deferred Taxes % Taxes", null, null, null, null, null, null, null, null],
    ["Dividends % Net Income", null, null, null, null, null, null, null, null],
    ["Stock Repurchases", 1900, 4198, 1943, 1000, 1000, 1000, 1000, 1000],
    ["FX Rate Effects % Revenue", null, null, null, null, null, null, null, null],
    ["Other Non-Cash Items", null, null, null, 0, 0, 0, 0, 0],
    ["Other Investing Items", null, null, null, 0, 0, 0, 0, 0],
    ["Other Financing Items", null, null, null, 0, 0, 0, 0, 0],
    [null, null, null, null, null, null, null, null, null],
    ["$ in million", null, "Historical", null, null, "Projected", null, null, null],
    ["Income Statement", 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    ["Total Revenue", 14135, 14484, 13405, null, null, null, null, null],
    ["Cost of Goods Sold (COGS)", 8554, 8673, 7888, null, null, null, null, null],
    ["Gross Profit", 5581, 5811, 5517, null, null, null, null, null],
  ];

  const inputs = [
    // Revenue projection (3% growth from 13405)
    { row: 43, col: 4, correctValue: 13807, placeholder: "=", formula: "Prior Revenue × (1 + Growth %)" },
    // GM projection (41.1% + 0.85% improvement avg trend)
    { row: 8, col: 4, correctValue: "42.0%", placeholder: "%", formula: "Prior GM + Avg Improvement" }
  ];

  const content = {
    prompt: "Complete the Horizon Apparel 3-Statement Model",
    overview: "Horizon Apparel Group is a mid-cap branded clothing and lifestyle company generating billions in annual revenue. Operating in the growing fashion and consumer lifestyle market, the company combines stable cash flows with expanding margins and moderate revenue growth.\n\nThe company demonstrates a clear trend of improving profitability, with gross margins steadily rising as product mix and operational efficiency improve, while operating expenses as a percentage of revenue decline.",
    learningGoals: [
      "Develop and apply detailed forecasting assumptions based on historical trends.",
      "Project all three financial statements over a multi-year horizon.",
      "Understand how operating performance, financing decisions, and investing activities interact.",
      "Model debt amortization, interest expense, dividends, and share repurchases.",
      "Ensure full statement linkage by reconciling ending cash and balancing the Balance Sheet."
    ],
    keyConcepts: [
      { term: "Gross Margins", description: "Forecasting top-line growth and gradual gross margin improvement." },
      { term: "Operating Leverage", description: "Understanding how SG&A and operating costs scale with revenue." },
      { term: "Debt & Interest Modeling", description: "Forecasting debt balances, amortization schedules, and interest expense." },
      { term: "Working Capital Dynamics", description: "Using DSO, DIO, and DPO to project accounts receivable, inventory, and accounts payable." },
      { term: "Cash Flow Integrity", description: "Ensuring cash flows reconcile with Balance Sheet cash balances." }
    ],
    vocabulary: ["DSO", "DIO", "DPO", "EBITDA", "Circularity", "Amortization"],
    formulas: [
      "Revenue_t = Revenue_{t-1} * (1 + Growth_Rate)",
      "COGS = Revenue * (1 - Gross_Margin)",
      "EBIT = Gross_Profit - SG&A - D&A"
    ],
    table,
    inputs,
    coach: {
      hint: "Calculate the historical average growth for Gross Margin (2016-2018) and apply that trend to your 2019 projection.",
      correct: "Excellent work! Your linkages are mathematically sound.",
      incorrect: "Check your Revenue projection and Gross Margin calculations."
    }
  };

  await prisma.activityVersion.create({
    data: {
      activityId: activity.id,
      version: 1,
      isPublished: true,
      contentJson: content as any,
      validationRulesJson: {
        type: "spreadsheet",
        inputs,
      } as any,
    },
  });

  console.log(`✅ Seeded Horizon Apparel Group activity under "${studyPlan.title}"`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
