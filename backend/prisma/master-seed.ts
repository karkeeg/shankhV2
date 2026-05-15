import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Master Database Reset & Re-Seeding...");

  // 1. CLEAR DATABASE
  console.log("Cleaning up existing data...");
  await prisma.attemptAnswer.deleteMany();
  await prisma.attemptResult.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.activityVersion.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.level.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.module.deleteMany();
  await prisma.studyPlan.deleteMany();

  // 2. CREATE STUDY PLAN
  const plan = await prisma.studyPlan.create({
    data: {
      title: "Shankh Professional Learning Path",
      description: "Master the art of financial analysis and corporate valuation through rigorous practice.",
      position: 1,
    },
  });

  // ==========================================================================
  // MODULE 1: ACCOUNTING ESSENTIALS (FOUNDATION)
  // ==========================================================================
  console.log("Seeding Module 1: Accounting Essentials...");
  const module1 = await prisma.module.create({
    data: {
      studyPlanId: plan.id,
      title: "Accounting Essentials & The Three Statements",
      description: "Build the bedrock of your financial expertise by mastering the mechanics of accounting and statement integration.",
      stage: "foundation",
      skillTags: ["Accounting", "Financial Analysis", "Balance Sheet"],
      learningObjective: "Understand the core mechanics of double-entry accounting and how transactions propagate through the three financial statements.",
      caseContext: "You are a junior analyst at a specialized accounting firm, helping new business owners understand their financial position and cash flow dynamics.",
      position: 1,
    },
  });

  // --- Topic 1: Core Mechanics (Easy) ---
  const topic1_1 = await prisma.topic.create({
    data: {
      moduleId: module1.id,
      title: "Core Mechanics",
      description: "Understanding asset classification and the accounting equation.",
      position: 1,
    },
  });

  const level1_1 = await prisma.level.create({
    data: {
      topicId: topic1_1.id,
      difficulty: "easy",
      title: "Introductory Concepts",
      description: "Basic knowledge checks and simple calculations.",
      position: 1,
    },
  });

  // M1-T1-L1: MCQ (Asset Classification)
  const act_m1_t1_mcq = await prisma.activity.create({
    data: {
      levelId: level1_1.id,
      title: "Asset Classification Mastery",
      instructions: "1. Read the provided line item carefully.\n2. Determine whether it is a Current Asset, Non-Current Asset, or a Liability.\n3. Select the most appropriate classification from the options provided.",
      type: "mcq",
      position: 1,
    }
  });

  await prisma.activityVersion.create({
    data: {
      activityId: act_m1_t1_mcq.id,
      version: 1,
      isPublished: true,
      contentJson: {
        prompt: "Knowledge Check: Asset Classification",
        overview: "Correctly classifying assets is the first step in analyzing a company's liquidity and long-term solvency. Current assets are expected to be converted to cash within one year, while non-current assets provide long-term utility.",
        learningGoals: ["Identify current vs. non-current assets.", "Understand the liquidity hierarchy of a balance sheet."],
        keyConcepts: [
          { term: "Current Asset", description: "Cash and other assets expected to be turned into cash or consumed within one year." },
          { term: "Liquidity", description: "The ease with which an asset can be converted into cash." }
        ],
        questions: [
          {
            id: "q1",
            prompt: "Which of the following items is ordinarily classified as a Non-Current Asset?",
            options: ["Inventory", "Accounts Receivable", "Goodwill", "Prepaid Expenses"],
            rationale: "Goodwill is an intangible asset representing long-term value from acquisitions, not expected to be converted to cash in 12 months.",
            correctAnswer: "C"
          }
        ]
      } as any,
      validationRulesJson: {}
    }
  });

  // M1-T1-L1: Spreadsheet (Basic Balance Sheet)
  const act_m1_t1_excel = await prisma.activity.create({
    data: {
      levelId: level1_1.id,
      title: "Balancing the Equation",
      instructions: "1. Review the list of account balances for 'Seedling Cafe'.\n2. Calculate the Total Assets by summing all relevant asset line items.\n3. Calculate Total Liabilities & Equity.\n4. Ensure the accounting equation (Assets = Liabilities + Equity) balances.",
      type: "spreadsheet",
      position: 2,
    }
  });

  await prisma.activityVersion.create({
    data: {
      activityId: act_m1_t1_excel.id,
      version: 1,
      isPublished: true,
      contentJson: {
        prompt: "Seedling Cafe: Balance Sheet Practice",
        overview: "The Balance Sheet provides a snapshot of a company's financial health at a specific point in time. It must always satisfy the fundamental equation: Assets = Liabilities + Shareholders' Equity.",
        learningGoals: ["Structure a basic balance sheet.", "Validate the accounting equation."],
        vocabulary: ["Accounting Equation", "Snapshot", "Equity"],
        table: [
          ["Item", "Value"],
          ["Cash & Equivalents", 15000],
          ["Inventory", 8000],
          ["Property, Plant & Equipment", 50000],
          ["Total Assets", null],
          [null, null],
          ["Accounts Payable", 5000],
          ["Long-term Debt", 20000],
          ["Retained Earnings", 48000],
          ["Total Liabilities & Equity", null]
        ],
        inputs: [
          { row: 4, col: 1, correctValue: 73000, placeholder: "Sum Assets", formula: "Cash + Inv + PP&E" },
          { row: 9, col: 1, correctValue: 73000, placeholder: "Sum L&E", formula: "AP + Debt + RE" }
        ],
        coach: {
          hint: "Sum the first three rows for Assets. Sum the last three rows for L&E. They should match!",
          correct: "Perfectly balanced! You've mastered the basic structure of a Balance Sheet.",
          incorrect: "The totals do not match. Check your addition for both sides."
        }
      } as any,
      validationRulesJson: {
        type: "spreadsheet",
        inputs: [
          { row: 4, col: 1, correctValue: 73000 },
          { row: 9, col: 1, correctValue: 73000 }
        ]
      } as any
    }
  });

  // M1-T1-L1: Canvas (Transaction Impact)
  const act_m1_t1_canvas = await prisma.activity.create({
    data: {
      levelId: level1_1.id,
      title: "Mapping Transaction Flows",
      instructions: "1. Analyze the transaction: 'Company purchases $5,000 of inventory on credit'.\n2. Map the impact of this transaction on the accounting equation elements.\n3. Connect the transaction to the specific accounts affected.",
      type: "canvas",
      position: 3,
    }
  });

  await prisma.activityVersion.create({
    data: {
      activityId: act_m1_t1_canvas.id,
      version: 1,
      isPublished: true,
      contentJson: {
        prompt: "Transaction Impact: Inventory Purchase on Credit",
        overview: "Every business transaction affects at least two accounts. Understanding this 'double-entry' impact is critical for building accurate financial models.",
        learningGoals: ["Apply double-entry logic.", "Trace transaction impact to the Balance Sheet."],
        canvasDraggableElements: [
          {
            category: "Impact",
            items: [
              { id: "asset_up", label: "Asset Increase", type: "rectangle", content: "+ Inventory" },
              { id: "liab_up", label: "Liability Increase", type: "rectangle", content: "+ Accounts Payable" },
              { id: "equity_up", label: "Equity Increase", type: "rectangle", content: "+ Retained Earnings" }
            ]
          }
        ],
        coach: {
          hint: "Buying on credit means you get an asset (inventory) but you also owe money (liability).",
          correct: "Correct! Both Assets and Liabilities increase by $5,000, keeping the equation balanced.",
          incorrect: "Check your logic. Did cash change? No, it was 'on credit'."
        }
      } as any,
      validationRulesJson: {}
    }
  });

  // ==========================================================================
  // MODULE 2: HORIZON APPAREL MODELING (APPLIED)
  // ==========================================================================
  console.log("Seeding Module 2: Horizon Apparel Modeling...");
  const module2 = await prisma.module.create({
    data: {
      studyPlanId: plan.id,
      title: "Horizon Apparel Group Modeling",
      description: "Advanced financial modeling for a mid-cap branded clothing and lifestyle company generating billions in annual revenue.",
      stage: "applied",
      skillTags: ["Financial Modeling", "3-Statement Model", "Retail Analysis"],
      learningObjective: "Master the integration of the three financial statements and understand how operating drivers flow into valuation.",
      caseContext: "Horizon Apparel Group is navigating a transition to higher-margin product lines. As a senior analyst, you must project their performance for the next 5 years.",
      position: 2,
    },
  });

  // --- Topic 1: Business Drivers (Medium) ---
  const topic2_1 = await prisma.topic.create({
    data: {
      moduleId: module2.id,
      title: "Operating Drivers",
      description: "Forecasting revenue and margins based on historical trends.",
      position: 1,
    },
  });

  const level2_1 = await prisma.level.create({
    data: {
      topicId: topic2_1.id,
      difficulty: "medium",
      title: "Intermediate Drivers",
      description: "Applying historical growth rates and margin trends.",
      position: 1,
    },
  });

  // M2-T1-L1: MCQ (Revenue Drivers)
  const act_m2_t1_mcq = await prisma.activity.create({
    data: {
      levelId: level2_1.id,
      title: "Horizon's Growth Strategy",
      instructions: "1. Read the company overview in the 'Context' tab.\n2. Evaluate the historical revenue growth trend (2016-2018).\n3. Identify the most likely driver for the projected 3-6% growth CAGR.",
      type: "mcq",
      position: 1,
    }
  });

  await prisma.activityVersion.create({
    data: {
      activityId: act_m2_t1_mcq.id,
      version: 1,
      isPublished: true,
      contentJson: {
        prompt: "Horizon Growth Analysis",
        overview: "Horizon Apparel maintains disciplined capital allocation and is expanding its store footprint. Growth is a function of both existing store performance and new store openings.",
        learningGoals: ["Identify growth drivers in retail.", "Distinguish organic from inorganic growth."],
        questions: [
          {
            id: "q1",
            prompt: "Given Horizon's mid-cap status and lifestyle focus, what is the primary driver of its projected revenue growth?",
            options: ["Liquidation of inventory", "Store expansion and product mix improvements", "Decrease in overall market size", "Selling off brand intellectual property"],
            rationale: "Horizon is expanding its footprint and improving product margins to drive sustainable growth.",
            correctAnswer: "B"
          }
        ]
      } as any,
      validationRulesJson: {}
    }
  });

  // M2-T1-L1: Spreadsheet (Full Forecast)
  const act_m2_t1_excel = await prisma.activity.create({
    data: {
      levelId: level2_1.id,
      title: "Horizon 3-Statement Projection",
      instructions: "1. Use the 'Assumptions' section (Rows 2-4) to set your forecast drivers.\n2. Calculate the projected Revenue for 2019 using the 3.0% growth assumption.\n3. Calculate the projected Gross Margin for 2019 by applying the 0.45% annual improvement trend.\n4. Complete the Income Statement for the forecast period (2019-2023).",
      type: "spreadsheet",
      position: 2,
    }
  });

  const horizon_table: (string | number | null)[][] = [
    [null, null, null, null, null, null, null, null, null],
    ["Assumptions", null, null, null, null, null, null, null, null],
    ["Annual Gross Margin Improvement", "0.45%", null, null, "Interest Rate on Debt", "4.00%", "Days in Year", 365, null],
    ["Effective Tax Rate", "30.00%", null, null, "Interest Rate on Cash", "0.50%", "Circ.", 1, null],
    [null, null, null, null, null, null, null, null, null],
    ["$ in million", null, "Historical", null, null, "Projected", null, null, null],
    ["Income Statement Drivers", 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    ["Revenue Growth %", null, null, null, "3.0%", "5.0%", "6.0%", "6.0%", "6.0%"],
    ["Gross Margin %", "39.4%", "40.1%", "41.1%", null, null, null, null, null],
    ["$ in million", null, "Historical", null, null, "Projected", null, null, null],
    ["Income Statement", 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    ["Total Revenue", 14135, 14484, 13405, null, null, null, null, null],
    ["Cost of Goods Sold (COGS)", 8554, 8673, 7888, null, null, null, null, null]
  ];

  await prisma.activityVersion.create({
    data: {
      activityId: act_m2_t1_excel.id,
      version: 1,
      isPublished: true,
      contentJson: {
        prompt: "Horizon Apparel: Advanced Forecasting",
        overview: "This exercise focuses on modeling detailed drivers—such as margin improvement and working capital efficiency—reflecting the complexity encountered in real-world corporate finance.",
        learningGoals: ["Model revenue and margin expansion.", "Apply historical averages to forecast future performance."],
        formulas: ["Revenue_t = Revenue_{t-1} * (1 + Growth)", "Gross_Margin_t = Gross_Margin_{t-1} + Improvement"],
        table: horizon_table,
        inputs: [
          { row: 11, col: 4, correctValue: 13807, placeholder: "=", formula: "13405 * (1 + 0.03)" },
          { row: 8, col: 4, correctValue: "41.55%", placeholder: "%", formula: "41.1% + 0.45%" }
        ],
        coach: {
          hint: "For Revenue: Multiply 2018 revenue by (1 + 3%). For GM: Add 0.45% to the 2018 margin.",
          correct: "Spot on! You've correctly translated business assumptions into financial projections.",
          incorrect: "Check your math. Ensure you are applying the growth rate to the correct base year."
        }
      } as any,
      validationRulesJson: {
        type: "spreadsheet",
        inputs: [
          { row: 11, col: 4, correctValue: 13807 },
          { row: 8, col: 4, correctValue: "41.55%" }
        ]
      } as any
    }
  });

  // M2-T1-L1: Canvas (Value Creation Flow)
  const act_m2_t1_canvas = await prisma.activity.create({
    data: {
      levelId: level2_1.id,
      title: "The Value Creation Cycle",
      instructions: "1. Identify the key steps in Horizon's capital allocation strategy.\n2. Map the flow from Operating Cash Flow to final Shareholder Value.\n3. Include nodes for Capex, Dividends, and Debt Repayment.",
      type: "canvas",
      position: 3,
    }
  });

  await prisma.activityVersion.create({
    data: {
      activityId: act_m2_t1_canvas.id,
      version: 1,
      isPublished: true,
      contentJson: {
        prompt: "Capital Allocation Flowchart",
        overview: "Value creation is not just about profit; it's about what a company does with its cash. Disciplined capital allocation is a hallmark of Horizon's strategy.",
        learningGoals: ["Map cash flow utilization.", "Understand the hierarchy of capital allocation."],
        canvasDraggableElements: [
          {
            category: "Inflow",
            items: [{ id: "ocf", label: "Operating Cash Flow", type: "rectangle", content: "Core Cash Source" }]
          },
          {
            category: "Allocation",
            items: [
              { id: "capex", label: "Growth Capex", type: "ellipse", content: "Reinvestment" },
              { id: "dividends", label: "Dividends", type: "ellipse", content: "Cash to Shareholders" },
              { id: "debt_pay", label: "Debt Paydown", type: "ellipse", content: "De-leveraging" }
            ]
          }
        ],
        coach: {
          hint: "Start with Operating Cash Flow and branch out into the different ways Horizon uses that cash.",
          correct: "Excellent mapping! This flow represents a healthy, mature corporate entity.",
          incorrect: "Ensure you are showing cash FLOWING OUT from the core operations."
        }
      } as any,
      validationRulesJson: {}
    }
  });

  console.log("✅ Master Seeding Complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
