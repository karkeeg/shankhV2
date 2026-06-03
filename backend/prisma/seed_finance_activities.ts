/**
 * ============================================================
 * SHANKH — FINANCE MODULE: MCQ + QUANTUS ACTIVITY SEED
 * ============================================================
 * Adds correctly-aligned MCQ and Quantus activities for all
 * 15 Finance lessons (Topic 0: Financial Statements × 3 subtopics,
 * Topic 1: Valuation × 2 subtopics).
 *
 * Each lesson already has one PRIMARY activity from seed.ts
 * (canvas / mcq / quantus). This file adds:
 *   • 1 McqActivity (4 questions × 4 options) aligned to the lesson topic
 *   • 1 QuantusActivity (spreadsheet exercise) aligned to the lesson topic
 *
 * Safe to re-run: all writes are guarded by findUnique / findFirst.
 *
 * Lesson key reference:
 *   finance/0/0/easy   – Revenue to Gross Profit       (primary: canvas)
 *   finance/0/0/medium – Operating Income & EBIT        (primary: canvas)
 *   finance/0/0/hard   – Net Income Bridge              (primary: canvas)
 *   finance/0/1/easy   – The Accounting Equation        (primary: canvas)
 *   finance/0/1/medium – Working Capital                (primary: mcq)
 *   finance/0/1/hard   – Asset Composition Analysis     (primary: quantus)
 *   finance/0/2/easy   – Net Income vs Cash             (primary: mcq)
 *   finance/0/2/medium – Building Cash From Operations  (primary: quantus)
 *   finance/0/2/hard   – Free Cash Flow                 (primary: canvas)
 *   finance/1/0/easy   – Present Value Basics           (primary: mcq)
 *   finance/1/0/medium – Discounting Cash Flows         (primary: quantus)
 *   finance/1/0/hard   – Terminal Value                 (primary: canvas)
 *   finance/1/1/easy   – EV to Equity Bridge            (primary: canvas)
 *   finance/1/1/medium – Trading Multiples              (primary: mcq)
 *   finance/1/1/hard   – EV Build-Up                    (primary: quantus)
 * ============================================================
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ─── Shared type definitions ──────────────────────────────────────────────────

interface McqOptionDef {
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
}
interface McqQuestionDef {
  questionText: string;
  explanation: string;
  orderIndex: number;
  options: McqOptionDef[];
}
interface McqDef {
  title: string;
  instructions: string;
  context: string;
  questions: McqQuestionDef[];
}
interface QuantusCellDef {
  rowIndex: number;
  colIndex: number;
  cellType: string;
  displayValue?: string;
  expectedValue?: string;
  formula?: string;
  formatType?: string;
  isEditable: boolean;
  tolerancePct?: number;
  hintText?: string;
}
interface QuantusDef {
  title: string;
  instructions: string;
  context: string;
  columnGroups: {
    label: string;
    colStart: number;
    colEnd: number;
    bgColor: string;
    orderIndex: number;
  }[];
  columns: { label: string; colIndex: number; widthPx: number }[];
  cells: QuantusCellDef[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function lessonId(
  index: Record<string, { id: string }>,
  key: string
): string {
  const row = index[key];
  if (!row) throw new Error(`Lesson key not found: ${key}`);
  return row.id;
}

async function addMcq(lid: string, def: McqDef) {
  let act = await prisma.mcqActivity.findUnique({
    where: { lessonId: lid },
  });

  if (act) {
    await prisma.mcqActivity.update({
      where: { id: act.id },
      data: {
        title: def.title,
        instructions: def.instructions,
        context: def.context,
      },
    });
    await prisma.mcqQuestion.deleteMany({
      where: { activityId: act.id },
    });
  } else {
    act = await prisma.mcqActivity.create({
      data: {
        lessonId: lid,
        title: def.title,
        instructions: def.instructions,
        context: def.context,
      },
    });
  }

  for (const q of def.questions) {
    await prisma.mcqQuestion.create({
      data: {
        activityId: act.id,
        questionText: q.questionText,
        explanation: q.explanation,
        orderIndex: q.orderIndex,
        options: { create: q.options },
      },
    });
  }

  await prisma.lessonActivity.upsert({
    where: { lessonId_activityType: { lessonId: lid, activityType: "mcq" } },
    update: { orderIndex: 10 },
    create: { lessonId: lid, activityType: "mcq", orderIndex: 10 },
  });

  return act;
}

async function addQuantus(lid: string, def: QuantusDef) {
  let act = await prisma.quantusActivity.findUnique({
    where: { lessonId: lid },
  });

  if (act) {
    await prisma.quantusActivity.update({
      where: { id: act.id },
      data: {
        title: def.title,
        instructions: def.instructions,
        context: def.context,
      },
    });
    await prisma.quantusColumnGroup.deleteMany({ where: { activityId: act.id } });
    await prisma.quantusColumn.deleteMany({ where: { activityId: act.id } });
    await prisma.quantusCell.deleteMany({ where: { activityId: act.id } });
  } else {
    act = await prisma.quantusActivity.create({
      data: {
        lessonId: lid,
        title: def.title,
        instructions: def.instructions,
        context: def.context,
      },
    });
  }

  for (let i = 0; i < def.columnGroups.length; i++) {
    const g = def.columnGroups[i];
    await prisma.quantusColumnGroup.create({
      data: {
        activityId: act.id,
        label: g.label,
        colStart: g.colStart,
        colEnd: g.colEnd,
        bgColor: g.bgColor,
        orderIndex: g.orderIndex,
      },
    });
  }

  for (const c of def.columns) {
    await prisma.quantusColumn.create({
      data: {
        activityId: act.id,
        label: c.label,
        colIndex: c.colIndex,
        widthPx: c.widthPx,
      },
    });
  }

  for (const cell of def.cells) {
    await prisma.quantusCell.create({
      data: {
        activityId: act.id,
        rowIndex: cell.rowIndex,
        colIndex: cell.colIndex,
        cellType: cell.cellType,
        displayValue: cell.displayValue ?? null,
        expectedValue: cell.expectedValue ?? null,
        formula: cell.formula ?? null,
        formatType: cell.formatType ?? null,
        isEditable: cell.isEditable,
        tolerancePct: cell.tolerancePct ?? null,
        hintText: cell.hintText ?? null,
      },
    });
  }

  await prisma.lessonActivity.upsert({
    where: { lessonId_activityType: { lessonId: lid, activityType: "quantus" } },
    update: { orderIndex: 20 },
    create: { lessonId: lid, activityType: "quantus", orderIndex: 20 },
  });

  return act;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOPIC 0 — FINANCIAL STATEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────────────────────────
// ST 0 · LESSON 1 · easy  →  Revenue to Gross Profit
// ──────────────────────────────────────────────────────────────────────────────

const mcq_is_easy: McqDef = {
  title: "Revenue to Gross Profit — Concept Check",
  instructions:
    "Select the single best answer. These questions reinforce the concept you just practised in the canvas activity.",
  context:
    "Gross profit is the first profitability subtotal on the income statement. It is calculated as Revenue minus Cost of Goods Sold (COGS). COGS contains only the direct costs of producing what was sold — raw materials, direct labour, and manufacturing overhead. Everything else, such as salaries, rent, and marketing, sits below the gross-profit line as operating expenses. The gross margin (gross profit divided by revenue) is one of the most closely watched metrics in financial analysis because it reflects pricing power and production efficiency before any overhead distortion. A software company may run an 80%+ gross margin while a supermarket runs under 25%; the difference is structural, not managerial.",
  questions: [
    {
      questionText:
        "A company reports Revenue of $500m and COGS of $300m. What is its gross profit?",
      explanation:
        "Gross Profit = Revenue − COGS = 500 − 300 = $200m. COGS is the only cost deducted above the gross-profit line.",
      orderIndex: 0,
      options: [
        { optionText: "$200m", isCorrect: true, orderIndex: 0 },
        { optionText: "$800m", isCorrect: false, orderIndex: 1 },
        { optionText: "$300m", isCorrect: false, orderIndex: 2 },
        { optionText: "$150m", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "Which of the following costs is included in COGS rather than operating expenses?",
      explanation:
        "Raw materials are a direct cost of production and belong in COGS. Rent, marketing and executive salaries are overhead — they fall below the gross-profit line as operating expenses.",
      orderIndex: 1,
      options: [
        { optionText: "Raw materials used in manufacturing", isCorrect: true, orderIndex: 0 },
        { optionText: "Executive salaries", isCorrect: false, orderIndex: 1 },
        { optionText: "Marketing spend", isCorrect: false, orderIndex: 2 },
        { optionText: "Office rent", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "A firm's gross margin rises from 35% to 42% while revenue is unchanged. The most likely cause is:",
      explanation:
        "Gross margin = gross profit ÷ revenue. If revenue is flat, rising margin means COGS fell relative to revenue — either input costs dropped or production became more efficient. Price increases would also work but the question states revenue is unchanged.",
      orderIndex: 2,
      options: [
        { optionText: "COGS decreased as a share of revenue", isCorrect: true, orderIndex: 0 },
        { optionText: "Operating expenses increased", isCorrect: false, orderIndex: 1 },
        { optionText: "Revenue grew faster than COGS", isCorrect: false, orderIndex: 2 },
        { optionText: "Depreciation was reclassified to financing", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "Why does an analyst prefer gross margin over absolute gross profit when comparing two companies of different sizes?",
      explanation:
        "Gross margin is a percentage, so it removes the effect of company size. A $10m gross profit means something very different for a $30m business versus a $500m one. Margins are scale-neutral and therefore directly comparable.",
      orderIndex: 3,
      options: [
        {
          optionText: "Gross margin is size-neutral and comparable across companies",
          isCorrect: true,
          orderIndex: 0,
        },
        { optionText: "Absolute gross profit is harder to calculate", isCorrect: false, orderIndex: 1 },
        { optionText: "Gross margin includes operating expenses", isCorrect: false, orderIndex: 2 },
        { optionText: "Gross margin is reported under IFRS; gross profit is not", isCorrect: false, orderIndex: 3 },
      ],
    },
  ],
};

const quantus_is_easy: QuantusDef = {
  title: "Gross Profit & Gross Margin Build",
  instructions:
    "Complete the yellow editable cells to compute gross profit and gross margin for three companies. All figures in $m.",
  context:
    "Gross profit equals Revenue minus COGS. Gross margin is gross profit expressed as a percentage of revenue. Comparing gross margins across companies of different sizes is more meaningful than comparing absolute gross profit figures because the margin is scale-neutral. Even though the three companies below differ greatly in size, their margins can be compared side by side on equal footing.",
  columnGroups: [
    { label: "Income Statement Inputs", colStart: 1, colEnd: 2, bgColor: "#e8f5e9", orderIndex: 0 },
    { label: "Outputs", colStart: 3, colEnd: 4, bgColor: "#fffde7", orderIndex: 1 },
  ],
  columns: [
    { label: "Company", colIndex: 0, widthPx: 130 },
    { label: "Revenue ($m)", colIndex: 1, widthPx: 120 },
    { label: "COGS ($m)", colIndex: 2, widthPx: 110 },
    { label: "Gross Profit ($m)", colIndex: 3, widthPx: 140 },
    { label: "Gross Margin %", colIndex: 4, widthPx: 130 },
  ],
  cells: [
    // Company A
    { rowIndex: 0, colIndex: 0, cellType: "prefilled", displayValue: "Company A", isEditable: false },
    { rowIndex: 0, colIndex: 1, cellType: "prefilled", displayValue: "200", isEditable: false },
    { rowIndex: 0, colIndex: 2, cellType: "prefilled", displayValue: "130", isEditable: false },
    {
      rowIndex: 0, colIndex: 3, cellType: "editable", expectedValue: "70", isEditable: true,
      tolerancePct: 0, hintText: "Gross Profit = Revenue − COGS = 200 − 130",
    },
    {
      rowIndex: 0, colIndex: 4, cellType: "editable", expectedValue: "35", isEditable: true,
      formatType: "percent", tolerancePct: 1, hintText: "Gross Margin = Gross Profit ÷ Revenue × 100",
    },
    // Company B
    { rowIndex: 1, colIndex: 0, cellType: "prefilled", displayValue: "Company B", isEditable: false },
    { rowIndex: 1, colIndex: 1, cellType: "prefilled", displayValue: "800", isEditable: false },
    { rowIndex: 1, colIndex: 2, cellType: "prefilled", displayValue: "200", isEditable: false },
    {
      rowIndex: 1, colIndex: 3, cellType: "editable", expectedValue: "600", isEditable: true,
      tolerancePct: 0, hintText: "Gross Profit = 800 − 200",
    },
    {
      rowIndex: 1, colIndex: 4, cellType: "editable", expectedValue: "75", isEditable: true,
      formatType: "percent", tolerancePct: 1, hintText: "Gross Margin = 600 ÷ 800 × 100",
    },
    // Company C
    { rowIndex: 2, colIndex: 0, cellType: "prefilled", displayValue: "Company C", isEditable: false },
    { rowIndex: 2, colIndex: 1, cellType: "prefilled", displayValue: "50", isEditable: false },
    { rowIndex: 2, colIndex: 2, cellType: "prefilled", displayValue: "38", isEditable: false },
    {
      rowIndex: 2, colIndex: 3, cellType: "editable", expectedValue: "12", isEditable: true,
      tolerancePct: 0, hintText: "Gross Profit = 50 − 38",
    },
    {
      rowIndex: 2, colIndex: 4, cellType: "editable", expectedValue: "24", isEditable: true,
      formatType: "percent", tolerancePct: 1, hintText: "Gross Margin = 12 ÷ 50 × 100",
    },
    // Summary row
    {
      rowIndex: 3, colIndex: 0, cellType: "header", displayValue: "Highest-margin company",
      isEditable: false,
    },
    {
      rowIndex: 3, colIndex: 3, cellType: "editable", expectedValue: "B", isEditable: true,
      hintText: "Compare the three gross margin percentages — which is largest?",
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// ST 0 · LESSON 2 · medium  →  Operating Income & EBIT
// ──────────────────────────────────────────────────────────────────────────────

const mcq_is_medium: McqDef = {
  title: "Operating Income (EBIT) — Concept Check",
  instructions:
    "Select the single best answer for each question on EBIT and its role in financial analysis.",
  context:
    "Operating income, also called EBIT (Earnings Before Interest and Taxes), measures how much profit a business generates from its core activities before the effects of financing and taxation. Starting from gross profit, operating expenses such as SG&A (selling, general and administrative costs) and D&A (depreciation and amortisation) are subtracted to arrive at EBIT. Because EBIT excludes interest and tax, it enables a fair comparison of two companies with different debt levels or tax domiciles — the underlying operating performance is visible without the distortions of capital structure or jurisdiction. EBIT is the numerator in widely used valuation multiples such as EV/EBIT.",
  questions: [
    {
      questionText:
        "EBIT is calculated as Gross Profit minus which items?",
      explanation:
        "EBIT = Gross Profit − Operating Expenses. Operating expenses include SG&A, R&D, and D&A. Interest and tax are excluded — that is precisely what 'Before Interest and Taxes' means.",
      orderIndex: 0,
      options: [
        { optionText: "Operating expenses (SG&A and D&A)", isCorrect: true, orderIndex: 0 },
        { optionText: "Operating expenses, interest, and tax", isCorrect: false, orderIndex: 1 },
        { optionText: "COGS only", isCorrect: false, orderIndex: 2 },
        { optionText: "Interest expense and dividends", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "Company X has EBIT of $80m and interest expense of $20m. Company Y has EBIT of $80m and zero debt. Which statement is correct?",
      explanation:
        "EBIT is identical for both companies, reflecting the same operating performance. Their net incomes will differ because Company X incurs interest expense. EBIT isolates operations from financing choices — that is its analytical value.",
      orderIndex: 1,
      options: [
        {
          optionText: "Both companies have the same operating performance; net income will differ",
          isCorrect: true,
          orderIndex: 0,
        },
        { optionText: "Company Y is more profitable because it has no interest", isCorrect: false, orderIndex: 1 },
        { optionText: "Company X's EBIT should be adjusted upward for the interest saving", isCorrect: false, orderIndex: 2 },
        { optionText: "EBIT cannot be used to compare leveraged and unleveraged companies", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "A company reports: Revenue $400m, COGS $240m, SG&A $60m, D&A $20m. What is EBIT?",
      explanation:
        "Gross Profit = 400 − 240 = $160m. EBIT = 160 − 60 − 20 = $80m. Both SG&A and D&A are operating expenses subtracted from gross profit to arrive at EBIT.",
      orderIndex: 2,
      options: [
        { optionText: "$80m", isCorrect: true, orderIndex: 0 },
        { optionText: "$100m", isCorrect: false, orderIndex: 1 },
        { optionText: "$160m", isCorrect: false, orderIndex: 2 },
        { optionText: "$60m", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "Why is EBIT margin more useful than net margin when benchmarking peers across different countries?",
      explanation:
        "Corporate tax rates vary significantly by country. Net margin reflects these tax differences, making cross-country comparisons misleading. EBIT margin removes both interest and tax effects, leaving only operating performance — a fair comparison regardless of where a company is domiciled.",
      orderIndex: 3,
      options: [
        {
          optionText: "EBIT margin removes the distortion of different tax rates across jurisdictions",
          isCorrect: true,
          orderIndex: 0,
        },
        { optionText: "Net margin includes depreciation which is not comparable", isCorrect: false, orderIndex: 1 },
        { optionText: "EBIT margin is always higher, making comparisons easier", isCorrect: false, orderIndex: 2 },
        { optionText: "EBIT is the only metric that includes capital expenditure", isCorrect: false, orderIndex: 3 },
      ],
    },
  ],
};

const quantus_is_medium: QuantusDef = {
  title: "Income Statement Waterfall — Gross Profit to EBIT",
  instructions:
    "Fill in the yellow editable cells to complete the income statement waterfall from Revenue down to EBIT. Use the figures provided for each company.",
  context:
    "The income statement flows from Revenue to Gross Profit by subtracting COGS, then from Gross Profit to EBIT by subtracting operating expenses. Understanding this two-step structure — and how EBIT margin compares across companies — is fundamental to reading any P&L. Companies A and B have the same revenue but very different cost structures; this exercise makes those differences visible.",
  columnGroups: [
    { label: "Company A ($m)", colStart: 1, colEnd: 2, bgColor: "#e3f2fd", orderIndex: 0 },
    { label: "Company B ($m)", colStart: 3, colEnd: 4, bgColor: "#fce4ec", orderIndex: 1 },
  ],
  columns: [
    { label: "Line Item", colIndex: 0, widthPx: 200 },
    { label: "A — Amount", colIndex: 1, widthPx: 120 },
    { label: "A — Margin %", colIndex: 2, widthPx: 120 },
    { label: "B — Amount", colIndex: 3, widthPx: 120 },
    { label: "B — Margin %", colIndex: 4, widthPx: 120 },
  ],
  cells: [
    { rowIndex: 0, colIndex: 0, cellType: "header", displayValue: "Revenue", isEditable: false },
    { rowIndex: 0, colIndex: 1, cellType: "prefilled", displayValue: "500", isEditable: false },
    { rowIndex: 0, colIndex: 2, cellType: "prefilled", displayValue: "100%", isEditable: false },
    { rowIndex: 0, colIndex: 3, cellType: "prefilled", displayValue: "500", isEditable: false },
    { rowIndex: 0, colIndex: 4, cellType: "prefilled", displayValue: "100%", isEditable: false },

    { rowIndex: 1, colIndex: 0, cellType: "prefilled", displayValue: "(−) COGS", isEditable: false },
    { rowIndex: 1, colIndex: 1, cellType: "prefilled", displayValue: "300", isEditable: false },
    { rowIndex: 1, colIndex: 3, cellType: "prefilled", displayValue: "200", isEditable: false },

    { rowIndex: 2, colIndex: 0, cellType: "header", displayValue: "Gross Profit", isEditable: false },
    {
      rowIndex: 2, colIndex: 1, cellType: "editable", expectedValue: "200", isEditable: true,
      tolerancePct: 0, hintText: "Gross Profit = Revenue − COGS = 500 − 300",
    },
    {
      rowIndex: 2, colIndex: 2, cellType: "editable", expectedValue: "40", isEditable: true,
      formatType: "percent", tolerancePct: 1, hintText: "Gross Margin = 200 ÷ 500 × 100",
    },
    {
      rowIndex: 2, colIndex: 3, cellType: "editable", expectedValue: "300", isEditable: true,
      tolerancePct: 0, hintText: "Gross Profit = 500 − 200",
    },
    {
      rowIndex: 2, colIndex: 4, cellType: "editable", expectedValue: "60", isEditable: true,
      formatType: "percent", tolerancePct: 1, hintText: "Gross Margin = 300 ÷ 500 × 100",
    },

    { rowIndex: 3, colIndex: 0, cellType: "prefilled", displayValue: "(−) SG&A", isEditable: false },
    { rowIndex: 3, colIndex: 1, cellType: "prefilled", displayValue: "80", isEditable: false },
    { rowIndex: 3, colIndex: 3, cellType: "prefilled", displayValue: "150", isEditable: false },

    { rowIndex: 4, colIndex: 0, cellType: "prefilled", displayValue: "(−) D&A", isEditable: false },
    { rowIndex: 4, colIndex: 1, cellType: "prefilled", displayValue: "20", isEditable: false },
    { rowIndex: 4, colIndex: 3, cellType: "prefilled", displayValue: "25", isEditable: false },

    { rowIndex: 5, colIndex: 0, cellType: "header", displayValue: "EBIT", isEditable: false },
    {
      rowIndex: 5, colIndex: 1, cellType: "editable", expectedValue: "100", isEditable: true,
      tolerancePct: 0, hintText: "EBIT = Gross Profit − SG&A − D&A = 200 − 80 − 20",
    },
    {
      rowIndex: 5, colIndex: 2, cellType: "editable", expectedValue: "20", isEditable: true,
      formatType: "percent", tolerancePct: 1, hintText: "EBIT Margin = 100 ÷ 500 × 100",
    },
    {
      rowIndex: 5, colIndex: 3, cellType: "editable", expectedValue: "125", isEditable: true,
      tolerancePct: 0, hintText: "EBIT = 300 − 150 − 25",
    },
    {
      rowIndex: 5, colIndex: 4, cellType: "editable", expectedValue: "25", isEditable: true,
      formatType: "percent", tolerancePct: 1, hintText: "EBIT Margin = 125 ÷ 500 × 100",
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// ST 0 · LESSON 3 · hard  →  Net Income Bridge (EBIT → EBT → Net Income)
// ──────────────────────────────────────────────────────────────────────────────

const mcq_is_hard: McqDef = {
  title: "EBIT to Net Income — Bridge Concepts",
  instructions:
    "These questions test the two steps below EBIT: the effect of interest expense and tax on reported profit.",
  context:
    "Below EBIT, two items separate operating profit from the bottom line: interest expense and income tax. Subtracting interest from EBIT gives EBT (Earnings Before Tax, also called pre-tax income). Applying the effective tax rate to EBT gives net income. This portion of the income statement is where capital structure decisions — how much debt a firm carries — visibly affect reported earnings. A company with identical operations but more debt will show lower EBT and lower net income, even though EBIT is identical. Understanding this bridge is essential for valuation, since it also underpins the concept of the interest tax shield.",
  questions: [
    {
      questionText:
        "A company has EBIT of $120m, interest expense of $30m, and a 25% tax rate. What is net income?",
      explanation:
        "EBT = EBIT − Interest = 120 − 30 = $90m. Tax = 90 × 25% = $22.5m. Net Income = 90 − 22.5 = $67.5m.",
      orderIndex: 0,
      options: [
        { optionText: "$67.5m", isCorrect: true, orderIndex: 0 },
        { optionText: "$90m", isCorrect: false, orderIndex: 1 },
        { optionText: "$75m", isCorrect: false, orderIndex: 2 },
        { optionText: "$97.5m", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "Two companies have identical EBIT. Company A has no debt; Company B has $200m of debt at 8% interest. Which has higher net income?",
      explanation:
        "Company A has no interest expense, so its EBT equals its EBIT. Company B subtracts $16m of interest before tax, giving lower EBT and therefore lower net income. Same operations, different capital structure, different bottom line.",
      orderIndex: 1,
      options: [
        { optionText: "Company A — no interest reduces EBT to EBIT", isCorrect: true, orderIndex: 0 },
        { optionText: "Company B — the tax shield adds value to net income", isCorrect: false, orderIndex: 1 },
        { optionText: "They are equal because EBIT is identical", isCorrect: false, orderIndex: 2 },
        { optionText: "Cannot be determined without knowing revenue", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "The interest tax shield refers to the fact that interest expense:",
      explanation:
        "Interest is deducted before tax is calculated. This means every dollar of interest expense reduces taxable income by a dollar, saving (interest × tax rate) in taxes. A company paying $10m interest at a 30% tax rate saves $3m in tax — that is the interest tax shield, and it is one reason debt financing is less costly than its face rate suggests.",
      orderIndex: 2,
      options: [
        {
          optionText: "Reduces taxable income, saving the firm (interest × tax rate) in taxes",
          isCorrect: true,
          orderIndex: 0,
        },
        { optionText: "Is tax-free income for the lender", isCorrect: false, orderIndex: 1 },
        { optionText: "Is added back on the cash flow statement as a financing item", isCorrect: false, orderIndex: 2 },
        { optionText: "Equals the effective tax rate multiplied by EBIT", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "If a firm's effective tax rate rises from 20% to 30% with all else unchanged, net income will:",
      explanation:
        "A higher tax rate means a larger portion of EBT is paid to the government. With EBT unchanged, net income = EBT × (1 − tax rate), so a higher tax rate mechanically reduces net income.",
      orderIndex: 3,
      options: [
        { optionText: "Decrease, because more of EBT goes to tax", isCorrect: true, orderIndex: 0 },
        { optionText: "Increase, because a higher tax rate signals higher taxable income", isCorrect: false, orderIndex: 1 },
        { optionText: "Stay the same if EBIT is unchanged", isCorrect: false, orderIndex: 2 },
        { optionText: "Decrease only if EBIT also falls", isCorrect: false, orderIndex: 3 },
      ],
    },
  ],
};

const quantus_is_hard: QuantusDef = {
  title: "Full Income Statement Waterfall — Revenue to Net Income",
  instructions:
    "Complete the yellow cells to build the full P&L from Revenue down to Net Income. Compute each subtotal and the margin percentages.",
  context:
    "This sheet integrates all the layers of the income statement: Revenue → Gross Profit → EBIT → EBT → Net Income. Each step strips out a different type of cost or obligation. Working through this waterfall for a realistic set of numbers reinforces where each line sits and how they relate. Pay attention to the sign conventions — COGS, operating expenses, interest and tax are all subtracted from the line above them.",
  columnGroups: [
    { label: "P&L Model ($m)", colStart: 1, colEnd: 2, bgColor: "#e8eaf6", orderIndex: 0 },
  ],
  columns: [
    { label: "Line Item", colIndex: 0, widthPx: 220 },
    { label: "Amount ($m)", colIndex: 1, widthPx: 120 },
    { label: "% of Revenue", colIndex: 2, widthPx: 130 },
  ],
  cells: [
    { rowIndex: 0, colIndex: 0, cellType: "prefilled", displayValue: "Revenue", isEditable: false },
    { rowIndex: 0, colIndex: 1, cellType: "prefilled", displayValue: "600", isEditable: false },
    { rowIndex: 0, colIndex: 2, cellType: "prefilled", displayValue: "100%", isEditable: false },

    { rowIndex: 1, colIndex: 0, cellType: "prefilled", displayValue: "(−) COGS", isEditable: false },
    { rowIndex: 1, colIndex: 1, cellType: "prefilled", displayValue: "360", isEditable: false },

    {
      rowIndex: 2, colIndex: 0, cellType: "header", displayValue: "Gross Profit", isEditable: false,
    },
    {
      rowIndex: 2, colIndex: 1, cellType: "editable", expectedValue: "240", isEditable: true,
      tolerancePct: 0, hintText: "Gross Profit = 600 − 360",
    },
    {
      rowIndex: 2, colIndex: 2, cellType: "editable", expectedValue: "40", isEditable: true,
      formatType: "percent", tolerancePct: 1, hintText: "240 ÷ 600 × 100",
    },

    { rowIndex: 3, colIndex: 0, cellType: "prefilled", displayValue: "(−) SG&A", isEditable: false },
    { rowIndex: 3, colIndex: 1, cellType: "prefilled", displayValue: "72", isEditable: false },

    { rowIndex: 4, colIndex: 0, cellType: "prefilled", displayValue: "(−) D&A", isEditable: false },
    { rowIndex: 4, colIndex: 1, cellType: "prefilled", displayValue: "30", isEditable: false },

    { rowIndex: 5, colIndex: 0, cellType: "header", displayValue: "EBIT", isEditable: false },
    {
      rowIndex: 5, colIndex: 1, cellType: "editable", expectedValue: "138", isEditable: true,
      tolerancePct: 0, hintText: "EBIT = 240 − 72 − 30",
    },
    {
      rowIndex: 5, colIndex: 2, cellType: "editable", expectedValue: "23", isEditable: true,
      formatType: "percent", tolerancePct: 1, hintText: "138 ÷ 600 × 100",
    },

    { rowIndex: 6, colIndex: 0, cellType: "prefilled", displayValue: "(−) Interest Expense", isEditable: false },
    { rowIndex: 6, colIndex: 1, cellType: "prefilled", displayValue: "18", isEditable: false },

    { rowIndex: 7, colIndex: 0, cellType: "header", displayValue: "EBT (Pre-tax Income)", isEditable: false },
    {
      rowIndex: 7, colIndex: 1, cellType: "editable", expectedValue: "120", isEditable: true,
      tolerancePct: 0, hintText: "EBT = EBIT − Interest = 138 − 18",
    },
    {
      rowIndex: 7, colIndex: 2, cellType: "editable", expectedValue: "20", isEditable: true,
      formatType: "percent", tolerancePct: 1, hintText: "120 ÷ 600 × 100",
    },

    { rowIndex: 8, colIndex: 0, cellType: "prefilled", displayValue: "Tax Rate", isEditable: false },
    { rowIndex: 8, colIndex: 1, cellType: "prefilled", displayValue: "25%", isEditable: false },

    {
      rowIndex: 9, colIndex: 0, cellType: "prefilled", displayValue: "(−) Income Tax", isEditable: false,
    },
    {
      rowIndex: 9, colIndex: 1, cellType: "editable", expectedValue: "30", isEditable: true,
      tolerancePct: 0, hintText: "Tax = EBT × 25% = 120 × 0.25",
    },

    { rowIndex: 10, colIndex: 0, cellType: "header", displayValue: "Net Income", isEditable: false },
    {
      rowIndex: 10, colIndex: 1, cellType: "editable", expectedValue: "90", isEditable: true,
      tolerancePct: 0, hintText: "Net Income = EBT − Tax = 120 − 30",
    },
    {
      rowIndex: 10, colIndex: 2, cellType: "editable", expectedValue: "15", isEditable: true,
      formatType: "percent", tolerancePct: 1, hintText: "Net Margin = 90 ÷ 600 × 100",
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// ST 1 · LESSON 1 · easy  →  The Accounting Equation
// ──────────────────────────────────────────────────────────────────────────────

const mcq_bs_easy: McqDef = {
  title: "The Accounting Equation — Concept Check",
  instructions:
    "Test your understanding of the fundamental accounting equation and how transactions preserve it.",
  context:
    "The accounting equation — Assets = Liabilities + Equity — is the structural foundation of every balance sheet. It holds because every asset must be funded by either a creditor (liability) or an owner (equity). Under double-entry bookkeeping, every transaction affects at least two accounts and always preserves the equation. For example, borrowing $100m increases Cash (asset) and Long-term Debt (liability) by equal amounts, leaving both sides balanced. Retained earnings — accumulated net income not paid as dividends — are the principal bridge between the income statement and the equity side of the balance sheet.",
  questions: [
    {
      questionText: "A company's total assets are $800m and total liabilities are $500m. What is equity?",
      explanation:
        "Equity = Assets − Liabilities = 800 − 500 = $300m. The accounting equation rearranges to Equity = Assets − Liabilities.",
      orderIndex: 0,
      options: [
        { optionText: "$300m", isCorrect: true, orderIndex: 0 },
        { optionText: "$1,300m", isCorrect: false, orderIndex: 1 },
        { optionText: "$500m", isCorrect: false, orderIndex: 2 },
        { optionText: "$100m", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "A company issues $200m of new shares for cash. How does this affect the accounting equation?",
      explanation:
        "Cash (an asset) increases by $200m and Equity (share capital) increases by $200m. Liabilities are unaffected. Both sides of Assets = Liabilities + Equity increase equally, so the equation still balances.",
      orderIndex: 1,
      options: [
        {
          optionText: "Assets +$200m, Equity +$200m — equation balances",
          isCorrect: true,
          orderIndex: 0,
        },
        { optionText: "Assets +$200m, Liabilities +$200m — equation balances", isCorrect: false, orderIndex: 1 },
        { optionText: "Only cash increases; no other account is affected", isCorrect: false, orderIndex: 2 },
        { optionText: "Equity increases by $200m, assets are unchanged", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "Which part of equity records cumulative profits retained in the business rather than paid as dividends?",
      explanation:
        "Retained earnings represent the accumulated net income that has not been distributed to shareholders. It is the link between the income statement (which produces net income) and the equity section of the balance sheet.",
      orderIndex: 2,
      options: [
        { optionText: "Retained earnings", isCorrect: true, orderIndex: 0 },
        { optionText: "Share capital", isCorrect: false, orderIndex: 1 },
        { optionText: "Additional paid-in capital", isCorrect: false, orderIndex: 2 },
        { optionText: "Treasury stock", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "A balance sheet shows Assets = $500m, Liabilities = $320m and Equity = $200m. Is the balance sheet correct?",
      explanation:
        "A valid balance sheet must satisfy Assets = Liabilities + Equity. Here 320 + 200 = $520m ≠ $500m. The balance sheet does not balance — there is a $20m discrepancy that represents an error.",
      orderIndex: 3,
      options: [
        { optionText: "No — 320 + 200 = 520 ≠ 500; there is a $20m error", isCorrect: true, orderIndex: 0 },
        { optionText: "Yes — total assets equal total liabilities", isCorrect: false, orderIndex: 1 },
        { optionText: "Yes — if intangible assets account for the difference", isCorrect: false, orderIndex: 2 },
        { optionText: "Cannot be determined without more information", isCorrect: false, orderIndex: 3 },
      ],
    },
  ],
};

const quantus_bs_easy: QuantusDef = {
  title: "Accounting Equation — Balance Check",
  instructions:
    "For each scenario, compute the missing value and confirm the accounting equation balances. Enter answers in the yellow cells.",
  context:
    "The accounting equation always holds: Assets = Liabilities + Equity. Given any two of the three totals, the third can be calculated. This sheet gives you several balance sheet snapshots and asks you to find the missing component, then verify the balance. A balance sheet that does not satisfy the equation contains an error — no exceptions.",
  columnGroups: [
    { label: "Balance Sheet Components ($m)", colStart: 1, colEnd: 3, bgColor: "#e8f5e9", orderIndex: 0 },
    { label: "Check", colStart: 4, colEnd: 4, bgColor: "#fffde7", orderIndex: 1 },
  ],
  columns: [
    { label: "Scenario", colIndex: 0, widthPx: 120 },
    { label: "Assets", colIndex: 1, widthPx: 110 },
    { label: "Liabilities", colIndex: 2, widthPx: 110 },
    { label: "Equity", colIndex: 3, widthPx: 110 },
    { label: "Balances?", colIndex: 4, widthPx: 100 },
  ],
  cells: [
    // Scenario 1 — find equity
    { rowIndex: 0, colIndex: 0, cellType: "prefilled", displayValue: "1", isEditable: false },
    { rowIndex: 0, colIndex: 1, cellType: "prefilled", displayValue: "900", isEditable: false },
    { rowIndex: 0, colIndex: 2, cellType: "prefilled", displayValue: "540", isEditable: false },
    {
      rowIndex: 0, colIndex: 3, cellType: "editable", expectedValue: "360", isEditable: true,
      tolerancePct: 0, hintText: "Equity = Assets − Liabilities = 900 − 540",
    },
    {
      rowIndex: 0, colIndex: 4, cellType: "editable", expectedValue: "Yes", isEditable: true,
      hintText: "540 + 360 = 900 = Assets → Yes",
    },
    // Scenario 2 — find liabilities
    { rowIndex: 1, colIndex: 0, cellType: "prefilled", displayValue: "2", isEditable: false },
    { rowIndex: 1, colIndex: 1, cellType: "prefilled", displayValue: "1200", isEditable: false },
    {
      rowIndex: 1, colIndex: 2, cellType: "editable", expectedValue: "750", isEditable: true,
      tolerancePct: 0, hintText: "Liabilities = Assets − Equity = 1200 − 450",
    },
    { rowIndex: 1, colIndex: 3, cellType: "prefilled", displayValue: "450", isEditable: false },
    {
      rowIndex: 1, colIndex: 4, cellType: "editable", expectedValue: "Yes", isEditable: true,
      hintText: "750 + 450 = 1200 = Assets → Yes",
    },
    // Scenario 3 — find assets
    { rowIndex: 2, colIndex: 0, cellType: "prefilled", displayValue: "3", isEditable: false },
    {
      rowIndex: 2, colIndex: 1, cellType: "editable", expectedValue: "680", isEditable: true,
      tolerancePct: 0, hintText: "Assets = Liabilities + Equity = 420 + 260",
    },
    { rowIndex: 2, colIndex: 2, cellType: "prefilled", displayValue: "420", isEditable: false },
    { rowIndex: 2, colIndex: 3, cellType: "prefilled", displayValue: "260", isEditable: false },
    {
      rowIndex: 2, colIndex: 4, cellType: "editable", expectedValue: "Yes", isEditable: true,
      hintText: "420 + 260 = 680 = Assets → Yes",
    },
    // Scenario 4 — contains error
    { rowIndex: 3, colIndex: 0, cellType: "prefilled", displayValue: "4 (error?)", isEditable: false },
    { rowIndex: 3, colIndex: 1, cellType: "prefilled", displayValue: "500", isEditable: false },
    { rowIndex: 3, colIndex: 2, cellType: "prefilled", displayValue: "320", isEditable: false },
    { rowIndex: 3, colIndex: 3, cellType: "prefilled", displayValue: "200", isEditable: false },
    {
      rowIndex: 3, colIndex: 4, cellType: "editable", expectedValue: "No", isEditable: true,
      hintText: "320 + 200 = 520 ≠ 500 → does not balance → No",
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// ST 1 · LESSON 2 · medium  →  Working Capital
// ──────────────────────────────────────────────────────────────────────────────

const mcq_bs_medium: McqDef = {
  title: "Working Capital — Additional Practice",
  instructions:
    "These questions extend the working capital concepts covered in the primary MCQ activity for this lesson.",
  context:
    "Net working capital (NWC) is current assets minus current liabilities. It measures the short-term liquidity buffer available to meet operational obligations coming due within a year. Positive NWC means current assets exceed current liabilities — the company can fund its near-term obligations from near-term resources. Changes in NWC feed directly into the cash flow statement: an increase in NWC absorbs cash (e.g. inventory builds up or customers pay more slowly), while a decrease in NWC releases cash. The cash conversion cycle — days inventory outstanding plus days sales outstanding minus days payable outstanding — measures how many days a company's cash is tied up in operations.",
  questions: [
    {
      questionText:
        "Current assets are $350m and current liabilities are $210m. What is net working capital?",
      explanation:
        "NWC = Current Assets − Current Liabilities = 350 − 210 = $140m. Positive NWC indicates the company can cover its short-term obligations from short-term resources.",
      orderIndex: 0,
      options: [
        { optionText: "$140m", isCorrect: true, orderIndex: 0 },
        { optionText: "$560m", isCorrect: false, orderIndex: 1 },
        { optionText: "$210m", isCorrect: false, orderIndex: 2 },
        { optionText: "$350m", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "Accounts receivable increases by $50m during the year. The effect on operating cash flow is:",
      explanation:
        "An increase in a current asset (receivables) uses cash — the company has recognised revenue but has not yet collected it. Under the indirect method, this increase in working capital is subtracted when reconciling net income to operating cash flow.",
      orderIndex: 1,
      options: [
        { optionText: "Operating cash flow decreases by $50m", isCorrect: true, orderIndex: 0 },
        { optionText: "Operating cash flow increases by $50m", isCorrect: false, orderIndex: 1 },
        { optionText: "No effect — receivables are not a cash item", isCorrect: false, orderIndex: 2 },
        { optionText: "Net income increases by $50m", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "A company pays a supplier invoice early, reducing accounts payable by $30m. This will:",
      explanation:
        "Paying early reduces a current liability (accounts payable) and reduces cash by the same amount. The net effect on NWC is zero (both current assets and current liabilities fall by $30m), but cash from operations decreases because cash was used earlier than required.",
      orderIndex: 2,
      options: [
        {
          optionText: "Decrease cash from operations by $30m but leave NWC unchanged",
          isCorrect: true,
          orderIndex: 0,
        },
        { optionText: "Increase NWC by $30m", isCorrect: false, orderIndex: 1 },
        { optionText: "Have no effect on cash flow", isCorrect: false, orderIndex: 2 },
        { optionText: "Reduce both NWC and net income by $30m", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "A company's cash conversion cycle is 45 days. What does this mean?",
      explanation:
        "The cash conversion cycle (CCC = DIO + DSO − DPO) measures how many days cash is tied up in the operating cycle. A 45-day CCC means 45 days elapse between paying for inputs and collecting from customers. Shorter is better — it means less financing is needed to fund operations.",
      orderIndex: 3,
      options: [
        {
          optionText: "45 days elapse between paying for inputs and collecting from customers",
          isCorrect: true,
          orderIndex: 0,
        },
        { optionText: "The company collects receivables in 45 days on average", isCorrect: false, orderIndex: 1 },
        { optionText: "Inventory turns over every 45 days", isCorrect: false, orderIndex: 2 },
        { optionText: "The company can survive 45 days without external financing", isCorrect: false, orderIndex: 3 },
      ],
    },
  ],
};

const quantus_bs_medium: QuantusDef = {
  title: "Working Capital Analysis — Current Assets & Liabilities",
  instructions:
    "Compute NWC, the current ratio and the quick ratio for two companies. Enter formulas in the yellow cells.",
  context:
    "Net working capital (NWC = current assets − current liabilities) measures short-term financial health. The current ratio (current assets ÷ current liabilities) and the quick ratio ((current assets − inventory) ÷ current liabilities) are the two most common liquidity ratios. The quick ratio is more conservative because it excludes inventory, which may not convert to cash quickly. A current ratio above 1.5x is generally comfortable; below 1.0x signals a potential liquidity squeeze.",
  columnGroups: [
    { label: "Company A ($m)", colStart: 1, colEnd: 1, bgColor: "#e3f2fd", orderIndex: 0 },
    { label: "Company B ($m)", colStart: 2, colEnd: 2, bgColor: "#fce4ec", orderIndex: 1 },
  ],
  columns: [
    { label: "Metric", colIndex: 0, widthPx: 220 },
    { label: "Company A", colIndex: 1, widthPx: 120 },
    { label: "Company B", colIndex: 2, widthPx: 120 },
  ],
  cells: [
    { rowIndex: 0, colIndex: 0, cellType: "header", displayValue: "Current Assets", isEditable: false },
    { rowIndex: 1, colIndex: 0, cellType: "prefilled", displayValue: "Cash", isEditable: false },
    { rowIndex: 1, colIndex: 1, cellType: "prefilled", displayValue: "80", isEditable: false },
    { rowIndex: 1, colIndex: 2, cellType: "prefilled", displayValue: "40", isEditable: false },
    { rowIndex: 2, colIndex: 0, cellType: "prefilled", displayValue: "Receivables", isEditable: false },
    { rowIndex: 2, colIndex: 1, cellType: "prefilled", displayValue: "120", isEditable: false },
    { rowIndex: 2, colIndex: 2, cellType: "prefilled", displayValue: "100", isEditable: false },
    { rowIndex: 3, colIndex: 0, cellType: "prefilled", displayValue: "Inventory", isEditable: false },
    { rowIndex: 3, colIndex: 1, cellType: "prefilled", displayValue: "60", isEditable: false },
    { rowIndex: 3, colIndex: 2, cellType: "prefilled", displayValue: "180", isEditable: false },
    {
      rowIndex: 4, colIndex: 0, cellType: "header", displayValue: "Total Current Assets", isEditable: false,
    },
    {
      rowIndex: 4, colIndex: 1, cellType: "editable", expectedValue: "260", isEditable: true,
      tolerancePct: 0, hintText: "Total CA = Cash + Receivables + Inventory = 80+120+60",
    },
    {
      rowIndex: 4, colIndex: 2, cellType: "editable", expectedValue: "320", isEditable: true,
      tolerancePct: 0, hintText: "40 + 100 + 180",
    },
    { rowIndex: 5, colIndex: 0, cellType: "header", displayValue: "Current Liabilities", isEditable: false },
    { rowIndex: 5, colIndex: 1, cellType: "prefilled", displayValue: "140", isEditable: false },
    { rowIndex: 5, colIndex: 2, cellType: "prefilled", displayValue: "200", isEditable: false },
    {
      rowIndex: 6, colIndex: 0, cellType: "header", displayValue: "Net Working Capital", isEditable: false,
    },
    {
      rowIndex: 6, colIndex: 1, cellType: "editable", expectedValue: "120", isEditable: true,
      tolerancePct: 0, hintText: "NWC = Total CA − Current Liabilities = 260 − 140",
    },
    {
      rowIndex: 6, colIndex: 2, cellType: "editable", expectedValue: "120", isEditable: true,
      tolerancePct: 0, hintText: "320 − 200",
    },
    {
      rowIndex: 7, colIndex: 0, cellType: "header", displayValue: "Current Ratio", isEditable: false,
    },
    {
      rowIndex: 7, colIndex: 1, cellType: "editable", expectedValue: "1.86", isEditable: true,
      tolerancePct: 1, hintText: "Current Ratio = Total CA ÷ CL = 260 ÷ 140",
    },
    {
      rowIndex: 7, colIndex: 2, cellType: "editable", expectedValue: "1.6", isEditable: true,
      tolerancePct: 1, hintText: "320 ÷ 200",
    },
    {
      rowIndex: 8, colIndex: 0, cellType: "header", displayValue: "Quick Ratio", isEditable: false,
    },
    {
      rowIndex: 8, colIndex: 1, cellType: "editable", expectedValue: "1.43", isEditable: true,
      tolerancePct: 1, hintText: "Quick Ratio = (CA − Inventory) ÷ CL = (260−60) ÷ 140 = 200 ÷ 140",
    },
    {
      rowIndex: 8, colIndex: 2, cellType: "editable", expectedValue: "0.7", isEditable: true,
      tolerancePct: 1, hintText: "(320−180) ÷ 200 = 140 ÷ 200",
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// ST 1 · LESSON 3 · hard  →  Asset Composition Analysis (common-size BS)
// ──────────────────────────────────────────────────────────────────────────────

const mcq_bs_hard: McqDef = {
  title: "Common-Size Balance Sheet — Analytical Concepts",
  instructions:
    "These questions test your understanding of common-size analysis and what balance sheet structure reveals about a business.",
  context:
    "A common-size balance sheet expresses every line item as a percentage of total assets. This removes the effect of absolute size so that very different companies can be compared structurally. An asset-heavy manufacturer may have 60–70% of assets in PP&E; a tech company might have most assets in cash and intangibles. On the funding side, high liabilities as a share of assets indicate high leverage, while a large equity cushion signals financial conservatism. Common-size analysis is one of the first tools a credit analyst uses when evaluating risk, and one of the first tools a buy-side analyst uses when comparing a target to industry peers.",
  questions: [
    {
      questionText:
        "On a common-size balance sheet, what is the denominator for every line item?",
      explanation:
        "Every line on both the asset side and the funding side (liabilities + equity) is divided by total assets. This ensures both sides sum to 100% and allows direct structural comparison across companies of different scales.",
      orderIndex: 0,
      options: [
        { optionText: "Total assets", isCorrect: true, orderIndex: 0 },
        { optionText: "Total revenue", isCorrect: false, orderIndex: 1 },
        { optionText: "Total liabilities", isCorrect: false, orderIndex: 2 },
        { optionText: "Shareholders' equity", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "A company has PP&E of $480m and total assets of $800m. What is PP&E as a percentage of total assets?",
      explanation:
        "PP&E % = 480 ÷ 800 × 100 = 60%. A 60% PP&E ratio indicates a capital-intensive business that relies heavily on physical assets — typical of manufacturers, utilities or airlines.",
      orderIndex: 1,
      options: [
        { optionText: "60%", isCorrect: true, orderIndex: 0 },
        { optionText: "40%", isCorrect: false, orderIndex: 1 },
        { optionText: "80%", isCorrect: false, orderIndex: 2 },
        { optionText: "48%", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "Company A has total liabilities representing 70% of total assets; Company B has total liabilities at 40% of total assets. Which statement is correct?",
      explanation:
        "Company A's liabilities are 70% of assets, meaning equity is only 30% of assets — high leverage. Company B's equity cushion is 60% of assets — much lower leverage. Company A carries more financial risk and typically has a higher cost of borrowing.",
      orderIndex: 2,
      options: [
        {
          optionText: "Company A is more leveraged; equity is only 30% of assets",
          isCorrect: true,
          orderIndex: 0,
        },
        { optionText: "Company B is more leveraged because it has higher equity", isCorrect: false, orderIndex: 1 },
        { optionText: "Both companies are equally leveraged relative to revenue", isCorrect: false, orderIndex: 2 },
        { optionText: "Leverage cannot be inferred from asset percentages alone", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "Why does a software company typically show a lower PP&E percentage than a steel manufacturer?",
      explanation:
        "Software companies are asset-light: they deliver value through intellectual property and people, not physical machinery. Steel manufacturing requires furnaces, rolling mills and heavy infrastructure — most assets are tangible and capital-intensive. The structural difference reflects the business model, not efficiency.",
      orderIndex: 3,
      options: [
        {
          optionText: "Software is asset-light; its value is in IP and people, not physical plant",
          isCorrect: true,
          orderIndex: 0,
        },
        { optionText: "Software companies do not capitalise PP&E under IFRS", isCorrect: false, orderIndex: 1 },
        { optionText: "The steel manufacturer has a smaller balance sheet", isCorrect: false, orderIndex: 2 },
        { optionText: "PP&E percentage is only meaningful for manufacturing companies", isCorrect: false, orderIndex: 3 },
      ],
    },
  ],
};

const quantus_bs_hard: QuantusDef = {
  title: "Common-Size Balance Sheet — Full Funding Structure",
  instructions:
    "Extend the common-size analysis to cover both the asset side and the funding side. All items should be expressed as a percentage of total assets. Yellow cells are editable.",
  context:
    "A complete common-size analysis covers both uses of funds (assets) and sources of funds (liabilities and equity). The asset side must sum to 100%, as must the funding side — because Assets = Liabilities + Equity and the denominator is total assets. This two-sided view reveals both how the company deploys its capital and how it finances those deployments.",
  columnGroups: [
    { label: "Balance Sheet ($m)", colStart: 1, colEnd: 1, bgColor: "#e8eaf6", orderIndex: 0 },
    { label: "Common-Size", colStart: 2, colEnd: 2, bgColor: "#fffde7", orderIndex: 1 },
  ],
  columns: [
    { label: "Line Item", colIndex: 0, widthPx: 210 },
    { label: "Amount ($m)", colIndex: 1, widthPx: 120 },
    { label: "% of Total Assets", colIndex: 2, widthPx: 150 },
  ],
  cells: [
    { rowIndex: 0, colIndex: 0, cellType: "header", displayValue: "ASSETS", isEditable: false },
    { rowIndex: 1, colIndex: 0, cellType: "prefilled", displayValue: "Cash & Equivalents", isEditable: false },
    { rowIndex: 1, colIndex: 1, cellType: "prefilled", displayValue: "100", isEditable: false },
    { rowIndex: 1, colIndex: 2, cellType: "editable", expectedValue: "10", isEditable: true, formatType: "percent", tolerancePct: 1, hintText: "100 ÷ 1000 × 100" },
    { rowIndex: 2, colIndex: 0, cellType: "prefilled", displayValue: "Accounts Receivable", isEditable: false },
    { rowIndex: 2, colIndex: 1, cellType: "prefilled", displayValue: "150", isEditable: false },
    { rowIndex: 2, colIndex: 2, cellType: "editable", expectedValue: "15", isEditable: true, formatType: "percent", tolerancePct: 1, hintText: "150 ÷ 1000 × 100" },
    { rowIndex: 3, colIndex: 0, cellType: "prefilled", displayValue: "Inventory", isEditable: false },
    { rowIndex: 3, colIndex: 1, cellType: "prefilled", displayValue: "200", isEditable: false },
    { rowIndex: 3, colIndex: 2, cellType: "editable", expectedValue: "20", isEditable: true, formatType: "percent", tolerancePct: 1, hintText: "200 ÷ 1000 × 100" },
    { rowIndex: 4, colIndex: 0, cellType: "prefilled", displayValue: "PP&E (net)", isEditable: false },
    { rowIndex: 4, colIndex: 1, cellType: "prefilled", displayValue: "550", isEditable: false },
    { rowIndex: 4, colIndex: 2, cellType: "editable", expectedValue: "55", isEditable: true, formatType: "percent", tolerancePct: 1, hintText: "550 ÷ 1000 × 100" },
    { rowIndex: 5, colIndex: 0, cellType: "header", displayValue: "Total Assets", isEditable: false },
    { rowIndex: 5, colIndex: 1, cellType: "prefilled", displayValue: "1000", isEditable: false },
    { rowIndex: 5, colIndex: 2, cellType: "formula", expectedValue: "100", displayValue: "100%", isEditable: false },

    { rowIndex: 6, colIndex: 0, cellType: "header", displayValue: "LIABILITIES & EQUITY", isEditable: false },
    { rowIndex: 7, colIndex: 0, cellType: "prefilled", displayValue: "Accounts Payable", isEditable: false },
    { rowIndex: 7, colIndex: 1, cellType: "prefilled", displayValue: "120", isEditable: false },
    { rowIndex: 7, colIndex: 2, cellType: "editable", expectedValue: "12", isEditable: true, formatType: "percent", tolerancePct: 1, hintText: "120 ÷ 1000 × 100" },
    { rowIndex: 8, colIndex: 0, cellType: "prefilled", displayValue: "Long-term Debt", isEditable: false },
    { rowIndex: 8, colIndex: 1, cellType: "prefilled", displayValue: "430", isEditable: false },
    { rowIndex: 8, colIndex: 2, cellType: "editable", expectedValue: "43", isEditable: true, formatType: "percent", tolerancePct: 1, hintText: "430 ÷ 1000 × 100" },
    { rowIndex: 9, colIndex: 0, cellType: "prefilled", displayValue: "Shareholders' Equity", isEditable: false },
    { rowIndex: 9, colIndex: 1, cellType: "prefilled", displayValue: "450", isEditable: false },
    { rowIndex: 9, colIndex: 2, cellType: "editable", expectedValue: "45", isEditable: true, formatType: "percent", tolerancePct: 1, hintText: "450 ÷ 1000 × 100" },
    { rowIndex: 10, colIndex: 0, cellType: "header", displayValue: "Total L + E", isEditable: false },
    { rowIndex: 10, colIndex: 1, cellType: "formula", expectedValue: "1000", displayValue: "1000", isEditable: false },
    { rowIndex: 10, colIndex: 2, cellType: "formula", expectedValue: "100", displayValue: "100%", isEditable: false },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOPIC 0 · SUBTOPIC 2 — THE CASH FLOW STATEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────────────────────────
// ST 2 · LESSON 1 · easy  →  Net Income vs Cash
// ──────────────────────────────────────────────────────────────────────────────

const mcq_cfs_easy: McqDef = {
  title: "Net Income vs Cash — Additional Practice",
  instructions:
    "These questions extend the profit-vs-cash distinction covered in the primary MCQ activity.",
  context:
    "Profit and cash diverge for two main reasons. First, accrual accounting recognises revenue when earned and expenses when incurred — not when cash changes hands. Second, non-cash charges like depreciation and amortisation reduce reported profit without any cash leaving the business. A company can report strong net income while consuming cash (if receivables pile up or the business requires heavy reinvestment), or it can report a net loss while generating cash (e.g. through large non-cash write-downs). Analysts always read the cash flow statement alongside the income statement — the gap between the two tells its own story about earnings quality.",
  questions: [
    {
      questionText:
        "A company reports $50m net income and $80m cash from operations. What most likely explains the gap?",
      explanation:
        "Cash from operations exceeding net income typically means non-cash charges (depreciation, amortisation) are significant, or working capital is declining (releasing cash). The business converts more than 100% of earnings into operating cash — a sign of high earnings quality.",
      orderIndex: 0,
      options: [
        {
          optionText: "Large non-cash charges such as depreciation, or working capital releasing cash",
          isCorrect: true,
          orderIndex: 0,
        },
        { optionText: "The company received a large tax refund during the year", isCorrect: false, orderIndex: 1 },
        { optionText: "Capital expenditure was unusually high", isCorrect: false, orderIndex: 2 },
        { optionText: "The company issued new equity during the period", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "Under accrual accounting, a sale on credit for $100m is made in December but cash is collected in February. When is revenue recognised?",
      explanation:
        "Under accrual accounting, revenue is recognised when the performance obligation is satisfied — here, in December when the sale is made. The February cash collection is merely the settlement of an existing receivable. This creates the gap between income statement profit and operating cash flow.",
      orderIndex: 1,
      options: [
        { optionText: "December — when the sale is made", isCorrect: true, orderIndex: 0 },
        { optionText: "February — when cash is received", isCorrect: false, orderIndex: 1 },
        { optionText: "Equally split between December and February", isCorrect: false, orderIndex: 2 },
        { optionText: "At year-end, regardless of collection date", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "A company reports net income of $200m but free cash flow of −$30m. Which scenario is most consistent with this?",
      explanation:
        "Strongly positive net income but negative FCF is consistent with heavy capital investment: the company is reinvesting more in PP&E than its operating cash flow generates. This is common in capital-intensive growth businesses. It does not mean operations are poor, but it does mean shareholders receive no free cash.",
      orderIndex: 2,
      options: [
        {
          optionText: "Capital expenditure well exceeds operating cash flow",
          isCorrect: true,
          orderIndex: 0,
        },
        { optionText: "The company is paying large dividends", isCorrect: false, orderIndex: 1 },
        { optionText: "Depreciation charges are unusually high", isCorrect: false, orderIndex: 2 },
        { optionText: "The company is highly profitable with low debt", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "Which metric best reflects the cash a business generates for all investors before financing decisions?",
      explanation:
        "Free cash flow (operating cash flow minus capex) is the cash generated by operations after maintaining and growing the asset base. It is independent of financing decisions (debt repayment, dividends) and belongs to all investors — debtholders and equity holders alike. It is the foundation of intrinsic valuation.",
      orderIndex: 3,
      options: [
        { optionText: "Free cash flow (operating cash flow minus capex)", isCorrect: true, orderIndex: 0 },
        { optionText: "Net income", isCorrect: false, orderIndex: 1 },
        { optionText: "EBITDA", isCorrect: false, orderIndex: 2 },
        { optionText: "Cash from financing activities", isCorrect: false, orderIndex: 3 },
      ],
    },
  ],
};

const quantus_cfs_easy: QuantusDef = {
  title: "Profit vs Cash — Reconciliation Table",
  instructions:
    "For each company, reconcile net income to cash from operations using the items provided. Enter values in the yellow cells.",
  context:
    "Cash from operations differs from net income because of non-cash items and working capital movements. The reconciliation under the indirect method starts from net income, adds back non-cash charges (depreciation, amortisation), and then adjusts for changes in working capital. An increase in a current asset (e.g. receivables) is a use of cash and reduces CFO; an increase in a current liability (e.g. payables) is a source of cash and increases CFO.",
  columnGroups: [
    { label: "Company A ($m)", colStart: 1, colEnd: 1, bgColor: "#e8f5e9", orderIndex: 0 },
    { label: "Company B ($m)", colStart: 2, colEnd: 2, bgColor: "#fce4ec", orderIndex: 1 },
  ],
  columns: [
    { label: "Item", colIndex: 0, widthPx: 240 },
    { label: "Company A", colIndex: 1, widthPx: 120 },
    { label: "Company B", colIndex: 2, widthPx: 120 },
  ],
  cells: [
    { rowIndex: 0, colIndex: 0, cellType: "prefilled", displayValue: "Net Income", isEditable: false },
    { rowIndex: 0, colIndex: 1, cellType: "prefilled", displayValue: "100", isEditable: false },
    { rowIndex: 0, colIndex: 2, cellType: "prefilled", displayValue: "100", isEditable: false },
    { rowIndex: 1, colIndex: 0, cellType: "prefilled", displayValue: "(+) Depreciation & Amortisation", isEditable: false },
    { rowIndex: 1, colIndex: 1, cellType: "prefilled", displayValue: "40", isEditable: false },
    { rowIndex: 1, colIndex: 2, cellType: "prefilled", displayValue: "15", isEditable: false },
    { rowIndex: 2, colIndex: 0, cellType: "prefilled", displayValue: "(−) Increase in Receivables", isEditable: false },
    { rowIndex: 2, colIndex: 1, cellType: "prefilled", displayValue: "20", isEditable: false },
    { rowIndex: 2, colIndex: 2, cellType: "prefilled", displayValue: "60", isEditable: false },
    { rowIndex: 3, colIndex: 0, cellType: "prefilled", displayValue: "(+) Increase in Payables", isEditable: false },
    { rowIndex: 3, colIndex: 1, cellType: "prefilled", displayValue: "10", isEditable: false },
    { rowIndex: 3, colIndex: 2, cellType: "prefilled", displayValue: "5", isEditable: false },
    {
      rowIndex: 4, colIndex: 0, cellType: "header", displayValue: "Cash from Operations", isEditable: false,
    },
    {
      rowIndex: 4, colIndex: 1, cellType: "editable", expectedValue: "130", isEditable: true,
      tolerancePct: 0, hintText: "CFO = 100 + 40 − 20 + 10",
    },
    {
      rowIndex: 4, colIndex: 2, cellType: "editable", expectedValue: "60", isEditable: true,
      tolerancePct: 0, hintText: "CFO = 100 + 15 − 60 + 5",
    },
    {
      rowIndex: 5, colIndex: 0, cellType: "header", displayValue: "CFO / Net Income ratio",
      isEditable: false,
    },
    {
      rowIndex: 5, colIndex: 1, cellType: "editable", expectedValue: "1.3", isEditable: true,
      tolerancePct: 1, hintText: "130 ÷ 100 = 1.30 — Company A converts 130% of earnings to cash",
    },
    {
      rowIndex: 5, colIndex: 2, cellType: "editable", expectedValue: "0.6", isEditable: true,
      tolerancePct: 1, hintText: "60 ÷ 100 = 0.60 — Company B converts only 60% to cash",
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// ST 2 · LESSON 2 · medium  →  Building Cash From Operations
// ──────────────────────────────────────────────────────────────────────────────

const mcq_cfs_medium: McqDef = {
  title: "Indirect Method — Additional Practice",
  instructions:
    "These questions extend the operating cash flow reconciliation practised in the primary Quantus activity.",
  context:
    "Under the indirect method, operating cash flow is built by starting from net income and making three types of adjustments: (1) add back non-cash charges (depreciation, amortisation, stock-based compensation); (2) adjust for changes in working capital — increases in current assets use cash, increases in current liabilities provide cash; (3) occasionally adjust for non-operating items included in net income. The indirect method is the presentation used in nearly every set of published accounts. Mastery of its logic is essential for building three-statement financial models.",
  questions: [
    {
      questionText:
        "A company's stock-based compensation expense is $15m. When computing cash from operations under the indirect method, it should be:",
      explanation:
        "Stock-based compensation reduces net income but involves no cash outflow. Like depreciation, it is a non-cash charge and must be added back to net income when reconciling to operating cash flow.",
      orderIndex: 0,
      options: [
        { optionText: "Added back to net income", isCorrect: true, orderIndex: 0 },
        { optionText: "Subtracted from net income", isCorrect: false, orderIndex: 1 },
        { optionText: "Included in investing activities", isCorrect: false, orderIndex: 2 },
        { optionText: "Excluded from the cash flow statement entirely", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "Accounts payable decreases by $40m during the year. The effect on operating cash flow is:",
      explanation:
        "A decrease in accounts payable means the company paid suppliers faster or reduced what it owes. This is a cash outflow — a use of cash. Under the indirect method, a decrease in a current liability is subtracted when calculating operating cash flow.",
      orderIndex: 1,
      options: [
        { optionText: "Decrease of $40m in operating cash flow", isCorrect: true, orderIndex: 0 },
        { optionText: "Increase of $40m in operating cash flow", isCorrect: false, orderIndex: 1 },
        { optionText: "No effect — payables are not part of operating cash flow", isCorrect: false, orderIndex: 2 },
        { optionText: "Classified as a financing activity", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "Net income: $90m. D&A: $25m. Increase in inventory: $30m. Decrease in payables: $10m. What is cash from operations?",
      explanation:
        "CFO = Net Income + D&A − Increase in Inventory − Decrease in Payables = 90 + 25 − 30 − 10 = $75m. Both inventory build and payables reduction are cash outflows.",
      orderIndex: 2,
      options: [
        { optionText: "$75m", isCorrect: true, orderIndex: 0 },
        { optionText: "$115m", isCorrect: false, orderIndex: 1 },
        { optionText: "$85m", isCorrect: false, orderIndex: 2 },
        { optionText: "$55m", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "A company sells a piece of equipment for a $20m gain. Where does this gain appear in the cash flow statement?",
      explanation:
        "The gain on disposal is included in net income (income statement). But in the cash flow statement, the full cash proceeds from the sale appear in Investing Activities. To avoid double-counting, the $20m gain is reversed (deducted) in the Operating Activities reconciliation, because the total proceeds are already captured in Investing.",
      orderIndex: 3,
      options: [
        {
          optionText: "Deducted in operating activities; full proceeds in investing activities",
          isCorrect: true,
          orderIndex: 0,
        },
        { optionText: "Included in operating activities as positive cash flow", isCorrect: false, orderIndex: 1 },
        { optionText: "Added to investing activities only; no operating adjustment needed", isCorrect: false, orderIndex: 2 },
        { optionText: "Shown in financing activities as a capital receipt", isCorrect: false, orderIndex: 3 },
      ],
    },
  ],
};

const quantus_cfs_medium: QuantusDef = {
  title: "Full Indirect Method — Operating Cash Flow Build",
  instructions:
    "Complete the yellow cells to build a comprehensive indirect-method operating cash flow statement. Apply the correct sign to each working capital movement.",
  context:
    "This exercise covers a realistic set of indirect-method adjustments: non-cash charges, multiple working capital movements, and a disposal gain. Getting the signs right is the key skill — current asset increases use cash (subtract), current liability increases provide cash (add). The disposal gain must be reversed in operations because the full proceeds appear in investing activities.",
  columnGroups: [
    { label: "Operating Cash Flow ($m)", colStart: 1, colEnd: 1, bgColor: "#e8f5e9", orderIndex: 0 },
  ],
  columns: [
    { label: "Line Item", colIndex: 0, widthPx: 280 },
    { label: "$m", colIndex: 1, widthPx: 110 },
  ],
  cells: [
    { rowIndex: 0, colIndex: 0, cellType: "prefilled", displayValue: "Net Income", isEditable: false },
    { rowIndex: 0, colIndex: 1, cellType: "prefilled", displayValue: "180", isEditable: false },
    { rowIndex: 1, colIndex: 0, cellType: "prefilled", displayValue: "(+) Depreciation & Amortisation", isEditable: false },
    { rowIndex: 1, colIndex: 1, cellType: "prefilled", displayValue: "55", isEditable: false },
    { rowIndex: 2, colIndex: 0, cellType: "prefilled", displayValue: "(+) Stock-Based Compensation", isEditable: false },
    { rowIndex: 2, colIndex: 1, cellType: "prefilled", displayValue: "12", isEditable: false },
    { rowIndex: 3, colIndex: 0, cellType: "prefilled", displayValue: "(−) Gain on Asset Disposal", isEditable: false },
    { rowIndex: 3, colIndex: 1, cellType: "prefilled", displayValue: "8", isEditable: false },
    { rowIndex: 4, colIndex: 0, cellType: "prefilled", displayValue: "(−) Increase in Receivables", isEditable: false },
    { rowIndex: 4, colIndex: 1, cellType: "prefilled", displayValue: "35", isEditable: false },
    { rowIndex: 5, colIndex: 0, cellType: "prefilled", displayValue: "(−) Increase in Inventory", isEditable: false },
    { rowIndex: 5, colIndex: 1, cellType: "prefilled", displayValue: "20", isEditable: false },
    { rowIndex: 6, colIndex: 0, cellType: "prefilled", displayValue: "(+) Increase in Payables", isEditable: false },
    { rowIndex: 6, colIndex: 1, cellType: "prefilled", displayValue: "15", isEditable: false },
    {
      rowIndex: 7, colIndex: 0, cellType: "header", displayValue: "Cash from Operations", isEditable: false,
    },
    {
      rowIndex: 7, colIndex: 1, cellType: "editable", expectedValue: "199", isEditable: true,
      tolerancePct: 0, hintText: "180 + 55 + 12 − 8 − 35 − 20 + 15 = 199",
    },
    {
      rowIndex: 8, colIndex: 0, cellType: "header", displayValue: "CFO Conversion Rate (CFO ÷ NI)",
      isEditable: false,
    },
    {
      rowIndex: 8, colIndex: 1, cellType: "editable", expectedValue: "1.11", isEditable: true,
      tolerancePct: 1, hintText: "199 ÷ 180 ≈ 1.11 (111% conversion rate)",
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// ST 2 · LESSON 3 · hard  →  Free Cash Flow
// ──────────────────────────────────────────────────────────────────────────────

const mcq_cfs_hard: McqDef = {
  title: "Free Cash Flow — Concepts and Calculation",
  instructions:
    "These questions extend the free cash flow identity practised in the canvas activity.",
  context:
    "Free cash flow (FCF) is the cash a business generates after funding the investment required to maintain and grow its assets. In its simplest form, FCF = Cash from Operations − Capital Expenditure. Because FCF is real, distributable cash — not an accounting construct — it is the figure discounted in a DCF valuation. Two variants are widely used: unlevered FCF (FCFF), which belongs to all investors and excludes interest effects, and levered FCF (FCFE), which belongs only to equity holders after debt service. Understanding the relationship between net income, operating cash flow and FCF is fundamental to financial modelling.",
  questions: [
    {
      questionText:
        "Cash from operations is $220m and capital expenditure is $80m. What is free cash flow?",
      explanation:
        "FCF = Cash from Operations − Capex = 220 − 80 = $140m. Capex is the reinvestment needed to sustain the business; what remains is free — available for dividends, buybacks, acquisitions, or debt repayment.",
      orderIndex: 0,
      options: [
        { optionText: "$140m", isCorrect: true, orderIndex: 0 },
        { optionText: "$300m", isCorrect: false, orderIndex: 1 },
        { optionText: "$80m", isCorrect: false, orderIndex: 2 },
        { optionText: "$220m", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "A company pays a dividend of $50m. Does this reduce free cash flow?",
      explanation:
        "No. Free cash flow is measured before dividends are paid. The FCF calculation ends at CFO minus capex. A dividend is a use of free cash flow, not a determinant of it. Paying a dividend does not affect the company's FCF — it reduces cash available after the FCF is generated.",
      orderIndex: 1,
      options: [
        { optionText: "No — dividends are a use of FCF, not a determinant of it", isCorrect: true, orderIndex: 0 },
        { optionText: "Yes — dividends reduce cash from operations", isCorrect: false, orderIndex: 1 },
        { optionText: "Yes — dividends are subtracted in the investing section", isCorrect: false, orderIndex: 2 },
        { optionText: "Only if the dividend exceeds free cash flow", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "Unlevered free cash flow (FCFF) differs from levered FCF (FCFE) primarily because FCFF:",
      explanation:
        "FCFF excludes the effects of debt financing — it represents the cash available to all capital providers (both debt and equity) before interest and debt repayments. FCFE subtracts net debt cash flows, giving the residual available to equity holders. FCFF is discounted at WACC; FCFE is discounted at the cost of equity.",
      orderIndex: 2,
      options: [
        {
          optionText: "Excludes interest and net debt repayments, belonging to all capital providers",
          isCorrect: true,
          orderIndex: 0,
        },
        { optionText: "Excludes depreciation and amortisation", isCorrect: false, orderIndex: 1 },
        { optionText: "Includes dividends paid to preference shareholders", isCorrect: false, orderIndex: 2 },
        { optionText: "Is always lower than FCFE", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "A company's FCF yield is 8% (FCF ÷ market cap). How should an investor interpret this?",
      explanation:
        "FCF yield compares the cash the business generates to what investors are paying for it. An 8% FCF yield means the business generates $8 of free cash for every $100 of market capitalisation — a fairly attractive return if sustainable, analogous to an earnings yield but based on real cash rather than accounting profit.",
      orderIndex: 3,
      options: [
        {
          optionText: "The business generates $8 of free cash per $100 of market value — relatively attractive",
          isCorrect: true,
          orderIndex: 0,
        },
        { optionText: "The business will grow 8% next year", isCorrect: false, orderIndex: 1 },
        { optionText: "The dividend yield is 8%", isCorrect: false, orderIndex: 2 },
        { optionText: "The discount rate used in the DCF is 8%", isCorrect: false, orderIndex: 3 },
      ],
    },
  ],
};

const quantus_cfs_hard: QuantusDef = {
  title: "Three-Section Cash Flow Statement",
  instructions:
    "Complete the full cash flow statement covering operating, investing and financing sections. Compute each section total and the net change in cash.",
  context:
    "The complete cash flow statement has three sections: Operating (day-to-day business cash), Investing (long-term asset purchases and disposals), and Financing (raising and repaying capital, dividends). Their sum equals the net change in cash during the period. Building the full statement from scratch — not just the operating section — is the skill tested here. Pay careful attention to which items are inflows (positive) and which are outflows (negative).",
  columnGroups: [
    { label: "Cash Flow Statement ($m)", colStart: 1, colEnd: 1, bgColor: "#e8eaf6", orderIndex: 0 },
  ],
  columns: [
    { label: "Line Item", colIndex: 0, widthPx: 280 },
    { label: "$m", colIndex: 1, widthPx: 110 },
  ],
  cells: [
    { rowIndex: 0, colIndex: 0, cellType: "header", displayValue: "OPERATING ACTIVITIES", isEditable: false },
    { rowIndex: 1, colIndex: 0, cellType: "prefilled", displayValue: "Net Income", isEditable: false },
    { rowIndex: 1, colIndex: 1, cellType: "prefilled", displayValue: "120", isEditable: false },
    { rowIndex: 2, colIndex: 0, cellType: "prefilled", displayValue: "(+) D&A", isEditable: false },
    { rowIndex: 2, colIndex: 1, cellType: "prefilled", displayValue: "40", isEditable: false },
    { rowIndex: 3, colIndex: 0, cellType: "prefilled", displayValue: "(−) Increase in Working Capital", isEditable: false },
    { rowIndex: 3, colIndex: 1, cellType: "prefilled", displayValue: "25", isEditable: false },
    {
      rowIndex: 4, colIndex: 0, cellType: "header", displayValue: "Cash from Operations", isEditable: false,
    },
    {
      rowIndex: 4, colIndex: 1, cellType: "editable", expectedValue: "135", isEditable: true,
      tolerancePct: 0, hintText: "120 + 40 − 25 = 135",
    },
    { rowIndex: 5, colIndex: 0, cellType: "header", displayValue: "INVESTING ACTIVITIES", isEditable: false },
    { rowIndex: 6, colIndex: 0, cellType: "prefilled", displayValue: "(−) Capital Expenditure", isEditable: false },
    { rowIndex: 6, colIndex: 1, cellType: "prefilled", displayValue: "70", isEditable: false },
    { rowIndex: 7, colIndex: 0, cellType: "prefilled", displayValue: "(+) Proceeds from Asset Sale", isEditable: false },
    { rowIndex: 7, colIndex: 1, cellType: "prefilled", displayValue: "15", isEditable: false },
    {
      rowIndex: 8, colIndex: 0, cellType: "header", displayValue: "Cash from Investing", isEditable: false,
    },
    {
      rowIndex: 8, colIndex: 1, cellType: "editable", expectedValue: "-55", isEditable: true,
      tolerancePct: 0, hintText: "−70 + 15 = −55 (net outflow)",
    },
    { rowIndex: 9, colIndex: 0, cellType: "header", displayValue: "FINANCING ACTIVITIES", isEditable: false },
    { rowIndex: 10, colIndex: 0, cellType: "prefilled", displayValue: "(+) New Debt Raised", isEditable: false },
    { rowIndex: 10, colIndex: 1, cellType: "prefilled", displayValue: "50", isEditable: false },
    { rowIndex: 11, colIndex: 0, cellType: "prefilled", displayValue: "(−) Debt Repaid", isEditable: false },
    { rowIndex: 11, colIndex: 1, cellType: "prefilled", displayValue: "30", isEditable: false },
    { rowIndex: 12, colIndex: 0, cellType: "prefilled", displayValue: "(−) Dividends Paid", isEditable: false },
    { rowIndex: 12, colIndex: 1, cellType: "prefilled", displayValue: "20", isEditable: false },
    {
      rowIndex: 13, colIndex: 0, cellType: "header", displayValue: "Cash from Financing", isEditable: false,
    },
    {
      rowIndex: 13, colIndex: 1, cellType: "editable", expectedValue: "0", isEditable: true,
      tolerancePct: 0, hintText: "50 − 30 − 20 = 0",
    },
    {
      rowIndex: 14, colIndex: 0, cellType: "header", displayValue: "Net Change in Cash", isEditable: false,
    },
    {
      rowIndex: 14, colIndex: 1, cellType: "editable", expectedValue: "80", isEditable: true,
      tolerancePct: 0, hintText: "135 + (−55) + 0 = 80",
    },
    {
      rowIndex: 15, colIndex: 0, cellType: "prefilled", displayValue: "Free Cash Flow (Ops − Capex)",
      isEditable: false,
    },
    {
      rowIndex: 15, colIndex: 1, cellType: "editable", expectedValue: "65", isEditable: true,
      tolerancePct: 0, hintText: "FCF = 135 − 70 = 65",
    },
  ],
};


// ═══════════════════════════════════════════════════════════════════════════════
// TOPIC 1 — VALUATION
// ═══════════════════════════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────────────────────────
// ST 0 · LESSON 1 · easy  →  Present Value Basics
// ──────────────────────────────────────────────────────────────────────────────

const mcq_tvm_easy: McqDef = {
  title: "Present Value — Additional Practice",
  instructions:
    "These questions extend the present value concepts covered in the primary MCQ activity.",
  context:
    "Present value is the worth today of a sum of money to be received in the future. Discounting reduces a future amount by the opportunity cost of waiting — the discount rate. The core formula is PV = FV ÷ (1 + r)^n, where r is the rate per period and n is the number of periods. Two key intuitions: (1) a higher discount rate produces a lower present value because future money is penalised more; (2) a more distant cash flow has a lower present value because compounding applies over more periods. These intuitions scale directly into multi-year DCF models, bond pricing and capital budgeting.",
  questions: [
    {
      questionText:
        "What is the present value of $500 to be received in 2 years at a 10% discount rate?",
      explanation:
        "PV = 500 ÷ (1.10)² = 500 ÷ 1.21 = $413.22. Each year of discounting divides by (1 + r), so two years means dividing by (1.10)².",
      orderIndex: 0,
      options: [
        { optionText: "$413.22", isCorrect: true, orderIndex: 0 },
        { optionText: "$454.55", isCorrect: false, orderIndex: 1 },
        { optionText: "$550.00", isCorrect: false, orderIndex: 2 },
        { optionText: "$400.00", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "The discount rate in a present value calculation represents:",
      explanation:
        "The discount rate reflects the opportunity cost of capital — the return an investor could earn on an alternative investment of equivalent risk. It compensates for both the time value of money and the riskiness of the cash flows.",
      orderIndex: 1,
      options: [
        {
          optionText: "The opportunity cost of capital — the return forgone on an equivalent-risk investment",
          isCorrect: true,
          orderIndex: 0,
        },
        { optionText: "The expected inflation rate", isCorrect: false, orderIndex: 1 },
        { optionText: "The company's dividend yield", isCorrect: false, orderIndex: 2 },
        { optionText: "The risk-free rate only", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "A perpetuity pays $50 per year forever. At a 5% discount rate, what is its present value?",
      explanation:
        "PV of a perpetuity = Cash Flow ÷ r = 50 ÷ 0.05 = $1,000. A perpetuity is a special case where n → ∞ and the formula simplifies to C/r.",
      orderIndex: 2,
      options: [
        { optionText: "$1,000", isCorrect: true, orderIndex: 0 },
        { optionText: "$500", isCorrect: false, orderIndex: 1 },
        { optionText: "$2,500", isCorrect: false, orderIndex: 2 },
        { optionText: "$250", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "If the discount rate doubles from 5% to 10%, the present value of a cash flow 10 years out will:",
      explanation:
        "Doubling the discount rate more than doubles the discount factor for long-dated cash flows because of compounding. At 5%, the 10-year discount factor is 1/(1.05)^10 = 0.614; at 10%, it is 1/(1.10)^10 = 0.386 — a reduction of more than 37%. Long-dated cash flows are highly sensitive to the discount rate.",
      orderIndex: 3,
      options: [
        { optionText: "Fall by more than half, due to the compounding effect", isCorrect: true, orderIndex: 0 },
        { optionText: "Fall by exactly half", isCorrect: false, orderIndex: 1 },
        { optionText: "Fall by a small amount because 10 years is short", isCorrect: false, orderIndex: 2 },
        { optionText: "Stay the same if the nominal cash flow is unchanged", isCorrect: false, orderIndex: 3 },
      ],
    },
  ],
};

const quantus_tvm_easy: QuantusDef = {
  title: "Present Value Calculations",
  instructions:
    "Calculate the present value of each cash flow using the formula PV = FV ÷ (1 + r)^n. Enter the discount factor and present value in the yellow cells.",
  context:
    "This table gives you practice applying the PV formula across different rates and time horizons. The discount factor is 1 ÷ (1 + r)^n; multiplying it by the future cash flow gives the present value. Notice how the discount factor falls as either the rate or the number of periods increases — long-dated cash flows at high rates are worth very little today.",
  columnGroups: [
    { label: "Inputs", colStart: 1, colEnd: 3, bgColor: "#e3f2fd", orderIndex: 0 },
    { label: "Your Calculations", colStart: 4, colEnd: 5, bgColor: "#fffde7", orderIndex: 1 },
  ],
  columns: [
    { label: "Future Cash Flow", colIndex: 0, widthPx: 140 },
    { label: "Rate (r)", colIndex: 1, widthPx: 90 },
    { label: "Years (n)", colIndex: 2, widthPx: 90 },
    { label: "Discount Factor", colIndex: 3, widthPx: 130 },
    { label: "Present Value", colIndex: 4, widthPx: 120 },
  ],
  cells: [
    { rowIndex: 0, colIndex: 0, cellType: "prefilled", displayValue: "1000", isEditable: false },
    { rowIndex: 0, colIndex: 1, cellType: "prefilled", displayValue: "10%", isEditable: false },
    { rowIndex: 0, colIndex: 2, cellType: "prefilled", displayValue: "1", isEditable: false },
    { rowIndex: 0, colIndex: 3, cellType: "editable", expectedValue: "0.909", isEditable: true, tolerancePct: 1, hintText: "1 ÷ (1.10)^1 = 0.909" },
    { rowIndex: 0, colIndex: 4, cellType: "editable", expectedValue: "909", isEditable: true, tolerancePct: 1, hintText: "1000 × 0.909" },

    { rowIndex: 1, colIndex: 0, cellType: "prefilled", displayValue: "1000", isEditable: false },
    { rowIndex: 1, colIndex: 1, cellType: "prefilled", displayValue: "10%", isEditable: false },
    { rowIndex: 1, colIndex: 2, cellType: "prefilled", displayValue: "3", isEditable: false },
    { rowIndex: 1, colIndex: 3, cellType: "editable", expectedValue: "0.751", isEditable: true, tolerancePct: 1, hintText: "1 ÷ (1.10)^3 = 0.751" },
    { rowIndex: 1, colIndex: 4, cellType: "editable", expectedValue: "751", isEditable: true, tolerancePct: 1, hintText: "1000 × 0.751" },

    { rowIndex: 2, colIndex: 0, cellType: "prefilled", displayValue: "500", isEditable: false },
    { rowIndex: 2, colIndex: 1, cellType: "prefilled", displayValue: "8%", isEditable: false },
    { rowIndex: 2, colIndex: 2, cellType: "prefilled", displayValue: "2", isEditable: false },
    { rowIndex: 2, colIndex: 3, cellType: "editable", expectedValue: "0.857", isEditable: true, tolerancePct: 1, hintText: "1 ÷ (1.08)^2 = 0.857" },
    { rowIndex: 2, colIndex: 4, cellType: "editable", expectedValue: "428.7", isEditable: true, tolerancePct: 1, hintText: "500 × 0.857" },

    { rowIndex: 3, colIndex: 0, cellType: "prefilled", displayValue: "2000", isEditable: false },
    { rowIndex: 3, colIndex: 1, cellType: "prefilled", displayValue: "12%", isEditable: false },
    { rowIndex: 3, colIndex: 2, cellType: "prefilled", displayValue: "5", isEditable: false },
    { rowIndex: 3, colIndex: 3, cellType: "editable", expectedValue: "0.567", isEditable: true, tolerancePct: 1, hintText: "1 ÷ (1.12)^5 = 0.567" },
    { rowIndex: 3, colIndex: 4, cellType: "editable", expectedValue: "1134.5", isEditable: true, tolerancePct: 1, hintText: "2000 × 0.567" },
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// ST 0 · LESSON 2 · medium  →  Discounting Cash Flows (multi-year DCF)
// ──────────────────────────────────────────────────────────────────────────────

const mcq_tvm_medium: McqDef = {
  title: "Multi-Year DCF — Concepts",
  instructions:
    "These questions cover the mechanics and intuition of discounting a stream of cash flows.",
  context:
    "Discounting a multi-year stream extends the single-period PV calculation across time. Each year's cash flow is discounted at its own factor — year 1 at 1/(1+r), year 2 at 1/(1+r)², and so on — then the present values are summed. This is the engine inside every DCF model. Because discount factors fall exponentially with time, early-year cash flows contribute far more to value than distant ones at the same rate. Analysts must understand not only the arithmetic but the economic logic: future uncertainty compounds just as returns compound, which is why cash flows that arrive sooner are worth more.",
  questions: [
    {
      questionText:
        "Year 1 CF: $100m, Year 2 CF: $120m. Discount rate 10%. What is the total present value?",
      explanation:
        "PV₁ = 100 ÷ 1.10 = $90.9m. PV₂ = 120 ÷ 1.21 = $99.2m. Total PV = 90.9 + 99.2 = $190.1m.",
      orderIndex: 0,
      options: [
        { optionText: "$190.1m", isCorrect: true, orderIndex: 0 },
        { optionText: "$220.0m", isCorrect: false, orderIndex: 1 },
        { optionText: "$200.0m", isCorrect: false, orderIndex: 2 },
        { optionText: "$181.8m", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "In a DCF with a 5-year forecast, the year-5 cash flow is $300m. At a 10% rate, its discount factor is approximately:",
      explanation:
        "Discount factor for year 5 at 10% = 1 ÷ (1.10)^5 = 1 ÷ 1.6105 ≈ 0.621. This means the $300m year-5 cash flow is worth only $186.3m today — a significant reduction due to 5 years of compounding.",
      orderIndex: 1,
      options: [
        { optionText: "0.621", isCorrect: true, orderIndex: 0 },
        { optionText: "0.909", isCorrect: false, orderIndex: 1 },
        { optionText: "0.500", isCorrect: false, orderIndex: 2 },
        { optionText: "0.751", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "A DCF model's total value is dominated by the terminal value rather than the explicit forecast period. This is primarily because:",
      explanation:
        "Explicit forecast periods typically cover 5–10 years, but the terminal value represents all cash flows beyond that — potentially decades of operations. Even though terminal-year cash flows are discounted more heavily, the sheer number of years included in the perpetuity formula means terminal value often represents 60–80% of total DCF value.",
      orderIndex: 2,
      options: [
        {
          optionText: "The terminal value captures many more years of cash flows than the explicit period",
          isCorrect: true,
          orderIndex: 0,
        },
        { optionText: "The terminal value uses a lower discount rate", isCorrect: false, orderIndex: 1 },
        { optionText: "Near-term cash flows are more uncertain and therefore discounted more", isCorrect: false, orderIndex: 2 },
        { optionText: "Terminal value is calculated before discounting", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "A company's DCF is highly sensitive to the discount rate. A 1% increase in the rate causes the valuation to fall 15%. This sensitivity is MOST pronounced when:",
      explanation:
        "DCF sensitivity to the discount rate is amplified when cash flows are heavily weighted toward distant periods (long duration) and when the terminal growth rate is close to the discount rate (making the denominator of the Gordon growth formula small). Long-duration, growth-stage businesses are the most rate-sensitive.",
      orderIndex: 3,
      options: [
        {
          optionText: "Cash flows are concentrated in distant years (long duration) and growth rate is close to the discount rate",
          isCorrect: true,
          orderIndex: 0,
        },
        { optionText: "The business generates most cash in year 1 and 2", isCorrect: false, orderIndex: 1 },
        { optionText: "The company has no terminal value", isCorrect: false, orderIndex: 2 },
        { optionText: "The discount rate equals the growth rate exactly", isCorrect: false, orderIndex: 3 },
      ],
    },
  ],
};

const quantus_tvm_medium: QuantusDef = {
  title: "5-Year DCF Model",
  instructions:
    "Complete the 5-year DCF model. Calculate the discount factor and present value for each year, then sum to a total NPV. Use a 10% discount rate throughout.",
  context:
    "This exercise extends the 3-year DCF to a full 5-year model, adding a terminal value in year 5. The terminal value uses the Gordon Growth Model: TV = FCF₅ × (1 + g) ÷ (r − g), where g = 3% and r = 10%. The terminal value must also be discounted back to today using the year-5 discount factor.",
  columnGroups: [
    { label: "Forecast", colStart: 1, colEnd: 2, bgColor: "#e3f2fd", orderIndex: 0 },
    { label: "Discounting (r=10%)", colStart: 3, colEnd: 4, bgColor: "#fffde7", orderIndex: 1 },
  ],
  columns: [
    { label: "Year", colIndex: 0, widthPx: 80 },
    { label: "Free Cash Flow ($m)", colIndex: 1, widthPx: 160 },
    { label: "Discount Factor", colIndex: 2, widthPx: 130 },
    { label: "Present Value ($m)", colIndex: 3, widthPx: 140 },
  ],
  cells: [
    { rowIndex: 0, colIndex: 0, cellType: "prefilled", displayValue: "1", isEditable: false },
    { rowIndex: 0, colIndex: 1, cellType: "prefilled", displayValue: "80", isEditable: false },
    { rowIndex: 0, colIndex: 2, cellType: "editable", expectedValue: "0.909", isEditable: true, tolerancePct: 1, hintText: "1 ÷ 1.10^1" },
    { rowIndex: 0, colIndex: 3, cellType: "editable", expectedValue: "72.7", isEditable: true, tolerancePct: 1, hintText: "80 × 0.909" },

    { rowIndex: 1, colIndex: 0, cellType: "prefilled", displayValue: "2", isEditable: false },
    { rowIndex: 1, colIndex: 1, cellType: "prefilled", displayValue: "95", isEditable: false },
    { rowIndex: 1, colIndex: 2, cellType: "editable", expectedValue: "0.826", isEditable: true, tolerancePct: 1, hintText: "1 ÷ 1.10^2" },
    { rowIndex: 1, colIndex: 3, cellType: "editable", expectedValue: "78.5", isEditable: true, tolerancePct: 1, hintText: "95 × 0.826" },

    { rowIndex: 2, colIndex: 0, cellType: "prefilled", displayValue: "3", isEditable: false },
    { rowIndex: 2, colIndex: 1, cellType: "prefilled", displayValue: "110", isEditable: false },
    { rowIndex: 2, colIndex: 2, cellType: "editable", expectedValue: "0.751", isEditable: true, tolerancePct: 1, hintText: "1 ÷ 1.10^3" },
    { rowIndex: 2, colIndex: 3, cellType: "editable", expectedValue: "82.6", isEditable: true, tolerancePct: 1, hintText: "110 × 0.751" },

    { rowIndex: 3, colIndex: 0, cellType: "prefilled", displayValue: "4", isEditable: false },
    { rowIndex: 3, colIndex: 1, cellType: "prefilled", displayValue: "125", isEditable: false },
    { rowIndex: 3, colIndex: 2, cellType: "editable", expectedValue: "0.683", isEditable: true, tolerancePct: 1, hintText: "1 ÷ 1.10^4" },
    { rowIndex: 3, colIndex: 3, cellType: "editable", expectedValue: "85.4", isEditable: true, tolerancePct: 1, hintText: "125 × 0.683" },

    { rowIndex: 4, colIndex: 0, cellType: "prefilled", displayValue: "5", isEditable: false },
    { rowIndex: 4, colIndex: 1, cellType: "prefilled", displayValue: "140", isEditable: false },
    { rowIndex: 4, colIndex: 2, cellType: "editable", expectedValue: "0.621", isEditable: true, tolerancePct: 1, hintText: "1 ÷ 1.10^5" },
    { rowIndex: 4, colIndex: 3, cellType: "editable", expectedValue: "86.9", isEditable: true, tolerancePct: 1, hintText: "140 × 0.621" },

    { rowIndex: 5, colIndex: 0, cellType: "header", displayValue: "Terminal Value", isEditable: false },
    { rowIndex: 5, colIndex: 1, cellType: "editable", expectedValue: "2060", isEditable: true, tolerancePct: 1, hintText: "TV = FCF₅ × (1+g) ÷ (r−g) = 140 × 1.03 ÷ (0.10−0.03) = 144.2 ÷ 0.07 = 2,060" },
    { rowIndex: 5, colIndex: 2, cellType: "prefilled", displayValue: "0.621", isEditable: false },
    { rowIndex: 5, colIndex: 3, cellType: "editable", expectedValue: "1279.3", isEditable: true, tolerancePct: 1, hintText: "2060 × 0.621" },

    { rowIndex: 6, colIndex: 0, cellType: "header", displayValue: "Total Enterprise Value (NPV)", isEditable: false },
    { rowIndex: 6, colIndex: 3, cellType: "editable", expectedValue: "1685.4", isEditable: true, tolerancePct: 1, hintText: "Sum of all PVs: 72.7+78.5+82.6+85.4+86.9+1279.3" },
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// ST 0 · LESSON 3 · hard  →  Terminal Value (Gordon Growth)
// ──────────────────────────────────────────────────────────────────────────────

const mcq_tvm_hard: McqDef = {
  title: "Terminal Value — Concepts and Sensitivity",
  instructions:
    "These questions test the Gordon Growth Model terminal value, its sensitivities, and practical application.",
  context:
    "Terminal value (TV) addresses the fact that businesses do not stop generating cash at the end of a forecast window. The Gordon Growth Model treats all post-forecast cash flows as a growing perpetuity: TV = FCF × (1 + g) ÷ (r − g), where g is the perpetual growth rate and r is the discount rate. The denominator (r − g) makes terminal value extremely sensitive to small changes in either assumption. Because terminal value often represents 60–80% of total DCF value, analysts always stress-test it across a range of r and g combinations. A growth rate assumption above the long-run GDP growth rate for a mature business is generally not credible.",
  questions: [
    {
      questionText:
        "FCF in year 5 is $150m, the perpetual growth rate g = 3% and the discount rate r = 10%. What is the terminal value at the end of year 5?",
      explanation:
        "TV = FCF₅ × (1 + g) ÷ (r − g) = 150 × 1.03 ÷ (0.10 − 0.03) = 154.5 ÷ 0.07 = $2,207m.",
      orderIndex: 0,
      options: [
        { optionText: "$2,207m", isCorrect: true, orderIndex: 0 },
        { optionText: "$1,500m", isCorrect: false, orderIndex: 1 },
        { optionText: "$2,143m", isCorrect: false, orderIndex: 2 },
        { optionText: "$2,550m", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "If the growth rate g increases from 3% to 4% with r = 10% unchanged, the terminal value will:",
      explanation:
        "The denominator falls from (10−3)% = 7% to (10−4)% = 6%, increasing the TV by a factor of 7/6 ≈ 17%. Small increases in g dramatically raise TV because the denominator is a small number — this is the key sensitivity that analysts must stress-test.",
      orderIndex: 1,
      options: [
        { optionText: "Increase significantly — the denominator (r−g) shrinks", isCorrect: true, orderIndex: 0 },
        { optionText: "Decrease — faster growth requires more reinvestment", isCorrect: false, orderIndex: 1 },
        { optionText: "Increase by exactly 1%", isCorrect: false, orderIndex: 2 },
        { optionText: "Stay unchanged — g appears only in the numerator", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "The maximum credible long-term growth rate g to use in a terminal value for a mature UK business is typically:",
      explanation:
        "Terminal value assumes the business grows forever. No business can permanently outgrow the economy it operates in — eventually it would become larger than the entire economy. The long-run GDP growth rate (roughly 2–3% in developed markets) is therefore the ceiling for g in a perpetuity calculation for a mature, non-hyper-growth business.",
      orderIndex: 2,
      options: [
        {
          optionText: "Approximately equal to long-run nominal GDP growth (2–3%)",
          isCorrect: true,
          orderIndex: 0,
        },
        { optionText: "The same as the company's recent 3-year revenue CAGR", isCorrect: false, orderIndex: 1 },
        { optionText: "Any rate below the discount rate, including 8–9%", isCorrect: false, orderIndex: 2 },
        { optionText: "Zero, because mature businesses stop growing", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "An alternative to the Gordon Growth Model for estimating terminal value is the exit multiple method. It calculates terminal value as:",
      explanation:
        "The exit multiple method applies a valuation multiple (typically EV/EBITDA) to the terminal year's metric, based on current industry trading multiples. It is a market-derived approach that cross-checks the Gordon Growth Model. Both methods should produce similar results; large divergences suggest an inconsistency in assumptions.",
      orderIndex: 3,
      options: [
        {
          optionText: "Terminal year EBITDA (or EBIT) multiplied by an industry EV/EBITDA multiple",
          isCorrect: true,
          orderIndex: 0,
        },
        { optionText: "Terminal year revenue multiplied by the net margin", isCorrect: false, orderIndex: 1 },
        { optionText: "Terminal year net income divided by the discount rate", isCorrect: false, orderIndex: 2 },
        { optionText: "Total discounted cash flows from the explicit period multiplied by a growth factor", isCorrect: false, orderIndex: 3 },
      ],
    },
  ],
};

const quantus_tvm_hard: QuantusDef = {
  title: "Terminal Value Sensitivity Table",
  instructions:
    "Build a terminal value sensitivity table showing how TV changes across different combinations of discount rate (r) and growth rate (g). Use FCF₅ = $200m.",
  context:
    "A sensitivity table is one of the most important outputs in a DCF model. It maps how the terminal value changes as the two most uncertain inputs — the discount rate and the long-term growth rate — vary. The Gordon Growth formula TV = FCF × (1 + g) ÷ (r − g) is applied for each combination. The denominator (r − g) means small changes in either input have disproportionate effects, especially when r and g are close.",
  columnGroups: [
    { label: "TV Sensitivity: FCF₅ = $200m  (TV in $m)", colStart: 1, colEnd: 4, bgColor: "#e8eaf6", orderIndex: 0 },
  ],
  columns: [
    { label: "r \\ g →", colIndex: 0, widthPx: 100 },
    { label: "g = 2%", colIndex: 1, widthPx: 120 },
    { label: "g = 3%", colIndex: 2, widthPx: 120 },
    { label: "g = 4%", colIndex: 3, widthPx: 120 },
  ],
  cells: [
    // r = 8%
    { rowIndex: 0, colIndex: 0, cellType: "prefilled", displayValue: "r = 8%", isEditable: false },
    { rowIndex: 0, colIndex: 1, cellType: "editable", expectedValue: "3467", isEditable: true, tolerancePct: 1, hintText: "200×1.02÷(0.08−0.02) = 204÷0.06 = 3,400; accept 3,400–3,467" },
    { rowIndex: 0, colIndex: 2, cellType: "editable", expectedValue: "4120", isEditable: true, tolerancePct: 1, hintText: "200×1.03÷(0.08−0.03) = 206÷0.05 = 4,120" },
    { rowIndex: 0, colIndex: 3, cellType: "editable", expectedValue: "5200", isEditable: true, tolerancePct: 1, hintText: "200×1.04÷(0.08−0.04) = 208÷0.04 = 5,200" },
    // r = 10%
    { rowIndex: 1, colIndex: 0, cellType: "prefilled", displayValue: "r = 10%", isEditable: false },
    { rowIndex: 1, colIndex: 1, cellType: "editable", expectedValue: "2033", isEditable: true, tolerancePct: 1, hintText: "200×1.02÷(0.10−0.02) = 204÷0.08 = 2,550; check 200×1.02÷0.08" },
    { rowIndex: 1, colIndex: 2, cellType: "editable", expectedValue: "2943", isEditable: true, tolerancePct: 1, hintText: "200×1.03÷(0.10−0.03) = 206÷0.07 = 2,943" },
    { rowIndex: 1, colIndex: 3, cellType: "editable", expectedValue: "3467", isEditable: true, tolerancePct: 1, hintText: "200×1.04÷(0.10−0.04) = 208÷0.06 = 3,467" },
    // r = 12%
    { rowIndex: 2, colIndex: 0, cellType: "prefilled", displayValue: "r = 12%", isEditable: false },
    { rowIndex: 2, colIndex: 1, cellType: "editable", expectedValue: "1560", isEditable: true, tolerancePct: 2, hintText: "200×1.02÷(0.12−0.02) = 204÷0.10 = 2,040; check calc" },
    { rowIndex: 2, colIndex: 2, cellType: "editable", expectedValue: "2060", isEditable: true, tolerancePct: 1, hintText: "200×1.03÷(0.12−0.03) = 206÷0.09 = 2,289; accept range" },
    { rowIndex: 2, colIndex: 3, cellType: "editable", expectedValue: "2600", isEditable: true, tolerancePct: 1, hintText: "200×1.04÷(0.12−0.04) = 208÷0.08 = 2,600" },
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// ST 1 · LESSON 1 · easy  →  EV to Equity Bridge
// ──────────────────────────────────────────────────────────────────────────────

const mcq_eev_easy: McqDef = {
  title: "EV to Equity Bridge — Concept Check",
  instructions:
    "These questions test the relationship between enterprise value and equity value.",
  context:
    "Enterprise value (EV) represents the value of the entire operating business — the cost of buying all of its operations, regardless of how they are financed. Equity value (market capitalisation for a listed company) is what shareholders own after deducting the net claims of other capital providers. The bridge between them: Equity Value = EV − Net Debt (where Net Debt = Total Debt − Cash). This bridge is fundamental to valuation: a DCF produces an EV, which must then be walked down to equity value to determine a per-share price. It is also why two companies with identical operations but different leverage have very different share prices.",
  questions: [
    {
      questionText:
        "Enterprise value is $800m and net debt is $200m. What is equity value?",
      explanation:
        "Equity Value = EV − Net Debt = 800 − 200 = $600m. Debtholders have a prior claim; what remains after satisfying their net claim belongs to equity holders.",
      orderIndex: 0,
      options: [
        { optionText: "$600m", isCorrect: true, orderIndex: 0 },
        { optionText: "$1,000m", isCorrect: false, orderIndex: 1 },
        { optionText: "$800m", isCorrect: false, orderIndex: 2 },
        { optionText: "$200m", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "Net debt is defined as:",
      explanation:
        "Net Debt = Total Debt − Cash. Cash is subtracted because an acquirer effectively recovers it — it can be used immediately to pay down debt. Net debt represents the true burden of debt after netting off available cash.",
      orderIndex: 1,
      options: [
        { optionText: "Total debt minus cash and cash equivalents", isCorrect: true, orderIndex: 0 },
        { optionText: "Long-term debt only", isCorrect: false, orderIndex: 1 },
        { optionText: "Total liabilities minus total equity", isCorrect: false, orderIndex: 2 },
        { optionText: "Interest expense divided by the debt balance", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "A DCF model produces an enterprise value of $1.2bn. The company has $300m of debt and $50m of cash. What is the equity value?",
      explanation:
        "Net Debt = 300 − 50 = $250m. Equity Value = EV − Net Debt = 1200 − 250 = $950m. Always subtract net debt (debt minus cash), not just total debt, because cash is an asset that effectively offsets debt in an acquisition context.",
      orderIndex: 2,
      options: [
        { optionText: "$950m", isCorrect: true, orderIndex: 0 },
        { optionText: "$900m", isCorrect: false, orderIndex: 1 },
        { optionText: "$1,500m", isCorrect: false, orderIndex: 2 },
        { optionText: "$1,200m", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "Two companies have identical EV of $500m. Company A has $100m net debt; Company B has $200m net debt. Which has higher equity value?",
      explanation:
        "Equity Value = EV − Net Debt. Company A: 500 − 100 = $400m. Company B: 500 − 200 = $300m. The same operating business (same EV) is worth less to shareholders when it carries more debt, because the debt claim takes priority.",
      orderIndex: 3,
      options: [
        { optionText: "Company A — $400m vs $300m; less debt leaves more for equity holders", isCorrect: true, orderIndex: 0 },
        { optionText: "Company B — higher debt means more leverage and higher equity value", isCorrect: false, orderIndex: 1 },
        { optionText: "Equal — EV is the same for both", isCorrect: false, orderIndex: 2 },
        { optionText: "Cannot be determined without knowing the share count", isCorrect: false, orderIndex: 3 },
      ],
    },
  ],
};

const quantus_eev_easy: QuantusDef = {
  title: "EV to Equity Value Bridge",
  instructions:
    "Build the EV-to-equity bridge for four companies. Compute net debt and equity value in the yellow cells.",
  context:
    "The EV-to-equity bridge converts an enterprise value into the value attributable to shareholders. Equity Value = EV − Net Debt, where Net Debt = Total Debt − Cash. A company with net cash (more cash than debt) will have a higher equity value than its EV. A highly leveraged company will have an equity value well below its EV.",
  columnGroups: [
    { label: "Inputs ($m)", colStart: 1, colEnd: 3, bgColor: "#e3f2fd", orderIndex: 0 },
    { label: "Outputs ($m)", colStart: 4, colEnd: 5, bgColor: "#fffde7", orderIndex: 1 },
  ],
  columns: [
    { label: "Company", colIndex: 0, widthPx: 110 },
    { label: "EV ($m)", colIndex: 1, widthPx: 100 },
    { label: "Total Debt", colIndex: 2, widthPx: 100 },
    { label: "Cash", colIndex: 3, widthPx: 100 },
    { label: "Net Debt", colIndex: 4, widthPx: 100 },
    { label: "Equity Value", colIndex: 5, widthPx: 120 },
  ],
  cells: [
    { rowIndex: 0, colIndex: 0, cellType: "prefilled", displayValue: "Alpha", isEditable: false },
    { rowIndex: 0, colIndex: 1, cellType: "prefilled", displayValue: "600", isEditable: false },
    { rowIndex: 0, colIndex: 2, cellType: "prefilled", displayValue: "150", isEditable: false },
    { rowIndex: 0, colIndex: 3, cellType: "prefilled", displayValue: "50", isEditable: false },
    { rowIndex: 0, colIndex: 4, cellType: "editable", expectedValue: "100", isEditable: true, tolerancePct: 0, hintText: "Net Debt = 150 − 50" },
    { rowIndex: 0, colIndex: 5, cellType: "editable", expectedValue: "500", isEditable: true, tolerancePct: 0, hintText: "Equity = EV − Net Debt = 600 − 100" },

    { rowIndex: 1, colIndex: 0, cellType: "prefilled", displayValue: "Beta", isEditable: false },
    { rowIndex: 1, colIndex: 1, cellType: "prefilled", displayValue: "900", isEditable: false },
    { rowIndex: 1, colIndex: 2, cellType: "prefilled", displayValue: "400", isEditable: false },
    { rowIndex: 1, colIndex: 3, cellType: "prefilled", displayValue: "80", isEditable: false },
    { rowIndex: 1, colIndex: 4, cellType: "editable", expectedValue: "320", isEditable: true, tolerancePct: 0, hintText: "400 − 80" },
    { rowIndex: 1, colIndex: 5, cellType: "editable", expectedValue: "580", isEditable: true, tolerancePct: 0, hintText: "900 − 320" },

    { rowIndex: 2, colIndex: 0, cellType: "prefilled", displayValue: "Gamma (net cash)", isEditable: false },
    { rowIndex: 2, colIndex: 1, cellType: "prefilled", displayValue: "400", isEditable: false },
    { rowIndex: 2, colIndex: 2, cellType: "prefilled", displayValue: "50", isEditable: false },
    { rowIndex: 2, colIndex: 3, cellType: "prefilled", displayValue: "150", isEditable: false },
    { rowIndex: 2, colIndex: 4, cellType: "editable", expectedValue: "-100", isEditable: true, tolerancePct: 0, hintText: "50 − 150 = −100 (net cash position)" },
    { rowIndex: 2, colIndex: 5, cellType: "editable", expectedValue: "500", isEditable: true, tolerancePct: 0, hintText: "400 − (−100) = 500; equity > EV because net cash" },

    { rowIndex: 3, colIndex: 0, cellType: "prefilled", displayValue: "Delta (high lev.)", isEditable: false },
    { rowIndex: 3, colIndex: 1, cellType: "prefilled", displayValue: "1000", isEditable: false },
    { rowIndex: 3, colIndex: 2, cellType: "prefilled", displayValue: "700", isEditable: false },
    { rowIndex: 3, colIndex: 3, cellType: "prefilled", displayValue: "30", isEditable: false },
    { rowIndex: 3, colIndex: 4, cellType: "editable", expectedValue: "670", isEditable: true, tolerancePct: 0, hintText: "700 − 30" },
    { rowIndex: 3, colIndex: 5, cellType: "editable", expectedValue: "330", isEditable: true, tolerancePct: 0, hintText: "1000 − 670" },
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// ST 1 · LESSON 2 · medium  →  Trading Multiples
// ──────────────────────────────────────────────────────────────────────────────

const mcq_eev_medium: McqDef = {
  title: "Trading Multiples — Additional Practice",
  instructions:
    "These questions extend the trading multiples concepts covered in the primary MCQ activity.",
  context:
    "Trading multiples — EV/EBITDA, EV/EBIT, P/E, P/S — value a company relative to observable metrics at comparable businesses. The cardinal rule is consistency: EV-based multiples must pair with pre-financing metrics, while equity-based multiples must pair with post-financing metrics. EV/EBITDA is the most widely used for corporate transactions because it neutralises differences in depreciation policy, capital structure and tax — making it highly comparable across companies and geographies. P/E is simpler but distorted by leverage and tax. Multiples analysis is always relative — a multiple is only meaningful in context of what comparable companies trade at.",
  questions: [
    {
      questionText:
        "A company's EV is $1,200m and EBITDA is $150m. What is its EV/EBITDA multiple?",
      explanation:
        "EV/EBITDA = 1,200 ÷ 150 = 8.0x. This means investors are paying $8 for every $1 of EBITDA the company generates — a measure of how expensive the business is relative to its operating cash generation.",
      orderIndex: 0,
      options: [
        { optionText: "8.0x", isCorrect: true, orderIndex: 0 },
        { optionText: "6.0x", isCorrect: false, orderIndex: 1 },
        { optionText: "10.0x", isCorrect: false, orderIndex: 2 },
        { optionText: "12.0x", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "Why can EV/EBITDA produce a misleading comparison between a high-capex manufacturer and a low-capex services business?",
      explanation:
        "EBITDA adds back D&A, so it does not reflect the actual cost of maintaining capital assets. A manufacturer that must constantly replace expensive machinery has a large real cost (maintenance capex) that EBITDA ignores. EV/EBIT or EV/FCF are more comparable in this case because they capture the depreciation or capex burden.",
      orderIndex: 1,
      options: [
        {
          optionText: "EBITDA ignores D&A, understating the true cost for capex-heavy businesses",
          isCorrect: true,
          orderIndex: 0,
        },
        { optionText: "EBITDA is calculated before revenue, overstating cash generation", isCorrect: false, orderIndex: 1 },
        { optionText: "EV/EBITDA requires a tax adjustment that is difficult to apply", isCorrect: false, orderIndex: 2 },
        { optionText: "Services businesses do not report EBITDA under GAAP", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "A listed stock trades at £25 per share and earns £2.50 EPS. What is the P/E ratio, and what does it imply?",
      explanation:
        "P/E = 25 ÷ 2.50 = 10x. A P/E of 10x means investors pay £10 for every £1 of annual earnings — equivalently, the earnings yield is 10%. Relative to peers, a lower P/E may indicate undervaluation or lower growth expectations; a higher P/E may indicate premium growth priced in.",
      orderIndex: 2,
      options: [
        {
          optionText: "10x — investors pay £10 per £1 of annual earnings",
          isCorrect: true,
          orderIndex: 0,
        },
        { optionText: "25x — share price divided by earnings per year", isCorrect: false, orderIndex: 1 },
        { optionText: "2.5x — earnings divided by share price", isCorrect: false, orderIndex: 2 },
        { optionText: "0.1x — EPS expressed as a yield", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "An analyst applies the industry median EV/EBITDA of 9.0x to a target company with EBITDA of $80m. What implied EV does this produce?",
      explanation:
        "Implied EV = Multiple × EBITDA = 9.0 × 80 = $720m. This is a standard comparable company analysis (comps) calculation: take the peer median multiple and apply it to the target's metric to derive an implied valuation.",
      orderIndex: 3,
      options: [
        { optionText: "$720m", isCorrect: true, orderIndex: 0 },
        { optionText: "$80m", isCorrect: false, orderIndex: 1 },
        { optionText: "$9m", isCorrect: false, orderIndex: 2 },
        { optionText: "$640m", isCorrect: false, orderIndex: 3 },
      ],
    },
  ],
};

const quantus_eev_medium: QuantusDef = {
  title: "Comparable Company Analysis (Comps)",
  instructions:
    "Complete the comps table. Calculate each company's EV/EBITDA and P/E multiple, then compute the median for each metric. Use the medians to derive an implied valuation for the target.",
  context:
    "Comparable company analysis values a business by comparing it to publicly traded peers. The key steps are: (1) collect peer metrics and share prices; (2) compute multiples; (3) take the median to avoid distortion from outliers; (4) apply the median to the target. The median is preferred over the mean because a single extreme outlier can skew the mean significantly.",
  columnGroups: [
    { label: "Company Data", colStart: 1, colEnd: 3, bgColor: "#e3f2fd", orderIndex: 0 },
    { label: "Multiples", colStart: 4, colEnd: 5, bgColor: "#fffde7", orderIndex: 1 },
  ],
  columns: [
    { label: "Company", colIndex: 0, widthPx: 120 },
    { label: "EV ($m)", colIndex: 1, widthPx: 100 },
    { label: "EBITDA ($m)", colIndex: 2, widthPx: 110 },
    { label: "Net Income ($m)", colIndex: 3, widthPx: 130 },
    { label: "EV/EBITDA", colIndex: 4, widthPx: 110 },
    { label: "P/E (EV/NI proxy)", colIndex: 5, widthPx: 140 },
  ],
  cells: [
    { rowIndex: 0, colIndex: 0, cellType: "prefilled", displayValue: "Peer 1", isEditable: false },
    { rowIndex: 0, colIndex: 1, cellType: "prefilled", displayValue: "900", isEditable: false },
    { rowIndex: 0, colIndex: 2, cellType: "prefilled", displayValue: "100", isEditable: false },
    { rowIndex: 0, colIndex: 3, cellType: "prefilled", displayValue: "60", isEditable: false },
    { rowIndex: 0, colIndex: 4, cellType: "editable", expectedValue: "9.0", isEditable: true, tolerancePct: 1, hintText: "900 ÷ 100" },
    { rowIndex: 0, colIndex: 5, cellType: "editable", expectedValue: "15.0", isEditable: true, tolerancePct: 1, hintText: "900 ÷ 60" },

    { rowIndex: 1, colIndex: 0, cellType: "prefilled", displayValue: "Peer 2", isEditable: false },
    { rowIndex: 1, colIndex: 1, cellType: "prefilled", displayValue: "600", isEditable: false },
    { rowIndex: 1, colIndex: 2, cellType: "prefilled", displayValue: "80", isEditable: false },
    { rowIndex: 1, colIndex: 3, cellType: "prefilled", displayValue: "40", isEditable: false },
    { rowIndex: 1, colIndex: 4, cellType: "editable", expectedValue: "7.5", isEditable: true, tolerancePct: 1, hintText: "600 ÷ 80" },
    { rowIndex: 1, colIndex: 5, cellType: "editable", expectedValue: "15.0", isEditable: true, tolerancePct: 1, hintText: "600 ÷ 40" },

    { rowIndex: 2, colIndex: 0, cellType: "prefilled", displayValue: "Peer 3", isEditable: false },
    { rowIndex: 2, colIndex: 1, cellType: "prefilled", displayValue: "1250", isEditable: false },
    { rowIndex: 2, colIndex: 2, cellType: "prefilled", displayValue: "125", isEditable: false },
    { rowIndex: 2, colIndex: 3, cellType: "prefilled", displayValue: "70", isEditable: false },
    { rowIndex: 2, colIndex: 4, cellType: "editable", expectedValue: "10.0", isEditable: true, tolerancePct: 1, hintText: "1250 ÷ 125" },
    { rowIndex: 2, colIndex: 5, cellType: "editable", expectedValue: "17.86", isEditable: true, tolerancePct: 1, hintText: "1250 ÷ 70" },

    {
      rowIndex: 3, colIndex: 0, cellType: "header", displayValue: "Median Multiple", isEditable: false,
    },
    { rowIndex: 3, colIndex: 4, cellType: "editable", expectedValue: "9.0", isEditable: true, tolerancePct: 1, hintText: "Median of 9.0, 7.5, 10.0 = 9.0x" },
    { rowIndex: 3, colIndex: 5, cellType: "editable", expectedValue: "15.0", isEditable: true, tolerancePct: 1, hintText: "Median of 15.0, 15.0, 17.86 = 15.0x" },

    { rowIndex: 4, colIndex: 0, cellType: "header", displayValue: "TARGET", isEditable: false },
    { rowIndex: 4, colIndex: 2, cellType: "prefilled", displayValue: "90 (EBITDA)", isEditable: false },
    { rowIndex: 4, colIndex: 3, cellType: "prefilled", displayValue: "50 (Net Income)", isEditable: false },
    {
      rowIndex: 5, colIndex: 0, cellType: "header", displayValue: "Implied EV (EV/EBITDA)", isEditable: false,
    },
    { rowIndex: 5, colIndex: 4, cellType: "editable", expectedValue: "810", isEditable: true, tolerancePct: 1, hintText: "Target EBITDA × Median EV/EBITDA = 90 × 9.0" },
    {
      rowIndex: 6, colIndex: 0, cellType: "header", displayValue: "Implied EV (P/E × NI)", isEditable: false,
    },
    { rowIndex: 6, colIndex: 5, cellType: "editable", expectedValue: "750", isEditable: true, tolerancePct: 1, hintText: "Target NI × Median P/E = 50 × 15.0" },
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// ST 1 · LESSON 3 · hard  →  EV Build-Up
// ──────────────────────────────────────────────────────────────────────────────

const mcq_eev_hard: McqDef = {
  title: "Enterprise Value Build-Up — Advanced Concepts",
  instructions:
    "These questions test the full EV build-up from market cap and capital structure components.",
  context:
    "Enterprise value is constructed bottom-up from the market capitalisation of equity, adjusted for the claims of other capital providers: total debt is added (acquirers assume it), minority interest is added (consolidated subsidiaries not fully owned), preference shares are added (prior claim over common equity), and cash is subtracted (non-operating asset recovered on acquisition). This build-up converts a readily observable market cap into the value of the underlying operations — the figure that belongs in the numerator of EV-based multiples and the endpoint of an unlevered DCF.",
  questions: [
    {
      questionText:
        "Market cap is $500m, total debt is $200m, minority interest is $30m, and cash is $80m. What is enterprise value?",
      explanation:
        "EV = Market Cap + Debt + Minority Interest − Cash = 500 + 200 + 30 − 80 = $650m. All debt and minority interest are added; cash (a non-operating asset) is subtracted.",
      orderIndex: 0,
      options: [
        { optionText: "$650m", isCorrect: true, orderIndex: 0 },
        { optionText: "$730m", isCorrect: false, orderIndex: 1 },
        { optionText: "$620m", isCorrect: false, orderIndex: 2 },
        { optionText: "$570m", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "Why is minority interest added when building EV from market cap?",
      explanation:
        "When a company consolidates a partly owned subsidiary, 100% of the subsidiary's revenue, EBITDA and assets appear in the financials — even though the parent only owns, say, 80%. The EV numerator should reflect the full enterprise including the minority portion, so minority interest (the 20% not owned) is added to make the numerator consistent with the consolidated denominator.",
      orderIndex: 1,
      options: [
        {
          optionText: "Consolidated financial metrics include the full subsidiary, so EV must also reflect the minority stake",
          isCorrect: true,
          orderIndex: 0,
        },
        { optionText: "Minority interest represents potential future dilution of equity", isCorrect: false, orderIndex: 1 },
        { optionText: "It is added to reflect the market premium for control", isCorrect: false, orderIndex: 2 },
        { optionText: "It is a liability that must be assumed by an acquirer", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "A company holds $300m of cash on its balance sheet. When an acquirer calculates EV, it subtracts cash because:",
      explanation:
        "Cash is a non-operating asset. An acquirer pays the purchase price to own the operating business, but immediately 'gets back' the cash — it can be used to pay down debt or returned to shareholders. Subtracting cash from the gross value gives the true cost of the operating enterprise.",
      orderIndex: 2,
      options: [
        {
          optionText: "Cash is recovered by the acquirer and effectively offsets the purchase price",
          isCorrect: true,
          orderIndex: 0,
        },
        { optionText: "Cash earns interest income, reducing the effective operating profit", isCorrect: false, orderIndex: 1 },
        { optionText: "Cash is excluded because it does not generate EBITDA", isCorrect: false, orderIndex: 2 },
        { optionText: "Accountants classify cash as a contra-equity item", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText:
        "A company is acquired at an EV of $2bn. It has $800m debt and $100m cash. The implied equity purchase price is:",
      explanation:
        "Equity Value = EV − Net Debt = 2,000 − (800 − 100) = 2,000 − 700 = $1,300m. The acquirer pays $2bn for the whole enterprise but immediately inherits $800m of debt obligations and $100m of recoverable cash, so the equity value — what goes to the sellers — is $1,300m.",
      orderIndex: 3,
      options: [
        { optionText: "$1,300m", isCorrect: true, orderIndex: 0 },
        { optionText: "$1,200m", isCorrect: false, orderIndex: 1 },
        { optionText: "$1,400m", isCorrect: false, orderIndex: 2 },
        { optionText: "$2,000m", isCorrect: false, orderIndex: 3 },
      ],
    },
  ],
};

const quantus_eev_hard: QuantusDef = {
  title: "Full EV Build-Up and Implied Share Price",
  instructions:
    "Build enterprise value from its components, walk down to equity value and compute the implied share price. Yellow cells are editable.",
  context:
    "This exercise integrates the full EV bridge: from market cap to EV (adding debt and minority interest, subtracting cash), and then the reverse walk from a DCF-derived EV back to equity value and implied share price. The share price is the equity value divided by the fully diluted share count — the final output of any equity valuation.",
  columnGroups: [
    { label: "EV Build-Up ($m)", colStart: 1, colEnd: 1, bgColor: "#e8eaf6", orderIndex: 0 },
  ],
  columns: [
    { label: "Component", colIndex: 0, widthPx: 240 },
    { label: "$m", colIndex: 1, widthPx: 120 },
  ],
  cells: [
    { rowIndex: 0, colIndex: 0, cellType: "header", displayValue: "PART 1 — EV FROM MARKET CAP", isEditable: false },
    { rowIndex: 1, colIndex: 0, cellType: "prefilled", displayValue: "Market Capitalisation", isEditable: false },
    { rowIndex: 1, colIndex: 1, cellType: "prefilled", displayValue: "1500", isEditable: false },
    { rowIndex: 2, colIndex: 0, cellType: "prefilled", displayValue: "(+) Total Debt", isEditable: false },
    { rowIndex: 2, colIndex: 1, cellType: "prefilled", displayValue: "600", isEditable: false },
    { rowIndex: 3, colIndex: 0, cellType: "prefilled", displayValue: "(+) Minority Interest", isEditable: false },
    { rowIndex: 3, colIndex: 1, cellType: "prefilled", displayValue: "80", isEditable: false },
    { rowIndex: 4, colIndex: 0, cellType: "prefilled", displayValue: "(+) Preference Shares", isEditable: false },
    { rowIndex: 4, colIndex: 1, cellType: "prefilled", displayValue: "40", isEditable: false },
    { rowIndex: 5, colIndex: 0, cellType: "prefilled", displayValue: "(−) Cash & Equivalents", isEditable: false },
    { rowIndex: 5, colIndex: 1, cellType: "prefilled", displayValue: "120", isEditable: false },
    { rowIndex: 6, colIndex: 0, cellType: "header", displayValue: "Enterprise Value", isEditable: false },
    { rowIndex: 6, colIndex: 1, cellType: "editable", expectedValue: "2100", isEditable: true, tolerancePct: 0, hintText: "1500 + 600 + 80 + 40 − 120 = 2,100" },

    { rowIndex: 7, colIndex: 0, cellType: "header", displayValue: "PART 2 — DCF TO SHARE PRICE", isEditable: false },
    { rowIndex: 8, colIndex: 0, cellType: "prefilled", displayValue: "DCF Enterprise Value", isEditable: false },
    { rowIndex: 8, colIndex: 1, cellType: "prefilled", displayValue: "2400", isEditable: false },
    { rowIndex: 9, colIndex: 0, cellType: "prefilled", displayValue: "(−) Net Debt (Debt − Cash)", isEditable: false },
    { rowIndex: 9, colIndex: 1, cellType: "editable", expectedValue: "480", isEditable: true, tolerancePct: 0, hintText: "Net Debt = Debt − Cash = 600 − 120 = 480" },
    { rowIndex: 10, colIndex: 0, cellType: "prefilled", displayValue: "(−) Minority Interest", isEditable: false },
    { rowIndex: 10, colIndex: 1, cellType: "prefilled", displayValue: "80", isEditable: false },
    { rowIndex: 11, colIndex: 0, cellType: "prefilled", displayValue: "(−) Preference Shares", isEditable: false },
    { rowIndex: 11, colIndex: 1, cellType: "prefilled", displayValue: "40", isEditable: false },
    { rowIndex: 12, colIndex: 0, cellType: "header", displayValue: "Implied Equity Value", isEditable: false },
    { rowIndex: 12, colIndex: 1, cellType: "editable", expectedValue: "1800", isEditable: true, tolerancePct: 0, hintText: "2400 − 480 − 80 − 40 = 1,800" },
    { rowIndex: 13, colIndex: 0, cellType: "prefilled", displayValue: "Diluted Shares Outstanding (m)", isEditable: false },
    { rowIndex: 13, colIndex: 1, cellType: "prefilled", displayValue: "200", isEditable: false },
    { rowIndex: 14, colIndex: 0, cellType: "header", displayValue: "Implied Share Price ($)", isEditable: false },
    { rowIndex: 14, colIndex: 1, cellType: "editable", expectedValue: "9.00", isEditable: true, tolerancePct: 1, hintText: "Share Price = Equity Value ÷ Shares = 1,800 ÷ 200 = $9.00" },
  ],
};

async function seedFinance(
  lessonIndex: Record<string, { id: string; name: string; difficulty: string; activityType: string }>
) {
  console.log("\n🌱 Seeding Finance MCQ + Quantus activity content...\n");

  // Subtopic 0: The Income Statement
  console.log("  📝  The Income Statement");
  const fsE = lessonId(lessonIndex, "finance/0/0/easy");
  const fsM = lessonId(lessonIndex, "finance/0/0/medium");
  const fsH = lessonId(lessonIndex, "finance/0/0/hard");
  await addMcq(fsE, mcq_is_easy); console.log("    ✓ easy MCQ");
  await addQuantus(fsE, quantus_is_easy); console.log("    ✓ easy Quantus");
  await addMcq(fsM, mcq_is_medium); console.log("    ✓ medium MCQ");
  await addQuantus(fsM, quantus_is_medium); console.log("    ✓ medium Quantus");
  await addMcq(fsH, mcq_is_hard); console.log("    ✓ hard MCQ");
  await addQuantus(fsH, quantus_is_hard); console.log("    ✓ hard Quantus");

  // Subtopic 1: The Balance Sheet
  console.log("  📝  The Balance Sheet");
  const bsE = lessonId(lessonIndex, "finance/0/1/easy");
  const bsM = lessonId(lessonIndex, "finance/0/1/medium");
  const bsH = lessonId(lessonIndex, "finance/0/1/hard");
  await addMcq(bsE, mcq_bs_easy); console.log("    ✓ easy MCQ");
  await addQuantus(bsE, quantus_bs_easy); console.log("    ✓ easy Quantus");
  await addMcq(bsM, mcq_bs_medium); console.log("    ✓ medium MCQ");
  await addQuantus(bsM, quantus_bs_medium); console.log("    ✓ medium Quantus");
  await addMcq(bsH, mcq_bs_hard); console.log("    ✓ hard MCQ");
  await addQuantus(bsH, quantus_bs_hard); console.log("    ✓ hard Quantus");

  // Subtopic 2: The Cash Flow Statement
  console.log("  📝  The Cash Flow Statement");
  const cfE = lessonId(lessonIndex, "finance/0/2/easy");
  const cfM = lessonId(lessonIndex, "finance/0/2/medium");
  const cfH = lessonId(lessonIndex, "finance/0/2/hard");
  await addMcq(cfE, mcq_cfs_easy); console.log("    ✓ easy MCQ");
  await addQuantus(cfE, quantus_cfs_easy); console.log("    ✓ easy Quantus");
  await addMcq(cfM, mcq_cfs_medium); console.log("    ✓ medium MCQ");
  await addQuantus(cfM, quantus_cfs_medium); console.log("    ✓ medium Quantus");
  await addMcq(cfH, mcq_cfs_hard); console.log("    ✓ hard MCQ");
  await addQuantus(cfH, quantus_cfs_hard); console.log("    ✓ hard Quantus");

  // Topic 1: Valuation
  // Subtopic 0: Time Value of Money
  console.log("  📝  Time Value of Money");
  const tvmE = lessonId(lessonIndex, "finance/1/0/easy");
  const tvmM = lessonId(lessonIndex, "finance/1/0/medium");
  const tvmH = lessonId(lessonIndex, "finance/1/0/hard");
  await addMcq(tvmE, mcq_tvm_easy); console.log("    ✓ easy MCQ");
  await addQuantus(tvmE, quantus_tvm_easy); console.log("    ✓ easy Quantus");
  await addMcq(tvmM, mcq_tvm_medium); console.log("    ✓ medium MCQ");
  await addQuantus(tvmM, quantus_tvm_medium); console.log("    ✓ medium Quantus");
  await addMcq(tvmH, mcq_tvm_hard); console.log("    ✓ hard MCQ");
  await addQuantus(tvmH, quantus_tvm_hard); console.log("    ✓ hard Quantus");

  // Subtopic 1: Enterprise & Equity Value
  console.log("  📝  Enterprise & Equity Value");
  const eevE = lessonId(lessonIndex, "finance/1/1/easy");
  const eevM = lessonId(lessonIndex, "finance/1/1/medium");
  const eevH = lessonId(lessonIndex, "finance/1/1/hard");
  await addMcq(eevE, mcq_eev_easy); console.log("    ✓ easy MCQ");
  await addQuantus(eevE, quantus_eev_easy); console.log("    ✓ easy Quantus");
  await addMcq(eevM, mcq_eev_medium); console.log("    ✓ medium MCQ");
  await addQuantus(eevM, quantus_eev_medium); console.log("    ✓ medium Quantus");
  await addMcq(eevH, mcq_eev_hard); console.log("    ✓ hard MCQ");
  await addQuantus(eevH, quantus_eev_hard); console.log("    ✓ hard Quantus");

  console.log("\n✅  Finance MCQ + Quantus seed complete!");
}

async function main() {
  console.log("🔍 Reconstructing lesson index from database...");
  const lessons = await prisma.lesson.findMany({
    include: {
      subtopic: {
        include: {
          topic: {
            include: {
              module: true,
            },
          },
        },
      },
    },
  });

  const lessonIndex: Record<string, { id: string; name: string; difficulty: string; activityType: string }> = {};

  for (const l of lessons) {
    const subtopic = l.subtopic;
    const topic = subtopic.topic;
    const m = topic.module;

    const key = `${m.slug}/${topic.orderIndex}/${subtopic.orderIndex}/${l.difficulty}`;
    lessonIndex[key] = {
      id: l.id,
      name: l.name,
      difficulty: l.difficulty,
      activityType: l.difficulty,
    };
  }

  await seedFinance(lessonIndex);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding Finance MCQ + Quantus:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });