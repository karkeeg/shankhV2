/**
 * ============================================================
 * SHANKH — MCQ + QUANTUS ACTIVITY SEED
 * ============================================================
 * Adds MCQ and Quantus content for all 18 lessons.
 * Does NOT touch CanvasActivity / CanvasToken / CanvasSolutionEdge.
 *
 * Structure:
 *   6 subtopics × 3 difficulties (easy / medium / hard) = 18 lessons
 *   Every lesson  → McqActivity + 4 questions × 4 options each
 *   Hard lessons  → QuantusActivity + column groups + columns + cells
 *
 * Safe to re-run: every write is guarded by findUnique / findFirst.
 *
 * HOW TO USE:
 *   Paste the helpers + the seedMcqQuantus() function body into your
 *   existing seed.ts, then call  await seedMcqQuantus();  at the END
 *   of your main() — after lessons are created, before disconnect.
 *
 *   Or run standalone:
 *   npx ts-node --transpile-only prisma/seed_mcq_quantus.ts
 * ============================================================
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ─── types ────────────────────────────────────────────────────────────────────
interface McqOption { optionText: string; isCorrect: boolean; orderIndex: number }
interface McqQuestion {
    questionText: string;
    explanation: string;
    hints: string[];          // 3-4 progressive hints shown in AI Coach
    orderIndex: number;
    options: McqOption[];
}
interface McqDef {
    title: string;
    instructions: string;
    context: string;           // 100-200 word framing shown in left panel
    questions: McqQuestion[];
}
interface QuantusCell {
    rowIndex: number; colIndex: number;
    cellType: string;          // 'header'|'label'|'prefilled'|'editable'|'formula'
    displayValue?: string; expectedValue?: string; formula?: string;
    formatType?: string; isEditable: boolean;
    tolerancePct?: number; hintText?: string;
    rowSpan?: number; colSpan?: number;
}
interface QuantusDef {
    title: string; instructions: string; context: string;
    columnGroups: { label: string; colStart: number; colEnd: number; bgColor: string; textColor: string; orderIndex: number }[];
    columns: { label: string; colIndex: number; widthPx: number }[];
    cells: QuantusCell[];
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function findLesson(
    lessonIndex: Record<string, { id: string }>,
    key: string
): string {
    const l = lessonIndex[key];
    if (!l) throw new Error(`lessonIndex key not found: ${key}`);
    return l.id;
}

async function upsertMcq(lessonId: string, def: McqDef) {
    let mcq = await prisma.mcqActivity.findUnique({ where: { lessonId } });
    if (!mcq) {
        mcq = await prisma.mcqActivity.create({
            data: { lessonId, title: def.title, instructions: def.instructions, context: def.context },
        });
    }
    for (const q of def.questions) {
        const exists = await prisma.mcqQuestion.findFirst({ where: { activityId: mcq.id, orderIndex: q.orderIndex } });
        if (exists) continue;
        await prisma.mcqQuestion.create({
            data: {
                activityId: mcq.id,
                questionText: q.questionText,
                explanation: q.explanation,
                orderIndex: q.orderIndex,
                options: { create: q.options },
            },
        });
        // Store hints as ActivityHint rows linked to the activity
        for (let i = 0; i < q.hints.length; i++) {
            const hintOrderIndex = q.orderIndex * 10 + i;
            await prisma.activityHint.upsert({
                where: { activityId_activityType_orderIndex: { activityId: mcq.id, activityType: 'mcq', orderIndex: hintOrderIndex } },
                update: { hintText: q.hints[i] },
                create: { activityId: mcq.id, activityType: 'mcq', orderIndex: hintOrderIndex, hintText: q.hints[i] },
            });
        }
    }

    await prisma.lessonActivity.upsert({
        where: { lessonId_activityType: { lessonId, activityType: 'mcq' } },
        update: { orderIndex: 10 },
        create: { lessonId, activityType: 'mcq', orderIndex: 10 },
    });
}

async function upsertQuantus(lessonId: string, def: QuantusDef) {
    const act = await prisma.quantusActivity.findUnique({ where: { lessonId } });
    if (!act) {
        const newAct = await prisma.quantusActivity.create({
            data: { lessonId, title: def.title, instructions: def.instructions, context: def.context },
        });
        await prisma.quantusColumnGroup.createMany({ data: def.columnGroups.map(g => ({ ...g, activityId: newAct.id })), skipDuplicates: true });
        await prisma.quantusColumn.createMany({ data: def.columns.map(c => ({ ...c, activityId: newAct.id })), skipDuplicates: true });
        await prisma.quantusCell.createMany({ data: def.cells.map(c => ({ ...c, activityId: newAct.id })), skipDuplicates: true });
    }

    await prisma.lessonActivity.upsert({
        where: { lessonId_activityType: { lessonId, activityType: 'quantus' } },
        update: { orderIndex: 20 },
        create: { lessonId, activityType: 'quantus', orderIndex: 20 },
    });
}

// ─────────────────────────────────────────────────────────────────────────────
//  MCQ DEFINITIONS  (6 subtopics × 3 difficulties = 18 McqDef objects)
// ─────────────────────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════════════════════
// 1. FINANCIAL STATEMENTS
// ══════════════════════════════════════════════════════════════════════════════

const mcq_fs_easy: McqDef = {
    title: 'Financial Statements — Fundamentals',
    instructions: 'Select the single best answer for each question. Each question is independent.',
    context: `The three core financial statements — the Income Statement, the Balance Sheet, and the Cash Flow Statement — form the backbone of all financial analysis. The Income Statement shows revenue and expenses over a period, producing a profit or loss figure. The Balance Sheet is a snapshot of assets, liabilities, and equity at one point in time and must always satisfy the accounting equation: Assets = Liabilities + Equity. The Cash Flow Statement reconciles net income to actual cash movements by adjusting for non-cash items and changes in working capital. Together, these statements are deeply interconnected: net income flows into retained earnings on the Balance Sheet, and it also seeds the Cash Flow Statement under the indirect method. Every analyst, accountant, and consultant must be fluent in reading and linking all three.`,
    questions: [
        {
            questionText: 'Which financial statement provides a snapshot of a company\'s financial position at a single point in time?',
            explanation: 'The Balance Sheet (Statement of Financial Position) captures assets, liabilities, and equity on a specific date — unlike the Income Statement and Cash Flow Statement, which cover a period of time.',
            hints: [
                'Think about which statement uses the word "as of" a date rather than "for the period ended".',
                'One statement is like a photograph; the other two are like videos. Which one is the photograph?',
                'The accounting equation Assets = Liabilities + Equity defines a specific statement.',
                'The Balance Sheet shows what the company owns and owes at a single moment.',
            ],
            orderIndex: 0,
            options: [
                { optionText: 'Income Statement', isCorrect: false, orderIndex: 0 },
                { optionText: 'Balance Sheet', isCorrect: true, orderIndex: 1 },
                { optionText: 'Cash Flow Statement', isCorrect: false, orderIndex: 2 },
                { optionText: 'Statement of Retained Earnings', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'Revenue minus Cost of Goods Sold (COGS) gives which line item?',
            explanation: 'Gross Profit = Revenue − COGS. It measures profitability from core operations before deducting operating expenses like SG&A or R&D.',
            hints: [
                'COGS includes direct costs of producing goods: raw materials, direct labour, manufacturing overhead.',
                'The result sits at the top of the P&L waterfall, before operating expenses.',
                'Gross Profit ÷ Revenue gives you the Gross Margin percentage.',
                'Gross Profit = Revenue − COGS.',
            ],
            orderIndex: 1,
            options: [
                { optionText: 'EBITDA', isCorrect: false, orderIndex: 0 },
                { optionText: 'Operating Income (EBIT)', isCorrect: false, orderIndex: 1 },
                { optionText: 'Gross Profit', isCorrect: true, orderIndex: 2 },
                { optionText: 'Net Income', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'Which section of the Cash Flow Statement includes the purchase of property, plant, and equipment (PP&E)?',
            explanation: 'Purchasing PP&E is a capital expenditure (CapEx) — a long-term investment in tangible assets. This is classified as an Investing Activity, not an Operating one.',
            hints: [
                'Divide cash flows into three buckets: day-to-day operations, buying/selling long-term assets, and raising/repaying capital.',
                'CapEx is about acquiring physical assets for the long term — this is not a routine operating cost.',
                'The Investing section contains asset purchases, acquisitions, and asset sales.',
                'CapEx belongs in Investing Activities.',
            ],
            orderIndex: 2,
            options: [
                { optionText: 'Operating Activities', isCorrect: false, orderIndex: 0 },
                { optionText: 'Investing Activities', isCorrect: true, orderIndex: 1 },
                { optionText: 'Financing Activities', isCorrect: false, orderIndex: 2 },
                { optionText: 'Supplemental Disclosures', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'Depreciation is a non-cash expense. Under the indirect method, where does it appear in the Cash Flow Statement?',
            explanation: 'The indirect method starts with Net Income and adds back non-cash charges. Since depreciation reduced Net Income but involved no cash outflow, it is added back in Operating Activities to reconcile to actual cash generated.',
            hints: [
                'The indirect method starts with Net Income from the P&L and adjusts for non-cash items.',
                'Depreciation reduced Net Income but no cash actually left the company — so it must be reversed.',
                'Adding it back "undoes" its effect on net income to show true cash generation.',
                'Depreciation is added back in Operating Activities.',
            ],
            orderIndex: 3,
            options: [
                { optionText: 'Deducted in Operating Activities', isCorrect: false, orderIndex: 0 },
                { optionText: 'Added back in Operating Activities', isCorrect: true, orderIndex: 1 },
                { optionText: 'Shown as a cash outflow in Investing Activities', isCorrect: false, orderIndex: 2 },
                { optionText: 'Excluded from the Cash Flow Statement entirely', isCorrect: false, orderIndex: 3 },
            ],
        },
    ],
};

const mcq_fs_medium: McqDef = {
    title: 'Financial Statements — Statement Linkages',
    instructions: 'These questions test how the three financial statements connect. Think carefully before selecting.',
    context: `Understanding the linkages between financial statements is one of the most tested skills in finance interviews and professional practice. When Net Income changes, it ripples across all three statements simultaneously: it feeds into Retained Earnings on the Balance Sheet (increasing Equity) and it serves as the starting point for the Cash Flow Statement under the indirect method. When a company buys inventory on credit, Assets rise (inventory) and Liabilities rise (accounts payable) — the Income Statement is unaffected until the goods are sold. When a company collects a receivable, Cash increases but Revenue does not — revenue was already recognised. These cause-and-effect chains are the foundation of financial modelling. Analysts who can trace a single transaction through all three statements can build and audit any model.`,
    questions: [
        {
            questionText: 'If Net Income increases by $50M with no other changes, which Balance Sheet item increases by $50M?',
            explanation: 'Net Income flows into Retained Earnings, which is part of Shareholders\' Equity. When a company earns profit and does not distribute it as dividends, Retained Earnings increases. Both sides of the accounting equation rise equally: assets (cash) go up and equity (retained earnings) goes up.',
            hints: [
                'Net Income is distributed as dividends or retained inside the business.',
                'If no dividend is paid, all of Net Income stays in the company — increasing which equity account?',
                'Retained Earnings is the cumulative sum of all past net incomes not paid as dividends.',
                'Retained Earnings increases by the full $50M.',
            ],
            orderIndex: 0,
            options: [
                { optionText: 'Common Stock', isCorrect: false, orderIndex: 0 },
                { optionText: 'Accounts Payable', isCorrect: false, orderIndex: 1 },
                { optionText: 'Retained Earnings', isCorrect: true, orderIndex: 2 },
                { optionText: 'Long-term Debt', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'A company collects $80M of Accounts Receivable in cash. What is the net effect on Net Income?',
            explanation: 'Revenue was already recognised when the sale was made and the receivable was created. Collecting the cash is purely a Balance Sheet transaction: Cash (asset) goes up and AR (asset) goes down by the same amount. Net Income is unaffected.',
            hints: [
                'Under accrual accounting, revenue is recognised when earned — not when cash is received.',
                'Collecting a receivable simply converts one asset (AR) into another (cash).',
                'No new revenue or expense is created by collecting cash.',
                'Net Income is unchanged — this is purely a balance sheet event.',
            ],
            orderIndex: 1,
            options: [
                { optionText: 'Net Income increases by $80M', isCorrect: false, orderIndex: 0 },
                { optionText: 'Net Income decreases by $80M', isCorrect: false, orderIndex: 1 },
                { optionText: 'No impact on Net Income', isCorrect: true, orderIndex: 2 },
                { optionText: 'Gross Profit increases by $80M', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'EBITDA adds back Depreciation & Amortisation (D&A) to EBIT. Why?',
            explanation: 'D&A is a non-cash charge that reduces EBIT. Adding it back gives a closer approximation of operating cash generation — before capital structure (interest) and tax effects. EBITDA is widely used in valuation multiples precisely because it strips out accounting-driven charges.',
            hints: [
                'D&A reduces accounting profit but involves no actual cash payment in the period.',
                'EBITDA is meant to approximate operating cash flow before working capital effects.',
                'By adding back D&A, we reverse a non-cash deduction to see pure cash-generating power.',
                'EBITDA = EBIT + D&A.',
            ],
            orderIndex: 2,
            options: [
                { optionText: 'Because D&A is a financing cost, not an operating cost', isCorrect: false, orderIndex: 0 },
                { optionText: 'Because D&A is non-cash and reduces accounting profit without using cash', isCorrect: true, orderIndex: 1 },
                { optionText: 'Because D&A is always equal to CapEx', isCorrect: false, orderIndex: 2 },
                { optionText: 'Because regulators require it in all financial reporting', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'A company raises $200M of new debt. Which sections of which statements are directly affected?',
            explanation: 'Issuing debt increases Cash (asset on Balance Sheet) and increases Long-term Debt (liability on Balance Sheet). On the Cash Flow Statement, it appears as a cash inflow in Financing Activities. The Income Statement is unaffected at the time of issuance — interest expense only begins accruing in subsequent periods.',
            hints: [
                'Debt issuance puts cash in the bank and creates a liability — think Balance Sheet first.',
                'On the Cash Flow Statement, which section covers raising and repaying capital?',
                'The Income Statement is only affected when interest is charged — not at issuance.',
                'Balance Sheet (Cash↑, Debt↑) and CFS Financing Activities (inflow +$200M).',
            ],
            orderIndex: 3,
            options: [
                { optionText: 'Income Statement (revenue) and Balance Sheet (assets)', isCorrect: false, orderIndex: 0 },
                { optionText: 'Balance Sheet (cash + debt) and CFS Financing Activities', isCorrect: true, orderIndex: 1 },
                { optionText: 'Balance Sheet only — no cash flow impact', isCorrect: false, orderIndex: 2 },
                { optionText: 'CFS Operating Activities and Balance Sheet', isCorrect: false, orderIndex: 3 },
            ],
        },
    ],
};

const mcq_fs_hard: McqDef = {
    title: 'Financial Statements — Advanced Analysis',
    instructions: 'Advanced questions covering accounting policy choices, quality of earnings, and analyst-level reasoning.',
    context: `Advanced financial statement analysis goes beyond reading reported numbers — it questions the quality and sustainability of those numbers. Accounting choices such as revenue recognition timing, inventory costing methods (FIFO vs LIFO), lease capitalisation, and R&D treatment can materially inflate or deflate reported earnings relative to economic reality. Sophisticated analysts normalise for one-off items, assess working capital trends, compare cash conversion (FCF vs Net Income), and scrutinise footnotes for off-balance-sheet obligations. In M&A and credit analysis, the question is never "what did they report?" but "what did they actually earn in cash, on a sustainable basis?" This mindset separates junior analysts from seasoned professionals. These questions are designed to sharpen that critical lens.`,
    questions: [
        {
            questionText: 'A company switches from FIFO to LIFO inventory costing during a period of rising input prices. What is the most likely effect on Cost of Goods Sold and Net Income?',
            explanation: 'Under LIFO, the most recently purchased (higher-priced) inventory is expensed first. In a rising-price environment this raises COGS relative to FIFO, compressing gross profit and reducing Net Income. LIFO also lowers the Balance Sheet inventory value to older (cheaper) costs.',
            hints: [
                'Under LIFO, the "last in" inventory — the most recently purchased — is the first to be expensed as COGS.',
                'If prices are rising, the most recently purchased inventory is the most expensive.',
                'Higher COGS → lower Gross Profit → lower Net Income.',
                'LIFO raises COGS and reduces Net Income in a rising-price environment.',
            ],
            orderIndex: 0,
            options: [
                { optionText: 'COGS decreases, Net Income increases', isCorrect: false, orderIndex: 0 },
                { optionText: 'COGS increases, Net Income decreases', isCorrect: true, orderIndex: 1 },
                { optionText: 'COGS unchanged, Net Income unchanged', isCorrect: false, orderIndex: 2 },
                { optionText: 'COGS increases, Net Income increases due to tax shield', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'Company A has Net Income of $100M and Free Cash Flow of $20M. Company B has Net Income of $100M and Free Cash Flow of $90M. Which company has higher earnings quality and why?',
            explanation: 'Company B converts 90% of its earnings into cash (FCF/NI = 90%). Company A converts only 20% — the rest is trapped in working capital or consumed by heavy CapEx. Higher FCF/NI ratio = higher earnings quality because the profits are real, collectible cash rather than accruals.',
            hints: [
                'Earnings quality measures how closely reported profit resembles actual cash received.',
                'Calculate FCF / Net Income for each company as a conversion ratio.',
                'Company A: 20/100 = 20%. Company B: 90/100 = 90%.',
                'Higher FCF/NI = higher earnings quality. Company B wins.',
            ],
            orderIndex: 1,
            options: [
                { optionText: 'Company A — higher CapEx signals more growth investment', isCorrect: false, orderIndex: 0 },
                { optionText: 'Company B — higher FCF/NI ratio means earnings are backed by real cash', isCorrect: true, orderIndex: 1 },
                { optionText: 'Equal — Net Income is the same for both', isCorrect: false, orderIndex: 2 },
                { optionText: 'Company A — lower FCF means more reinvestment, signalling confidence', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'A company capitalises $150M of software development costs instead of expensing them immediately. Compared to expensing, what is the impact on Operating Income this year?',
            explanation: 'Capitalising delays the full cost recognition. Instead of $150M hitting the Income Statement immediately as an expense, only the amortisation charge (a fraction of $150M) is expensed this period. This inflates Operating Income relative to the expensing approach.',
            hints: [
                'If you capitalise a cost, it becomes an asset on the Balance Sheet — only amortisation hits the P&L.',
                'If you expense it, the full $150M hits the Income Statement immediately.',
                'Capitalising spreads the cost over multiple years vs. a single-period hit.',
                'Capitalising inflates Operating Income this year versus expensing.',
            ],
            orderIndex: 2,
            options: [
                { optionText: 'Operating Income decreases — CapEx creates higher depreciation', isCorrect: false, orderIndex: 0 },
                { optionText: 'Operating Income increases — only amortisation, not the full cost, is expensed', isCorrect: true, orderIndex: 1 },
                { optionText: 'Operating Income is unchanged — only the balance sheet changes', isCorrect: false, orderIndex: 2 },
                { optionText: 'Operating Income decreases — capitalising increases total liabilities', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'An analyst wants to compare two companies\' operating performance without the distortion of different capital structures. Which metric should they use?',
            explanation: 'EBIT (or EBITDA) strips out interest expense, which is driven by debt levels. Two companies with identical operations but different debt loads will have different Net Income figures — making NI an unfair comparison. EBIT equalises for financing decisions.',
            hints: [
                'Capital structure refers to the mix of debt and equity a company uses.',
                'Interest expense is the cost of debt — it only appears because debt exists.',
                'To compare operations fairly, remove the financing cost (interest) from the picture.',
                'EBIT or EBITDA neutralises the impact of different debt levels.',
            ],
            orderIndex: 3,
            options: [
                { optionText: 'Net Income', isCorrect: false, orderIndex: 0 },
                { optionText: 'Earnings Per Share (EPS)', isCorrect: false, orderIndex: 1 },
                { optionText: 'EBIT or EBITDA', isCorrect: true, orderIndex: 2 },
                { optionText: 'Return on Equity (ROE)', isCorrect: false, orderIndex: 3 },
            ],
        },
    ],
};

// ══════════════════════════════════════════════════════════════════════════════
// 2. CAPITAL STRUCTURE
// ══════════════════════════════════════════════════════════════════════════════

const mcq_cs_easy: McqDef = {
    title: 'Capital Structure — Fundamentals',
    instructions: 'Select the single best answer. Focus on core definitions and concepts.',
    context: `Capital structure refers to how a company finances its assets through a combination of equity and debt. Equity represents ownership — shareholders provide capital in exchange for a residual claim on profits and assets. Debt represents a contractual obligation to repay principal plus interest regardless of profitability. The balance between these two determines a company's financial risk profile. The Weighted Average Cost of Capital (WACC) blends the costs of both into a single discount rate. Debt is cheaper than equity because interest is tax-deductible (the tax shield) and debt holders are paid before equity holders in bankruptcy (lower risk = lower required return). However, too much debt increases financial distress risk — the possibility of bankruptcy costs and reduced operating flexibility. Finding the optimal capital structure that minimises WACC while managing risk is a central challenge in corporate finance.`,
    questions: [
        {
            questionText: 'The Weighted Average Cost of Capital (WACC) is defined as:',
            explanation: 'WACC = (E/V) × Ke + (D/V) × Kd × (1−T). It weights each source of capital by its proportion of total firm value and adjusts debt cost for the tax shield. It represents the minimum return the company must earn to satisfy all capital providers.',
            hints: [
                'WACC blends the cost of equity and the after-tax cost of debt.',
                'Each component is weighted by its share of total capital (E+D = V).',
                'Debt gets a (1−T) tax adjustment because interest is tax-deductible.',
                'WACC = (E/V)×Ke + (D/V)×Kd×(1−T).',
            ],
            orderIndex: 0,
            options: [
                { optionText: 'Cost of Equity + Cost of Debt', isCorrect: false, orderIndex: 0 },
                { optionText: '(E/V)×Ke + (D/V)×Kd×(1−T)', isCorrect: true, orderIndex: 1 },
                { optionText: 'Net Income ÷ Total Assets', isCorrect: false, orderIndex: 2 },
                { optionText: 'Risk-free Rate + Beta × Market Premium', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'Why is debt financing generally cheaper than equity financing?',
            explanation: 'Debt is cheaper for two reasons: (1) interest payments are tax-deductible, creating a tax shield that effectively reduces the net cost; (2) debt holders have priority in bankruptcy over equity holders, making their investment less risky — lower risk demands lower return.',
            hints: [
                'Think about how the government subsidises debt through the tax system.',
                'In bankruptcy, who gets paid first — bondholders or shareholders?',
                'Lower risk for the investor means a lower required return.',
                'Debt is cheaper because interest is tax-deductible AND debt is senior in the capital stack.',
            ],
            orderIndex: 1,
            options: [
                { optionText: 'Debt holders receive dividends, which are fixed', isCorrect: false, orderIndex: 0 },
                { optionText: 'Interest is tax-deductible and debt holders have priority over equity in bankruptcy', isCorrect: true, orderIndex: 1 },
                { optionText: 'Equity is riskier for the company, so its cost is lower', isCorrect: false, orderIndex: 2 },
                { optionText: 'Debt financing requires no collateral', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'Using the CAPM formula, if the risk-free rate is 4%, beta is 1.3, and the equity risk premium is 5%, what is the Cost of Equity?',
            explanation: 'CAPM: Ke = Rf + β × ERP = 4% + 1.3 × 5% = 4% + 6.5% = 10.5%.',
            hints: [
                'CAPM: Cost of Equity = Risk-free Rate + Beta × Equity Risk Premium.',
                'Beta of 1.3 means the stock is 30% more volatile than the market.',
                '4% + (1.3 × 5%) = ?',
                'Ke = 4% + 6.5% = 10.5%.',
            ],
            orderIndex: 2,
            options: [
                { optionText: '9.0%', isCorrect: false, orderIndex: 0 },
                { optionText: '10.5%', isCorrect: true, orderIndex: 1 },
                { optionText: '11.5%', isCorrect: false, orderIndex: 2 },
                { optionText: '8.5%', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'What does the Debt/Equity (D/E) ratio measure?',
            explanation: 'The D/E ratio measures financial leverage — how much debt a company uses relative to equity financing. A higher ratio means greater reliance on debt, which amplifies both returns and risk for equity holders.',
            hints: [
                'Leverage ratios measure how much borrowed capital a company uses versus owner capital.',
                'D/E = Total Debt ÷ Total Equity.',
                'A D/E of 2.0x means $2 of debt for every $1 of equity.',
                'D/E measures the proportion of debt financing relative to equity financing.',
            ],
            orderIndex: 3,
            options: [
                { optionText: 'The company\'s ability to pay short-term obligations', isCorrect: false, orderIndex: 0 },
                { optionText: 'The proportion of debt financing relative to equity financing', isCorrect: true, orderIndex: 1 },
                { optionText: 'How efficiently a company uses its assets', isCorrect: false, orderIndex: 2 },
                { optionText: 'The return generated for shareholders', isCorrect: false, orderIndex: 3 },
            ],
        },
    ],
};

const mcq_cs_medium: McqDef = {
    title: 'Capital Structure — WACC & Leverage',
    instructions: 'Apply capital structure concepts. Some questions require calculation.',
    context: `The relationship between capital structure and firm value is one of the most debated topics in corporate finance. Modigliani and Miller showed that in a world without taxes or financial distress, capital structure is irrelevant — value depends only on operating cash flows. But in reality, debt creates a valuable tax shield (interest is tax-deductible) while also increasing financial distress risk as leverage rises. The optimal capital structure balances these two forces. Practically, finance professionals compute WACC to quantify the blended cost of capital, use debt capacity analysis to determine safe leverage levels, and model the interest coverage ratio to ensure debt service is manageable. In leveraged buyouts, maximising debt is the strategy — because financial sponsors want to amplify equity returns and benefit from the tax shield on the maximum allowable debt load.`,
    questions: [
        {
            questionText: 'Company X has: Equity = $400M, Debt = $600M, Cost of Equity = 14%, Pre-tax Cost of Debt = 6%, Tax Rate = 30%. What is WACC?',
            explanation: 'V = 400+600 = $1,000M. E/V = 40%, D/V = 60%. After-tax Kd = 6%×(1−0.30) = 4.2%. WACC = 0.40×14% + 0.60×4.2% = 5.6% + 2.52% = 8.12%.',
            hints: [
                'Total Value V = Equity + Debt = $1,000M.',
                'E/V = 400/1000 = 40%. D/V = 600/1000 = 60%.',
                'After-tax cost of debt = 6% × (1−30%) = 4.2%.',
                'WACC = 0.40×14% + 0.60×4.2% = 5.60% + 2.52% = 8.12%.',
            ],
            orderIndex: 0,
            options: [
                { optionText: '9.6%', isCorrect: false, orderIndex: 0 },
                { optionText: '8.12%', isCorrect: true, orderIndex: 1 },
                { optionText: '10.0%', isCorrect: false, orderIndex: 2 },
                { optionText: '7.4%', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'A company has EBIT of $50M and Interest Expense of $10M. What is the Interest Coverage Ratio, and how would a lender interpret it?',
            explanation: 'Interest Coverage = EBIT / Interest = 50 / 10 = 5.0x. A ratio above 3x is generally considered comfortable — the company earns 5 times its interest obligations from operations. Below 1.5x starts to signal distress.',
            hints: [
                'Interest Coverage = EBIT ÷ Interest Expense.',
                '50 ÷ 10 = ?',
                'A ratio of 5.0x means operating profit covers interest 5 times over.',
                'Lenders want this above ~2-3x; 5.0x is healthy.',
            ],
            orderIndex: 1,
            options: [
                { optionText: '4.0x — borderline; lender would be cautious', isCorrect: false, orderIndex: 0 },
                { optionText: '5.0x — comfortable; lender would view as healthy', isCorrect: true, orderIndex: 1 },
                { optionText: '2.0x — high risk; lender would likely decline', isCorrect: false, orderIndex: 2 },
                { optionText: '0.5x — the company cannot cover interest', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'Adding more debt initially lowers WACC because of the tax shield. But beyond an optimal point, WACC begins to rise. Why?',
            explanation: 'At high leverage levels, both equity holders and debt holders demand higher returns to compensate for increased financial distress risk. Equity holders bear more residual risk; debt holders face higher default probability. These rising costs eventually outweigh the tax shield benefit, causing WACC to increase.',
            hints: [
                'The tax shield benefit is fixed per dollar of debt. But what happens to risk as leverage climbs?',
                'At very high debt levels, lenders start charging much higher interest rates.',
                'Equity holders also demand a higher return as the probability of bankruptcy increases.',
                'Rising cost of equity + rising cost of debt at high leverage outweighs the tax shield.',
            ],
            orderIndex: 2,
            options: [
                { optionText: 'Because tax rates increase automatically at high leverage levels', isCorrect: false, orderIndex: 0 },
                { optionText: 'Because financial distress risk raises the required returns of both equity and debt holders', isCorrect: true, orderIndex: 1 },
                { optionText: 'Because EBITDA falls when debt rises', isCorrect: false, orderIndex: 2 },
                { optionText: 'Because regulators cap the debt tax shield', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'In an LBO, the private equity sponsor seeks to maximise debt. The primary reason is:',
            explanation: 'Maximising debt amplifies equity returns through leverage (since equity is a smaller slice of total value, any increase in firm value generates a higher % return on equity). The tax shield from debt also improves FCF. The PE firm does not bear interest risk directly — the operating company does.',
            hints: [
                'In an LBO, the PE sponsor buys a company using mostly debt and a small equity cheque.',
                'When the company\'s value increases by $100M, that gain flows entirely to the small equity tranche.',
                'Small equity base + large value gain = massive % return on equity.',
                'Maximising debt maximises equity return leverage AND generates a tax shield.',
            ],
            orderIndex: 3,
            options: [
                { optionText: 'To lower the purchase price of the company', isCorrect: false, orderIndex: 0 },
                { optionText: 'To amplify equity returns through leverage and benefit from the debt tax shield', isCorrect: true, orderIndex: 1 },
                { optionText: 'To reduce the company\'s WACC to zero', isCorrect: false, orderIndex: 2 },
                { optionText: 'To ensure lenders control the company\'s strategy', isCorrect: false, orderIndex: 3 },
            ],
        },
    ],
};

const mcq_cs_hard: McqDef = {
    title: 'Capital Structure — Advanced Modelling & Theory',
    instructions: 'Hard questions covering M&M theory, optimal structure analysis, and LBO return mechanics.',
    context: `At the advanced level, capital structure analysis requires integrating theory with numerical modelling. Modigliani-Miller propositions form the theoretical bedrock: MM Proposition I states that in a frictionless market, firm value is independent of capital structure. MM Proposition II shows that as leverage increases, the cost of equity rises to exactly offset the cheaper debt — keeping WACC constant. In the real world, the trade-off theory and pecking order theory offer competing explanations for observed capital structures. Practitioners use leverage buyout (LBO) models, credit metrics (Net Debt/EBITDA, interest coverage), and scenario analysis to determine the right structure. Advanced analysts also distinguish between recourse and non-recourse debt, covenant structures, and the role of mezzanine financing in complex capital stacks.`,
    questions: [
        {
            questionText: 'Under Modigliani-Miller with taxes, adding debt increases firm value because:',
            explanation: 'MM with taxes (Proposition I with tax) shows that firm value = Unlevered Value + PV(Tax Shield). Each dollar of debt generates an annual tax shield of (Kd × T), whose present value adds to firm value. This is the theoretical basis for why debt financing is preferred when tax rates are positive.',
            hints: [
                'MM with taxes introduces the debt tax shield — interest payments reduce taxable income.',
                'PV of tax shield = Debt × Tax Rate (when debt is permanent).',
                'Levered firm value = Unlevered firm value + Tax Shield.',
                'Firm value increases with debt because the government effectively subsidises interest via the tax system.',
            ],
            orderIndex: 0,
            options: [
                { optionText: 'Debt holders require lower returns than equity holders', isCorrect: false, orderIndex: 0 },
                { optionText: 'Interest payments generate a tax shield that adds value to the firm', isCorrect: true, orderIndex: 1 },
                { optionText: 'Higher leverage always reduces the cost of equity', isCorrect: false, orderIndex: 2 },
                { optionText: 'Debt reduces agency costs between management and shareholders', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'A PE firm buys a company for $500M EV (4x EBITDA). It uses $350M debt, $150M equity. At exit after 5 years, EV = $750M and remaining debt = $200M. What is the equity return (MoM)?',
            explanation: 'Entry equity = $150M. Exit equity = EV − Debt = 750 − 200 = $550M. MoM = 550 / 150 = 3.7x. IRR is approximately 30%+ over 5 years — a typical LBO target.',
            hints: [
                'Equity value at entry = Purchase Price − Debt = 500 − 350 = $150M.',
                'Equity value at exit = Exit EV − Remaining Debt = 750 − 200 = $550M.',
                'Money-on-Money (MoM) = Exit Equity / Entry Equity.',
                'MoM = 550 / 150 = 3.67x.',
            ],
            orderIndex: 1,
            options: [
                { optionText: '1.5x MoM', isCorrect: false, orderIndex: 0 },
                { optionText: '3.67x MoM', isCorrect: true, orderIndex: 1 },
                { optionText: '5.0x MoM', isCorrect: false, orderIndex: 2 },
                { optionText: '2.5x MoM', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'Under the Pecking Order Theory, which source of financing does a company prefer first?',
            explanation: 'Pecking Order Theory (Myers & Majluf) argues companies prefer internal financing (retained earnings) first, then debt, and finally equity — because issuing equity signals to the market that management believes the stock is overvalued, depressing share price.',
            hints: [
                'Pecking Order is driven by information asymmetry — managers know more than the market.',
                'Using retained earnings signals nothing to the market — no information leakage.',
                'Issuing new equity is the most expensive signal — it implies the stock is overvalued.',
                'Order: Retained Earnings → Debt → Equity.',
            ],
            orderIndex: 2,
            options: [
                { optionText: 'External equity (new share issuance)', isCorrect: false, orderIndex: 0 },
                { optionText: 'Internal financing (retained earnings)', isCorrect: true, orderIndex: 1 },
                { optionText: 'Hybrid instruments (convertible bonds)', isCorrect: false, orderIndex: 2 },
                { optionText: 'Senior secured debt', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'Net Debt / EBITDA is 6.0x after an LBO. A lender covenant requires this to fall below 4.0x within 3 years. If EBITDA grows 10% annually, how much debt must be repaid to meet the covenant?',
            explanation: 'If EBITDA at close = $100M (implied), then Net Debt = $600M. After 3 years, EBITDA = 100×1.1³ = $133.1M. To meet 4.0x: max Net Debt = 4.0 × 133.1 = $532.4M. Debt to repay = 600 − 532.4 = $67.6M.',
            hints: [
                'Let EBITDA = $100M at close. Then Net Debt = 6.0 × 100 = $600M.',
                'After 3 years at 10% growth: EBITDA = 100 × 1.1³ = $133.1M.',
                'Target max debt at year 3: 4.0 × 133.1 = $532.4M.',
                'Debt repayment needed = 600 − 532.4 = $67.6M.',
            ],
            orderIndex: 3,
            options: [
                { optionText: '$200M', isCorrect: false, orderIndex: 0 },
                { optionText: '$67.6M', isCorrect: true, orderIndex: 1 },
                { optionText: '$133.1M', isCorrect: false, orderIndex: 2 },
                { optionText: '$100M', isCorrect: false, orderIndex: 3 },
            ],
        },
    ],
};

// ══════════════════════════════════════════════════════════════════════════════
// 3. COMPETITIVE ANALYSIS
// ══════════════════════════════════════════════════════════════════════════════

const mcq_ca_easy: McqDef = {
    title: 'Competitive Analysis — Fundamentals',
    instructions: 'Select the best answer for each concept question.',
    context: `Competitive analysis is the systematic assessment of an industry's attractiveness and a company's position within it. Porter's Five Forces framework — developed by Michael Porter at Harvard — is the foundational tool. It analyses five sources of competitive pressure: the threat of new entrants, the bargaining power of buyers, the bargaining power of suppliers, the threat of substitute products, and the intensity of rivalry among existing competitors. Industries with strong forces are less attractive because profit potential is eroded. The SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) provides an internal-external lens at the company level, identifying where a firm can compete effectively and where it is vulnerable. Together, these tools help strategists diagnose competitive position and make informed decisions about market entry, pricing, and investment.`,
    questions: [
        {
            questionText: 'Porter\'s Five Forces does NOT include which of the following?',
            explanation: 'Porter\'s Five Forces are: (1) Threat of new entrants, (2) Bargaining power of buyers, (3) Bargaining power of suppliers, (4) Threat of substitutes, (5) Rivalry among existing competitors. "Government regulation" is an external factor but is not one of the five forces.',
            hints: [
                'List the five forces: new entrants, buyers, suppliers, substitutes, and rivals.',
                'Government regulation can influence all five forces, but it is not a force itself in Porter\'s model.',
                'Each force measures a competitive pressure on profit margins.',
                'Government regulation is not one of Porter\'s original five forces.',
            ],
            orderIndex: 0,
            options: [
                { optionText: 'Threat of new entrants', isCorrect: false, orderIndex: 0 },
                { optionText: 'Bargaining power of suppliers', isCorrect: false, orderIndex: 1 },
                { optionText: 'Government regulation intensity', isCorrect: true, orderIndex: 2 },
                { optionText: 'Threat of substitute products', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'A high threat of new entrants in an industry typically leads to:',
            explanation: 'When entry barriers are low, new competitors can easily enter the market, increasing supply and eroding pricing power. Incumbents must invest more in defending their position, compressing margins. High entry threat = structurally less attractive industry.',
            hints: [
                'Think about what happens to an industry when many new players can easily join.',
                'More competitors generally means more price competition.',
                'Higher supply competing for the same customers puts downward pressure on prices.',
                'High threat of new entrants compresses margins and reduces industry attractiveness.',
            ],
            orderIndex: 1,
            options: [
                { optionText: 'Higher margins for incumbents', isCorrect: false, orderIndex: 0 },
                { optionText: 'Lower margins due to increased competition and pricing pressure', isCorrect: true, orderIndex: 1 },
                { optionText: 'Increased supplier bargaining power', isCorrect: false, orderIndex: 2 },
                { optionText: 'Reduced threat from substitutes', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'In SWOT analysis, which quadrant represents internal negative factors?',
            explanation: 'SWOT: Strengths and Weaknesses are internal (within the firm\'s control); Opportunities and Threats are external. Weaknesses are internal negative factors — capabilities or resources where the firm is deficient.',
            hints: [
                'SWOT has two dimensions: internal vs external, and positive vs negative.',
                'Strengths and Weaknesses both describe the firm itself.',
                'Weaknesses are things the firm does poorly or lacks — internal negatives.',
                'Weaknesses is the internal negative quadrant.',
            ],
            orderIndex: 2,
            options: [
                { optionText: 'Threats', isCorrect: false, orderIndex: 0 },
                { optionText: 'Weaknesses', isCorrect: true, orderIndex: 1 },
                { optionText: 'Opportunities', isCorrect: false, orderIndex: 2 },
                { optionText: 'Strengths', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'A company with a "cost leadership" generic strategy primarily competes on:',
            explanation: 'Porter\'s generic strategies: Cost Leadership (competing on lowest price), Differentiation (competing on unique features/brand), and Focus (targeting a niche). A cost leader aims to be the lowest-cost producer in the industry, enabling it to undercut rivals on price while maintaining acceptable margins.',
            hints: [
                'Porter identified three generic strategies: cost leadership, differentiation, and focus.',
                'Cost leadership is about being the cheapest producer — not necessarily the lowest price seller.',
                'By controlling costs, the firm can price aggressively or earn higher margins than rivals.',
                'Cost leadership = competing by being the lowest-cost producer.',
            ],
            orderIndex: 3,
            options: [
                { optionText: 'Superior product features and premium pricing', isCorrect: false, orderIndex: 0 },
                { optionText: 'Being the lowest-cost producer to undercut rivals on price', isCorrect: true, orderIndex: 1 },
                { optionText: 'Serving a narrow niche with tailored offerings', isCorrect: false, orderIndex: 2 },
                { optionText: 'Acquiring competitors to gain market share', isCorrect: false, orderIndex: 3 },
            ],
        },
    ],
};

const mcq_ca_medium: McqDef = {
    title: 'Competitive Analysis — Framework Application',
    instructions: 'Apply competitive analysis frameworks to real-world scenarios.',
    context: `Effective competitive analysis requires applying frameworks to actual business situations — not just recalling definitions. When using Five Forces, an analyst must evaluate each force's intensity and then synthesise an overall view of industry attractiveness. For example, a pharmaceutical company with patented drugs faces low substitution threat and high entry barriers (expensive R&D, regulatory approval), making it structurally attractive. But if patents expire and generics flood the market, the threat of substitutes spikes overnight. The BCG Growth-Share Matrix classifies business units by market growth rate and relative market share into Stars, Cash Cows, Question Marks, and Dogs — guiding capital allocation decisions. McKinsey's 7S framework examines seven interconnected elements (Strategy, Structure, Systems, Staff, Style, Skills, Shared Values) to diagnose organisational alignment. Real analysis triangulates across multiple frameworks for richer insight.`,
    questions: [
        {
            questionText: 'A company is the dominant player in a slow-growth, high-market-share business. In the BCG Matrix, this is classified as:',
            explanation: 'The BCG matrix classifies business units by: Stars (high growth, high share), Cash Cows (low growth, high share), Question Marks (high growth, low share), and Dogs (low growth, low share). A dominant player in a slow-growth market is a Cash Cow — it generates strong, stable cash flows with minimal reinvestment needed.',
            hints: [
                'BCG Matrix axes: vertical = market growth rate, horizontal = relative market share.',
                'High market share + low market growth = ?',
                'This unit generates reliable cash — like a cow producing milk steadily.',
                'Cash Cow: low growth market, high relative market share.',
            ],
            orderIndex: 0,
            options: [
                { optionText: 'Star', isCorrect: false, orderIndex: 0 },
                { optionText: 'Cash Cow', isCorrect: true, orderIndex: 1 },
                { optionText: 'Question Mark', isCorrect: false, orderIndex: 2 },
                { optionText: 'Dog', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'In a Five Forces analysis, "high switching costs" for customers most directly reduces which force?',
            explanation: 'If customers face high costs or friction when switching to a competitor, they have less leverage to demand lower prices or better terms. This reduces the bargaining power of buyers — one of the five forces. The firm can charge more because customers are effectively locked in.',
            hints: [
                'Switching costs are what buyers face when they want to change supplier.',
                'High switching costs reduce the customer\'s ability to credibly threaten to leave.',
                'When customers can\'t easily switch, what happens to their negotiating power?',
                'High switching costs reduce the bargaining power of buyers.',
            ],
            orderIndex: 1,
            options: [
                { optionText: 'Threat of new entrants', isCorrect: false, orderIndex: 0 },
                { optionText: 'Bargaining power of suppliers', isCorrect: false, orderIndex: 1 },
                { optionText: 'Bargaining power of buyers', isCorrect: true, orderIndex: 2 },
                { optionText: 'Threat of substitutes', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'Two firms in the same industry have similar cost structures but one earns consistently higher margins. This is most likely explained by:',
            explanation: 'If costs are similar but one firm earns higher margins, the differentiator is pricing power — typically the result of a sustainable competitive advantage such as a strong brand, network effect, proprietary technology, or customer loyalty that allows premium pricing without losing volume.',
            hints: [
                'If costs are the same, margin differences must come from the revenue side.',
                'Higher revenue per unit = better pricing power.',
                'What gives a firm the ability to charge more than its rivals?',
                'A sustainable competitive advantage (brand, network effect, IP) explains persistent margin superiority.',
            ],
            orderIndex: 2,
            options: [
                { optionText: 'The higher-margin firm has more employees', isCorrect: false, orderIndex: 0 },
                { optionText: 'A sustainable competitive advantage that enables premium pricing', isCorrect: true, orderIndex: 1 },
                { optionText: 'The firm is in a different industry', isCorrect: false, orderIndex: 2 },
                { optionText: 'The firm uses more debt financing', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'Which SWOT quadrant aligns with "convert weaknesses into strengths using external opportunities"?',
            explanation: 'The WO (Weakness-Opportunity) strategy involves using external opportunities to overcome internal weaknesses — for example, partnering with a tech firm to compensate for internal digital capability gaps. This is a turnaround or improvement strategy.',
            hints: [
                'SWOT cross-analysis creates four strategy types: SO, WO, ST, WT.',
                'WO strategy uses Opportunities to compensate for Weaknesses.',
                '"Convert weaknesses using opportunities" = Weakness + Opportunity strategy.',
                'WO (mini-max) strategy: minimise weakness, maximise opportunity.',
            ],
            orderIndex: 3,
            options: [
                { optionText: 'SO strategy', isCorrect: false, orderIndex: 0 },
                { optionText: 'WO strategy', isCorrect: true, orderIndex: 1 },
                { optionText: 'ST strategy', isCorrect: false, orderIndex: 2 },
                { optionText: 'WT strategy', isCorrect: false, orderIndex: 3 },
            ],
        },
    ],
};

const mcq_ca_hard: McqDef = {
    title: 'Competitive Analysis — Case-Level Reasoning',
    instructions: 'Advanced questions requiring multi-framework synthesis and case-style reasoning.',
    context: `At the highest level of competitive analysis, frameworks become instruments of diagnosis rather than checklists. A McKinsey or BCG case interview expects candidates to define the problem precisely, structure an issue tree, identify the key drivers, and synthesise findings into a data-driven recommendation. MECE thinking (Mutually Exclusive, Collectively Exhaustive) ensures the analysis covers all causes without double-counting. Value chain analysis (Porter, 1985) decomposes firm activities into primary and support activities to identify where value is created and cost is incurred — pinpointing the highest-leverage improvement areas. Competitive dynamics analysis goes further: it maps competitor reaction patterns using game theory to anticipate how rivals will respond to strategic moves. At this level, the analyst must hold multiple frameworks simultaneously and choose the right lens for the question being asked.`,
    questions: [
        {
            questionText: 'A case interviewer says "Our client\'s profits have fallen 20% over two years. Diagnose the issue." The MECE issue tree should first split into:',
            explanation: 'Profit = Revenue − Cost. The first MECE split is Revenue vs. Cost — two exhaustive, non-overlapping branches. This is the standard top-level split for any profitability case. From there, each branch decomposes further (Revenue → Volume × Price; Cost → Fixed vs. Variable).',
            hints: [
                'Profit decline can come from only two sources: lower revenue or higher costs (or both).',
                'Revenue and Cost are mutually exclusive (one is not the other) and collectively exhaustive (nothing is missing).',
                'This is the classic first split in any profitability case framework.',
                'First split: Revenue vs. Cost.',
            ],
            orderIndex: 0,
            options: [
                { optionText: 'Internal issues vs. External issues', isCorrect: false, orderIndex: 0 },
                { optionText: 'Revenue vs. Cost', isCorrect: true, orderIndex: 1 },
                { optionText: 'Short-term vs. Long-term factors', isCorrect: false, orderIndex: 2 },
                { optionText: 'Product vs. Geography', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'In Porter\'s Value Chain, which activity is classified as a "Support Activity" rather than a "Primary Activity"?',
            explanation: 'Primary Activities directly create value: Inbound Logistics, Operations, Outbound Logistics, Marketing & Sales, Service. Support Activities enable primary activities: Firm Infrastructure, Human Resource Management, Technology Development, Procurement. Human Resource Management is a support activity.',
            hints: [
                'Primary activities are the direct steps in creating and delivering the product.',
                'Support activities are the backbone functions that enable primary activities.',
                'Inbound logistics, operations, outbound logistics, marketing, and service are all primary.',
                'Human Resource Management is a support activity.',
            ],
            orderIndex: 1,
            options: [
                { optionText: 'Outbound logistics', isCorrect: false, orderIndex: 0 },
                { optionText: 'Human Resource Management', isCorrect: true, orderIndex: 1 },
                { optionText: 'Marketing and Sales', isCorrect: false, orderIndex: 2 },
                { optionText: 'Service', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'A market leader is considering a 15% price cut to pre-empt a new entrant. Using game theory reasoning, the key question before acting is:',
            explanation: 'In game theory, rational players anticipate rivals\' responses. Before cutting price, the leader should model the entrant\'s likely reaction: will they match the cut (leading to a price war that destroys industry margins for everyone) or exit? A price war is only rational if the entrant will exit; if they match the cut, the incumbent destroys its own margins for no strategic gain.',
            hints: [
                'Game theory focuses on how one player\'s decision depends on the other player\'s response.',
                'If the entrant matches the price cut, what happens to both firms\' margins?',
                'The incumbent should only cut price if the entrant will exit rather than match.',
                'Key question: will the entrant exit or match the price cut?',
            ],
            orderIndex: 2,
            options: [
                { optionText: 'Whether the price cut will be reported in financial media', isCorrect: false, orderIndex: 0 },
                { optionText: 'Whether the entrant will exit or match the cut — determining if a price war is triggered', isCorrect: true, orderIndex: 1 },
                { optionText: 'Whether the incumbent has the lowest cost structure', isCorrect: false, orderIndex: 2 },
                { optionText: 'Whether the price cut is compliant with antitrust regulations', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'A firm\'s Five Forces analysis shows: low threat of new entrants (high capital requirements), weak buyer power (fragmented customers), moderate supplier power, high threat of substitutes, and high rivalry. What is the overall industry attractiveness assessment?',
            explanation: 'Of the five forces, two are attractive (low entrants, weak buyers), one is moderate (suppliers), and two are unattractive (substitutes, rivalry). The high threat of substitutes and high rivalry are particularly damaging — they cap pricing power and compress margins. Overall, this is a moderately unattractive industry.',
            hints: [
                'Tally the forces: low/moderate/high for each, then synthesise.',
                'High rivalry erodes margins directly. High substitute threat caps pricing power.',
                'Low entry barriers and weak buyer power partially offset, but cannot fully compensate.',
                'Two unattractive forces dominate — overall moderately unattractive.',
            ],
            orderIndex: 3,
            options: [
                { optionText: 'Highly attractive — low entrant threat dominates', isCorrect: false, orderIndex: 0 },
                { optionText: 'Moderately unattractive — substitutes and rivalry undermine profitability', isCorrect: true, orderIndex: 1 },
                { optionText: 'Neutral — forces perfectly balance', isCorrect: false, orderIndex: 2 },
                { optionText: 'Highly unattractive — all five forces are negative', isCorrect: false, orderIndex: 3 },
            ],
        },
    ],
};

// ══════════════════════════════════════════════════════════════════════════════
// 4. GROWTH STRATEGY
// ══════════════════════════════════════════════════════════════════════════════

const mcq_gs_easy: McqDef = {
    title: 'Growth Strategy — Fundamentals',
    instructions: 'Select the best answer for each foundational strategy question.',
    context: `Growth strategy defines how an organisation expands its revenues, profits, and market presence over time. Igor Ansoff's Growth Matrix is the entry-level framework: it classifies growth options by whether the firm sells existing or new products into existing or new markets. The four quadrants — Market Penetration, Market Development, Product Development, and Diversification — carry increasing risk and complexity as you move from leveraging existing capabilities to entering entirely new territory. Market penetration (more of the same product in the same market) is the lowest risk. Diversification (new product, new market) is the highest — it requires mastering two unknowns simultaneously. M&A is a common execution mechanism for market development and diversification strategies. Strategic alliances and joint ventures offer a lower-risk alternative when capabilities or capital are constrained.`,
    questions: [
        {
            questionText: 'In the Ansoff Growth Matrix, which quadrant represents selling existing products to new markets?',
            explanation: 'Market Development involves taking the company\'s current products into new customer segments or geographies. It leverages existing product capabilities while expanding the customer base — riskier than market penetration but less risky than product development.',
            hints: [
                'The Ansoff Matrix has two axes: Products (existing/new) and Markets (existing/new).',
                'Existing product + new market = ?',
                'Think of a domestic company expanding to an overseas market with its current product line.',
                'Market Development: existing product into a new market.',
            ],
            orderIndex: 0,
            options: [
                { optionText: 'Market Penetration', isCorrect: false, orderIndex: 0 },
                { optionText: 'Market Development', isCorrect: true, orderIndex: 1 },
                { optionText: 'Product Development', isCorrect: false, orderIndex: 2 },
                { optionText: 'Diversification', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'Which growth strategy carries the highest risk according to the Ansoff Matrix?',
            explanation: 'Diversification — new product into a new market — carries the most risk because the company is simultaneously navigating an unfamiliar product and an unfamiliar customer base. It has no existing expertise or relationships to leverage in either dimension.',
            hints: [
                'Risk increases as you move away from what you already know how to do.',
                'The riskiest strategy requires learning both a new product AND a new market.',
                'Think of a car manufacturer entering the pharmaceutical industry.',
                'Diversification (new product + new market) is highest risk.',
            ],
            orderIndex: 1,
            options: [
                { optionText: 'Market Penetration', isCorrect: false, orderIndex: 0 },
                { optionText: 'Market Development', isCorrect: false, orderIndex: 1 },
                { optionText: 'Product Development', isCorrect: false, orderIndex: 2 },
                { optionText: 'Diversification', isCorrect: true, orderIndex: 3 },
            ],
        },
        {
            questionText: 'Horizontal integration occurs when a company:',
            explanation: 'Horizontal integration means acquiring or merging with a direct competitor at the same stage of the value chain. It increases market share, reduces competition, and creates economies of scale. Vertical integration, by contrast, means acquiring a supplier or distributor.',
            hints: [
                'Integration can be horizontal (same level) or vertical (up/down the chain).',
                'Horizontal = combining with a company at the same stage of production.',
                'Think of two competing airlines merging.',
                'Horizontal integration: acquiring a competitor at the same value chain stage.',
            ],
            orderIndex: 2,
            options: [
                { optionText: 'Acquires a supplier to control input costs', isCorrect: false, orderIndex: 0 },
                { optionText: 'Acquires a direct competitor at the same value chain stage', isCorrect: true, orderIndex: 1 },
                { optionText: 'Acquires a distributor to control its retail channel', isCorrect: false, orderIndex: 2 },
                { optionText: 'Enters a joint venture with an unrelated business', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'A company with strong brand equity in smartphones launches a smartwatch. This is best described as:',
            explanation: 'Launching a new product (smartwatch) while staying in an existing customer market (tech-savvy smartphone users) is Product Development. The company leverages its existing brand and customer relationships while developing new capabilities.',
            hints: [
                'Map it to the Ansoff Matrix: what type of product, what type of market?',
                'The smartwatch is a new product category for the company.',
                'But the target customers are largely the same smartphone-owning market.',
                'New product + existing market = Product Development.',
            ],
            orderIndex: 3,
            options: [
                { optionText: 'Market Penetration', isCorrect: false, orderIndex: 0 },
                { optionText: 'Market Development', isCorrect: false, orderIndex: 1 },
                { optionText: 'Product Development', isCorrect: true, orderIndex: 2 },
                { optionText: 'Diversification', isCorrect: false, orderIndex: 3 },
            ],
        },
    ],
};

const mcq_gs_medium: McqDef = {
    title: 'Growth Strategy — Strategic Planning',
    instructions: 'Apply growth strategy concepts to real business scenarios.',
    context: `Executing a growth strategy requires translating a high-level direction into specific, measurable initiatives. The OKR (Objectives and Key Results) framework, pioneered at Intel and popularised by Google, links ambitious objectives to measurable outcomes. Blue Ocean Strategy (Kim & Mauborgne) argues that sustained growth comes not from competing harder in existing markets (red oceans) but from creating entirely new demand in uncontested space (blue oceans) — making competition irrelevant. Platform businesses and network effect strategies have become dominant growth models in the digital era, since each additional user adds value for all other users, creating winner-take-most dynamics. Organic growth (internal investment) and inorganic growth (M&A, JV) each have distinct trade-offs in speed, cost, execution risk, and strategic control. Understanding which lever to pull in which context is the hallmark of a skilled strategist.`,
    questions: [
        {
            questionText: 'A company creates an entirely new product category with no direct competition. This is best described as:',
            explanation: 'Blue Ocean Strategy involves creating new market space (blue ocean) where no competitors exist yet — making direct comparison irrelevant. The firm simultaneously differentiates and reduces costs by eliminating features the industry takes for granted and adding value that customers have never been offered.',
            hints: [
                'Blue vs. Red: Red oceans are crowded markets; Blue oceans are new, uncontested space.',
                'If there are no direct competitors, you\'ve created a new market.',
                'Blue Ocean Strategy focuses on value innovation — creating new demand rather than competing.',
                'Creating an uncontested market space = Blue Ocean Strategy.',
            ],
            orderIndex: 0,
            options: [
                { optionText: 'Competitive advantage through cost leadership', isCorrect: false, orderIndex: 0 },
                { optionText: 'Blue Ocean Strategy — creating uncontested market space', isCorrect: true, orderIndex: 1 },
                { optionText: 'Market Penetration — selling more in an existing market', isCorrect: false, orderIndex: 2 },
                { optionText: 'Horizontal integration with a competitor', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'A platform business has 1 million users. Adding the next 1 million users creates more value per user than the first million did. This describes:',
            explanation: 'Network effects occur when a product or service becomes more valuable as more people use it. Platforms like Uber, Airbnb, and LinkedIn exhibit this property. It creates a powerful competitive moat — once a platform achieves critical mass, it becomes self-reinforcing.',
            hints: [
                'Think about how a phone network becomes more valuable as more people join it.',
                'Each new user creates additional value for all existing users.',
                'This is why digital platforms tend toward monopoly or duopoly.',
                'This is the network effect — more users = more value per user.',
            ],
            orderIndex: 1,
            options: [
                { optionText: 'Economies of scale', isCorrect: false, orderIndex: 0 },
                { optionText: 'Network effects', isCorrect: true, orderIndex: 1 },
                { optionText: 'First-mover advantage', isCorrect: false, orderIndex: 2 },
                { optionText: 'Vertical integration', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'M&A delivers growth faster than organic investment. The key risk that frequently destroys deal value is:',
            explanation: 'Studies consistently show that 50–70% of M&A transactions destroy value. The most common cause is poor post-merger integration — cultural clashes, system incompatibilities, talent attrition, and customer confusion that erode the expected synergies. Deals fail not in negotiation but in execution.',
            hints: [
                'M&A is fast — but paying the right price and executing the deal are different problems.',
                'Most M&A value destruction happens after the deal closes, not before.',
                'What makes two companies harder to combine after they\'ve been bought?',
                'Post-merger integration failure is the #1 cause of M&A value destruction.',
            ],
            orderIndex: 2,
            options: [
                { optionText: 'Regulatory approval delays', isCorrect: false, orderIndex: 0 },
                { optionText: 'Post-merger integration failure destroying expected synergies', isCorrect: true, orderIndex: 1 },
                { optionText: 'Overpaying for the target company', isCorrect: false, orderIndex: 2 },
                { optionText: 'Insufficient due diligence on financials', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'The OKR framework sets an Objective as "Become the market leader in APAC by FY2026". A good Key Result for this objective would be:',
            explanation: 'Key Results must be measurable, time-bound, and directly indicative of the objective\'s achievement. "Achieve 30% market share in APAC by Q4 FY2026" is specific, measurable, and directly tied to market leadership. Vague actions like "expand our presence" are not good Key Results — they describe activity, not outcome.',
            hints: [
                'Key Results answer "how will we know if we achieved the objective?"',
                'A good KR is measurable with a number and a deadline.',
                '"Expand our presence" is an activity — not a measurable outcome.',
                '"Achieve X% market share by Q4 FY2026" is a measurable Key Result.',
            ],
            orderIndex: 3,
            options: [
                { optionText: 'Expand our presence across APAC markets', isCorrect: false, orderIndex: 0 },
                { optionText: 'Hire 50 new sales representatives in APAC', isCorrect: false, orderIndex: 1 },
                { optionText: 'Achieve 30% market share in APAC by Q4 FY2026', isCorrect: true, orderIndex: 2 },
                { optionText: 'Improve customer satisfaction in the APAC region', isCorrect: false, orderIndex: 3 },
            ],
        },
    ],
};

const mcq_gs_hard: McqDef = {
    title: 'Growth Strategy — Advanced Strategic Reasoning',
    instructions: 'Case-level questions on strategy formulation, M&A logic, and competitive positioning.',
    context: `Advanced growth strategy requires quantitative rigour alongside qualitative judgement. Market sizing (TAM, SAM, SOM) gives a growth ceiling; penetration modelling shows the trajectory. M&A valuation requires synergy identification, a standalone DCF of the target, and a synergised DCF — the spread represents the maximum premium the acquirer can pay while creating value. Platform strategy requires understanding which side of a multi-sided market to subsidise to achieve network critical mass (e.g., Uber initially subsidised drivers; Airbnb subsidised early hosts). The GE-McKinsey Nine-Box Matrix extends BCG by rating Business Unit Attractiveness and Competitive Strength on nine gradations rather than two, enabling more nuanced capital allocation. Applying these tools in an integrated, data-driven argument under time pressure is what distinguishes senior strategists from junior analysts.`,
    questions: [
        {
            questionText: 'A company\'s TAM is $20B, SAM is $8B, and SOM is $1.2B. Its current revenue is $400M. What is its current SOM penetration rate?',
            explanation: 'SOM penetration = Current Revenue / SOM = 400 / 1,200 = 33.3%. The company has captured one third of its serviceable obtainable market — showing substantial room to grow within its defined addressable space without needing to expand the market definition.',
            hints: [
                'SOM is the portion of SAM the company can realistically capture.',
                'Current penetration = Current Revenue ÷ SOM.',
                '400 ÷ 1,200 = ?',
                'SOM penetration = 400/1,200 = 33.3%.',
            ],
            orderIndex: 0,
            options: [
                { optionText: '5.0% — measured against TAM', isCorrect: false, orderIndex: 0 },
                { optionText: '33.3% — measured against SOM', isCorrect: true, orderIndex: 1 },
                { optionText: '50.0% — measured against SAM', isCorrect: false, orderIndex: 2 },
                { optionText: '2.0% — current revenue / TAM', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'Acquirer values Target standalone at $500M. With synergies, the combined value is $700M. What is the maximum premium the acquirer can pay and still create value?',
            explanation: 'Maximum premium = Total synergy value = $700M − $500M = $200M. If the acquirer pays more than $200M above standalone value (i.e., above $700M total), they are paying more than the synergies are worth and will destroy value. This is why many deals overpay.',
            hints: [
                'The acquirer creates value only when the total price paid is less than the combined (synergised) value.',
                'Maximum price = Standalone Value + Total Synergy Value = $700M.',
                'Maximum premium above standalone = $700M − $500M = $200M.',
                'Paying more than $200M above standalone destroys value.',
            ],
            orderIndex: 1,
            options: [
                { optionText: '$500M premium above standalone', isCorrect: false, orderIndex: 0 },
                { optionText: '$200M premium — the full value of synergies', isCorrect: true, orderIndex: 1 },
                { optionText: '$100M premium — half the synergy value as safety buffer', isCorrect: false, orderIndex: 2 },
                { optionText: '$700M — the total combined value', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'A two-sided platform is deciding which side to subsidise to reach critical mass. The correct principle is:',
            explanation: 'In a two-sided platform, the side whose participation creates more value for the other side should be subsidised first. Uber subsidised drivers initially because without a reliable supply of drivers, the rider experience is poor and riders won\'t join. Once supply is thick, demand follows. This is the "solve the chicken-and-egg" problem.',
            hints: [
                'Two-sided markets require both sides to be present for value to be created.',
                'The chicken-and-egg problem: neither side joins without the other.',
                'Subsidise the side whose participation is harder to attract or whose presence creates more value for the other.',
                'Subsidise the constrained side — typically the supply side — first.',
            ],
            orderIndex: 2,
            options: [
                { optionText: 'Always subsidise the demand side (buyers) first', isCorrect: false, orderIndex: 0 },
                { optionText: 'Subsidise the side whose participation creates more value for the other side', isCorrect: true, orderIndex: 1 },
                { optionText: 'Subsidise both sides equally to maintain balance', isCorrect: false, orderIndex: 2 },
                { optionText: 'Subsidise the side with the higher willingness to pay', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'In the GE-McKinsey Nine-Box Matrix, a Business Unit rated HIGH on Industry Attractiveness and MEDIUM on Competitive Strength should be:',
            explanation: 'In the GE-McKinsey Matrix, the top-left three boxes (high attractiveness + high/medium strength, and medium attractiveness + high strength) are "invest and grow" zones. HIGH attractiveness + MEDIUM strength is in the green invest zone — the industry is very attractive and the unit has reasonable competitive position, so investing to strengthen position is rational.',
            hints: [
                'GE-McKinsey: high attractiveness + high strength = Invest. Low on both = Divest.',
                'HIGH attractiveness is a very positive signal — the industry is worth being in.',
                'MEDIUM competitive strength means the unit is a credible player, not a laggard.',
                'HIGH attractiveness + MEDIUM strength = Invest/Selectively Invest zone.',
            ],
            orderIndex: 3,
            options: [
                { optionText: 'Divested — medium competitive strength is insufficient', isCorrect: false, orderIndex: 0 },
                { optionText: 'Invested in — the attractive industry warrants building competitive strength', isCorrect: true, orderIndex: 1 },
                { optionText: 'Harvested for cash — treat as a Cash Cow', isCorrect: false, orderIndex: 2 },
                { optionText: 'Left unchanged pending further analysis', isCorrect: false, orderIndex: 3 },
            ],
        },
    ],
};

// ══════════════════════════════════════════════════════════════════════════════
// 5. DEMAND PLANNING
// ══════════════════════════════════════════════════════════════════════════════

const mcq_dp_easy: McqDef = {
    title: 'Demand Planning — Fundamentals',
    instructions: 'Choose the best answer for each foundational question.',
    context: `Demand planning is the process of forecasting customer demand to ensure that supply chain resources — inventory, production capacity, and logistics — are aligned with expected sales volumes. Accurate demand planning reduces the cost of excess inventory while preventing stockouts that lose revenue and damage customer relationships. The key challenge is that demand is inherently uncertain, driven by seasonality, promotions, economic conditions, and competitor actions. Forecasting methods range from simple moving averages (historical average of recent periods) to exponential smoothing (weighted average giving more weight to recent data) to advanced machine learning models that incorporate dozens of variables. The choice of method depends on data availability, forecast horizon, and the cost asymmetry between over- and under-forecasting.`,
    questions: [
        {
            questionText: 'What is the primary goal of demand planning?',
            explanation: 'Demand planning aims to align supply chain resources with forecasted customer demand — ensuring adequate stock to serve demand while avoiding the cost of excess inventory. It bridges the sales forecast with operations, procurement, and logistics.',
            hints: [
                'Think about what goes wrong when demand is higher or lower than expected.',
                'Stockouts lose sales. Excess inventory ties up cash and risks obsolescence.',
                'Demand planning tries to match supply to expected demand as closely as possible.',
                'The goal is to optimise inventory levels by accurately forecasting demand.',
            ],
            orderIndex: 0,
            options: [
                { optionText: 'Maximise production output regardless of sales', isCorrect: false, orderIndex: 0 },
                { optionText: 'Align supply chain resources with forecasted customer demand', isCorrect: true, orderIndex: 1 },
                { optionText: 'Minimise procurement costs at all times', isCorrect: false, orderIndex: 2 },
                { optionText: 'Eliminate all inventory from the supply chain', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'A 3-month moving average demand forecast uses sales from months 4, 5, and 6 to forecast month 7. Month 4 = 100, Month 5 = 120, Month 6 = 110. What is the forecast for month 7?',
            explanation: 'Simple moving average = (100 + 120 + 110) / 3 = 330 / 3 = 110 units.',
            hints: [
                'Moving average = sum of the N most recent periods ÷ N.',
                'Add the three months: 100 + 120 + 110 = 330.',
                'Divide by 3.',
                'Forecast = 330 / 3 = 110 units.',
            ],
            orderIndex: 1,
            options: [
                { optionText: '100 units', isCorrect: false, orderIndex: 0 },
                { optionText: '110 units', isCorrect: true, orderIndex: 1 },
                { optionText: '120 units', isCorrect: false, orderIndex: 2 },
                { optionText: '115 units', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'The "bullwhip effect" in supply chains refers to:',
            explanation: 'The bullwhip effect describes how small fluctuations in consumer demand become amplified as orders move upstream through the supply chain. A retailer ordering slightly more to buffer uncertainty causes a wholesaler to order even more, which causes the manufacturer to see massive demand swings — even though end-consumer demand was relatively stable.',
            hints: [
                'Think about how a small flick of a whip handle creates a large crack at the tip.',
                'Small demand variability at the consumer level becomes amplified at each upstream stage.',
                'Each layer in the supply chain adds a safety buffer, compounding the distortion.',
                'Bullwhip effect: demand variability amplifies as it moves upstream through the supply chain.',
            ],
            orderIndex: 2,
            options: [
                { optionText: 'A sudden spike in consumer demand caused by promotions', isCorrect: false, orderIndex: 0 },
                { optionText: 'Demand variability amplifying as it moves upstream through the supply chain', isCorrect: true, orderIndex: 1 },
                { optionText: 'The lag between placing an order and receiving inventory', isCorrect: false, orderIndex: 2 },
                { optionText: 'A supply shortage caused by a single supplier failure', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'Safety stock is held to protect against:',
            explanation: 'Safety stock is buffer inventory held above expected demand to guard against two sources of uncertainty: demand being higher than forecast and lead time being longer than expected. It is the operational cushion that prevents stockouts when forecasts are wrong.',
            hints: [
                'Safety stock is extra inventory beyond what the forecast predicts you need.',
                'Think about when you would need that extra stock.',
                'Two things can go wrong: demand exceeds forecast, or suppliers deliver late.',
                'Safety stock protects against demand uncertainty and lead time variability.',
            ],
            orderIndex: 3,
            options: [
                { optionText: 'Planned promotions and seasonal peaks', isCorrect: false, orderIndex: 0 },
                { optionText: 'Demand uncertainty and lead time variability', isCorrect: true, orderIndex: 1 },
                { optionText: 'Excess capacity at the manufacturing plant', isCorrect: false, orderIndex: 2 },
                { optionText: 'Currency fluctuations affecting procurement cost', isCorrect: false, orderIndex: 3 },
            ],
        },
    ],
};

const mcq_dp_medium: McqDef = {
    title: 'Demand Planning — Forecasting Methods',
    instructions: 'Apply demand planning techniques to operational scenarios.',
    context: `Intermediate demand planning requires choosing the right forecasting method for the situation and calculating key inventory metrics. Exponential smoothing gives more weight to recent data using a smoothing parameter α (0 < α < 1). A higher α reacts faster to changes but is noisier; a lower α is smoother but slower to adapt. The Economic Order Quantity (EOQ) model calculates the optimal order size that minimises total inventory cost (ordering cost + holding cost). Reorder Point (ROP) = average demand during lead time + safety stock — it tells you at what inventory level to place a new order. Service level (fill rate or cycle service level) quantifies the probability of meeting demand from stock. Demand planning in practice requires cross-functional alignment between Sales, Finance, and Operations — each function has different incentives that must be reconciled into a single agreed number.`,
    questions: [
        {
            questionText: 'Exponential smoothing forecast with α = 0.4. Last forecast = 200 units, actual demand = 240 units. What is the new forecast?',
            explanation: 'New Forecast = α × Actual + (1−α) × Last Forecast = 0.4 × 240 + 0.6 × 200 = 96 + 120 = 216 units.',
            hints: [
                'Exponential smoothing: New Forecast = α × Actual + (1−α) × Previous Forecast.',
                'α = 0.4, so (1−α) = 0.6.',
                '0.4 × 240 = 96. 0.6 × 200 = 120.',
                'New Forecast = 96 + 120 = 216 units.',
            ],
            orderIndex: 0,
            options: [
                { optionText: '220 units', isCorrect: false, orderIndex: 0 },
                { optionText: '216 units', isCorrect: true, orderIndex: 1 },
                { optionText: '228 units', isCorrect: false, orderIndex: 2 },
                { optionText: '210 units', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'The Economic Order Quantity (EOQ) formula is √(2DS/H). D = 10,000 units/yr, S = $50/order, H = $2/unit/yr. What is EOQ?',
            explanation: 'EOQ = √(2 × 10,000 × 50 / 2) = √(1,000,000 / 2) = √500,000 = 707 units (rounded).',
            hints: [
                'EOQ = √(2 × Annual Demand × Ordering Cost / Holding Cost per Unit).',
                'Numerator = 2 × 10,000 × 50 = 1,000,000.',
                'Divide by H = 2: 1,000,000 / 2 = 500,000.',
                'EOQ = √500,000 ≈ 707 units.',
            ],
            orderIndex: 1,
            options: [
                { optionText: '500 units', isCorrect: false, orderIndex: 0 },
                { optionText: '707 units', isCorrect: true, orderIndex: 1 },
                { optionText: '1,000 units', isCorrect: false, orderIndex: 2 },
                { optionText: '354 units', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'Average daily demand = 50 units, lead time = 5 days, safety stock = 100 units. What is the Reorder Point (ROP)?',
            explanation: 'ROP = (Average Daily Demand × Lead Time) + Safety Stock = (50 × 5) + 100 = 250 + 100 = 350 units. When inventory falls to 350 units, place a new order.',
            hints: [
                'ROP = demand during lead time + safety stock.',
                'Demand during lead time = 50 units/day × 5 days = 250 units.',
                'Add safety stock: 250 + 100.',
                'ROP = 350 units.',
            ],
            orderIndex: 2,
            options: [
                { optionText: '250 units', isCorrect: false, orderIndex: 0 },
                { optionText: '350 units', isCorrect: true, orderIndex: 1 },
                { optionText: '150 units', isCorrect: false, orderIndex: 2 },
                { optionText: '450 units', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'To reduce the bullwhip effect, which practice is most effective?',
            explanation: 'Sharing real-time point-of-sale (POS) data upstream directly addresses the root cause of the bullwhip effect — information distortion. When each supply chain participant can see actual consumer demand rather than inferred orders, they don\'t need to add excessive safety buffers.',
            hints: [
                'The bullwhip effect is caused by information distortion and demand amplification.',
                'If every player could see actual end-consumer sales, would they still over-order?',
                'VMI (Vendor-Managed Inventory) and POS data sharing are classic solutions.',
                'Sharing real-time POS data directly eliminates the information distortion that causes bullwhip.',
            ],
            orderIndex: 3,
            options: [
                { optionText: 'Holding more safety stock at every supply chain stage', isCorrect: false, orderIndex: 0 },
                { optionText: 'Sharing real-time point-of-sale data upstream with suppliers', isCorrect: true, orderIndex: 1 },
                { optionText: 'Ordering less frequently to reduce order processing costs', isCorrect: false, orderIndex: 2 },
                { optionText: 'Increasing the number of suppliers to improve competition', isCorrect: false, orderIndex: 3 },
            ],
        },
    ],
};

const mcq_dp_hard: McqDef = {
    title: 'Demand Planning — Advanced Analytics & S&OP',
    instructions: 'Advanced demand planning: statistical forecasting, S&OP process design, and scenario modelling.',
    context: `Advanced demand planning integrates statistical forecasting with collaborative business processes. Sales & Operations Planning (S&OP) is a monthly cross-functional process that aligns unconstrained demand forecasts with supply capacity to produce a balanced operational plan. The S&OP cycle includes Demand Review, Supply Review, Financial Reconciliation, and Executive Sign-off. Mean Absolute Percentage Error (MAPE) is the standard forecast accuracy metric — it measures average percentage deviation from actuals. Bias (systematic over- or under-forecasting) is a separate concern: a forecast can have low MAPE but high bias if errors consistently go in one direction. Demand sensing uses high-frequency data (daily POS, social signals, weather) to update the near-term forecast in real time. Probabilistic forecasting provides a distribution of demand outcomes rather than a point estimate — enabling smarter safety stock and risk management decisions.`,
    questions: [
        {
            questionText: 'MAPE (Mean Absolute Percentage Error) for a 3-period forecast: Actuals = [100, 150, 120], Forecasts = [110, 140, 130]. What is MAPE?',
            explanation: 'MAPE = average of |Actual−Forecast| / Actual. Period 1: |100−110|/100 = 10%. Period 2: |150−140|/150 = 6.67%. Period 3: |120−130|/120 = 8.33%. MAPE = (10+6.67+8.33)/3 = 25/3 = 8.33%.',
            hints: [
                'MAPE = (1/n) × Σ |Actual − Forecast| / Actual × 100%.',
                'Period 1: |100−110|/100 = 10%. Period 2: |150−140|/150 = 6.67%. Period 3: |120−130|/120 = 8.33%.',
                'Average = (10 + 6.67 + 8.33) / 3.',
                'MAPE = 25 / 3 = 8.33%.',
            ],
            orderIndex: 0,
            options: [
                { optionText: '6.67%', isCorrect: false, orderIndex: 0 },
                { optionText: '8.33%', isCorrect: true, orderIndex: 1 },
                { optionText: '10.0%', isCorrect: false, orderIndex: 2 },
                { optionText: '7.5%', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'A forecast consistently over-predicts demand by 15% every month. This is a problem of:',
            explanation: 'Forecast bias is systematic directional error — consistently over- or under-predicting by a similar amount. It is distinct from MAPE (which measures average magnitude of error). Bias causes structural excess inventory (if over-forecast) or recurring stockouts (if under-forecast) and must be corrected through model recalibration or process adjustment.',
            hints: [
                'Random errors cancel out over time. Systematic errors in one direction do not.',
                'Consistently over-predicting by 15% is not random — it is a pattern.',
                'This pattern is called forecast bias.',
                'Bias = systematic directional error in forecasting.',
            ],
            orderIndex: 1,
            options: [
                { optionText: 'High MAPE — the forecast is inaccurate', isCorrect: false, orderIndex: 0 },
                { optionText: 'Forecast bias — systematic directional error', isCorrect: true, orderIndex: 1 },
                { optionText: 'Demand volatility — unpredictable market conditions', isCorrect: false, orderIndex: 2 },
                { optionText: 'Bullwhip effect — amplification through the supply chain', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'In the S&OP process, the Demand Review step produces:',
            explanation: 'The Demand Review brings together Sales, Marketing, and demand planning to review recent performance against forecast and produce an unconstrained demand plan — what customers are expected to want, regardless of supply capacity. The Supply Review then checks whether the organisation can actually meet that demand.',
            hints: [
                'S&OP steps in order: Demand Review → Supply Review → Financial Reconciliation → Exec sign-off.',
                '"Unconstrained" means it doesn\'t yet account for capacity limitations.',
                'Demand Review is owned by Sales and Marketing — they know what customers want.',
                'Output = unconstrained demand plan (what demand will be, before supply limits are applied).',
            ],
            orderIndex: 2,
            options: [
                { optionText: 'A production schedule constrained by factory capacity', isCorrect: false, orderIndex: 0 },
                { optionText: 'An unconstrained demand plan aligned with sales and marketing inputs', isCorrect: true, orderIndex: 1 },
                { optionText: 'A financial P&L projection for the year', isCorrect: false, orderIndex: 2 },
                { optionText: 'A supplier procurement plan for raw materials', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'Probabilistic forecasting provides a demand distribution rather than a point estimate. The key operational benefit is:',
            explanation: 'With a probabilistic forecast (e.g., 10th/50th/90th percentile demand), planners can set safety stock to achieve a target service level — e.g., hold stock sufficient to meet the 90th percentile demand. A single-point forecast cannot support this decision scientifically; it forces arbitrary buffer additions.',
            hints: [
                'A point forecast gives one number. A probabilistic forecast gives a range.',
                'Safety stock is meant to cover uncertainty — which forecast better quantifies uncertainty?',
                'With a distribution, you can say: "to hit 95% service level, hold this much stock."',
                'Probabilistic forecasting enables scientifically calibrated safety stock calculations.',
            ],
            orderIndex: 3,
            options: [
                { optionText: 'Eliminates the need for safety stock entirely', isCorrect: false, orderIndex: 0 },
                { optionText: 'Enables safety stock to be scientifically set to a target service level', isCorrect: true, orderIndex: 1 },
                { optionText: 'Simplifies S&OP by removing uncertainty from planning', isCorrect: false, orderIndex: 2 },
                { optionText: 'Replaces human judgement entirely with machine output', isCorrect: false, orderIndex: 3 },
            ],
        },
    ],
};

// ══════════════════════════════════════════════════════════════════════════════
// 6. PROCESS DESIGN
// ══════════════════════════════════════════════════════════════════════════════

const mcq_pd_easy: McqDef = {
    title: 'Process Design — Fundamentals',
    instructions: 'Select the best answer for each foundational process design question.',
    context: `Process design is the structured approach to defining, documenting, and optimising the sequence of activities that transform inputs into outputs. A well-designed process minimises waste (non-value-adding activities), reduces cycle time, improves quality consistency, and scales efficiently. Lean thinking — pioneered by Toyota — provides the foundational vocabulary: value streams, waste (muda), flow, pull systems, and continuous improvement (kaizen). The eight wastes in Lean (TIMWOODS: Transport, Inventory, Motion, Waiting, Overproduction, Overprocessing, Defects, Skills) are the lenses through which every process step is examined. Process flow diagrams (swimlane, SIPOC, value stream maps) visualise the current state and reveal improvement opportunities. Good process design is not a one-time exercise — it is embedded in a culture of continuous, incremental improvement.`,
    questions: [
        {
            questionText: 'In Lean thinking, which of the following is NOT one of the eight wastes (TIMWOODS)?',
            explanation: 'TIMWOODS: Transport, Inventory, Motion, Waiting, Overproduction, Overprocessing, Defects, Skills (underutilised). "Procurement" is a business function, not a Lean waste category.',
            hints: [
                'The TIMWOODS acronym covers the eight Lean wastes.',
                'T=Transport, I=Inventory, M=Motion, W=Waiting, O=Overproduction, O=Overprocessing, D=Defects, S=Skills.',
                'Check each option against TIMWOODS.',
                'Procurement is not one of the eight Lean wastes.',
            ],
            orderIndex: 0,
            options: [
                { optionText: 'Overproduction', isCorrect: false, orderIndex: 0 },
                { optionText: 'Procurement', isCorrect: true, orderIndex: 1 },
                { optionText: 'Waiting', isCorrect: false, orderIndex: 2 },
                { optionText: 'Defects', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'A process step that consumes resources but adds no value from the customer\'s perspective is called:',
            explanation: 'Non-value-adding (NVA) activity is any step the customer would not pay for if they knew it existed. Examples include rework, approvals, unnecessary data entry, and internal handoffs. Lean aims to eliminate NVA activities or minimise their proportion of total process time.',
            hints: [
                'Value is defined from the customer\'s perspective — they pay for value-adding steps.',
                'Would a customer pay extra to have this step done? If not, it\'s non-value-adding.',
                'Examples: waiting for approvals, correcting errors, redundant checks.',
                'Non-value-adding (NVA) activity: consumes resources but doesn\'t create customer value.',
            ],
            orderIndex: 1,
            options: [
                { optionText: 'A value-added activity', isCorrect: false, orderIndex: 0 },
                { optionText: 'A non-value-adding (NVA) activity — waste', isCorrect: true, orderIndex: 1 },
                { optionText: 'A critical path activity', isCorrect: false, orderIndex: 2 },
                { optionText: 'A support activity', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'In process design, the "bottleneck" is defined as:',
            explanation: 'The bottleneck is the slowest step in a process — the one with the lowest throughput rate. It determines the maximum output of the entire process. No matter how fast other steps are, the process output is capped at the bottleneck\'s rate.',
            hints: [
                'Think of water flowing through a pipe with one narrow section.',
                'The overall flow rate is limited by the narrowest section.',
                'The bottleneck constrains total output regardless of how fast other steps run.',
                'Bottleneck = slowest step in the process; it determines maximum throughput.',
            ],
            orderIndex: 2,
            options: [
                { optionText: 'The most expensive step in the process', isCorrect: false, orderIndex: 0 },
                { optionText: 'The step with the highest error rate', isCorrect: false, orderIndex: 1 },
                { optionText: 'The slowest step that limits overall process throughput', isCorrect: true, orderIndex: 2 },
                { optionText: 'The first step in the process flow', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'A SIPOC diagram maps a process using five elements. What does SIPOC stand for?',
            explanation: 'SIPOC = Suppliers, Inputs, Process, Outputs, Customers. It is a high-level process mapping tool that defines the scope of a process and its key stakeholders before detailed mapping begins.',
            hints: [
                'SIPOC is a 5-element process scope tool used in Lean and Six Sigma.',
                'Start from both ends: who provides inputs (Suppliers) and who receives outputs (Customers)?',
                'S=Suppliers, I=Inputs, P=Process, O=Outputs, C=Customers.',
                'SIPOC: Suppliers, Inputs, Process, Outputs, Customers.',
            ],
            orderIndex: 3,
            options: [
                { optionText: 'Scope, Inputs, Performance, Outputs, Control', isCorrect: false, orderIndex: 0 },
                { optionText: 'Suppliers, Inputs, Process, Outputs, Customers', isCorrect: true, orderIndex: 1 },
                { optionText: 'Strategy, Integration, Process, Operations, Cost', isCorrect: false, orderIndex: 2 },
                { optionText: 'Systems, Inventory, Production, Order, Cycle', isCorrect: false, orderIndex: 3 },
            ],
        },
    ],
};

const mcq_pd_medium: McqDef = {
    title: 'Process Design — Lean & Six Sigma',
    instructions: 'Apply Lean and Six Sigma concepts to process improvement scenarios.',
    context: `Intermediate process design bridges conceptual frameworks with practical tools. Six Sigma uses statistical methods to measure and reduce process variation — its DMAIC cycle (Define, Measure, Analyse, Improve, Control) provides a structured improvement methodology. A process is "Six Sigma capable" when the defect rate is below 3.4 per million opportunities — achieved by ensuring the process mean is at least six standard deviations from the nearest specification limit. Value Stream Mapping (VSM) visualises both value-adding and non-value-adding activities across the entire flow from supplier to customer, making waste visible and enabling targeted improvement. Pull systems (kanban) are preferable to push systems because they produce only what downstream demand requires — reducing overproduction waste. Takt time = Available Production Time / Customer Demand — it sets the drumbeat that the process must match to meet demand without overproducing.`,
    questions: [
        {
            questionText: 'Takt time = Available Production Time / Customer Demand. If available time = 7.5 hours/day and demand = 150 units/day, what is takt time?',
            explanation: 'Takt time = 7.5 hours / 150 units = 0.05 hours/unit = 3 minutes/unit. The process must produce one unit every 3 minutes to match customer demand without overproduction.',
            hints: [
                'Convert hours to minutes: 7.5 hours = 450 minutes.',
                'Takt time = 450 minutes ÷ 150 units.',
                'Each unit must take no longer than 3 minutes to maintain pace with demand.',
                'Takt time = 3 minutes per unit.',
            ],
            orderIndex: 0,
            options: [
                { optionText: '2 minutes per unit', isCorrect: false, orderIndex: 0 },
                { optionText: '3 minutes per unit', isCorrect: true, orderIndex: 1 },
                { optionText: '5 minutes per unit', isCorrect: false, orderIndex: 2 },
                { optionText: '4.5 minutes per unit', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'In the DMAIC cycle, what is the purpose of the "Measure" phase?',
            explanation: 'The Measure phase establishes baseline process performance by collecting current data — quantifying the current defect rate, cycle time, or other quality metrics. Without a baseline, improvement cannot be measured and root cause analysis lacks quantitative grounding.',
            hints: [
                'DMAIC: Define (problem) → Measure (baseline) → Analyse (root cause) → Improve → Control.',
                '"You can\'t improve what you can\'t measure."',
                'Before fixing anything, you need to know exactly how bad the current state is.',
                'Measure phase: establish a quantitative baseline of current process performance.',
            ],
            orderIndex: 1,
            options: [
                { optionText: 'Identify the root causes of defects', isCorrect: false, orderIndex: 0 },
                { optionText: 'Establish a quantitative baseline of current process performance', isCorrect: true, orderIndex: 1 },
                { optionText: 'Implement process changes and pilot solutions', isCorrect: false, orderIndex: 2 },
                { optionText: 'Define the project scope and customer requirements', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'A kanban pull system produces only when the downstream stage sends a signal. The primary waste it eliminates is:',
            explanation: 'Kanban is a pull system — it produces only when downstream demand triggers it. This directly eliminates Overproduction, which Lean considers the most dangerous waste because it masks other problems and ties up capital in inventory that may never be sold.',
            hints: [
                'Pull systems produce only in response to downstream demand signals.',
                'The opposite is a push system — which produces based on forecasts, often leading to excess.',
                'What happens in a push system when production runs faster than demand?',
                'Kanban eliminates Overproduction waste.',
            ],
            orderIndex: 2,
            options: [
                { optionText: 'Defects', isCorrect: false, orderIndex: 0 },
                { optionText: 'Overproduction', isCorrect: true, orderIndex: 1 },
                { optionText: 'Motion', isCorrect: false, orderIndex: 2 },
                { optionText: 'Transport', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'A Value Stream Map shows 8 process steps. Total value-adding time = 15 minutes. Total lead time = 5 days. Process Cycle Efficiency (PCE) is:',
            explanation: 'PCE = Value-Adding Time / Total Lead Time. Convert 5 days to minutes: 5 × 480 = 2,400 minutes (assuming 8-hour days). PCE = 15 / 2,400 = 0.625% — shockingly low, as is typical in most processes where the vast majority of time is spent waiting, not working.',
            hints: [
                'PCE = Value-Adding Time ÷ Total Lead Time (both in same units).',
                'Convert 5 days to minutes: 5 days × 8 hrs × 60 min = 2,400 minutes.',
                '15 ÷ 2,400 = 0.00625.',
                'PCE = 0.625% — most time is non-value-adding waiting.',
            ],
            orderIndex: 3,
            options: [
                { optionText: '3.0%', isCorrect: false, orderIndex: 0 },
                { optionText: '0.625%', isCorrect: true, orderIndex: 1 },
                { optionText: '18.75%', isCorrect: false, orderIndex: 2 },
                { optionText: '1.25%', isCorrect: false, orderIndex: 3 },
            ],
        },
    ],
};

const mcq_pd_hard: McqDef = {
    title: 'Process Design — Advanced Optimisation & Design',
    instructions: 'Hard questions on process capacity modelling, constraint theory, and design for excellence.',
    context: `Advanced process design applies queuing theory, constraint management (Theory of Constraints), and statistical process control to build high-performance operations. The Theory of Constraints (Goldratt) argues that every system has exactly one binding constraint at any time — and that improving anything other than the constraint is an illusion of progress. The five focusing steps are: Identify the constraint, Exploit the constraint, Subordinate everything else to the constraint, Elevate the constraint, and Repeat. Little's Law (L = λW) links inventory (L), throughput (λ), and cycle time (W) — a fundamental relationship in queueing systems. Design for Six Sigma (DFSS) builds quality into process and product design from the start, rather than inspecting quality in afterwards. Simulation modelling (Monte Carlo, discrete event) enables what-if analysis on process designs before they are built.`,
    questions: [
        {
            questionText: 'Theory of Constraints says a factory has a bottleneck machine running at 85% utilisation while all others run at 60%. To maximise throughput, the first action should be:',
            explanation: 'The Theory of Constraints\' first step is to Exploit the constraint — get maximum output from the bottleneck before spending capital to elevate (expand) it. This means ensuring the bottleneck never starves for work, never produces scrap, and is never idle for non-value-adding reasons.',
            hints: [
                'TOC Five Steps: Identify → Exploit → Subordinate → Elevate → Repeat.',
                'Exploiting means getting maximum possible output from the constraint as-is.',
                'Before buying a new machine (elevate), squeeze every unit out of the existing one.',
                'Step 2: Exploit the constraint — maximise its utilisation and output quality.',
            ],
            orderIndex: 0,
            options: [
                { optionText: 'Buy a second bottleneck machine immediately to increase capacity', isCorrect: false, orderIndex: 0 },
                { optionText: 'Exploit the bottleneck — ensure it never starves or runs idle', isCorrect: true, orderIndex: 1 },
                { optionText: 'Improve efficiency of the 60% machines to balance the line', isCorrect: false, orderIndex: 2 },
                { optionText: 'Reduce the product variety to simplify the process', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'Little\'s Law states L = λW. If average inventory L = 200 units and throughput λ = 50 units/hour, what is average cycle time W?',
            explanation: 'W = L / λ = 200 / 50 = 4 hours. Little\'s Law is a universal relationship in stable queueing systems — it holds for any process regardless of arrival distribution or service time distribution.',
            hints: [
                'Little\'s Law: L = λ × W. Rearrange for W: W = L ÷ λ.',
                'L = 200 units in the system. λ = 50 units per hour throughput.',
                '200 ÷ 50 = ?',
                'W = 4 hours average cycle time.',
            ],
            orderIndex: 1,
            options: [
                { optionText: '2 hours', isCorrect: false, orderIndex: 0 },
                { optionText: '4 hours', isCorrect: true, orderIndex: 1 },
                { optionText: '10 hours', isCorrect: false, orderIndex: 2 },
                { optionText: '0.25 hours', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'Statistical Process Control (SPC) uses control charts to distinguish between "common cause" and "special cause" variation. What is the correct action for each?',
            explanation: 'Common cause variation is random, inherent noise in the process — it requires system redesign (management\'s responsibility). Special cause variation is an assignable, non-random anomaly — it requires immediate investigation and removal. Tampering with common cause variation (treating noise as a signal) makes the process worse.',
            hints: [
                'Common cause = random variation inherent in the process. Special cause = unusual event.',
                'Tampering with common cause variation increases variability.',
                'Special causes need immediate root cause investigation.',
                'Common cause: redesign the system. Special cause: investigate and remove the anomaly.',
            ],
            orderIndex: 2,
            options: [
                { optionText: 'Common cause: investigate immediately. Special cause: accept as normal', isCorrect: false, orderIndex: 0 },
                { optionText: 'Common cause: redesign the system. Special cause: investigate and remove', isCorrect: true, orderIndex: 1 },
                { optionText: 'Both types require immediate corrective action', isCorrect: false, orderIndex: 2 },
                { optionText: 'Both types require monitoring but no immediate action', isCorrect: false, orderIndex: 3 },
            ],
        },
        {
            questionText: 'A process has Cp = 1.5 and Cpk = 0.8. What does this tell the engineer?',
            explanation: 'Cp measures process spread relative to specification width (1.5 is capable if centered). Cpk measures actual process performance accounting for centering — 0.8 means the process mean is shifted toward a spec limit, generating defects even though the spread is narrow enough. The process is capable but off-center.',
            hints: [
                'Cp = potential capability (how wide the spec is vs. process spread). Cpk = actual capability (including centering).',
                'Cp > 1.33 is good. Cpk < 1.0 means defects are occurring.',
                'Cp = 1.5 but Cpk = 0.8: spread is fine but the mean is shifted toward a limit.',
                'The process is capable in spread (Cp) but not centered (Cpk) — requiring mean adjustment.',
            ],
            orderIndex: 3,
            options: [
                { optionText: 'The process is incapable — both Cp and Cpk must exceed 1.33', isCorrect: false, orderIndex: 0 },
                { optionText: 'The process has adequate spread but is off-center, causing defects near one spec limit', isCorrect: true, orderIndex: 1 },
                { optionText: 'The process is performing at Six Sigma level', isCorrect: false, orderIndex: 2 },
                { optionText: 'Cp and Cpk disagreement means the data is invalid', isCorrect: false, orderIndex: 3 },
            ],
        },
    ],
};

// ─────────────────────────────────────────────────────────────────────────────
//  QUANTUS DEFINITIONS  (6 hard lessons — one per subtopic)
// ─────────────────────────────────────────────────────────────────────────────

const quantus_fs_hard: QuantusDef = {
    title: 'Three-Statement Model — P&L Forecast',
    instructions: 'Complete the highlighted cells to build a 3-year P&L forecast. Yellow cells are editable. Use the assumption row as your guide. Values in $M.',
    context: 'This model projects a company\'s Income Statement for FY2023E and FY2024E using FY2022 actuals as the base. Apply the assumption percentages exactly. Calculated cells (grey) will auto-populate once you fill the yellow inputs.',
    columnGroups: [
        { label: 'Assumptions', colStart: 1, colEnd: 1, bgColor: '#e8f4fd', textColor: '#1a6fa8', orderIndex: 0 },
        { label: 'Actuals', colStart: 2, colEnd: 2, bgColor: '#f0f0f0', textColor: '#555', orderIndex: 1 },
        { label: 'Forecast', colStart: 3, colEnd: 4, bgColor: '#fffbe6', textColor: '#8a6a00', orderIndex: 2 },
    ],
    columns: [
        { label: 'Line Item', colIndex: 0, widthPx: 230 },
        { label: 'Driver', colIndex: 1, widthPx: 170 },
        { label: 'FY2022A ($M)', colIndex: 2, widthPx: 120 },
        { label: 'FY2023E ($M)', colIndex: 3, widthPx: 120 },
        { label: 'FY2024E ($M)', colIndex: 4, widthPx: 120 },
    ],
    cells: [
        { rowIndex: 0, colIndex: 0, cellType: 'header', displayValue: 'INCOME STATEMENT MODEL', isEditable: false, colSpan: 5 },
        { rowIndex: 1, colIndex: 0, cellType: 'label', displayValue: 'Revenue', isEditable: false },
        { rowIndex: 1, colIndex: 1, cellType: 'prefilled', displayValue: '+12% / +10% YoY', isEditable: false },
        { rowIndex: 1, colIndex: 2, cellType: 'prefilled', displayValue: '800.0', isEditable: false },
        { rowIndex: 1, colIndex: 3, cellType: 'editable', expectedValue: '896.0', isEditable: true, tolerancePct: 1, hintText: 'Revenue FY2023 = 800 × 1.12' },
        { rowIndex: 1, colIndex: 4, cellType: 'editable', expectedValue: '985.6', isEditable: true, tolerancePct: 1, hintText: 'Revenue FY2024 = FY2023 × 1.10' },
        { rowIndex: 2, colIndex: 0, cellType: 'label', displayValue: 'COGS', isEditable: false },
        { rowIndex: 2, colIndex: 1, cellType: 'prefilled', displayValue: '58% of Revenue', isEditable: false },
        { rowIndex: 2, colIndex: 2, cellType: 'prefilled', displayValue: '464.0', isEditable: false },
        { rowIndex: 2, colIndex: 3, cellType: 'editable', expectedValue: '519.7', isEditable: true, tolerancePct: 1, hintText: 'COGS = Revenue × 58%' },
        { rowIndex: 2, colIndex: 4, cellType: 'editable', expectedValue: '571.6', isEditable: true, tolerancePct: 1, hintText: 'COGS = Revenue × 58%' },
        { rowIndex: 3, colIndex: 0, cellType: 'label', displayValue: 'Gross Profit', isEditable: false },
        { rowIndex: 3, colIndex: 1, cellType: 'label', displayValue: 'Revenue − COGS', isEditable: false },
        { rowIndex: 3, colIndex: 2, cellType: 'prefilled', displayValue: '336.0', isEditable: false },
        { rowIndex: 3, colIndex: 3, cellType: 'formula', formula: '=D2-D3', expectedValue: '376.3', isEditable: false },
        { rowIndex: 3, colIndex: 4, cellType: 'formula', formula: '=E2-E3', expectedValue: '414.0', isEditable: false },
        { rowIndex: 4, colIndex: 0, cellType: 'label', displayValue: 'SG&A Expenses', isEditable: false },
        { rowIndex: 4, colIndex: 1, cellType: 'prefilled', displayValue: '18% of Revenue', isEditable: false },
        { rowIndex: 4, colIndex: 2, cellType: 'prefilled', displayValue: '144.0', isEditable: false },
        { rowIndex: 4, colIndex: 3, cellType: 'editable', expectedValue: '161.3', isEditable: true, tolerancePct: 1, hintText: 'SG&A = Revenue × 18%' },
        { rowIndex: 4, colIndex: 4, cellType: 'editable', expectedValue: '177.4', isEditable: true, tolerancePct: 1, hintText: 'SG&A = Revenue × 18%' },
        { rowIndex: 5, colIndex: 0, cellType: 'label', displayValue: 'D&A', isEditable: false },
        { rowIndex: 5, colIndex: 1, cellType: 'prefilled', displayValue: 'Fixed $30M/yr', isEditable: false },
        { rowIndex: 5, colIndex: 2, cellType: 'prefilled', displayValue: '30.0', isEditable: false },
        { rowIndex: 5, colIndex: 3, cellType: 'editable', expectedValue: '30.0', isEditable: true, tolerancePct: 0, hintText: 'D&A is fixed at $30M per year' },
        { rowIndex: 5, colIndex: 4, cellType: 'editable', expectedValue: '30.0', isEditable: true, tolerancePct: 0, hintText: 'D&A is fixed at $30M per year' },
        { rowIndex: 6, colIndex: 0, cellType: 'label', displayValue: 'EBIT', isEditable: false },
        { rowIndex: 6, colIndex: 1, cellType: 'label', displayValue: 'GP − SG&A − D&A', isEditable: false },
        { rowIndex: 6, colIndex: 2, cellType: 'prefilled', displayValue: '162.0', isEditable: false },
        { rowIndex: 6, colIndex: 3, cellType: 'formula', formula: '=D4-D5-D6', expectedValue: '185.0', isEditable: false },
        { rowIndex: 6, colIndex: 4, cellType: 'formula', formula: '=E4-E5-E6', expectedValue: '206.6', isEditable: false },
        { rowIndex: 7, colIndex: 0, cellType: 'label', displayValue: 'Interest Expense', isEditable: false },
        { rowIndex: 7, colIndex: 1, cellType: 'prefilled', displayValue: 'Fixed $25M/yr', isEditable: false },
        { rowIndex: 7, colIndex: 2, cellType: 'prefilled', displayValue: '25.0', isEditable: false },
        { rowIndex: 7, colIndex: 3, cellType: 'editable', expectedValue: '25.0', isEditable: true, tolerancePct: 0, hintText: 'Interest Expense is fixed at $25M per year' },
        { rowIndex: 7, colIndex: 4, cellType: 'editable', expectedValue: '25.0', isEditable: true, tolerancePct: 0, hintText: 'Interest Expense is fixed at $25M per year' },
        { rowIndex: 8, colIndex: 0, cellType: 'label', displayValue: 'EBT', isEditable: false },
        { rowIndex: 8, colIndex: 1, cellType: 'label', displayValue: 'EBIT − Interest', isEditable: false },
        { rowIndex: 8, colIndex: 2, cellType: 'prefilled', displayValue: '137.0', isEditable: false },
        { rowIndex: 8, colIndex: 3, cellType: 'formula', formula: '=D7-D8', expectedValue: '160.0', isEditable: false },
        { rowIndex: 8, colIndex: 4, cellType: 'formula', formula: '=E7-E8', expectedValue: '181.6', isEditable: false },
        { rowIndex: 9, colIndex: 0, cellType: 'label', displayValue: 'Taxes', isEditable: false },
        { rowIndex: 9, colIndex: 1, cellType: 'prefilled', displayValue: '25% tax rate', isEditable: false },
        { rowIndex: 9, colIndex: 2, cellType: 'prefilled', displayValue: '34.3', isEditable: false },
        { rowIndex: 9, colIndex: 3, cellType: 'editable', expectedValue: '40.0', isEditable: true, tolerancePct: 1, hintText: 'Tax = EBT × 25%' },
        { rowIndex: 9, colIndex: 4, cellType: 'editable', expectedValue: '45.4', isEditable: true, tolerancePct: 1, hintText: 'Tax = EBT × 25%' },
        { rowIndex: 10, colIndex: 0, cellType: 'label', displayValue: '✦ Net Income', isEditable: false },
        { rowIndex: 10, colIndex: 1, cellType: 'label', displayValue: 'EBT − Taxes', isEditable: false },
        { rowIndex: 10, colIndex: 2, cellType: 'prefilled', displayValue: '102.8', isEditable: false },
        { rowIndex: 10, colIndex: 3, cellType: 'formula', formula: '=D9-D10', expectedValue: '120.0', isEditable: false },
        { rowIndex: 10, colIndex: 4, cellType: 'formula', formula: '=E9-E10', expectedValue: '136.2', isEditable: false },
        { rowIndex: 11, colIndex: 0, cellType: 'label', displayValue: 'Net Margin %', isEditable: false },
        { rowIndex: 11, colIndex: 1, cellType: 'label', displayValue: 'NI ÷ Revenue', isEditable: false },
        { rowIndex: 11, colIndex: 2, cellType: 'prefilled', displayValue: '12.9%', isEditable: false },
        { rowIndex: 11, colIndex: 3, cellType: 'formula', formula: '=D11/D2', expectedValue: '0.1339', isEditable: false, formatType: 'percent' },
        { rowIndex: 11, colIndex: 4, cellType: 'formula', formula: '=E11/E2', expectedValue: '0.1382', isEditable: false, formatType: 'percent' },
    ],
};

const quantus_cs_hard: QuantusDef = {
    title: 'WACC Build-Up & LBO Entry Metrics',
    instructions: 'Build the WACC from scratch and compute key LBO entry statistics. Yellow cells are editable. Use the assumption rows.',
    context: 'Part 1 builds WACC using CAPM for Cost of Equity. Part 2 computes LBO entry metrics: Enterprise Value, Equity Value, and Debt/EBITDA at entry.',
    columnGroups: [
        { label: 'Inputs', colStart: 1, colEnd: 2, bgColor: '#eaf4ef', textColor: '#1a6b3c', orderIndex: 0 },
        { label: 'Result', colStart: 3, colEnd: 3, bgColor: '#fffbe6', textColor: '#8a6a00', orderIndex: 1 },
    ],
    columns: [
        { label: 'Component', colIndex: 0, widthPx: 260 },
        { label: 'Given / Formula', colIndex: 1, widthPx: 180 },
        { label: 'Your Answer', colIndex: 2, widthPx: 140 },
    ],
    cells: [
        { rowIndex: 0, colIndex: 0, cellType: 'header', displayValue: 'PART 1 — WACC CALCULATION', isEditable: false, colSpan: 3 },
        { rowIndex: 1, colIndex: 0, cellType: 'label', displayValue: 'Risk-Free Rate (Rf)', isEditable: false },
        { rowIndex: 1, colIndex: 1, cellType: 'prefilled', displayValue: '4.5%', isEditable: false },
        { rowIndex: 1, colIndex: 2, cellType: 'prefilled', displayValue: '4.5%', isEditable: false },
        { rowIndex: 2, colIndex: 0, cellType: 'label', displayValue: 'Equity Risk Premium (ERP)', isEditable: false },
        { rowIndex: 2, colIndex: 1, cellType: 'prefilled', displayValue: '5.5%', isEditable: false },
        { rowIndex: 2, colIndex: 2, cellType: 'prefilled', displayValue: '5.5%', isEditable: false },
        { rowIndex: 3, colIndex: 0, cellType: 'label', displayValue: 'Levered Beta', isEditable: false },
        { rowIndex: 3, colIndex: 1, cellType: 'prefilled', displayValue: '1.25', isEditable: false },
        { rowIndex: 3, colIndex: 2, cellType: 'prefilled', displayValue: '1.25', isEditable: false },
        { rowIndex: 4, colIndex: 0, cellType: 'label', displayValue: '✦ Cost of Equity (Ke) — CAPM', isEditable: false },
        { rowIndex: 4, colIndex: 1, cellType: 'label', displayValue: 'Rf + β × ERP', isEditable: false },
        { rowIndex: 4, colIndex: 2, cellType: 'editable', expectedValue: '11.375', isEditable: true, tolerancePct: 1, hintText: 'Ke = 4.5% + 1.25 × 5.5% = 4.5% + 6.875% = 11.375%', formatType: 'percent' },
        { rowIndex: 5, colIndex: 0, cellType: 'label', displayValue: 'Pre-tax Cost of Debt (Kd)', isEditable: false },
        { rowIndex: 5, colIndex: 1, cellType: 'prefilled', displayValue: '6.0%', isEditable: false },
        { rowIndex: 5, colIndex: 2, cellType: 'prefilled', displayValue: '6.0%', isEditable: false },
        { rowIndex: 6, colIndex: 0, cellType: 'label', displayValue: 'Tax Rate', isEditable: false },
        { rowIndex: 6, colIndex: 1, cellType: 'prefilled', displayValue: '28%', isEditable: false },
        { rowIndex: 6, colIndex: 2, cellType: 'prefilled', displayValue: '28%', isEditable: false },
        { rowIndex: 7, colIndex: 0, cellType: 'label', displayValue: '✦ After-Tax Cost of Debt', isEditable: false },
        { rowIndex: 7, colIndex: 1, cellType: 'label', displayValue: 'Kd × (1 − T)', isEditable: false },
        { rowIndex: 7, colIndex: 2, cellType: 'editable', expectedValue: '4.32', isEditable: true, tolerancePct: 1, hintText: 'After-tax Kd = 6.0% × (1 − 28%) = 6.0% × 0.72 = 4.32%', formatType: 'percent' },
        { rowIndex: 8, colIndex: 0, cellType: 'label', displayValue: 'Equity Weight (E/V)', isEditable: false },
        { rowIndex: 8, colIndex: 1, cellType: 'prefilled', displayValue: '55%', isEditable: false },
        { rowIndex: 8, colIndex: 2, cellType: 'prefilled', displayValue: '55%', isEditable: false },
        { rowIndex: 9, colIndex: 0, cellType: 'label', displayValue: 'Debt Weight (D/V)', isEditable: false },
        { rowIndex: 9, colIndex: 1, cellType: 'prefilled', displayValue: '45%', isEditable: false },
        { rowIndex: 9, colIndex: 2, cellType: 'prefilled', displayValue: '45%', isEditable: false },
        { rowIndex: 10, colIndex: 0, cellType: 'label', displayValue: '✦ WACC', isEditable: false },
        { rowIndex: 10, colIndex: 1, cellType: 'label', displayValue: '(E/V)×Ke + (D/V)×Kd×(1-T)', isEditable: false },
        { rowIndex: 10, colIndex: 2, cellType: 'editable', expectedValue: '8.20', isEditable: true, tolerancePct: 1, hintText: 'WACC = 55%×11.375% + 45%×4.32% = 6.256% + 1.944% = 8.20%', formatType: 'percent' },
        { rowIndex: 11, colIndex: 0, cellType: 'header', displayValue: 'PART 2 — LBO ENTRY METRICS', isEditable: false, colSpan: 3 },
        { rowIndex: 12, colIndex: 0, cellType: 'label', displayValue: 'EBITDA at Entry', isEditable: false },
        { rowIndex: 12, colIndex: 1, cellType: 'prefilled', displayValue: '$120M', isEditable: false },
        { rowIndex: 12, colIndex: 2, cellType: 'prefilled', displayValue: '120.0', isEditable: false },
        { rowIndex: 13, colIndex: 0, cellType: 'label', displayValue: 'EV/EBITDA Entry Multiple', isEditable: false },
        { rowIndex: 13, colIndex: 1, cellType: 'prefilled', displayValue: '9.5×', isEditable: false },
        { rowIndex: 13, colIndex: 2, cellType: 'prefilled', displayValue: '9.5', isEditable: false },
        { rowIndex: 14, colIndex: 0, cellType: 'label', displayValue: '✦ Enterprise Value at Entry', isEditable: false },
        { rowIndex: 14, colIndex: 1, cellType: 'label', displayValue: 'EBITDA × Multiple', isEditable: false },
        { rowIndex: 14, colIndex: 2, cellType: 'editable', expectedValue: '1140.0', isEditable: true, tolerancePct: 1, hintText: 'EV = EBITDA × EV/EBITDA = 120 × 9.5 = $1,140M' },
        { rowIndex: 15, colIndex: 0, cellType: 'label', displayValue: 'Debt at Entry (70% LTV)', isEditable: false },
        { rowIndex: 15, colIndex: 1, cellType: 'prefilled', displayValue: '70% of EV', isEditable: false },
        { rowIndex: 15, colIndex: 2, cellType: 'editable', expectedValue: '798.0', isEditable: true, tolerancePct: 1, hintText: 'Debt = EV × 70% = 1,140 × 0.70 = $798M' },
        { rowIndex: 16, colIndex: 0, cellType: 'label', displayValue: '✦ Equity Cheque', isEditable: false },
        { rowIndex: 16, colIndex: 1, cellType: 'label', displayValue: 'EV − Debt', isEditable: false },
        { rowIndex: 16, colIndex: 2, cellType: 'formula', formula: '=C15-C16', expectedValue: '342.0', isEditable: false },
        { rowIndex: 17, colIndex: 0, cellType: 'label', displayValue: '✦ Net Debt / EBITDA at Entry', isEditable: false },
        { rowIndex: 17, colIndex: 1, cellType: 'label', displayValue: 'Debt ÷ EBITDA', isEditable: false },
        { rowIndex: 17, colIndex: 2, cellType: 'formula', formula: '=C16/C13', expectedValue: '6.65', isEditable: false },
    ],
};

const quantus_ca_hard: QuantusDef = {
    title: 'Competitive Scoring Matrix — Five Forces',
    instructions: 'Score each of Porter\'s Five Forces on a 1–5 scale (1=low threat, 5=high threat) based on the industry description provided. Then calculate the weighted average attractiveness score.',
    context: 'Industry: Generic pharmaceutical manufacturing post-patent cliff. High capital requirements exist but biosimilar entry is growing. Buyers are large hospital chains (concentrated). Raw material suppliers are specialised (moderate power). Branded generics compete on price. OTC substitutes exist for some drugs.',
    columnGroups: [
        { label: 'Force Assessment', colStart: 1, colEnd: 2, bgColor: '#eaf4ef', textColor: '#1a6b3c', orderIndex: 0 },
        { label: 'Scoring', colStart: 3, colEnd: 4, bgColor: '#fffbe6', textColor: '#8a6a00', orderIndex: 1 },
    ],
    columns: [
        { label: 'Force', colIndex: 0, widthPx: 220 },
        { label: 'Evidence from description', colIndex: 1, widthPx: 250 },
        { label: 'Weight', colIndex: 2, widthPx: 80 },
        { label: 'Your Score (1–5)', colIndex: 3, widthPx: 130 },
    ],
    cells: [
        { rowIndex: 0, colIndex: 0, cellType: 'header', displayValue: 'PORTER\'S FIVE FORCES SCORING', isEditable: false, colSpan: 4 },
        { rowIndex: 1, colIndex: 0, cellType: 'label', displayValue: 'Threat of New Entrants', isEditable: false },
        { rowIndex: 1, colIndex: 1, cellType: 'prefilled', displayValue: 'High capital req. but biosimilar entrants growing', isEditable: false },
        { rowIndex: 1, colIndex: 2, cellType: 'prefilled', displayValue: '20%', isEditable: false },
        { rowIndex: 1, colIndex: 3, cellType: 'editable', expectedValue: '3', isEditable: true, tolerancePct: 0, hintText: 'Score 3: High capital is a barrier, but biosimilar entrants represent a real and growing threat. Moderate overall.' },
        { rowIndex: 2, colIndex: 0, cellType: 'label', displayValue: 'Buyer Power', isEditable: false },
        { rowIndex: 2, colIndex: 1, cellType: 'prefilled', displayValue: 'Large hospital chains — concentrated buyers', isEditable: false },
        { rowIndex: 2, colIndex: 2, cellType: 'prefilled', displayValue: '25%', isEditable: false },
        { rowIndex: 2, colIndex: 3, cellType: 'editable', expectedValue: '4', isEditable: true, tolerancePct: 0, hintText: 'Score 4: Concentrated buyers (hospital groups) have significant purchasing power to negotiate prices down.' },
        { rowIndex: 3, colIndex: 0, cellType: 'label', displayValue: 'Supplier Power', isEditable: false },
        { rowIndex: 3, colIndex: 1, cellType: 'prefilled', displayValue: 'Specialised raw material suppliers', isEditable: false },
        { rowIndex: 3, colIndex: 2, cellType: 'prefilled', displayValue: '15%', isEditable: false },
        { rowIndex: 3, colIndex: 3, cellType: 'editable', expectedValue: '3', isEditable: true, tolerancePct: 0, hintText: 'Score 3: Specialised inputs mean moderate supplier power — not easy to switch, but not monopolistic.' },
        { rowIndex: 4, colIndex: 0, cellType: 'label', displayValue: 'Threat of Substitutes', isEditable: false },
        { rowIndex: 4, colIndex: 1, cellType: 'prefilled', displayValue: 'OTC alternatives exist for some drugs', isEditable: false },
        { rowIndex: 4, colIndex: 2, cellType: 'prefilled', displayValue: '20%', isEditable: false },
        { rowIndex: 4, colIndex: 3, cellType: 'editable', expectedValue: '2', isEditable: true, tolerancePct: 0, hintText: 'Score 2: OTC substitutes exist for some but not all generics. Limited substitution overall.' },
        { rowIndex: 5, colIndex: 0, cellType: 'label', displayValue: 'Rivalry Among Competitors', isEditable: false },
        { rowIndex: 5, colIndex: 1, cellType: 'prefilled', displayValue: 'Branded generics compete heavily on price', isEditable: false },
        { rowIndex: 5, colIndex: 2, cellType: 'prefilled', displayValue: '20%', isEditable: false },
        { rowIndex: 5, colIndex: 3, cellType: 'editable', expectedValue: '4', isEditable: true, tolerancePct: 0, hintText: 'Score 4: Price-based competition among branded generics is intense, compressing margins.' },
        { rowIndex: 6, colIndex: 0, cellType: 'label', displayValue: '✦ Weighted Avg Threat Score', isEditable: false },
        { rowIndex: 6, colIndex: 1, cellType: 'label', displayValue: 'Σ(Weight × Score) — lower = more attractive', isEditable: false },
        { rowIndex: 6, colIndex: 2, cellType: 'formula', formula: 'SUM weights', expectedValue: '100%', isEditable: false },
        { rowIndex: 6, colIndex: 3, cellType: 'editable', expectedValue: '3.35', isEditable: true, tolerancePct: 3, hintText: 'Weighted score = 20%×3 + 25%×4 + 15%×3 + 20%×2 + 20%×4 = 0.6+1.0+0.45+0.4+0.8 = 3.25–3.35' },
    ],
};

const quantus_gs_hard: QuantusDef = {
    title: 'M&A Synergy & Maximum Premium Analysis',
    instructions: 'Build the synergy valuation to determine the maximum acquisition premium. Yellow cells are editable.',
    context: 'Acquirer (A) is considering buying Target (T). You must value T standalone, value the synergies separately, and determine the maximum price A can pay while still creating value. All values in $M.',
    columnGroups: [
        { label: 'Target Standalone', colStart: 1, colEnd: 2, bgColor: '#e8f4fd', textColor: '#1a6fa8', orderIndex: 0 },
        { label: 'Synergy Analysis', colStart: 3, colEnd: 3, bgColor: '#fffbe6', textColor: '#8a6a00', orderIndex: 1 },
    ],
    columns: [
        { label: 'Item', colIndex: 0, widthPx: 250 },
        { label: 'Input / Formula', colIndex: 1, widthPx: 180 },
        { label: 'Value ($M)', colIndex: 2, widthPx: 130 },
    ],
    cells: [
        { rowIndex: 0, colIndex: 0, cellType: 'header', displayValue: 'PART 1 — TARGET STANDALONE VALUATION', isEditable: false, colSpan: 3 },
        { rowIndex: 1, colIndex: 0, cellType: 'label', displayValue: 'Target EBITDA (LTM)', isEditable: false },
        { rowIndex: 1, colIndex: 1, cellType: 'prefilled', displayValue: 'Given', isEditable: false },
        { rowIndex: 1, colIndex: 2, cellType: 'prefilled', displayValue: '80.0', isEditable: false },
        { rowIndex: 2, colIndex: 0, cellType: 'label', displayValue: 'Comp Trading Multiple (EV/EBITDA)', isEditable: false },
        { rowIndex: 2, colIndex: 1, cellType: 'prefilled', displayValue: '7.0×', isEditable: false },
        { rowIndex: 2, colIndex: 2, cellType: 'prefilled', displayValue: '7.0', isEditable: false },
        { rowIndex: 3, colIndex: 0, cellType: 'label', displayValue: '✦ Target Standalone EV', isEditable: false },
        { rowIndex: 3, colIndex: 1, cellType: 'label', displayValue: 'EBITDA × Multiple', isEditable: false },
        { rowIndex: 3, colIndex: 2, cellType: 'editable', expectedValue: '560.0', isEditable: true, tolerancePct: 1, hintText: 'Standalone EV = 80 × 7.0 = $560M' },
        { rowIndex: 4, colIndex: 0, cellType: 'header', displayValue: 'PART 2 — SYNERGY VALUATION', isEditable: false, colSpan: 3 },
        { rowIndex: 5, colIndex: 0, cellType: 'label', displayValue: 'Annual Cost Synergies (steady-state)', isEditable: false },
        { rowIndex: 5, colIndex: 1, cellType: 'prefilled', displayValue: 'Given: $25M/yr', isEditable: false },
        { rowIndex: 5, colIndex: 2, cellType: 'prefilled', displayValue: '25.0', isEditable: false },
        { rowIndex: 6, colIndex: 0, cellType: 'label', displayValue: 'Annual Revenue Synergies', isEditable: false },
        { rowIndex: 6, colIndex: 1, cellType: 'prefilled', displayValue: 'Given: $10M/yr EBITDA impact', isEditable: false },
        { rowIndex: 6, colIndex: 2, cellType: 'prefilled', displayValue: '10.0', isEditable: false },
        { rowIndex: 7, colIndex: 0, cellType: 'label', displayValue: 'Total Annual Synergies', isEditable: false },
        { rowIndex: 7, colIndex: 1, cellType: 'label', displayValue: 'Cost + Revenue synergies', isEditable: false },
        { rowIndex: 7, colIndex: 2, cellType: 'formula', formula: '=C6+C7', expectedValue: '35.0', isEditable: false },
        { rowIndex: 8, colIndex: 0, cellType: 'label', displayValue: 'Synergy Capitalisation Multiple', isEditable: false },
        { rowIndex: 8, colIndex: 1, cellType: 'prefilled', displayValue: 'Same as trading: 7.0×', isEditable: false },
        { rowIndex: 8, colIndex: 2, cellType: 'prefilled', displayValue: '7.0', isEditable: false },
        { rowIndex: 9, colIndex: 0, cellType: 'label', displayValue: '✦ PV of Synergies', isEditable: false },
        { rowIndex: 9, colIndex: 1, cellType: 'label', displayValue: 'Annual Synergies × Multiple', isEditable: false },
        { rowIndex: 9, colIndex: 2, cellType: 'editable', expectedValue: '245.0', isEditable: true, tolerancePct: 1, hintText: 'PV Synergies = 35 × 7.0 = $245M' },
        { rowIndex: 10, colIndex: 0, cellType: 'header', displayValue: 'PART 3 — MAXIMUM ACQUISITION PRICE', isEditable: false, colSpan: 3 },
        { rowIndex: 11, colIndex: 0, cellType: 'label', displayValue: '✦ Max EV Acquirer Can Pay', isEditable: false },
        { rowIndex: 11, colIndex: 1, cellType: 'label', displayValue: 'Standalone EV + PV Synergies', isEditable: false },
        { rowIndex: 11, colIndex: 2, cellType: 'formula', formula: '=C4+C10', expectedValue: '805.0', isEditable: false },
        { rowIndex: 12, colIndex: 0, cellType: 'label', displayValue: 'Max Implied EV/EBITDA Multiple', isEditable: false },
        { rowIndex: 12, colIndex: 1, cellType: 'label', displayValue: 'Max EV ÷ Target EBITDA', isEditable: false },
        { rowIndex: 12, colIndex: 2, cellType: 'formula', formula: '=C12/C2', expectedValue: '10.06', isEditable: false },
        { rowIndex: 13, colIndex: 0, cellType: 'label', displayValue: 'Max Premium over Standalone', isEditable: false },
        { rowIndex: 13, colIndex: 1, cellType: 'label', displayValue: 'Max EV − Standalone EV', isEditable: false },
        { rowIndex: 13, colIndex: 2, cellType: 'editable', expectedValue: '245.0', isEditable: true, tolerancePct: 1, hintText: 'Max premium = Max EV − Standalone = 805 − 560 = $245M (= full synergy value)' },
    ],
};

const quantus_dp_hard: QuantusDef = {
    title: 'Inventory Optimisation — EOQ & Safety Stock Model',
    instructions: 'Complete the inventory model. Calculate EOQ, safety stock, reorder point, and total annual inventory cost.',
    context: 'A distributor needs to determine optimal order quantities and reorder points for a high-velocity SKU. Demand is seasonal but averages 300 units/day. Lead time is 7 days. Ordering cost is $200/order. Holding cost is $4/unit/year.',
    columnGroups: [
        { label: 'Inputs', colStart: 1, colEnd: 1, bgColor: '#e8f4fd', textColor: '#1a6fa8', orderIndex: 0 },
        { label: 'Your Calculation', colStart: 2, colEnd: 2, bgColor: '#fffbe6', textColor: '#8a6a00', orderIndex: 1 },
    ],
    columns: [
        { label: 'Parameter', colIndex: 0, widthPx: 280 },
        { label: 'Given / Formula', colIndex: 1, widthPx: 200 },
        { label: 'Answer', colIndex: 2, widthPx: 140 },
    ],
    cells: [
        { rowIndex: 0, colIndex: 0, cellType: 'header', displayValue: 'INVENTORY OPTIMISATION MODEL', isEditable: false, colSpan: 3 },
        { rowIndex: 1, colIndex: 0, cellType: 'label', displayValue: 'Annual Demand (D)', isEditable: false },
        { rowIndex: 1, colIndex: 1, cellType: 'prefilled', displayValue: '300 units/day × 365 days', isEditable: false },
        { rowIndex: 1, colIndex: 2, cellType: 'editable', expectedValue: '109500', isEditable: true, tolerancePct: 0, hintText: 'Annual Demand = 300 × 365 = 109,500 units' },
        { rowIndex: 2, colIndex: 0, cellType: 'label', displayValue: 'Ordering Cost (S)', isEditable: false },
        { rowIndex: 2, colIndex: 1, cellType: 'prefilled', displayValue: '$200 per order', isEditable: false },
        { rowIndex: 2, colIndex: 2, cellType: 'prefilled', displayValue: '200', isEditable: false },
        { rowIndex: 3, colIndex: 0, cellType: 'label', displayValue: 'Holding Cost (H)', isEditable: false },
        { rowIndex: 3, colIndex: 1, cellType: 'prefilled', displayValue: '$4 per unit per year', isEditable: false },
        { rowIndex: 3, colIndex: 2, cellType: 'prefilled', displayValue: '4', isEditable: false },
        { rowIndex: 4, colIndex: 0, cellType: 'label', displayValue: '✦ Economic Order Quantity (EOQ)', isEditable: false },
        { rowIndex: 4, colIndex: 1, cellType: 'label', displayValue: '√(2 × D × S / H)', isEditable: false },
        { rowIndex: 4, colIndex: 2, cellType: 'editable', expectedValue: '3307', isEditable: true, tolerancePct: 1, hintText: 'EOQ = √(2 × 109,500 × 200 / 4) = √(10,950,000) ≈ 3,309 units' },
        { rowIndex: 5, colIndex: 0, cellType: 'label', displayValue: 'Orders Per Year', isEditable: false },
        { rowIndex: 5, colIndex: 1, cellType: 'label', displayValue: 'D ÷ EOQ', isEditable: false },
        { rowIndex: 5, colIndex: 2, cellType: 'editable', expectedValue: '33.1', isEditable: true, tolerancePct: 2, hintText: 'Orders/year = 109,500 / 3,309 ≈ 33.1 orders per year' },
        { rowIndex: 6, colIndex: 0, cellType: 'header', displayValue: 'SAFETY STOCK & REORDER POINT', isEditable: false, colSpan: 3 },
        { rowIndex: 7, colIndex: 0, cellType: 'label', displayValue: 'Average Daily Demand', isEditable: false },
        { rowIndex: 7, colIndex: 1, cellType: 'prefilled', displayValue: '300 units/day', isEditable: false },
        { rowIndex: 7, colIndex: 2, cellType: 'prefilled', displayValue: '300', isEditable: false },
        { rowIndex: 8, colIndex: 0, cellType: 'label', displayValue: 'Demand Std Dev (daily)', isEditable: false },
        { rowIndex: 8, colIndex: 1, cellType: 'prefilled', displayValue: '40 units/day', isEditable: false },
        { rowIndex: 8, colIndex: 2, cellType: 'prefilled', displayValue: '40', isEditable: false },
        { rowIndex: 9, colIndex: 0, cellType: 'label', displayValue: 'Lead Time', isEditable: false },
        { rowIndex: 9, colIndex: 1, cellType: 'prefilled', displayValue: '7 days', isEditable: false },
        { rowIndex: 9, colIndex: 2, cellType: 'prefilled', displayValue: '7', isEditable: false },
        { rowIndex: 10, colIndex: 0, cellType: 'label', displayValue: 'Service Level Z-score (95%)', isEditable: false },
        { rowIndex: 10, colIndex: 1, cellType: 'prefilled', displayValue: 'Z = 1.645', isEditable: false },
        { rowIndex: 10, colIndex: 2, cellType: 'prefilled', displayValue: '1.645', isEditable: false },
        { rowIndex: 11, colIndex: 0, cellType: 'label', displayValue: '✦ Safety Stock', isEditable: false },
        { rowIndex: 11, colIndex: 1, cellType: 'label', displayValue: 'Z × σ × √(Lead Time)', isEditable: false },
        { rowIndex: 11, colIndex: 2, cellType: 'editable', expectedValue: '174', isEditable: true, tolerancePct: 2, hintText: 'Safety Stock = 1.645 × 40 × √7 = 1.645 × 40 × 2.646 ≈ 174 units' },
        { rowIndex: 12, colIndex: 0, cellType: 'label', displayValue: '✦ Reorder Point (ROP)', isEditable: false },
        { rowIndex: 12, colIndex: 1, cellType: 'label', displayValue: '(Avg Demand × Lead Time) + Safety Stock', isEditable: false },
        { rowIndex: 12, colIndex: 2, cellType: 'editable', expectedValue: '2274', isEditable: true, tolerancePct: 1, hintText: 'ROP = (300 × 7) + 174 = 2,100 + 174 = 2,274 units' },
        { rowIndex: 13, colIndex: 0, cellType: 'header', displayValue: 'TOTAL ANNUAL INVENTORY COST', isEditable: false, colSpan: 3 },
        { rowIndex: 14, colIndex: 0, cellType: 'label', displayValue: 'Annual Ordering Cost', isEditable: false },
        { rowIndex: 14, colIndex: 1, cellType: 'label', displayValue: 'Orders/year × S', isEditable: false },
        { rowIndex: 14, colIndex: 2, cellType: 'editable', expectedValue: '6620', isEditable: true, tolerancePct: 2, hintText: 'Ordering cost = 33.1 × $200 = $6,620' },
        { rowIndex: 15, colIndex: 0, cellType: 'label', displayValue: 'Annual Holding Cost', isEditable: false },
        { rowIndex: 15, colIndex: 1, cellType: 'label', displayValue: '(EOQ/2) × H', isEditable: false },
        { rowIndex: 15, colIndex: 2, cellType: 'editable', expectedValue: '6618', isEditable: true, tolerancePct: 2, hintText: 'Holding cost = (3,309/2) × $4 = 1,654.5 × $4 = $6,618' },
        { rowIndex: 16, colIndex: 0, cellType: 'label', displayValue: '✦ Total Annual Inventory Cost', isEditable: false },
        { rowIndex: 16, colIndex: 1, cellType: 'label', displayValue: 'Ordering + Holding', isEditable: false },
        { rowIndex: 16, colIndex: 2, cellType: 'formula', formula: '=C15+C16', expectedValue: '13238', isEditable: false },
    ],
};

const quantus_pd_hard: QuantusDef = {
    title: 'Process Capacity & Bottleneck Analysis',
    instructions: 'Analyse a 5-step manufacturing process. Identify the bottleneck, compute throughput, utilisation, and the cycle time improvement needed.',
    context: 'A factory runs a 5-step assembly line for 8 hours/day, 250 days/year. Customer demand is 480 units/day. Each step has a different cycle time and number of parallel machines. Your task: find where the bottleneck is and quantify the impact.',
    columnGroups: [
        { label: 'Process Data', colStart: 1, colEnd: 3, bgColor: '#f0f0f0', textColor: '#444', orderIndex: 0 },
        { label: 'Your Analysis', colStart: 4, colEnd: 5, bgColor: '#fffbe6', textColor: '#8a6a00', orderIndex: 1 },
    ],
    columns: [
        { label: 'Step', colIndex: 0, widthPx: 100 },
        { label: 'Cycle Time (min/unit)', colIndex: 1, widthPx: 160 },
        { label: 'No. of Machines', colIndex: 2, widthPx: 130 },
        { label: 'Capacity (units/day)', colIndex: 3, widthPx: 160 },
        { label: 'Utilisation %', colIndex: 4, widthPx: 120 },
    ],
    cells: [
        { rowIndex: 0, colIndex: 0, cellType: 'header', displayValue: 'PROCESS CAPACITY ANALYSIS (8-hour day, 480 units/day demand)', isEditable: false, colSpan: 5 },
        { rowIndex: 1, colIndex: 0, cellType: 'label', displayValue: 'Step 1 — Cutting', isEditable: false },
        { rowIndex: 1, colIndex: 1, cellType: 'prefilled', displayValue: '0.8', isEditable: false },
        { rowIndex: 1, colIndex: 2, cellType: 'prefilled', displayValue: '2', isEditable: false },
        { rowIndex: 1, colIndex: 3, cellType: 'editable', expectedValue: '1200', isEditable: true, tolerancePct: 1, hintText: 'Capacity = (60 min/hr × 8 hr × machines) ÷ cycle time = (480 × 2) ÷ 0.8 = 1,200 units/day' },
        { rowIndex: 1, colIndex: 4, cellType: 'editable', expectedValue: '40', isEditable: true, tolerancePct: 2, hintText: 'Utilisation = Demand ÷ Capacity = 480 ÷ 1,200 = 40%' },
        { rowIndex: 2, colIndex: 0, cellType: 'label', displayValue: 'Step 2 — Moulding', isEditable: false },
        { rowIndex: 2, colIndex: 1, cellType: 'prefilled', displayValue: '2.0', isEditable: false },
        { rowIndex: 2, colIndex: 2, cellType: 'prefilled', displayValue: '3', isEditable: false },
        { rowIndex: 2, colIndex: 3, cellType: 'editable', expectedValue: '720', isEditable: true, tolerancePct: 1, hintText: 'Capacity = (480 min × 3 machines) ÷ 2.0 = 720 units/day' },
        { rowIndex: 2, colIndex: 4, cellType: 'editable', expectedValue: '66.7', isEditable: true, tolerancePct: 2, hintText: 'Utilisation = 480 ÷ 720 = 66.7%' },
        { rowIndex: 3, colIndex: 0, cellType: 'label', displayValue: 'Step 3 — Assembly', isEditable: false },
        { rowIndex: 3, colIndex: 1, cellType: 'prefilled', displayValue: '3.0', isEditable: false },
        { rowIndex: 3, colIndex: 2, cellType: 'prefilled', displayValue: '2', isEditable: false },
        { rowIndex: 3, colIndex: 3, cellType: 'editable', expectedValue: '320', isEditable: true, tolerancePct: 1, hintText: 'Capacity = (480 min × 2) ÷ 3.0 = 320 units/day' },
        { rowIndex: 3, colIndex: 4, cellType: 'editable', expectedValue: '150', isEditable: true, tolerancePct: 2, hintText: 'Utilisation = 480 ÷ 320 = 150% — this step is over capacity! It\'s the bottleneck.' },
        { rowIndex: 4, colIndex: 0, cellType: 'label', displayValue: 'Step 4 — Inspection', isEditable: false },
        { rowIndex: 4, colIndex: 1, cellType: 'prefilled', displayValue: '1.5', isEditable: false },
        { rowIndex: 4, colIndex: 2, cellType: 'prefilled', displayValue: '2', isEditable: false },
        { rowIndex: 4, colIndex: 3, cellType: 'editable', expectedValue: '640', isEditable: true, tolerancePct: 1, hintText: 'Capacity = (480 × 2) ÷ 1.5 = 640 units/day' },
        { rowIndex: 4, colIndex: 4, cellType: 'editable', expectedValue: '75', isEditable: true, tolerancePct: 2, hintText: 'Utilisation = 480 ÷ 640 = 75%' },
        { rowIndex: 5, colIndex: 0, cellType: 'label', displayValue: 'Step 5 — Packaging', isEditable: false },
        { rowIndex: 5, colIndex: 1, cellType: 'prefilled', displayValue: '1.0', isEditable: false },
        { rowIndex: 5, colIndex: 2, cellType: 'prefilled', displayValue: '1', isEditable: false },
        { rowIndex: 5, colIndex: 3, cellType: 'editable', expectedValue: '480', isEditable: true, tolerancePct: 1, hintText: 'Capacity = 480 min × 1 ÷ 1.0 = 480 units/day' },
        { rowIndex: 5, colIndex: 4, cellType: 'editable', expectedValue: '100', isEditable: true, tolerancePct: 2, hintText: 'Utilisation = 480 ÷ 480 = 100% — exactly at capacity' },
        { rowIndex: 6, colIndex: 0, cellType: 'header', displayValue: 'BOTTLENECK ANALYSIS', isEditable: false, colSpan: 5 },
        { rowIndex: 7, colIndex: 0, cellType: 'label', displayValue: '✦ Bottleneck Step', isEditable: false, colSpan: 2 },
        { rowIndex: 7, colIndex: 2, cellType: 'label', displayValue: 'Step with highest utilisation', isEditable: false },
        { rowIndex: 7, colIndex: 3, cellType: 'editable', expectedValue: '3', isEditable: true, tolerancePct: 0, hintText: 'Step 3 (Assembly) has 150% utilisation — it cannot meet demand. It is the bottleneck.', colSpan: 2 },
        { rowIndex: 8, colIndex: 0, cellType: 'label', displayValue: '✦ Max Throughput (current)', isEditable: false, colSpan: 2 },
        { rowIndex: 8, colIndex: 2, cellType: 'label', displayValue: 'Min capacity across all steps', isEditable: false },
        { rowIndex: 8, colIndex: 3, cellType: 'editable', expectedValue: '320', isEditable: true, tolerancePct: 1, hintText: 'Throughput is limited by the bottleneck: 320 units/day', colSpan: 2 },
        { rowIndex: 9, colIndex: 0, cellType: 'label', displayValue: '✦ Units Short per Day', isEditable: false, colSpan: 2 },
        { rowIndex: 9, colIndex: 2, cellType: 'label', displayValue: 'Demand − Throughput', isEditable: false },
        { rowIndex: 9, colIndex: 3, cellType: 'editable', expectedValue: '160', isEditable: true, tolerancePct: 0, hintText: '480 demand − 320 throughput = 160 units short per day', colSpan: 2 },
        { rowIndex: 10, colIndex: 0, cellType: 'label', displayValue: '✦ Cycle Time Needed at Step 3 to Meet Demand (with 2 machines)', isEditable: false, colSpan: 2 },
        { rowIndex: 10, colIndex: 2, cellType: 'label', displayValue: '(60 min × 8 hr × machines) ÷ Demand', isEditable: false },
        { rowIndex: 10, colIndex: 3, cellType: 'editable', expectedValue: '2.0', isEditable: true, tolerancePct: 1, hintText: 'Required cycle time = (480 min × 2) ÷ 480 = 960 ÷ 480 = 2.0 min/unit — reduce from 3.0 to 2.0', colSpan: 2 },
    ],
};

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN SEED FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

async function seedMcqQuantus(
    lessonIndex: Record<string, { id: string; name: string; difficulty: string; activityType: string }>
) {
    console.log('\n🌱  Seeding MCQ + Quantus activity content...\n');

    // ── The Income Statement (finance/topic0/subtopic0) ───────────────────────
    console.log('  📝  The Income Statement');
    const fsE = findLesson(lessonIndex, 'finance/0/0/easy');
    const fsM = findLesson(lessonIndex, 'finance/0/0/medium');
    const fsH = findLesson(lessonIndex, 'finance/0/0/hard');
    await upsertMcq(fsE, mcq_fs_easy); console.log('    ✓ easy MCQ');
    await upsertMcq(fsM, mcq_fs_medium); console.log('    ✓ medium MCQ');
    await upsertMcq(fsH, mcq_fs_hard); console.log('    ✓ hard MCQ');
    await upsertQuantus(fsH, quantus_fs_hard); console.log('    ✓ hard Quantus');

    // ── The Balance Sheet (finance/topic0/subtopic1) ──────────────────────────
    console.log('  📝  The Balance Sheet');
    const csE = findLesson(lessonIndex, 'finance/0/1/easy');
    const csM = findLesson(lessonIndex, 'finance/0/1/medium');
    const csH = findLesson(lessonIndex, 'finance/0/1/hard');
    await upsertMcq(csE, mcq_cs_easy); console.log('    ✓ easy MCQ');
    await upsertMcq(csM, mcq_cs_medium); console.log('    ✓ medium MCQ');
    await upsertMcq(csH, mcq_cs_hard); console.log('    ✓ hard MCQ');
    await upsertQuantus(csH, quantus_cs_hard); console.log('    ✓ hard Quantus');

    // ── The Cash Flow Statement (finance/topic0/subtopic2) ───────────────────
    console.log('  📝  The Cash Flow Statement');
    const caE = findLesson(lessonIndex, 'finance/0/2/easy');
    const caM = findLesson(lessonIndex, 'finance/0/2/medium');
    const caH = findLesson(lessonIndex, 'finance/0/2/hard');
    await upsertMcq(caE, mcq_ca_easy); console.log('    ✓ easy MCQ');
    await upsertMcq(caM, mcq_ca_medium); console.log('    ✓ medium MCQ');
    await upsertMcq(caH, mcq_ca_hard); console.log('    ✓ hard MCQ');
    await upsertQuantus(caH, quantus_ca_hard); console.log('    ✓ hard Quantus');

    // ── Time Value of Money (finance/topic1/subtopic0) ────────────────────────
    console.log('  📝  Time Value of Money');
    const gsE = findLesson(lessonIndex, 'finance/1/0/easy');
    const gsM = findLesson(lessonIndex, 'finance/1/0/medium');
    const gsH = findLesson(lessonIndex, 'finance/1/0/hard');
    await upsertMcq(gsE, mcq_gs_easy); console.log('    ✓ easy MCQ');
    await upsertMcq(gsM, mcq_gs_medium); console.log('    ✓ medium MCQ');
    await upsertMcq(gsH, mcq_gs_hard); console.log('    ✓ hard MCQ');
    await upsertQuantus(gsH, quantus_gs_hard); console.log('    ✓ hard Quantus');

    // ── Enterprise & Equity Value (finance/topic1/subtopic1) ─────────────────
    console.log('  📝  Enterprise & Equity Value');
    const dpE = findLesson(lessonIndex, 'finance/1/1/easy');
    const dpM = findLesson(lessonIndex, 'finance/1/1/medium');
    const dpH = findLesson(lessonIndex, 'finance/1/1/hard');
    await upsertMcq(dpE, mcq_dp_easy); console.log('    ✓ easy MCQ');
    await upsertMcq(dpM, mcq_dp_medium); console.log('    ✓ medium MCQ');
    await upsertMcq(dpH, mcq_dp_hard); console.log('    ✓ hard MCQ');
    await upsertQuantus(dpH, quantus_dp_hard); console.log('    ✓ hard Quantus');

    // ── Porter's Five Forces (strategy/topic0/subtopic0) ─────────────────────
    console.log('  📝  Porter\'s Five Forces');
    const pdE = findLesson(lessonIndex, 'strategy/0/0/easy');
    const pdM = findLesson(lessonIndex, 'strategy/0/0/medium');
    const pdH = findLesson(lessonIndex, 'strategy/0/0/hard');
    await upsertMcq(pdE, mcq_pd_easy); console.log('    ✓ easy MCQ');
    await upsertMcq(pdM, mcq_pd_medium); console.log('    ✓ medium MCQ');
    await upsertMcq(pdH, mcq_pd_hard); console.log('    ✓ hard MCQ');
    await upsertQuantus(pdH, quantus_pd_hard); console.log('    ✓ hard Quantus');
    console.log('✅  MCQ + Quantus seed complete!');
    console.log('  ─────────────────────────────────────────────────────────');
    console.log('  18 MCQ activities  (6 subtopics × 3 difficulties)');
    console.log('  72 MCQ questions   (18 activities × 4 questions)');
    console.log('  288 MCQ options    (72 questions × 4 options)');
    console.log('  6  Quantus sheets  (hard lesson per subtopic)');
    console.log('  Canvas tables:     NOT TOUCHED ✓');
    console.log('  ─────────────────────────────────────────────────────────');
}

async function main() {
    console.log('🔍 Reconstructing lesson index from database...');
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

    await seedMcqQuantus(lessonIndex);
}

main()
    .catch((e) => {
        console.error('❌ Error seeding MCQ + Quantus:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
