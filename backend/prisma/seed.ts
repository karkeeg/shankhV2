// ═══════════════════════════════════════════════════════════════════════════
// Shankh — Complete Database Seed (v3 — new schema)
// ═══════════════════════════════════════════════════════════════════════════
//
// Populates:
//   • One demo user
//   • 8 Professions
//   • Learning tree: 3 Modules → 2 Topics each → 3 Subtopics each → 3 Lessons
//     = 54 lessons with Canvas activities (from seed part 1)
//   • Additional MCQ + Quantus activities on every lesson (from seed part 2)
//   • SubtopicProfessionTags for cross-promotion
//
// Removed from old seed:
//   ✗ SkillSection, SkillBundle, SkillBundleProfession, SkillBundleItem
//   ✗ UserSkillBundleProgress, UserSkillItemProgress
//   ✗ SkillTopic, SkillLesson, UserSkillTopicProgress, UserSkillLessonProgress
//   ✗ SkillMcqSession, SkillMcqAnswer, SkillCanvasSession, SkillQuantusSession
//
// Run: npx prisma db seed
// ═══════════════════════════════════════════════════════════════════════════

import { PrismaClient, Prisma } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── Types ───────────────────────────────────────────────────────────────────

type ActivityType = "mcq" | "canvas" | "quantus";
type Difficulty = "easy" | "medium" | "hard";

// ─── Reset (FK-safe order) ────────────────────────────────────────────────────

async function reset() {
  console.log("  Clearing existing data...");
  await prisma.$transaction([
    // User activity
    prisma.userHintUsage.deleteMany(),
    prisma.userMcqAnswer.deleteMany(),
    prisma.userMcqSession.deleteMany(),
    prisma.userCanvasSession.deleteMany(),
    prisma.userQuantusSession.deleteMany(),
    prisma.userActivityDraft.deleteMany(),
    prisma.userLessonSession.deleteMany(),
    // Progress
    prisma.userLessonProgress.deleteMany(),
    prisma.userSubtopicProgress.deleteMany(),
    prisma.userTopicProgress.deleteMany(),
    prisma.userModuleProgress.deleteMany(),
    prisma.userStreak.deleteMany(),
    // Skill building — tests (new system)
    prisma.userSkillTestResponse.deleteMany(),
    prisma.userSkillTestSession.deleteMany(),
    prisma.skillTestItem.deleteMany(),
    prisma.skillTestTypeConfig.deleteMany(),
    prisma.skillTest.deleteMany(),
    // Content
    prisma.activityHint.deleteMany(),
    prisma.canvasSolutionEdge.deleteMany(),
    prisma.canvasToken.deleteMany(),
    prisma.canvasActivity.deleteMany(),
    prisma.quantusCell.deleteMany(),
    prisma.quantusColumn.deleteMany(),
    prisma.quantusColumnGroup.deleteMany(),
    prisma.quantusActivity.deleteMany(),
    prisma.mcqOption.deleteMany(),
    prisma.mcqQuestion.deleteMany(),
    prisma.mcqActivity.deleteMany(),
    prisma.lessonActivity.deleteMany(),
    prisma.lesson.deleteMany(),
    prisma.subtopicProfessionTag.deleteMany(),
    prisma.subtopic.deleteMany(),
    prisma.topic.deleteMany(),
    prisma.module.deleteMany(),
    prisma.profession.deleteMany(),
    // Case simulations
    prisma.userCaseSession.deleteMany(),
    prisma.caseActivity.deleteMany(),
    prisma.caseStudy.deleteMany(),
    prisma.caseSimulation.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

// ═══════════════════════════════════════════════════════════════════════════
// USERS & PROFESSIONS
// ═══════════════════════════════════════════════════════════════════════════

async function seedUser() {
  const learnerHash = await bcrypt.hash("shankh-demo", 10);
  const adminHash = await bcrypt.hash("shankh-admin", 10);
  await prisma.user.create({
    data: {
      email: "demo@shankh.app",
      name: "Demo Learner",
      passwordHash: learnerHash,
      role: "learner",
      planType: "pro",
      timezone: "Asia/Kolkata",
    },
  });
  await prisma.user.create({
    data: {
      email: "admin@shankh.app",
      name: "Shankh Admin",
      passwordHash: adminHash,
      role: "admin",
      planType: "pro",
      timezone: "Asia/Kolkata",
    },
  });
}

const PROFESSIONS = [
  { slug: "ca", name: "Chartered Accountant", icon: "calculator", order: 1, description: "Audit, taxation, financial reporting and assurance." },
  { slug: "account_head", name: "Account Head", icon: "ledger", order: 2, description: "Owns the books end-to-end: closing cycles, controls, consolidation." },
  { slug: "ib", name: "Investment Banker", icon: "trending-up", order: 3, description: "Valuation, deal structuring and capital raising." },
  { slug: "pe", name: "Private Equity Analyst", icon: "briefcase", order: 4, description: "Screens and underwrites buyouts. Builds LBO models." },
  { slug: "strategy", name: "Strategy Consultant", icon: "target", order: 5, description: "Frames business problems with structured frameworks." },
  { slug: "ops_mgr", name: "Operations Manager", icon: "settings", order: 6, description: "Runs throughput, inventory and process flow." },
  { slug: "mgmt_consultant", name: "Management Consultant", icon: "users", order: 7, description: "Cross-functional problem solver." },
  { slug: "fin_analyst", name: "Financial Analyst", icon: "bar-chart", order: 8, description: "Forecasting, budgeting and variance analysis." },
] as const;

async function seedProfessions() {
  const professions: Record<string, { id: string; slug: string }> = {};
  for (const p of PROFESSIONS) {
    const row = await prisma.profession.create({
      data: { slug: p.slug, name: p.name, description: p.description, iconKey: p.icon, orderIndex: p.order },
    });
    professions[p.slug] = { id: row.id, slug: p.slug };
  }
  return { professions };
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVITY CONTENT TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

interface McqOptionDef { text: string; correct?: boolean; }
interface McqQuestionDef { q: string; explanation: string; options: McqOptionDef[]; }
interface McqContent { kind: "mcq"; title: string; instructions: string; context: string; questions: McqQuestionDef[]; }

interface TokenDef { ref: string; text: string; role: "operand" | "operator" | "relation" | "result"; shape?: "rect" | "diamond" | "ellipse" | "pill"; distractor?: boolean; }
interface EdgeDef { from: string; to: string; slot?: "left" | "right"; commutative?: boolean; role: "sequence" | "connection"; order?: number; label?: string; }
interface CanvasContent { kind: "canvas"; title: string; instructions: string; context: string; assemblyMode: "sequence" | "graph"; tokens: TokenDef[]; edges: EdgeDef[]; }

interface CellDef { r: number; c: number; type: "editable" | "formula" | "prefilled" | "empty" | "header"; display?: string; expected?: string; formula?: string; format?: string; editable?: boolean; tolerancePct?: number; hint?: string; }
interface ColGroupDef { label: string; start: number; end: number; bg?: string; }
interface ColDef { label: string; index: number; width?: number; }
interface QuantusContent { kind: "quantus"; title: string; instructions: string; context: string; colGroups: ColGroupDef[]; cols: ColDef[]; cells: CellDef[]; }

type ActivityContent = McqContent | CanvasContent | QuantusContent;

interface LessonDef { name: string; difficulty: Difficulty; estMins: number; description: string; hints: string[]; activity: ActivityContent; }
interface SubtopicDef { name: string; description: string; professionSlugs?: string[]; lessons: LessonDef[]; }
interface TopicDef { name: string; subtitle: string; description: string; level?: string; durationWeeks?: number; subtopics: SubtopicDef[]; }
interface ModuleDef { slug: string; name: string; description: string; accent: string; icon: string; topics: TopicDef[]; }

// ═══════════════════════════════════════════════════════════════════════════
// MODULE 1 — FINANCE
// ═══════════════════════════════════════════════════════════════════════════

const FINANCE: ModuleDef = {
  slug: "finance", name: "Finance", accent: "#1e6f5c", icon: "trending-up",
  description: "From reading the three statements to building a forecast and valuing a business.",
  topics: [
    {
      name: "Financial Statements", subtitle: "Read the books before you build them",
      level: "Beginners / Intermediate", durationWeeks: 1.5,
      description: "How the income statement, balance sheet and cash flow statement fit together.",
      subtopics: [
        {
          name: "The Income Statement", professionSlugs: ["ca", "account_head", "fin_analyst"],
          description: "Revenue down to net income, line by line.",
          lessons: [
            {
              name: "Revenue to Gross Profit", difficulty: "easy", estMins: 15,
              description: "The top of the P&L: how sales become gross profit.",
              hints: [
                "Gross profit isolates the cost of making the product, before any overhead.",
                "COGS is subtracted from revenue — it is the only cost above the gross-profit line.",
                "Gross Profit = Revenue − COGS. Operating expenses come later, not here.",
              ],
              activity: {
                kind: "canvas", assemblyMode: "sequence",
                title: "Build the Gross Profit identity",
                instructions: "Assemble the gross-profit calculation from the tokens in the sidebar. Drag the pieces onto the canvas and order them left to right so they form the correct accounting identity that takes you from the top line of the income statement down to gross profit. You are building an equation, not sorting items into boxes — the order and the operator both matter. The sidebar contains more pieces than you need: some are valid income-statement terms that simply do not belong in this particular relationship. Choose only the operands and the operator that define gross profit, place the equals sign, and finish with the correct result term. When you are confident the expression reads correctly from left to right, click Check Answer.",
                context: "Gross profit is the first profitability subtotal on the income statement. It measures how much a company keeps from each unit of sales after paying only the direct cost of producing what it sold — its cost of goods sold (COGS). It deliberately excludes operating expenses such as salaries, rent and marketing, which sit further down the statement. Analysts watch the gross margin (gross profit ÷ revenue) closely because it reveals pricing power and production efficiency independent of how the business is run or financed. A retailer might run a 30% gross margin while a software firm runs 85%; the difference is structural, not a sign that one is better managed.",
                tokens: [
                  { ref: "rev", text: "Revenue", role: "operand", shape: "rect" },
                  { ref: "minus", text: "−", role: "operator", shape: "diamond" },
                  { ref: "cogs", text: "COGS", role: "operand", shape: "rect" },
                  { ref: "eq", text: "=", role: "relation", shape: "diamond" },
                  { ref: "gp", text: "Gross Profit", role: "result", shape: "pill" },
                  { ref: "opex", text: "Operating Expenses", role: "operand", shape: "rect", distractor: true },
                  { ref: "plus", text: "+", role: "operator", shape: "diamond", distractor: true },
                  { ref: "ni", text: "Net Income", role: "result", shape: "pill", distractor: true },
                ],
                edges: [
                  { from: "rev", to: "minus", role: "sequence", order: 1, slot: "left" },
                  { from: "minus", to: "cogs", role: "sequence", order: 2, slot: "right" },
                  { from: "cogs", to: "eq", role: "sequence", order: 3 },
                  { from: "eq", to: "gp", role: "sequence", order: 4 },
                ],
              },
            },
            {
              name: "Operating Income & EBIT", difficulty: "medium", estMins: 20,
              description: "From gross profit to operating income by stripping out overhead.",
              hints: [
                "Operating income is what's left after the costs of running the business, but before interest and tax.",
                "Start from gross profit and subtract operating expenses.",
                "EBIT = Gross Profit − Operating Expenses. Interest and tax are below this line.",
              ],
              activity: {
                kind: "canvas", assemblyMode: "sequence",
                title: "Build operating income (EBIT)",
                instructions: "Construct the identity that takes you from gross profit to operating income, also called EBIT. Drag tokens from the sidebar onto the canvas and arrange them left to right into the correct equation. Remember that operating income measures profitability from core operations only — it is calculated before the company's financing choices (interest) and before tax. The sidebar includes distractor tokens that belong elsewhere on the income statement, such as interest and tax line items; including them here would describe a different subtotal entirely. Select the correct starting subtotal, the right cost to subtract, the equals sign and the correct result, then order them and click Check Answer.",
                context: "Operating income — EBIT, earnings before interest and taxes — is the profit a business generates from its core activities. By stopping above interest and tax, it lets you compare the operating performance of two companies regardless of how they are financed or which tax regime they fall under. This is why EBIT and the related EBITDA are the workhorses of valuation multiples: an acquirer cares about the operating engine first and will layer on its own financing afterwards. Moving from gross profit to EBIT means absorbing operating expenses — the SG&A, R&D and depreciation that keep the business running but are not part of the direct cost of each sale.",
                tokens: [
                  { ref: "gp", text: "Gross Profit", role: "operand", shape: "rect" },
                  { ref: "minus", text: "−", role: "operator", shape: "diamond" },
                  { ref: "opex", text: "Operating Expenses", role: "operand", shape: "rect" },
                  { ref: "eq", text: "=", role: "relation", shape: "diamond" },
                  { ref: "ebit", text: "Operating Income (EBIT)", role: "result", shape: "pill" },
                  { ref: "int", text: "Interest Expense", role: "operand", shape: "rect", distractor: true },
                  { ref: "tax", text: "Tax", role: "operand", shape: "rect", distractor: true },
                  { ref: "ni", text: "Net Income", role: "result", shape: "pill", distractor: true },
                ],
                edges: [
                  { from: "gp", to: "minus", role: "sequence", order: 1, slot: "left" },
                  { from: "minus", to: "opex", role: "sequence", order: 2, slot: "right" },
                  { from: "opex", to: "eq", role: "sequence", order: 3 },
                  { from: "eq", to: "ebit", role: "sequence", order: 4 },
                ],
              },
            },
            {
              name: "Net Income Bridge", difficulty: "hard", estMins: 25,
              description: "The full walk from EBIT to net income through interest and tax.",
              hints: [
                "Two things stand between EBIT and net income: the cost of debt and the government's share.",
                "Subtract interest to reach pre-tax income, then subtract tax to reach net income.",
                "EBIT − Interest = Pre-tax Income; Pre-tax Income − Tax = Net Income.",
              ],
              activity: {
                kind: "canvas", assemblyMode: "graph",
                title: "Connect the EBIT-to-Net-Income bridge",
                instructions: "This is a two-step bridge, so you will build it as a graph rather than a single line. Drag the tokens onto the canvas and draw arrows to connect them into the correct flow: first show how EBIT becomes pre-tax income, then how pre-tax income becomes net income. Each subtraction has a left and a right side, and direction matters — interest is subtracted from EBIT, not the other way around. The sidebar contains distractors, including operating-level items that have already been accounted for above this point in the statement. Connect only the tokens that belong in the financing-and-tax portion of the income statement, then click Check Answer.",
                context: "Below operating income, two forces reduce profit to its final figure. First, interest expense — the cost of the company's debt — is subtracted from EBIT to give pre-tax income (also called EBT). This is where capital structure finally enters: a heavily leveraged firm and a debt-free firm with identical operations will diverge here. Second, tax is applied to pre-tax income, leaving net income, the bottom line that flows to retained earnings and, ultimately, to shareholders. Understanding this bridge is essential for valuation and for the tax shield concept in particular: because interest is deducted before tax, debt financing carries a tax advantage that equity does not.",
                tokens: [
                  { ref: "ebit", text: "EBIT", role: "operand", shape: "rect" },
                  { ref: "m1", text: "−", role: "operator", shape: "diamond" },
                  { ref: "int", text: "Interest", role: "operand", shape: "rect" },
                  { ref: "eq1", text: "=", role: "relation", shape: "diamond" },
                  { ref: "ebt", text: "Pre-tax Income", role: "result", shape: "pill" },
                  { ref: "m2", text: "−", role: "operator", shape: "diamond" },
                  { ref: "tax", text: "Tax", role: "operand", shape: "rect" },
                  { ref: "eq2", text: "=", role: "relation", shape: "diamond" },
                  { ref: "ni", text: "Net Income", role: "result", shape: "pill" },
                  { ref: "cogs", text: "COGS", role: "operand", shape: "rect", distractor: true },
                  { ref: "dep", text: "Depreciation", role: "operand", shape: "rect", distractor: true },
                ],
                edges: [
                  { from: "ebit", to: "m1", role: "connection", slot: "left" },
                  { from: "int", to: "m1", role: "connection", slot: "right" },
                  { from: "m1", to: "eq1", role: "connection" },
                  { from: "eq1", to: "ebt", role: "connection" },
                  { from: "ebt", to: "m2", role: "connection", slot: "left" },
                  { from: "tax", to: "m2", role: "connection", slot: "right" },
                  { from: "m2", to: "eq2", role: "connection" },
                  { from: "eq2", to: "ni", role: "connection" },
                ],
              },
            },
          ],
        },
        {
          name: "The Balance Sheet", professionSlugs: ["ca", "account_head"],
          description: "Assets, liabilities and equity — and why they always balance.",
          lessons: [
            {
              name: "The Accounting Equation", difficulty: "easy", estMins: 15,
              description: "Why every balance sheet balances.",
              hints: [
                "Everything a company owns was funded somehow — by lenders or by owners.",
                "Assets sit on one side; the two sources of funding sit on the other.",
                "Assets = Liabilities + Equity. The '+' side can be in either order.",
              ],
              activity: {
                kind: "canvas", assemblyMode: "sequence",
                title: "Build the accounting equation",
                instructions: "Assemble the fundamental accounting equation from the sidebar tokens. Drag the pieces onto the canvas and order them so the equation reads correctly from left to right. Think about what a balance sheet is really saying: everything the business controls had to be paid for by someone. Note that the right-hand side combines two funding sources with a plus, and because addition is commutative, the system will accept those two operands in either order — what it will not accept is the wrong term, the wrong operator, or the assets total on the wrong side. The sidebar includes distractor tokens drawn from the income statement that have no place in this identity. Build the equation and click Check Answer.",
                context: "The accounting equation — Assets = Liabilities + Equity — is the bedrock of double-entry bookkeeping and the reason a balance sheet always balances. Read it as a statement about funding: the left side lists everything the company owns and controls, while the right side shows where the money to acquire those assets came from. Liabilities represent claims from outside parties such as lenders and suppliers; equity represents the residual claim of the owners. Every transaction touches at least two accounts and preserves the equality. When an analyst sees a balance sheet that does not balance, it is not a judgement call — it is an error, because the identity holds by construction.",
                tokens: [
                  { ref: "assets", text: "Assets", role: "operand", shape: "rect" },
                  { ref: "eq", text: "=", role: "relation", shape: "diamond" },
                  { ref: "liab", text: "Liabilities", role: "operand", shape: "rect" },
                  { ref: "plus", text: "+", role: "operator", shape: "diamond" },
                  { ref: "equity", text: "Equity", role: "operand", shape: "rect" },
                  { ref: "rev", text: "Revenue", role: "operand", shape: "rect", distractor: true },
                  { ref: "ni", text: "Net Income", role: "operand", shape: "rect", distractor: true },
                ],
                edges: [
                  { from: "assets", to: "eq", role: "sequence", order: 1 },
                  { from: "eq", to: "liab", role: "sequence", order: 2, slot: "left", commutative: true },
                  { from: "liab", to: "plus", role: "sequence", order: 3 },
                  { from: "plus", to: "equity", role: "sequence", order: 4, slot: "right", commutative: true },
                ],
              },
            },
            {
              name: "Working Capital", difficulty: "medium", estMins: 20,
              description: "The short-term liquidity buffer and how to read it.",
              hints: [
                "Working capital is about the near term — what's due soon versus what's available soon.",
                "It compares current assets against current liabilities.",
                "Net Working Capital = Current Assets − Current Liabilities.",
              ],
              activity: {
                kind: "mcq",
                title: "Working capital concepts",
                instructions: "Answer the following questions on working capital. Each question has exactly one correct answer. Working capital is a practical, everyday concept for anyone managing a business's liquidity, and these questions move from the basic definition toward how changes in working capital actually affect cash.",
                context: "Working capital measures a company's short-term financial health — its ability to cover obligations coming due within a year using assets that will convert to cash within a year. Net working capital is current assets minus current liabilities. But the figure on its own is less interesting than its movement: when working capital rises (say, inventory builds up or customers are slow to pay), cash is consumed, even if the income statement looks healthy.",
                questions: [
                  { q: "What is net working capital?", explanation: "Net working capital is current assets minus current liabilities — the short-term resources left over after meeting short-term obligations.", options: [{ text: "Current assets − current liabilities", correct: true }, { text: "Total assets − total liabilities" }, { text: "Revenue − operating expenses" }, { text: "Cash + inventory" }] },
                  { q: "A company's inventory increases significantly during the year, with all else equal. What is the effect on cash flow?", explanation: "Building inventory ties up cash — you have paid for goods you have not yet sold. An increase in a current asset is a use of cash.", options: [{ text: "Cash flow decreases", correct: true }, { text: "Cash flow increases" }, { text: "No effect on cash flow" }, { text: "Net income decreases but cash is unaffected" }] },
                  { q: "Which change is a SOURCE of cash?", explanation: "An increase in accounts payable means you are holding onto cash longer by paying suppliers later — a source of cash.", options: [{ text: "An increase in accounts payable", correct: true }, { text: "An increase in accounts receivable" }, { text: "An increase in inventory" }, { text: "An increase in prepaid expenses" }] },
                ],
              },
            },
            {
              name: "Asset Composition Analysis", difficulty: "hard", estMins: 25,
              description: "Build a common-size balance sheet to compare structure.",
              hints: [
                "Common-size means expressing every line as a percentage of total assets.",
                "Each line item is divided by total assets, so the asset side sums to 100%.",
                "Use the formula =cell/total_assets and format as a percentage.",
              ],
              activity: {
                kind: "quantus",
                title: "Common-size the balance sheet",
                instructions: "Complete the common-size balance sheet by filling in the percentage column. For each asset and funding line, express it as a percentage of total assets by entering the correct formula in the yellow editable cells. Common-sizing strips out the effect of company size, letting you compare the structural shape of two very different businesses on equal footing.",
                context: "A common-size balance sheet restates every line item as a percentage of total assets. This simple transformation is one of the most powerful comparative tools in financial analysis because it removes scale: a $50m firm and a $5bn firm become directly comparable in structure. You can immediately see whether a company is asset-heavy or asset-light, how much of its funding comes from debt versus equity, and how its mix shifts over time.",
                colGroups: [{ label: "Balance Sheet", start: 1, end: 2, bg: "#e8e8ff" }],
                cols: [{ label: "Line Item", index: 0, width: 180 }, { label: "Amount ($m)", index: 1, width: 110 }, { label: "% of Total Assets", index: 2, width: 140 }],
                cells: [
                  { r: 0, c: 0, type: "header", display: "Assets" },
                  { r: 1, c: 0, type: "prefilled", display: "Cash" },
                  { r: 1, c: 1, type: "prefilled", display: "120" },
                  { r: 1, c: 2, type: "editable", expected: "15", formula: "=B1/B4*100", format: "percent", editable: true, tolerancePct: 1, hint: "Cash ÷ Total Assets" },
                  { r: 2, c: 0, type: "prefilled", display: "Receivables" },
                  { r: 2, c: 1, type: "prefilled", display: "200" },
                  { r: 2, c: 2, type: "editable", expected: "25", formula: "=B2/B4*100", format: "percent", editable: true, tolerancePct: 1, hint: "Receivables ÷ Total Assets" },
                  { r: 3, c: 0, type: "prefilled", display: "PP&E" },
                  { r: 3, c: 1, type: "prefilled", display: "480" },
                  { r: 3, c: 2, type: "editable", expected: "60", formula: "=B3/B4*100", format: "percent", editable: true, tolerancePct: 1, hint: "PP&E ÷ Total Assets" },
                  { r: 4, c: 0, type: "header", display: "Total Assets" },
                  { r: 4, c: 1, type: "prefilled", display: "800" },
                  { r: 4, c: 2, type: "formula", expected: "100", formula: "=SUM(C1:C3)", format: "percent" },
                ],
              },
            },
          ],
        },
        {
          name: "The Cash Flow Statement", professionSlugs: ["ca", "fin_analyst", "ib"],
          description: "Where profit and cash part ways.",
          lessons: [
            {
              name: "Net Income vs Cash", difficulty: "easy", estMins: 15,
              description: "Why a profitable company can still be cash-poor.",
              hints: [
                "Profit is an accounting concept; cash is what's actually in the bank.",
                "Non-cash charges like depreciation reduce profit but not cash.",
                "Cash from operations starts at net income and adds back non-cash items.",
              ],
              activity: {
                kind: "mcq",
                title: "Profit versus cash",
                instructions: "Answer these questions on the difference between accounting profit and cash flow. Each question has one correct answer.",
                context: "Net income and cash flow diverge for two main reasons. First, the income statement includes non-cash expenses — depreciation and amortisation chief among them — that reduce reported profit without any cash leaving the business. Second, accrual accounting records revenue when earned and expenses when incurred, not when cash changes hands.",
                questions: [
                  { q: "Why is depreciation added back when calculating cash from operations?", explanation: "Depreciation reduces net income but no cash actually leaves the business in that period — the cash was spent when the asset was purchased. So it is added back.", options: [{ text: "It is a non-cash expense already deducted from net income", correct: true }, { text: "It increases the value of the asset" }, { text: "It is a cash inflow from operations" }, { text: "It represents new capital expenditure" }] },
                  { q: "A company reports strong net income but negative operating cash flow. What is the most likely cause?", explanation: "A large build-up in receivables or inventory consumes cash even as the income statement shows profit.", options: [{ text: "A large increase in working capital", correct: true }, { text: "High depreciation charges" }, { text: "Repaying long-term debt" }, { text: "Issuing new equity" }] },
                  { q: "Which item appears in cash from operations but NOT on the income statement?", explanation: "Changes in working capital adjust operating cash flow but are not income-statement line items themselves.", options: [{ text: "Change in accounts receivable", correct: true }, { text: "Cost of goods sold" }, { text: "Interest expense" }, { text: "Depreciation" }] },
                ],
              },
            },
            {
              name: "Building Cash From Operations", difficulty: "medium", estMins: 20,
              description: "The indirect-method walk from net income to operating cash.",
              hints: [
                "Start at net income, then undo the non-cash and timing distortions.",
                "Add back depreciation; adjust for the change in working capital.",
                "CFO = Net Income + Depreciation − Increase in Working Capital.",
              ],
              activity: {
                kind: "quantus",
                title: "Indirect-method operating cash flow",
                instructions: "Build the operating section of the cash flow statement using the indirect method. Starting from net income, enter formulas in the yellow editable cells to add back non-cash charges and adjust for the change in working capital, arriving at cash from operations.",
                context: "The indirect method is how almost every real company presents operating cash flow. Rather than listing every cash receipt and payment, it starts from net income and reconciles it to cash by reversing the accounting adjustments that separate the two. Non-cash expenses like depreciation are added back. Then each component of working capital is adjusted.",
                colGroups: [{ label: "Cash Flow from Operations", start: 1, end: 1, bg: "#e8f5e8" }],
                cols: [{ label: "Line Item", index: 0, width: 220 }, { label: "$m", index: 1, width: 100 }],
                cells: [
                  { r: 0, c: 0, type: "prefilled", display: "Net Income" },
                  { r: 0, c: 1, type: "prefilled", display: "150" },
                  { r: 1, c: 0, type: "prefilled", display: "(+) Depreciation" },
                  { r: 1, c: 1, type: "prefilled", display: "60" },
                  { r: 2, c: 0, type: "prefilled", display: "(−) Increase in Working Capital" },
                  { r: 2, c: 1, type: "prefilled", display: "40" },
                  { r: 3, c: 0, type: "header", display: "Cash from Operations" },
                  { r: 3, c: 1, type: "editable", expected: "170", formula: "=B0+B1-B2", format: "number", editable: true, tolerancePct: 0, hint: "Net income + depreciation − increase in working capital" },
                ],
              },
            },
            {
              name: "Free Cash Flow", difficulty: "hard", estMins: 30,
              description: "From operating cash to the cash available to all investors.",
              hints: [
                "Free cash flow is what's left for investors after the business reinvests in itself.",
                "Subtract capital expenditure from operating cash flow.",
                "FCF = Cash from Operations − Capital Expenditure.",
              ],
              activity: {
                kind: "canvas", assemblyMode: "sequence",
                title: "Build the free cash flow identity",
                instructions: "Assemble the definition of free cash flow from the sidebar. Drag the tokens onto the canvas and order them into the correct identity that takes cash from operations down to the free cash flow available to investors. Free cash flow is the single most important number in intrinsic valuation, so getting its definition exactly right matters.",
                context: "Free cash flow (FCF) is the cash a business generates after funding the investment needed to maintain and grow its operations. In its most common form, FCF equals cash from operations minus capital expenditure. What remains is genuinely 'free': it can be returned to shareholders as dividends or buybacks, used to repay debt, or stockpiled.",
                tokens: [
                  { ref: "cfo", text: "Cash from Operations", role: "operand", shape: "rect" },
                  { ref: "minus", text: "−", role: "operator", shape: "diamond" },
                  { ref: "capex", text: "Capital Expenditure", role: "operand", shape: "rect" },
                  { ref: "eq", text: "=", role: "relation", shape: "diamond" },
                  { ref: "fcf", text: "Free Cash Flow", role: "result", shape: "pill" },
                  { ref: "div", text: "Dividends", role: "operand", shape: "rect", distractor: true },
                  { ref: "debt", text: "Debt Repayment", role: "operand", shape: "rect", distractor: true },
                  { ref: "plus", text: "+", role: "operator", shape: "diamond", distractor: true },
                ],
                edges: [
                  { from: "cfo", to: "minus", role: "sequence", order: 1, slot: "left" },
                  { from: "minus", to: "capex", role: "sequence", order: 2, slot: "right" },
                  { from: "capex", to: "eq", role: "sequence", order: 3 },
                  { from: "eq", to: "fcf", role: "sequence", order: 4 },
                ],
              },
            },
          ],
        },
        {
          name: "DuPont Analysis & Return Metrics",
          professionSlugs: ["ib", "ca", "fin_analyst"],
          description: "Decompose return on equity into its operating, efficiency, and leverage drivers using the DuPont framework.",
          lessons: [
            {
              name: "The 3-Factor DuPont Model", difficulty: "easy", estMins: 20,
              description: "Decompose ROE into net profit margin, asset turnover, and equity multiplier.",
              hints: [
                "ROE can be broken into three drivers: profitability, efficiency, and leverage.",
                "Net Profit Margin = Net Income ÷ Revenue. Asset Turnover = Revenue ÷ Total Assets. Equity Multiplier = Total Assets ÷ Equity.",
                "ROE = Net Profit Margin × Asset Turnover × Equity Multiplier.",
              ],
              activity: {
                kind: "canvas", assemblyMode: "graph",
                title: "Map the DuPont Decomposition Tree",
                instructions: "Build the 3-factor DuPont model as a hierarchy tree. Connect each building block — Net Income, Revenue, Total Assets, Equity — upward to their ratio node (Net Profit Margin, Asset Turnover, Equity Multiplier). Then connect those three ratio nodes upward to ROE. Revenue and Total Assets each feed two different ratios, so draw both connections from each shared node. Two sidebar tokens are distractors that do not appear in this identity. When every edge is in place, click Check Answer.",
                context: "The three-factor DuPont model decomposes return on equity into three multiplicative drivers. Net Profit Margin captures profitability — how many cents of every rupee of revenue the firm keeps after all expenses. Asset Turnover measures efficiency — how much revenue each rupee of assets generates. Equity Multiplier reflects leverage — the ratio of total assets to equity, showing how much of the asset base is funded by debt. Multiplying the three always returns the ROE, making it immediately visible whether an improvement comes from better margins, faster asset utilisation, or increased leverage.",
                tokens: [
                  { ref: "roe",    text: "ROE",               role: "result",  shape: "pill" },
                  { ref: "npm",    text: "Net Profit Margin",  role: "operand", shape: "rect" },
                  { ref: "at",     text: "Asset Turnover",     role: "operand", shape: "rect" },
                  { ref: "em",     text: "Equity Multiplier",  role: "operand", shape: "rect" },
                  { ref: "ni",     text: "Net Income",         role: "operand", shape: "rect" },
                  { ref: "rev",    text: "Revenue",            role: "operand", shape: "rect" },
                  { ref: "ta",     text: "Total Assets",       role: "operand", shape: "rect" },
                  { ref: "eq",     text: "Equity",             role: "operand", shape: "rect" },
                  { ref: "ebitda", text: "EBITDA",             role: "operand", shape: "rect", distractor: true },
                  { ref: "gp",     text: "Gross Profit",       role: "operand", shape: "rect", distractor: true },
                ],
                edges: [
                  { from: "ni",  to: "npm", role: "connection", label: "component of" },
                  { from: "rev", to: "npm", role: "connection", label: "component of" },
                  { from: "rev", to: "at",  role: "connection", label: "component of" },
                  { from: "ta",  to: "at",  role: "connection", label: "component of" },
                  { from: "ta",  to: "em",  role: "connection", label: "component of" },
                  { from: "eq",  to: "em",  role: "connection", label: "component of" },
                  { from: "npm", to: "roe", role: "connection", label: "drives" },
                  { from: "at",  to: "roe", role: "connection", label: "drives" },
                  { from: "em",  to: "roe", role: "connection", label: "drives" },
                ],
              },
            },
            {
              name: "Drivers of ROE Improvement", difficulty: "medium", estMins: 25,
              description: "Extend to the 5-factor DuPont and diagnose what actually changes when ROE moves.",
              hints: [
                "The 5-factor model splits net profit margin into Tax Burden, Interest Burden, and Operating Margin.",
                "Tax Burden = NI ÷ EBT; Interest Burden = EBT ÷ EBIT; Operating Margin = EBIT ÷ Revenue.",
                "ROE = Tax Burden × Interest Burden × Operating Margin × Asset Turnover × Equity Multiplier.",
              ],
              activity: {
                kind: "canvas", assemblyMode: "graph",
                title: "Build the 5-Factor DuPont Tree",
                instructions: "Construct the 5-factor DuPont model as a two-level hierarchy. At the bottom level, connect the raw financial inputs (Net Income, EBT, EBIT, Revenue, Total Assets, Equity) upward to the five DuPont ratios they define. At the top level, connect all five ratios upward to ROE. Several inputs feed two ratios — draw both connections. Two sidebar tokens are distractors. When all edges are correct, click Check Answer.",
                context: "The 5-factor DuPont model splits the net profit margin from the 3-factor model into three separate levers: Tax Burden (share of pre-tax income surviving after tax), Interest Burden (share of EBIT surviving after interest), and Operating Margin (EBIT as a fraction of revenue). This finer decomposition lets analysts pinpoint whether an ROE change is driven by operating execution, financing costs, or tax management — each calling for a different strategic response. A company that improves ROE by cutting its tax rate is doing something structurally different from one that improves it by raising prices.",
                tokens: [
                  { ref: "roe",  text: "ROE",               role: "result",  shape: "pill" },
                  { ref: "tb",   text: "Tax Burden",         role: "operand", shape: "rect" },
                  { ref: "intb", text: "Interest Burden",    role: "operand", shape: "rect" },
                  { ref: "om",   text: "Operating Margin",   role: "operand", shape: "rect" },
                  { ref: "at",   text: "Asset Turnover",     role: "operand", shape: "rect" },
                  { ref: "em",   text: "Equity Multiplier",  role: "operand", shape: "rect" },
                  { ref: "ni",   text: "Net Income",         role: "operand", shape: "rect" },
                  { ref: "ebt",  text: "EBT",                role: "operand", shape: "rect" },
                  { ref: "ebit", text: "EBIT",               role: "operand", shape: "rect" },
                  { ref: "rev",  text: "Revenue",            role: "operand", shape: "rect" },
                  { ref: "ta",   text: "Total Assets",       role: "operand", shape: "rect" },
                  { ref: "eq",   text: "Equity",             role: "operand", shape: "rect" },
                  { ref: "dep",  text: "Depreciation",       role: "operand", shape: "rect", distractor: true },
                  { ref: "cogs", text: "COGS",               role: "operand", shape: "rect", distractor: true },
                ],
                edges: [
                  { from: "ni",   to: "tb",   role: "connection", label: "component of" },
                  { from: "ebt",  to: "tb",   role: "connection", label: "component of" },
                  { from: "ebt",  to: "intb", role: "connection", label: "component of" },
                  { from: "ebit", to: "intb", role: "connection", label: "component of" },
                  { from: "ebit", to: "om",   role: "connection", label: "component of" },
                  { from: "rev",  to: "om",   role: "connection", label: "component of" },
                  { from: "rev",  to: "at",   role: "connection", label: "component of" },
                  { from: "ta",   to: "at",   role: "connection", label: "component of" },
                  { from: "ta",   to: "em",   role: "connection", label: "component of" },
                  { from: "eq",   to: "em",   role: "connection", label: "component of" },
                  { from: "tb",   to: "roe",  role: "connection", label: "drives" },
                  { from: "intb", to: "roe",  role: "connection", label: "drives" },
                  { from: "om",   to: "roe",  role: "connection", label: "drives" },
                  { from: "at",   to: "roe",  role: "connection", label: "drives" },
                  { from: "em",   to: "roe",  role: "connection", label: "drives" },
                ],
              },
            },
            {
              name: "ROCE & Capital Efficiency", difficulty: "hard", estMins: 30,
              description: "Measure return on capital employed and compare it to ROE to separate operational performance from leverage effects.",
              hints: [
                "ROCE = EBIT ÷ Capital Employed. Capital Employed = Total Assets − Current Liabilities.",
                "ROCE is capital-structure neutral — it excludes interest and tax, making it comparable across firms with different debt levels.",
                "If ROCE < WACC, the business destroys value even when growing.",
              ],
              activity: {
                kind: "canvas", assemblyMode: "graph",
                title: "Build the ROCE Decomposition Tree",
                instructions: "Construct the ROCE metric as a two-level tree. At the bottom level, connect Revenue and Operating Expenses upward to EBIT, and connect Total Assets and Current Liabilities upward to Capital Employed. At the top level, connect both EBIT and Capital Employed upward to ROCE. Two sidebar tokens are distractors. When the full tree is connected correctly, click Check Answer.",
                context: "Return on Capital Employed (ROCE) measures how efficiently a business generates operating profit from the long-term capital it uses. The denominator, Capital Employed, equals Total Assets minus Current Liabilities — representing the asset base funded by long-term sources rather than short-term trade creditors. Because ROCE uses EBIT rather than net income, it strips out the effect of capital structure and tax. The critical benchmark is the firm's WACC: ROCE above WACC means the business creates value; ROCE below WACC means every unit of growth destroys value, no matter how good the income statement looks.",
                tokens: [
                  { ref: "roce",  text: "ROCE",                role: "result",  shape: "pill" },
                  { ref: "ebit",  text: "EBIT",                role: "operand", shape: "rect" },
                  { ref: "ce",    text: "Capital Employed",    role: "operand", shape: "rect" },
                  { ref: "rev",   text: "Revenue",             role: "operand", shape: "rect" },
                  { ref: "opex",  text: "Operating Expenses",  role: "operand", shape: "rect" },
                  { ref: "ta",    text: "Total Assets",        role: "operand", shape: "rect" },
                  { ref: "cl",    text: "Current Liabilities", role: "operand", shape: "rect" },
                  { ref: "ni",    text: "Net Income",          role: "operand", shape: "rect", distractor: true },
                  { ref: "int",   text: "Interest Expense",    role: "operand", shape: "rect", distractor: true },
                ],
                edges: [
                  { from: "rev",  to: "ebit", role: "connection", label: "component of" },
                  { from: "opex", to: "ebit", role: "connection", label: "component of" },
                  { from: "ta",   to: "ce",   role: "connection", label: "component of" },
                  { from: "cl",   to: "ce",   role: "connection", label: "component of" },
                  { from: "ebit", to: "roce", role: "connection", label: "numerator" },
                  { from: "ce",   to: "roce", role: "connection", label: "denominator" },
                ],
              },
            },
          ],
        },
      ],
    },
    {
      name: "Valuation", subtitle: "What a business is worth",
      level: "Intermediate / Advanced", durationWeeks: 2.0,
      description: "Discounted cash flow, multiples and the bridge between enterprise and equity value.",
      subtopics: [
        {
          name: "Time Value of Money", professionSlugs: ["ib", "pe", "fin_analyst"],
          description: "A dollar today is worth more than a dollar tomorrow.",
          lessons: [
            {
              name: "Present Value Basics", difficulty: "easy", estMins: 15,
              description: "Discounting a single future cash flow.",
              hints: ["Money in the future is worth less today because of opportunity cost.", "Divide the future amount by one plus the rate, raised to the number of periods.", "PV = FV ÷ (1 + r)^n."],
              activity: {
                kind: "mcq", title: "Present value fundamentals",
                instructions: "Answer these questions on the time value of money and present value. This concept underpins every valuation technique in finance. Each question has a single correct answer.",
                context: "The time value of money is the principle that a sum received today is worth more than the same sum received later, because today's money can be invested to earn a return. Present value reverses this logic: it asks what a future cash flow is worth in today's terms, by discounting it at a rate that reflects risk and opportunity cost.",
                questions: [
                  { q: "What is the present value of $1,100 received in one year, discounted at 10%?", explanation: "PV = 1100 ÷ (1.10) = 1000. The future amount is divided by one plus the rate.", options: [{ text: "$1,000", correct: true }, { text: "$1,210" }, { text: "$990" }, { text: "$1,100" }] },
                  { q: "All else equal, a higher discount rate produces a _____ present value.", explanation: "A higher rate discounts future cash flows more heavily, lowering their present value.", options: [{ text: "Lower", correct: true }, { text: "Higher" }, { text: "Unchanged" }, { text: "Negative" }] },
                  { q: "Why does a cash flow further in the future have a lower present value?", explanation: "Discounting compounds over time, so a more distant cash flow is divided by a larger factor, reducing its value today.", options: [{ text: "It is discounted over more periods", correct: true }, { text: "Inflation does not affect it" }, { text: "The discount rate decreases over time" }, { text: "Future cash is always worth more" }] },
                ],
              },
            },
            {
              name: "Discounting Cash Flows", difficulty: "medium", estMins: 25,
              description: "Discount a multi-year stream to its present value.",
              hints: ["Each year's cash flow is discounted by its own factor, then summed.", "The discount factor for year n is 1 ÷ (1 + r)^n.", "Sum the discounted values across all years to get total PV."],
              activity: {
                kind: "quantus", title: "Discount a 3-year cash flow stream",
                instructions: "Discount a three-year stream of cash flows to its present value at a 10% discount rate. The undiscounted cash flows are prefilled for each year. In the yellow editable cells, enter the discount factor for each year and then the present value of each year's cash flow.",
                context: "Discounting a stream of cash flows is the operational core of valuation. Each future cash flow is brought back to today using a discount factor specific to its timing, and the present values are summed. The discount rate reflects the riskiness of the cash flows and the return investors could earn elsewhere.",
                colGroups: [{ label: "DCF (r = 10%)", start: 1, end: 3, bg: "#e8e8ff" }],
                cols: [{ label: "Year", index: 0, width: 80 }, { label: "Cash Flow", index: 1, width: 110 }, { label: "Discount Factor", index: 2, width: 130 }, { label: "Present Value", index: 3, width: 120 }],
                cells: [
                  { r: 0, c: 0, type: "prefilled", display: "1" }, { r: 0, c: 1, type: "prefilled", display: "100" },
                  { r: 0, c: 2, type: "editable", expected: "0.909", formula: "=1/1.1^1", format: "number", editable: true, tolerancePct: 1, hint: "1 ÷ 1.10^1" },
                  { r: 0, c: 3, type: "editable", expected: "90.9", formula: "=B0*C0", format: "number", editable: true, tolerancePct: 1, hint: "Cash flow × discount factor" },
                  { r: 1, c: 0, type: "prefilled", display: "2" }, { r: 1, c: 1, type: "prefilled", display: "120" },
                  { r: 1, c: 2, type: "editable", expected: "0.826", formula: "=1/1.1^2", format: "number", editable: true, tolerancePct: 1, hint: "1 ÷ 1.10^2" },
                  { r: 1, c: 3, type: "editable", expected: "99.2", formula: "=B1*C1", format: "number", editable: true, tolerancePct: 1, hint: "Cash flow × discount factor" },
                  { r: 2, c: 0, type: "prefilled", display: "3" }, { r: 2, c: 1, type: "prefilled", display: "150" },
                  { r: 2, c: 2, type: "editable", expected: "0.751", formula: "=1/1.1^3", format: "number", editable: true, tolerancePct: 1, hint: "1 ÷ 1.10^3" },
                  { r: 2, c: 3, type: "editable", expected: "112.7", formula: "=B2*C2", format: "number", editable: true, tolerancePct: 1, hint: "Cash flow × discount factor" },
                  { r: 3, c: 0, type: "header", display: "Total PV" },
                  { r: 3, c: 3, type: "formula", expected: "302.8", formula: "=SUM(D0:D2)", format: "number" },
                ],
              },
            },
            {
              name: "Terminal Value", difficulty: "hard", estMins: 30,
              description: "Capturing value beyond the explicit forecast with Gordon growth.",
              hints: ["Terminal value captures every cash flow after your explicit forecast window.", "The Gordon growth model divides the next year's cash flow by (rate − growth).", "TV = CF × (1 + g) ÷ (r − g)."],
              activity: {
                kind: "canvas", assemblyMode: "graph",
                title: "Build the Gordon growth terminal value",
                instructions: "Construct the Gordon growth (perpetuity) terminal-value formula as a graph. Drag the tokens onto the canvas and draw arrows to connect them into the correct structure: the final-year cash flow grown by one period, divided by the discount rate less the perpetual growth rate.",
                context: "Terminal value addresses a practical problem in DCF valuation: you cannot forecast cash flows forever, but a business does not stop generating them at the end of your forecast window. The Gordon growth model solves this by treating all cash flows beyond the forecast as a growing perpetuity.",
                tokens: [
                  { ref: "cf", text: "CF × (1 + g)", role: "operand", shape: "rect" },
                  { ref: "div", text: "÷", role: "operator", shape: "diamond" },
                  { ref: "r", text: "r", role: "operand", shape: "ellipse" },
                  { ref: "minus", text: "−", role: "operator", shape: "diamond" },
                  { ref: "g", text: "g", role: "operand", shape: "ellipse" },
                  { ref: "eq", text: "=", role: "relation", shape: "diamond" },
                  { ref: "tv", text: "Terminal Value", role: "result", shape: "pill" },
                  { ref: "plus", text: "+", role: "operator", shape: "diamond", distractor: true },
                  { ref: "cfplain", text: "CF", role: "operand", shape: "rect", distractor: true },
                ],
                edges: [
                  { from: "r", to: "minus", role: "connection", slot: "left" },
                  { from: "g", to: "minus", role: "connection", slot: "right" },
                  { from: "cf", to: "div", role: "connection", slot: "left" },
                  { from: "minus", to: "div", role: "connection", slot: "right", label: "denominator" },
                  { from: "div", to: "eq", role: "connection" },
                  { from: "eq", to: "tv", role: "connection" },
                ],
              },
            },
          ],
        },
        {
          name: "Enterprise & Equity Value", professionSlugs: ["ib", "pe"],
          description: "The bridge between what the business is worth and what the shares are worth.",
          lessons: [
            {
              name: "EV to Equity Bridge", difficulty: "easy", estMins: 15,
              description: "Getting from enterprise value to equity value.",
              hints: ["Enterprise value belongs to all investors; equity value belongs only to shareholders.", "Subtract net debt from enterprise value to reach equity value.", "Equity Value = Enterprise Value − Net Debt."],
              activity: {
                kind: "canvas", assemblyMode: "sequence",
                title: "Build the EV-to-equity bridge",
                instructions: "Assemble the bridge from enterprise value to equity value. Drag the tokens onto the canvas and order them into the correct identity. The core idea is that enterprise value represents the worth of the operating business to all providers of capital, while equity value is what is left for shareholders after the debtholders' claim is settled.",
                context: "Enterprise value (EV) and equity value answer two different questions. EV is the value of the entire operating business. Equity value is the value of just the shareholders' stake. The bridge between them is net debt: because debtholders have a prior claim on the business, their net position is subtracted from EV to leave equity value.",
                tokens: [
                  { ref: "ev", text: "Enterprise Value", role: "operand", shape: "rect" },
                  { ref: "minus", text: "−", role: "operator", shape: "diamond" },
                  { ref: "nd", text: "Net Debt", role: "operand", shape: "rect" },
                  { ref: "eq", text: "=", role: "relation", shape: "diamond" },
                  { ref: "eqv", text: "Equity Value", role: "result", shape: "pill" },
                  { ref: "cash", text: "Cash", role: "operand", shape: "rect", distractor: true },
                  { ref: "ebit", text: "Operating Income", role: "operand", shape: "rect", distractor: true },
                  { ref: "plus", text: "+", role: "operator", shape: "diamond", distractor: true },
                ],
                edges: [
                  { from: "ev", to: "minus", role: "sequence", order: 1, slot: "left" },
                  { from: "minus", to: "nd", role: "sequence", order: 2, slot: "right" },
                  { from: "nd", to: "eq", role: "sequence", order: 3 },
                  { from: "eq", to: "eqv", role: "sequence", order: 4 },
                ],
              },
            },
            {
              name: "Trading Multiples", difficulty: "medium", estMins: 20,
              description: "Valuing with EV/EBITDA and P/E.",
              hints: ["A multiple expresses value as a ratio to an operating or earnings metric.", "EV/EBITDA uses enterprise value; P/E uses equity value (price).", "Match the numerator to the denominator: EV with EBITDA, price with earnings."],
              activity: {
                kind: "mcq", title: "Valuation multiples",
                instructions: "Answer these questions on trading multiples, the most widely used valuation shorthand in practice. Each question has one correct answer.",
                context: "Trading multiples value a company by comparison rather than from first principles. The cardinal rule is consistency: enterprise value must be paired with a pre-financing metric such as EBITDA, while equity-based price must be paired with a post-financing metric such as net earnings.",
                questions: [
                  { q: "Which metric correctly pairs with Enterprise Value?", explanation: "EBITDA is a pre-financing, pre-tax measure available to all investors, matching EV which also belongs to all investors.", options: [{ text: "EBITDA", correct: true }, { text: "Net income" }, { text: "Dividends per share" }, { text: "Earnings per share" }] },
                  { q: "The P/E ratio relates share price to which figure?", explanation: "P/E divides price by earnings per share — a post-tax, post-interest figure attributable to shareholders.", options: [{ text: "Earnings per share", correct: true }, { text: "EBITDA" }, { text: "Revenue" }, { text: "Enterprise value" }] },
                  { q: "Why is EV/EBITDA often preferred for comparing companies with different leverage?", explanation: "Both EV and EBITDA are independent of capital structure, so the multiple is not distorted by how each company is financed.", options: [{ text: "It is capital-structure neutral", correct: true }, { text: "It includes the tax shield" }, { text: "It ignores operating performance" }, { text: "It is always lower than P/E" }] },
                ],
              },
            },
            {
              name: "EV Build-Up", difficulty: "hard", estMins: 30,
              description: "Construct enterprise value from market cap and the capital structure.",
              hints: ["Enterprise value starts from equity value and adds back the other claims.", "Add debt and minority interest, then subtract cash.", "EV = Equity Value + Debt + Minority Interest − Cash."],
              activity: {
                kind: "quantus", title: "Build enterprise value",
                instructions: "Construct enterprise value from the components of the capital structure. The equity value, total debt, minority interest and cash are prefilled. In the yellow editable cell, enter the formula that builds enterprise value from these pieces.",
                context: "Enterprise value is most often built up from the bottom rather than estimated directly. You begin with equity value and adjust for everything else with a claim on the business. Debt is added because an acquirer assumes it. Minority interest is added because the consolidated metrics include subsidiaries not wholly owned. Cash is subtracted because it is a non-operating asset.",
                colGroups: [{ label: "EV Build-Up ($m)", start: 1, end: 1, bg: "#fff0e8" }],
                cols: [{ label: "Component", index: 0, width: 200 }, { label: "$m", index: 1, width: 100 }],
                cells: [
                  { r: 0, c: 0, type: "prefilled", display: "Equity Value (Market Cap)" }, { r: 0, c: 1, type: "prefilled", display: "1200" },
                  { r: 1, c: 0, type: "prefilled", display: "(+) Total Debt" }, { r: 1, c: 1, type: "prefilled", display: "400" },
                  { r: 2, c: 0, type: "prefilled", display: "(+) Minority Interest" }, { r: 2, c: 1, type: "prefilled", display: "50" },
                  { r: 3, c: 0, type: "prefilled", display: "(−) Cash" }, { r: 3, c: 1, type: "prefilled", display: "150" },
                  { r: 4, c: 0, type: "header", display: "Enterprise Value" },
                  { r: 4, c: 1, type: "editable", expected: "1500", formula: "=B0+B1+B2-B3", format: "number", editable: true, tolerancePct: 0, hint: "Equity + Debt + Minority − Cash" },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// MODULE 2 — STRATEGY
// ═══════════════════════════════════════════════════════════════════════════

const STRATEGY: ModuleDef = {
  slug: "strategy", name: "Strategy", accent: "#5c3a8f", icon: "target",
  description: "Structured frameworks for diagnosing industries, positioning a business and allocating resources.",
  topics: [
    {
      name: "Competitive Analysis", subtitle: "Why some industries are more profitable than others",
      level: "Beginners / Intermediate", durationWeeks: 1.5,
      description: "Porter's frameworks for understanding the forces that shape industry returns.",
      subtopics: [
        {
          name: "Porter's Five Forces", professionSlugs: ["strategy", "mgmt_consultant"],
          description: "The five structural forces that determine industry attractiveness.",
          lessons: [
            {
              name: "The Five Forces", difficulty: "easy", estMins: 20,
              description: "Identify and connect the five forces acting on an industry.",
              hints: ["Industry rivalry sits at the centre; four other forces press on it from outside.", "Think suppliers and buyers on the sides, and two kinds of competition: new and substitute.", "The four outer forces all influence the central force of competitive rivalry."],
              activity: {
                kind: "canvas", assemblyMode: "graph",
                title: "Map Porter's Five Forces",
                instructions: "Build Porter's Five Forces framework as a graph. Drag the five forces onto the canvas and connect each of the four peripheral forces to the central force of competitive rivalry with an arrow, showing that each one shapes the intensity of competition within the industry.",
                context: "Porter's Five Forces is the canonical framework for analysing why some industries earn persistently higher returns than others. It examines five structural forces: rivalry among existing firms, bargaining power of suppliers, bargaining power of buyers, threat of new entrants, and threat of substitutes.",
                tokens: [
                  { ref: "rivalry", text: "Competitive Rivalry", role: "result", shape: "ellipse" },
                  { ref: "suppliers", text: "Supplier Power", role: "operand", shape: "rect" },
                  { ref: "buyers", text: "Buyer Power", role: "operand", shape: "rect" },
                  { ref: "entrants", text: "Threat of New Entrants", role: "operand", shape: "rect" },
                  { ref: "subs", text: "Threat of Substitutes", role: "operand", shape: "rect" },
                  { ref: "reg", text: "Government Regulation", role: "operand", shape: "rect", distractor: true },
                  { ref: "comp", text: "Complementary Products", role: "operand", shape: "rect", distractor: true },
                ],
                edges: [
                  { from: "suppliers", to: "rivalry", role: "connection", label: "pressures" },
                  { from: "buyers", to: "rivalry", role: "connection", label: "pressures" },
                  { from: "entrants", to: "rivalry", role: "connection", label: "pressures" },
                  { from: "subs", to: "rivalry", role: "connection", label: "pressures" },
                ],
              },
            },
            {
              name: "Assessing Force Strength", difficulty: "medium", estMins: 20,
              description: "Judge whether each force is strong or weak in a given industry.",
              hints: ["A force is strong when it can squeeze industry profits.", "Few suppliers or high switching costs mean strong supplier power.", "Low entry barriers mean a high threat of new entrants."],
              activity: {
                kind: "mcq", title: "Diagnosing the five forces",
                instructions: "Answer these questions about how to assess the strength of each of Porter's forces in a real industry. Each question has one correct answer.",
                context: "Naming the five forces is easy; assessing their strength in a specific industry is the real analytical work. Each force is strong — and therefore a drag on industry profits — under identifiable conditions.",
                questions: [
                  { q: "Supplier power is strongest when:", explanation: "When few suppliers control a critical input and switching is costly, they can dictate terms.", options: [{ text: "There are few suppliers of a critical input", correct: true }, { text: "Many suppliers compete for the same buyers" }, { text: "The input is a commodity with many sources" }, { text: "Buyers can easily make the input themselves" }] },
                  { q: "Which condition raises the threat of new entrants?", explanation: "Low barriers to entry — little capital needed, no scale advantage — make it easy for newcomers to enter.", options: [{ text: "Low barriers to entry", correct: true }, { text: "Strong incumbent brand loyalty" }, { text: "High capital requirements" }, { text: "Significant economies of scale" }] },
                  { q: "An industry where buyers are large and the product is undifferentiated will have:", explanation: "Large buyers purchasing an undifferentiated product can play suppliers off against each other.", options: [{ text: "Strong buyer power", correct: true }, { text: "Weak buyer power" }, { text: "Low rivalry" }, { text: "High entry barriers" }] },
                ],
              },
            },
            {
              name: "Industry Profitability Scoring", difficulty: "hard", estMins: 25,
              description: "Quantify overall industry attractiveness from force ratings.",
              hints: ["Convert each force's strength into a score, then combine them.", "A weighted average of the five force scores gives an attractiveness index.", "Multiply each force score by its weight, then sum."],
              activity: {
                kind: "quantus", title: "Score industry attractiveness",
                instructions: "Quantify the overall attractiveness of an industry by combining the five force ratings into a weighted score. Each force has been rated from 1 (very unfavourable) to 5 (very favourable), and each carries a weight. In the yellow editable cells, calculate the weighted contribution of each force, then sum them.",
                context: "Turning a qualitative framework into a comparable score is a common consulting technique. By rating each of the five forces on a consistent scale and weighting them by relevance, an analyst can collapse a rich structural analysis into a single index that supports portfolio decisions.",
                colGroups: [{ label: "Industry Attractiveness", start: 1, end: 3, bg: "#f0e8ff" }],
                cols: [{ label: "Force", index: 0, width: 200 }, { label: "Rating (1-5)", index: 1, width: 110 }, { label: "Weight", index: 2, width: 90 }, { label: "Weighted Score", index: 3, width: 130 }],
                cells: [
                  { r: 0, c: 0, type: "prefilled", display: "Rivalry" }, { r: 0, c: 1, type: "prefilled", display: "3" }, { r: 0, c: 2, type: "prefilled", display: "0.3" }, { r: 0, c: 3, type: "editable", expected: "0.9", formula: "=B0*C0", format: "number", editable: true, tolerancePct: 1, hint: "Rating × weight" },
                  { r: 1, c: 0, type: "prefilled", display: "Supplier Power" }, { r: 1, c: 1, type: "prefilled", display: "4" }, { r: 1, c: 2, type: "prefilled", display: "0.2" }, { r: 1, c: 3, type: "editable", expected: "0.8", formula: "=B1*C1", format: "number", editable: true, tolerancePct: 1, hint: "Rating × weight" },
                  { r: 2, c: 0, type: "prefilled", display: "Buyer Power" }, { r: 2, c: 1, type: "prefilled", display: "2" }, { r: 2, c: 2, type: "prefilled", display: "0.2" }, { r: 2, c: 3, type: "editable", expected: "0.4", formula: "=B2*C2", format: "number", editable: true, tolerancePct: 1, hint: "Rating × weight" },
                  { r: 3, c: 0, type: "prefilled", display: "Threat of Entry" }, { r: 3, c: 1, type: "prefilled", display: "4" }, { r: 3, c: 2, type: "prefilled", display: "0.15" }, { r: 3, c: 3, type: "editable", expected: "0.6", formula: "=B3*C3", format: "number", editable: true, tolerancePct: 1, hint: "Rating × weight" },
                  { r: 4, c: 0, type: "prefilled", display: "Threat of Subs" }, { r: 4, c: 1, type: "prefilled", display: "3" }, { r: 4, c: 2, type: "prefilled", display: "0.15" }, { r: 4, c: 3, type: "editable", expected: "0.45", formula: "=B4*C4", format: "number", editable: true, tolerancePct: 1, hint: "Rating × weight" },
                  { r: 5, c: 0, type: "header", display: "Attractiveness Index" },
                  { r: 5, c: 3, type: "formula", expected: "3.15", formula: "=SUM(D0:D4)", format: "number" },
                ],
              },
            },
          ],
        },
        {
          name: "Value Chain", professionSlugs: ["strategy", "mgmt_consultant", "ops_mgr"],
          description: "Where a company adds value, activity by activity.",
          lessons: [
            {
              name: "Primary vs Support Activities", difficulty: "easy", estMins: 15,
              description: "Sort value-chain activities into their two categories.",
              hints: ["Primary activities create and deliver the product; support activities enable them.", "Inbound logistics, operations, outbound logistics, marketing and service are primary.", "Procurement, technology, HR and infrastructure are support activities."],
              activity: {
                kind: "mcq", title: "The value chain",
                instructions: "Answer these questions on Porter's value chain. Each question has a single correct answer.",
                context: "The value chain disaggregates a company into the discrete activities it performs to design, produce, market, deliver and support its product. Porter splits these into primary activities and support activities.",
                questions: [
                  { q: "Which of the following is a PRIMARY activity?", explanation: "Operations — transforming inputs into the finished product — is a core primary activity.", options: [{ text: "Operations", correct: true }, { text: "Procurement" }, { text: "Human resource management" }, { text: "Technology development" }] },
                  { q: "Which is a SUPPORT activity?", explanation: "Procurement — sourcing inputs — enables the primary activities rather than directly handling the product.", options: [{ text: "Procurement", correct: true }, { text: "Outbound logistics" }, { text: "Marketing and sales" }, { text: "Service" }] },
                  { q: "What is the main strategic purpose of value chain analysis?", explanation: "It pinpoints where a firm adds value and where its competitive advantage lies, activity by activity.", options: [{ text: "To locate sources of competitive advantage", correct: true }, { text: "To calculate net income" }, { text: "To forecast cash flow" }, { text: "To set the discount rate" }] },
                ],
              },
            },
            {
              name: "Mapping the Chain", difficulty: "medium", estMins: 20,
              description: "Connect the primary activities into the correct sequence.",
              hints: ["Primary activities follow the flow of the product through the firm.", "It starts with bringing inputs in and ends with after-sales service.", "Inbound → Operations → Outbound → Marketing & Sales → Service."],
              activity: {
                kind: "canvas", assemblyMode: "sequence",
                title: "Sequence the primary value-chain activities",
                instructions: "Arrange the five primary value-chain activities into the correct left-to-right flow that a product follows through the firm. The sidebar contains distractor tokens drawn from the support activities.",
                context: "The primary activities of the value chain are best understood as a sequence that mirrors the journey of the product. Inbound logistics brings raw materials in. Operations transforms them. Outbound logistics distributes goods. Marketing and sales closes transactions. Service supports after purchase.",
                tokens: [
                  { ref: "inbound", text: "Inbound Logistics", role: "operand", shape: "rect" },
                  { ref: "ops", text: "Operations", role: "operand", shape: "rect" },
                  { ref: "outbound", text: "Outbound Logistics", role: "operand", shape: "rect" },
                  { ref: "marketing", text: "Marketing & Sales", role: "operand", shape: "rect" },
                  { ref: "service", text: "Service", role: "operand", shape: "rect" },
                  { ref: "proc", text: "Procurement", role: "operand", shape: "rect", distractor: true },
                  { ref: "hr", text: "Human Resources", role: "operand", shape: "rect", distractor: true },
                ],
                edges: [
                  { from: "inbound", to: "ops", role: "sequence", order: 1 },
                  { from: "ops", to: "outbound", role: "sequence", order: 2 },
                  { from: "outbound", to: "marketing", role: "sequence", order: 3 },
                  { from: "marketing", to: "service", role: "sequence", order: 4 },
                ],
              },
            },
            {
              name: "Margin Analysis by Activity", difficulty: "hard", estMins: 25,
              description: "Allocate cost across the chain to find where margin is made and lost.",
              hints: ["Margin is what's left after each activity takes its share of cost.", "Subtract each activity's cost from the price to track the running margin.", "Total value added is price minus the sum of all activity costs."],
              activity: {
                kind: "quantus", title: "Value-chain margin build-up",
                instructions: "Analyse where margin is created and consumed across the value chain. The selling price and the cost of each primary activity are prefilled. Compute each activity's cost as a percentage of the selling price, then calculate the total cost and final margin.",
                context: "Allocating cost to individual value-chain activities turns a structural framework into a quantitative diagnostic. By expressing each activity's cost as a share of the selling price, a strategist can see exactly where the firm spends to create its product.",
                colGroups: [{ label: "Value-Chain Economics", start: 1, end: 2, bg: "#f0e8ff" }],
                cols: [{ label: "Activity", index: 0, width: 180 }, { label: "Cost ($)", index: 1, width: 100 }, { label: "% of Price", index: 2, width: 110 }],
                cells: [
                  { r: 0, c: 0, type: "prefilled", display: "Selling Price" }, { r: 0, c: 1, type: "prefilled", display: "100" },
                  { r: 1, c: 0, type: "prefilled", display: "Inbound Logistics" }, { r: 1, c: 1, type: "prefilled", display: "15" }, { r: 1, c: 2, type: "editable", expected: "15", formula: "=B1/B0*100", format: "percent", editable: true, tolerancePct: 1, hint: "Cost ÷ price" },
                  { r: 2, c: 0, type: "prefilled", display: "Operations" }, { r: 2, c: 1, type: "prefilled", display: "30" }, { r: 2, c: 2, type: "editable", expected: "30", formula: "=B2/B0*100", format: "percent", editable: true, tolerancePct: 1, hint: "Cost ÷ price" },
                  { r: 3, c: 0, type: "prefilled", display: "Outbound & Marketing" }, { r: 3, c: 1, type: "prefilled", display: "25" }, { r: 3, c: 2, type: "editable", expected: "25", formula: "=B3/B0*100", format: "percent", editable: true, tolerancePct: 1, hint: "Cost ÷ price" },
                  { r: 4, c: 0, type: "header", display: "Total Cost" }, { r: 4, c: 1, type: "editable", expected: "70", formula: "=SUM(B1:B3)", format: "number", editable: true, tolerancePct: 0, hint: "Sum of activity costs" },
                  { r: 5, c: 0, type: "header", display: "Margin" }, { r: 5, c: 1, type: "editable", expected: "30", formula: "=B0-B4", format: "number", editable: true, tolerancePct: 0, hint: "Price − total cost" },
                ],
              },
            },
          ],
        },
      ],
    },
    {
      name: "Corporate Strategy", subtitle: "Allocating resources across a portfolio",
      level: "Intermediate", durationWeeks: 1.5,
      description: "Frameworks for managing a portfolio of businesses and choosing where to grow.",
      subtopics: [
        {
          name: "Growth Strategy", professionSlugs: ["strategy", "mgmt_consultant"],
          description: "The Ansoff matrix and choosing a direction for growth.",
          lessons: [
            {
              name: "The Ansoff Matrix", difficulty: "easy", estMins: 15,
              description: "Four growth strategies across products and markets.",
              hints: ["Growth comes from combining existing or new products with existing or new markets.", "Existing product + existing market is the lowest-risk option.", "New product + new market — diversification — is the highest-risk."],
              activity: {
                kind: "mcq", title: "Ansoff growth strategies",
                instructions: "Answer these questions on the Ansoff matrix. Each question has one correct answer.",
                context: "The Ansoff matrix maps four growth strategies against two dimensions: products (existing or new) and markets (existing or new). Market penetration is the lowest-risk path. Diversification is the riskiest.",
                questions: [
                  { q: "Selling more of an existing product to existing customers is called:", explanation: "Market penetration deepens the firm's position in markets and products it already knows.", options: [{ text: "Market penetration", correct: true }, { text: "Market development" }, { text: "Product development" }, { text: "Diversification" }] },
                  { q: "Which Ansoff strategy carries the highest risk?", explanation: "Diversification combines a new product with a new market, so the firm has no existing capability or customer base to rely on.", options: [{ text: "Diversification", correct: true }, { text: "Market penetration" }, { text: "Product development" }, { text: "Market development" }] },
                  { q: "Taking an existing product into a new geographic market is:", explanation: "Market development keeps the product the same but enters a new market.", options: [{ text: "Market development", correct: true }, { text: "Market penetration" }, { text: "Diversification" }, { text: "Product development" }] },
                ],
              },
            },
            {
              name: "Mapping Growth Options", difficulty: "medium", estMins: 20,
              description: "Place each strategy in the right product–market cell.",
              hints: ["Each quadrant is defined by a product choice and a market choice.", "Connect each strategy to its product condition and its market condition.", "Penetration = existing product + existing market; diversification = new + new."],
              activity: {
                kind: "canvas", assemblyMode: "graph",
                title: "Build the Ansoff matrix relationships",
                instructions: "Construct the relationships in the Ansoff matrix as a graph. Draw arrows connecting each strategy to the product condition and market condition that define it.",
                context: "The power of the Ansoff matrix lies in its two-by-two structure: each growth strategy is precisely defined by one product condition and one market condition.",
                tokens: [
                  { ref: "pen", text: "Market Penetration", role: "result", shape: "pill" },
                  { ref: "mdev", text: "Market Development", role: "result", shape: "pill" },
                  { ref: "pdev", text: "Product Development", role: "result", shape: "pill" },
                  { ref: "div", text: "Diversification", role: "result", shape: "pill" },
                  { ref: "exP", text: "Existing Product", role: "operand", shape: "rect" },
                  { ref: "newP", text: "New Product", role: "operand", shape: "rect" },
                  { ref: "exM", text: "Existing Market", role: "operand", shape: "rect" },
                  { ref: "newM", text: "New Market", role: "operand", shape: "rect" },
                  { ref: "newC", text: "New Channel", role: "operand", shape: "rect", distractor: true },
                ],
                edges: [
                  { from: "pen", to: "exP", role: "connection" }, { from: "pen", to: "exM", role: "connection" },
                  { from: "mdev", to: "exP", role: "connection" }, { from: "mdev", to: "newM", role: "connection" },
                  { from: "pdev", to: "newP", role: "connection" }, { from: "pdev", to: "exM", role: "connection" },
                  { from: "div", to: "newP", role: "connection" }, { from: "div", to: "newM", role: "connection" },
                ],
              },
            },
            {
              name: "Expected Value of Growth Bets", difficulty: "hard", estMins: 25,
              description: "Weight growth options by probability to compare them.",
              hints: ["Each growth bet has a payoff and a probability of success.", "Expected value multiplies the payoff by its probability of success.", "Compare options by expected value = payoff × probability."],
              activity: {
                kind: "quantus", title: "Expected value of growth options",
                instructions: "Compare four growth options by their expected value. Each option has an estimated payoff if it succeeds and a probability of success. Compute the expected value of each option.",
                context: "Expected value translates the risk language of the Ansoff matrix into comparable numbers. Each growth option is characterised by a payoff if it works and a probability of working.",
                colGroups: [{ label: "Growth Options", start: 1, end: 3, bg: "#f0e8ff" }],
                cols: [{ label: "Option", index: 0, width: 180 }, { label: "Payoff ($m)", index: 1, width: 110 }, { label: "P(success)", index: 2, width: 100 }, { label: "Expected Value", index: 3, width: 130 }],
                cells: [
                  { r: 0, c: 0, type: "prefilled", display: "Penetration" }, { r: 0, c: 1, type: "prefilled", display: "50" }, { r: 0, c: 2, type: "prefilled", display: "0.9" }, { r: 0, c: 3, type: "editable", expected: "45", formula: "=B0*C0", format: "number", editable: true, tolerancePct: 1, hint: "Payoff × probability" },
                  { r: 1, c: 0, type: "prefilled", display: "Market Development" }, { r: 1, c: 1, type: "prefilled", display: "90" }, { r: 1, c: 2, type: "prefilled", display: "0.6" }, { r: 1, c: 3, type: "editable", expected: "54", formula: "=B1*C1", format: "number", editable: true, tolerancePct: 1, hint: "Payoff × probability" },
                  { r: 2, c: 0, type: "prefilled", display: "Product Development" }, { r: 2, c: 1, type: "prefilled", display: "110" }, { r: 2, c: 2, type: "prefilled", display: "0.5" }, { r: 2, c: 3, type: "editable", expected: "55", formula: "=B2*C2", format: "number", editable: true, tolerancePct: 1, hint: "Payoff × probability" },
                  { r: 3, c: 0, type: "prefilled", display: "Diversification" }, { r: 3, c: 1, type: "prefilled", display: "200" }, { r: 3, c: 2, type: "prefilled", display: "0.25" }, { r: 3, c: 3, type: "editable", expected: "50", formula: "=B3*C3", format: "number", editable: true, tolerancePct: 1, hint: "Payoff × probability" },
                  { r: 4, c: 0, type: "header", display: "Best Option EV" },
                  { r: 4, c: 3, type: "formula", expected: "55", formula: "=MAX(D0:D3)", format: "number" },
                ],
              },
            },
          ],
        },
        {
          name: "Portfolio Management", professionSlugs: ["strategy", "mgmt_consultant", "pe"],
          description: "The BCG matrix and allocating cash across business units.",
          lessons: [
            {
              name: "The BCG Matrix", difficulty: "easy", estMins: 15,
              description: "Classify business units by growth and market share.",
              hints: ["Two axes: market growth rate and relative market share.", "High growth + high share is a star; low growth + high share is a cash cow.", "Low growth + low share is a dog; high growth + low share is a question mark."],
              activity: {
                kind: "mcq", title: "BCG portfolio classification",
                instructions: "Answer these questions on the BCG growth-share matrix. Each question has one correct answer.",
                context: "The BCG matrix helps a diversified company decide how to allocate cash across its business units. Stars need investment but lead attractive markets. Cash cows generate more cash than they need. Question marks demand cash and an investment decision. Dogs tie up resources for little return.",
                questions: [
                  { q: "A business unit with high market share in a low-growth market is a:", explanation: "A cash cow holds a strong position in a mature market, generating surplus cash.", options: [{ text: "Cash cow", correct: true }, { text: "Star" }, { text: "Question mark" }, { text: "Dog" }] },
                  { q: "Which quadrant typically funds the rest of the portfolio?", explanation: "Cash cows produce more cash than they consume, so their surplus is used to invest in stars and question marks.", options: [{ text: "Cash cows", correct: true }, { text: "Dogs" }, { text: "Question marks" }, { text: "Stars" }] },
                  { q: "A high-growth, low-share unit requiring an invest-or-divest decision is a:", explanation: "Question marks sit in attractive markets but lack share; they consume cash and force a clear strategic choice.", options: [{ text: "Question mark", correct: true }, { text: "Cash cow" }, { text: "Star" }, { text: "Dog" }] },
                ],
              },
            },
            {
              name: "Positioning Units", difficulty: "medium", estMins: 20,
              description: "Connect each business unit to its quadrant by its characteristics.",
              hints: ["Each quadrant is defined by a growth level and a share level.", "Connect each unit type to its growth condition and its share condition.", "Star = high growth + high share; dog = low growth + low share."],
              activity: {
                kind: "canvas", assemblyMode: "graph",
                title: "Build the BCG matrix relationships",
                instructions: "Construct the BCG matrix as a graph of relationships. Draw arrows connecting each quadrant to the market-growth condition and market-share condition that define it.",
                context: "The four BCG quadrants are precisely defined by a combination of market growth and relative market share. Mapping each quadrant to its underlying conditions lets a strategist reason about borderline units.",
                tokens: [
                  { ref: "star", text: "Star", role: "result", shape: "pill" },
                  { ref: "cow", text: "Cash Cow", role: "result", shape: "pill" },
                  { ref: "qm", text: "Question Mark", role: "result", shape: "pill" },
                  { ref: "dog", text: "Dog", role: "result", shape: "pill" },
                  { ref: "hg", text: "High Growth", role: "operand", shape: "rect" },
                  { ref: "lg", text: "Low Growth", role: "operand", shape: "rect" },
                  { ref: "hs", text: "High Share", role: "operand", shape: "rect" },
                  { ref: "ls", text: "Low Share", role: "operand", shape: "rect" },
                  { ref: "hp", text: "High Profit", role: "operand", shape: "rect", distractor: true },
                ],
                edges: [
                  { from: "star", to: "hg", role: "connection" }, { from: "star", to: "hs", role: "connection" },
                  { from: "cow", to: "lg", role: "connection" }, { from: "cow", to: "hs", role: "connection" },
                  { from: "qm", to: "hg", role: "connection" }, { from: "qm", to: "ls", role: "connection" },
                  { from: "dog", to: "lg", role: "connection" }, { from: "dog", to: "ls", role: "connection" },
                ],
              },
            },
            {
              name: "Portfolio Cash Balance", difficulty: "hard", estMins: 25,
              description: "Net the cash generated and consumed across the portfolio.",
              hints: ["Cash cows generate cash; stars and question marks consume it.", "Sum the cash flows across all units, respecting their signs.", "Net portfolio cash = sum of each unit's cash generation (negative if consuming)."],
              activity: {
                kind: "quantus", title: "Balance the portfolio's cash",
                instructions: "Assess whether the business portfolio is self-funding by netting the cash each unit generates or consumes.",
                context: "A core use of the BCG matrix is checking that a portfolio is in cash balance — that the units generating surplus cash can fund those consuming it without raising external capital.",
                colGroups: [{ label: "Portfolio Cash Flow ($m)", start: 1, end: 1, bg: "#f0e8ff" }],
                cols: [{ label: "Business Unit", index: 0, width: 200 }, { label: "Cash Flow ($m)", index: 1, width: 130 }],
                cells: [
                  { r: 0, c: 0, type: "prefilled", display: "Cash Cow A" }, { r: 0, c: 1, type: "prefilled", display: "80" },
                  { r: 1, c: 0, type: "prefilled", display: "Cash Cow B" }, { r: 1, c: 1, type: "prefilled", display: "50" },
                  { r: 2, c: 0, type: "prefilled", display: "Star" }, { r: 2, c: 1, type: "prefilled", display: "-20" },
                  { r: 3, c: 0, type: "prefilled", display: "Question Mark" }, { r: 3, c: 1, type: "prefilled", display: "-70" },
                  { r: 4, c: 0, type: "header", display: "Net Portfolio Cash" },
                  { r: 4, c: 1, type: "editable", expected: "40", formula: "=SUM(B0:B3)", format: "number", editable: true, tolerancePct: 0, hint: "Sum all unit cash flows (signs matter)" },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// MODULE 3 — OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

const OPERATIONS: ModuleDef = {
  slug: "operations", name: "Operations", accent: "#b5651d", icon: "settings",
  description: "Managing flow, inventory and capacity to deliver more value at lower cost.",
  topics: [
    {
      name: "Process & Flow", subtitle: "Making work move smoothly through a system",
      level: "Beginners / Intermediate", durationWeeks: 1.5,
      description: "Throughput, bottlenecks and the laws that govern how work flows.",
      subtopics: [
        {
          name: "Throughput & Bottlenecks", professionSlugs: ["ops_mgr", "mgmt_consultant"],
          description: "How fast a process can really go.",
          lessons: [
            {
              name: "Identifying the Bottleneck", difficulty: "easy", estMins: 15,
              description: "The slowest step sets the pace of the whole process.",
              hints: ["A chain is only as fast as its slowest link.", "The bottleneck is the step with the lowest capacity.", "Process capacity equals the capacity of its bottleneck step."],
              activity: {
                kind: "mcq", title: "Bottlenecks and throughput",
                instructions: "Answer these questions on identifying bottlenecks and their effect on process throughput. Each question has one correct answer.",
                context: "In any multi-step process, throughput is limited by the step with the lowest capacity, known as the bottleneck. The crucial managerial implication is that effort should focus on the bottleneck: speeding up any other step simply builds inventory in front of the constraint without raising output.",
                questions: [
                  { q: "A process has three steps with capacities of 100, 60 and 90 units/hour. What is the process throughput?", explanation: "Throughput equals the bottleneck's capacity — the slowest step at 60 units/hour limits the whole process.", options: [{ text: "60 units/hour", correct: true }, { text: "90 units/hour" }, { text: "100 units/hour" }, { text: "250 units/hour" }] },
                  { q: "To increase throughput, you should first improve:", explanation: "Only improving the bottleneck raises output; speeding up other steps just accumulates work-in-progress.", options: [{ text: "The bottleneck step", correct: true }, { text: "The fastest step" }, { text: "Every step equally" }, { text: "The final step" }] },
                  { q: "After the bottleneck is improved beyond the other steps, what happens?", explanation: "The constraint moves to whichever step is now slowest — the bottleneck shifts.", options: [{ text: "The bottleneck shifts to another step", correct: true }, { text: "Throughput becomes unlimited" }, { text: "The process has no bottleneck" }, { text: "All steps slow down" }] },
                ],
              },
            },
            {
              name: "Little's Law", difficulty: "medium", estMins: 20,
              description: "The relationship between inventory, throughput and flow time.",
              hints: ["Little's Law links how much is in the system, how fast it flows, and how long it takes.", "Inventory equals throughput multiplied by flow time.", "I = R × T (inventory = throughput rate × flow time)."],
              activity: {
                kind: "canvas", assemblyMode: "sequence",
                title: "Build Little's Law",
                instructions: "Assemble Little's Law from the sidebar tokens. Drag the pieces onto the canvas and order them into the correct identity relating average inventory to throughput rate and flow time.",
                context: "Little's Law states that the average inventory in a stable process equals its throughput rate multiplied by the average flow time: I = R × T. Its beauty is its generality — it applies to a factory line, a hospital ward, or a queue of software tickets.",
                tokens: [
                  { ref: "inv", text: "Inventory", role: "result", shape: "pill" },
                  { ref: "eq", text: "=", role: "relation", shape: "diamond" },
                  { ref: "rate", text: "Throughput Rate", role: "operand", shape: "rect" },
                  { ref: "mult", text: "×", role: "operator", shape: "diamond" },
                  { ref: "time", text: "Flow Time", role: "operand", shape: "rect" },
                  { ref: "cap", text: "Capacity", role: "operand", shape: "rect", distractor: true },
                  { ref: "plus", text: "+", role: "operator", shape: "diamond", distractor: true },
                ],
                edges: [
                  { from: "inv", to: "eq", role: "sequence", order: 1 },
                  { from: "eq", to: "rate", role: "sequence", order: 2, slot: "left", commutative: true },
                  { from: "rate", to: "mult", role: "sequence", order: 3 },
                  { from: "mult", to: "time", role: "sequence", order: 4, slot: "right", commutative: true },
                ],
              },
            },
            {
              name: "Capacity Utilisation", difficulty: "hard", estMins: 25,
              description: "Measure how hard each resource is working and find the constraint.",
              hints: ["Utilisation compares the work demanded of a resource to its available capacity.", "Utilisation = demand ÷ capacity, expressed as a percentage.", "The resource with the highest utilisation is the bottleneck."],
              activity: {
                kind: "quantus", title: "Compute resource utilisation",
                instructions: "Calculate the utilisation of each resource in a process and identify the bottleneck. Enter each resource's utilisation as a percentage of its capacity.",
                context: "Capacity utilisation measures how intensively a resource is being used: demand divided by available capacity. Comparing utilisation across resources pinpoints the constraint objectively.",
                colGroups: [{ label: "Resource Utilisation", start: 1, end: 3, bg: "#ffe8d8" }],
                cols: [{ label: "Resource", index: 0, width: 160 }, { label: "Demand (u/hr)", index: 1, width: 120 }, { label: "Capacity (u/hr)", index: 2, width: 120 }, { label: "Utilisation", index: 3, width: 110 }],
                cells: [
                  { r: 0, c: 0, type: "prefilled", display: "Cutting" }, { r: 0, c: 1, type: "prefilled", display: "80" }, { r: 0, c: 2, type: "prefilled", display: "100" }, { r: 0, c: 3, type: "editable", expected: "80", formula: "=B0/C0*100", format: "percent", editable: true, tolerancePct: 1, hint: "Demand ÷ capacity" },
                  { r: 1, c: 0, type: "prefilled", display: "Assembly" }, { r: 1, c: 1, type: "prefilled", display: "80" }, { r: 1, c: 2, type: "prefilled", display: "85" }, { r: 1, c: 3, type: "editable", expected: "94.1", formula: "=B1/C1*100", format: "percent", editable: true, tolerancePct: 1, hint: "Demand ÷ capacity" },
                  { r: 2, c: 0, type: "prefilled", display: "Packaging" }, { r: 2, c: 1, type: "prefilled", display: "80" }, { r: 2, c: 2, type: "prefilled", display: "120" }, { r: 2, c: 3, type: "editable", expected: "66.7", formula: "=B2/C2*100", format: "percent", editable: true, tolerancePct: 1, hint: "Demand ÷ capacity" },
                  { r: 3, c: 0, type: "header", display: "Max Utilisation (Bottleneck)" },
                  { r: 3, c: 3, type: "formula", expected: "94.1", formula: "=MAX(D0:D2)", format: "percent" },
                ],
              },
            },
          ],
        },
        {
          name: "Quality Management", professionSlugs: ["ops_mgr"],
          description: "Building quality in rather than inspecting it afterwards.",
          lessons: [
            {
              name: "Cost of Quality", difficulty: "easy", estMins: 15,
              description: "The four categories of quality cost.",
              hints: ["Quality has two kinds of cost: the cost of achieving it and the cost of failing.", "Prevention and appraisal are costs of conformance; failures are costs of non-conformance.", "Internal failures are caught before delivery; external failures reach the customer."],
              activity: {
                kind: "mcq", title: "The cost of quality",
                instructions: "Answer these questions on the cost of quality framework. Each question has one correct answer.",
                context: "The cost of quality framework divides quality spending into four buckets: Prevention, Appraisal, Internal Failure, and External Failure. The framework's central insight is the trade-off: modest investment in prevention typically slashes the much larger failure costs.",
                questions: [
                  { q: "Inspecting finished products for defects is which type of quality cost?", explanation: "Inspection to detect defects is an appraisal cost — it finds problems rather than preventing them.", options: [{ text: "Appraisal cost", correct: true }, { text: "Prevention cost" }, { text: "Internal failure cost" }, { text: "External failure cost" }] },
                  { q: "A customer returns a defective product under warranty. This is:", explanation: "A defect that reached the customer generates an external failure cost.", options: [{ text: "External failure cost", correct: true }, { text: "Internal failure cost" }, { text: "Appraisal cost" }, { text: "Prevention cost" }] },
                  { q: "Which spending typically reduces total quality cost the most?", explanation: "Prevention stops defects at the source, avoiding the much larger appraisal and failure costs downstream.", options: [{ text: "Prevention", correct: true }, { text: "More inspection" }, { text: "More rework capacity" }, { text: "Larger warranty reserves" }] },
                ],
              },
            },
            {
              name: "Defect Rate Analysis", difficulty: "medium", estMins: 20,
              description: "Compute defect rates and first-pass yield.",
              hints: ["Defect rate is the share of units that fail; yield is the share that pass.", "Defect rate = defects ÷ total units produced.", "First-pass yield = 1 − defect rate."],
              activity: {
                kind: "quantus", title: "Defect rate and yield",
                instructions: "Calculate defect rates and first-pass yield across three production lines. Compute each line's defect rate as a percentage.",
                context: "Defect rate and first-pass yield are the everyday vital signs of process quality. The defect rate is defects divided by units produced; first-pass yield is the share of units that come through correctly the first time.",
                colGroups: [{ label: "Quality Metrics", start: 1, end: 3, bg: "#ffe8d8" }],
                cols: [{ label: "Line", index: 0, width: 100 }, { label: "Units", index: 1, width: 100 }, { label: "Defects", index: 2, width: 100 }, { label: "Defect Rate", index: 3, width: 110 }],
                cells: [
                  { r: 0, c: 0, type: "prefilled", display: "Line A" }, { r: 0, c: 1, type: "prefilled", display: "1000" }, { r: 0, c: 2, type: "prefilled", display: "20" }, { r: 0, c: 3, type: "editable", expected: "2", formula: "=C0/B0*100", format: "percent", editable: true, tolerancePct: 1, hint: "Defects ÷ units" },
                  { r: 1, c: 0, type: "prefilled", display: "Line B" }, { r: 1, c: 1, type: "prefilled", display: "1500" }, { r: 1, c: 2, type: "prefilled", display: "45" }, { r: 1, c: 3, type: "editable", expected: "3", formula: "=C1/B1*100", format: "percent", editable: true, tolerancePct: 1, hint: "Defects ÷ units" },
                  { r: 2, c: 0, type: "prefilled", display: "Line C" }, { r: 2, c: 1, type: "prefilled", display: "800" }, { r: 2, c: 2, type: "prefilled", display: "8" }, { r: 2, c: 3, type: "editable", expected: "1", formula: "=C2/B2*100", format: "percent", editable: true, tolerancePct: 1, hint: "Defects ÷ units" },
                  { r: 3, c: 0, type: "header", display: "Overall Defect Rate" },
                  { r: 3, c: 3, type: "editable", expected: "2.15", formula: "=SUM(C0:C2)/SUM(B0:B2)*100", format: "percent", editable: true, tolerancePct: 2, hint: "Total defects ÷ total units" },
                ],
              },
            },
            {
              name: "Six Sigma DPMO", difficulty: "hard", estMins: 30,
              description: "Defects per million opportunities and sigma level.",
              hints: ["DPMO scales defects to a per-million basis so processes can be compared.", "DPMO = (defects ÷ (units × opportunities per unit)) × 1,000,000.", "Lower DPMO means a higher sigma level and a more capable process."],
              activity: {
                kind: "quantus", title: "Calculate DPMO",
                instructions: "Compute defects per million opportunities (DPMO). Calculate the total opportunities and then the DPMO.",
                context: "DPMO is the lingua franca of Six Sigma quality. It normalises quality to a per-million scale so that processes of very different complexity can be compared on equal footing.",
                colGroups: [{ label: "Six Sigma DPMO", start: 1, end: 1, bg: "#ffe8d8" }],
                cols: [{ label: "Metric", index: 0, width: 240 }, { label: "Value", index: 1, width: 120 }],
                cells: [
                  { r: 0, c: 0, type: "prefilled", display: "Units Produced" }, { r: 0, c: 1, type: "prefilled", display: "5000" },
                  { r: 1, c: 0, type: "prefilled", display: "Opportunities per Unit" }, { r: 1, c: 1, type: "prefilled", display: "4" },
                  { r: 2, c: 0, type: "prefilled", display: "Defects Found" }, { r: 2, c: 1, type: "prefilled", display: "30" },
                  { r: 3, c: 0, type: "header", display: "Total Opportunities" }, { r: 3, c: 1, type: "editable", expected: "20000", formula: "=B0*B1", format: "number", editable: true, tolerancePct: 0, hint: "Units × opportunities per unit" },
                  { r: 4, c: 0, type: "header", display: "DPMO" }, { r: 4, c: 1, type: "editable", expected: "1500", formula: "=B2/B3*1000000", format: "number", editable: true, tolerancePct: 1, hint: "Defects ÷ total opportunities × 1,000,000" },
                ],
              },
            },
          ],
        },
      ],
    },
    {
      name: "Inventory & Supply Chain", subtitle: "Holding the right amount of the right thing",
      level: "Intermediate", durationWeeks: 1.5,
      description: "Ordering, holding and replenishing inventory at the lowest total cost.",
      subtopics: [
        {
          name: "Inventory Models", professionSlugs: ["ops_mgr", "fin_analyst"],
          description: "How much to order and when.",
          lessons: [
            {
              name: "Inventory Cost Trade-off", difficulty: "easy", estMins: 15,
              description: "Why ordering more and ordering less both cost money.",
              hints: ["Ordering often means high ordering cost; ordering rarely means high holding cost.", "Total cost is the sum of ordering cost and holding cost.", "The optimal order balances the two opposing costs."],
              activity: {
                kind: "mcq", title: "Inventory cost trade-offs",
                instructions: "Answer these questions on the fundamental trade-off in inventory management. Each question has one correct answer.",
                context: "Inventory management is governed by a trade-off between two opposing costs. Ordering cost falls as you order in larger batches. Holding cost rises with larger batches. Total inventory cost is minimised at an intermediate order size where the marginal saving in one cost offsets the marginal increase in the other.",
                questions: [
                  { q: "As order quantity increases, holding cost per year:", explanation: "Larger orders mean more average inventory sitting in the warehouse, so annual holding cost rises.", options: [{ text: "Increases", correct: true }, { text: "Decreases" }, { text: "Stays constant" }, { text: "Becomes zero" }] },
                  { q: "As order quantity increases, annual ordering cost:", explanation: "Larger orders mean fewer orders per year, so total annual ordering cost falls.", options: [{ text: "Decreases", correct: true }, { text: "Increases" }, { text: "Stays constant" }, { text: "Doubles" }] },
                  { q: "Total inventory cost is minimised when:", explanation: "The optimum is where ordering and holding costs are balanced — at the EOQ, they are in fact equal.", options: [{ text: "Ordering cost equals holding cost", correct: true }, { text: "Ordering cost is zero" }, { text: "Holding cost is maximised" }, { text: "Orders are placed daily" }] },
                ],
              },
            },
            {
              name: "The EOQ Formula", difficulty: "medium", estMins: 25,
              description: "Build the economic order quantity formula.",
              hints: ["EOQ balances annual demand and ordering cost against holding cost.", "It is the square root of (2 × demand × order cost ÷ holding cost).", "EOQ = √(2DS / H)."],
              activity: {
                kind: "canvas", assemblyMode: "graph",
                title: "Build the EOQ formula",
                instructions: "Construct the economic order quantity (EOQ) formula as a graph. Connect the tokens into the correct structure: the square root of a fraction whose numerator is two times annual demand times the ordering cost, and whose denominator is the holding cost per unit.",
                context: "The economic order quantity is the order size that minimises total inventory cost by balancing ordering and holding costs. Its formula, EOQ = √(2DS/H), packs the trade-off into one expression.",
                tokens: [
                  { ref: "sqrt", text: "√", role: "operator", shape: "diamond" },
                  { ref: "two", text: "2", role: "operand", shape: "ellipse" },
                  { ref: "d", text: "D (Demand)", role: "operand", shape: "rect" },
                  { ref: "s", text: "S (Order Cost)", role: "operand", shape: "rect" },
                  { ref: "mult1", text: "×", role: "operator", shape: "diamond" },
                  { ref: "div", text: "÷", role: "operator", shape: "diamond" },
                  { ref: "h", text: "H (Holding Cost)", role: "operand", shape: "rect" },
                  { ref: "eq", text: "=", role: "relation", shape: "diamond" },
                  { ref: "eoq", text: "EOQ", role: "result", shape: "pill" },
                  { ref: "price", text: "P (Unit Price)", role: "operand", shape: "rect", distractor: true },
                ],
                edges: [
                  { from: "two", to: "mult1", role: "connection", slot: "left", label: "numerator" },
                  { from: "d", to: "mult1", role: "connection", slot: "right", label: "numerator" },
                  { from: "mult1", to: "s", role: "connection", label: "numerator" },
                  { from: "mult1", to: "div", role: "connection", slot: "left" },
                  { from: "h", to: "div", role: "connection", slot: "right", label: "denominator" },
                  { from: "div", to: "sqrt", role: "connection" },
                  { from: "sqrt", to: "eq", role: "connection" },
                  { from: "eq", to: "eoq", role: "connection" },
                ],
              },
            },
            {
              name: "EOQ Calculation", difficulty: "hard", estMins: 30,
              description: "Apply the EOQ formula and find total cost.",
              hints: ["Plug demand, order cost and holding cost into the EOQ formula.", "Then orders per year = demand ÷ EOQ.", "Total cost = ordering cost + holding cost at the EOQ."],
              activity: {
                kind: "quantus", title: "Compute EOQ and total cost",
                instructions: "Apply the EOQ model to a real inventory item. Compute the economic order quantity, orders per year, and total annual inventory cost.",
                context: "Applying the EOQ formula turns the inventory trade-off into a concrete order policy. A useful check is that at the true EOQ the annual ordering cost and annual holding cost are equal.",
                colGroups: [{ label: "EOQ Model", start: 1, end: 1, bg: "#ffe8d8" }],
                cols: [{ label: "Metric", index: 0, width: 240 }, { label: "Value", index: 1, width: 120 }],
                cells: [
                  { r: 0, c: 0, type: "prefilled", display: "Annual Demand (D)" }, { r: 0, c: 1, type: "prefilled", display: "10000" },
                  { r: 1, c: 0, type: "prefilled", display: "Order Cost (S)" }, { r: 1, c: 1, type: "prefilled", display: "50" },
                  { r: 2, c: 0, type: "prefilled", display: "Holding Cost per Unit (H)" }, { r: 2, c: 1, type: "prefilled", display: "4" },
                  { r: 3, c: 0, type: "header", display: "EOQ" }, { r: 3, c: 1, type: "editable", expected: "500", formula: "=SQRT(2*B0*B1/B2)", format: "number", editable: true, tolerancePct: 1, hint: "√(2DS / H)" },
                  { r: 4, c: 0, type: "header", display: "Orders per Year" }, { r: 4, c: 1, type: "editable", expected: "20", formula: "=B0/B3", format: "number", editable: true, tolerancePct: 1, hint: "Demand ÷ EOQ" },
                  { r: 5, c: 0, type: "header", display: "Total Annual Cost" }, { r: 5, c: 1, type: "editable", expected: "2000", formula: "=B0/B3*B1+B3/2*B2", format: "number", editable: true, tolerancePct: 2, hint: "Ordering cost + holding cost at EOQ" },
                ],
              },
            },
          ],
        },
        {
          name: "Supply Chain Metrics", professionSlugs: ["ops_mgr", "mgmt_consultant", "fin_analyst"],
          description: "Measuring how efficiently inventory and cash move.",
          lessons: [
            {
              name: "Inventory Turnover", difficulty: "easy", estMins: 15,
              description: "How many times inventory cycles in a year.",
              hints: ["Turnover measures how quickly inventory is sold and replaced.", "It divides the cost of goods sold by average inventory.", "Inventory Turnover = COGS ÷ Average Inventory."],
              activity: {
                kind: "canvas", assemblyMode: "sequence",
                title: "Build the inventory turnover ratio",
                instructions: "Assemble the inventory turnover ratio from the sidebar tokens. Note that turnover uses cost of goods sold, not revenue, divided by average inventory.",
                context: "Inventory turnover measures how efficiently a company converts its stock into sales. The choice of numerator matters — cost of goods sold, not revenue, because inventory is carried at cost.",
                tokens: [
                  { ref: "turn", text: "Inventory Turnover", role: "result", shape: "pill" },
                  { ref: "eq", text: "=", role: "relation", shape: "diamond" },
                  { ref: "cogs", text: "COGS", role: "operand", shape: "rect" },
                  { ref: "div", text: "÷", role: "operator", shape: "diamond" },
                  { ref: "inv", text: "Average Inventory", role: "operand", shape: "rect" },
                  { ref: "rev", text: "Revenue", role: "operand", shape: "rect", distractor: true },
                  { ref: "mult", text: "×", role: "operator", shape: "diamond", distractor: true },
                ],
                edges: [
                  { from: "turn", to: "eq", role: "sequence", order: 1 },
                  { from: "eq", to: "cogs", role: "sequence", order: 2, slot: "left" },
                  { from: "cogs", to: "div", role: "sequence", order: 3 },
                  { from: "div", to: "inv", role: "sequence", order: 4, slot: "right" },
                ],
              },
            },
            {
              name: "Days Inventory & DSO", difficulty: "medium", estMins: 20,
              description: "Convert turnover ratios into days.",
              hints: ["Days metrics translate a turnover ratio into an intuitive number of days.", "Days inventory = 365 ÷ inventory turnover.", "Days sales outstanding = receivables ÷ revenue × 365."],
              activity: {
                kind: "quantus", title: "Days inventory and DSO",
                instructions: "Convert turnover and receivables figures into days-based metrics. Compute inventory turnover, days inventory outstanding, and days sales outstanding.",
                context: "Days-based working-capital metrics restate turnover ratios in the more intuitive unit of time. DIO tells you how long stock sits before being sold. DSO tells you how long customers take to pay.",
                colGroups: [{ label: "Working Capital Days", start: 1, end: 1, bg: "#ffe8d8" }],
                cols: [{ label: "Metric", index: 0, width: 240 }, { label: "Value", index: 1, width: 120 }],
                cells: [
                  { r: 0, c: 0, type: "prefilled", display: "COGS" }, { r: 0, c: 1, type: "prefilled", display: "7300" },
                  { r: 1, c: 0, type: "prefilled", display: "Average Inventory" }, { r: 1, c: 1, type: "prefilled", display: "1200" },
                  { r: 2, c: 0, type: "prefilled", display: "Revenue" }, { r: 2, c: 1, type: "prefilled", display: "10950" },
                  { r: 3, c: 0, type: "prefilled", display: "Accounts Receivable" }, { r: 3, c: 1, type: "prefilled", display: "1350" },
                  { r: 4, c: 0, type: "header", display: "Inventory Turnover" }, { r: 4, c: 1, type: "editable", expected: "6.08", formula: "=B0/B1", format: "number", editable: true, tolerancePct: 2, hint: "COGS ÷ average inventory" },
                  { r: 5, c: 0, type: "header", display: "Days Inventory Outstanding" }, { r: 5, c: 1, type: "editable", expected: "60", formula: "=365/B4", format: "number", editable: true, tolerancePct: 2, hint: "365 ÷ inventory turnover" },
                  { r: 6, c: 0, type: "header", display: "Days Sales Outstanding" }, { r: 6, c: 1, type: "editable", expected: "45", formula: "=B3/B2*365", format: "number", editable: true, tolerancePct: 2, hint: "Receivables ÷ revenue × 365" },
                ],
              },
            },
            {
              name: "Cash Conversion Cycle", difficulty: "hard", estMins: 25,
              description: "Combine the days metrics into the cash conversion cycle.",
              hints: ["The cycle measures the gap between paying suppliers and collecting from customers.", "Add days inventory and days receivable, then subtract days payable.", "CCC = DIO + DSO − DPO."],
              activity: {
                kind: "canvas", assemblyMode: "graph",
                title: "Build the cash conversion cycle",
                instructions: "Construct the cash conversion cycle as a graph. Connect days inventory outstanding plus days sales outstanding, minus days payable outstanding.",
                context: "The cash conversion cycle measures how many days a company's cash is tied up in operations. It sums DIO and DSO (cash tied up) and subtracts DPO (supplier financing).",
                tokens: [
                  { ref: "dio", text: "DIO", role: "operand", shape: "rect" },
                  { ref: "plus", text: "+", role: "operator", shape: "diamond" },
                  { ref: "dso", text: "DSO", role: "operand", shape: "rect" },
                  { ref: "minus", text: "−", role: "operator", shape: "diamond" },
                  { ref: "dpo", text: "DPO", role: "operand", shape: "rect" },
                  { ref: "eq", text: "=", role: "relation", shape: "diamond" },
                  { ref: "ccc", text: "Cash Conversion Cycle", role: "result", shape: "pill" },
                  { ref: "doh", text: "Days Cash on Hand", role: "operand", shape: "rect", distractor: true },
                ],
                edges: [
                  { from: "dio", to: "plus", role: "connection", slot: "left" },
                  { from: "dso", to: "plus", role: "connection", slot: "right" },
                  { from: "plus", to: "minus", role: "connection", slot: "left" },
                  { from: "dpo", to: "minus", role: "connection", slot: "right" },
                  { from: "minus", to: "eq", role: "connection" },
                  { from: "eq", to: "ccc", role: "connection" },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
};

const MODULES: ModuleDef[] = [FINANCE, STRATEGY, OPERATIONS];

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVITY CREATORS
// ═══════════════════════════════════════════════════════════════════════════

async function createActivity(lessonId: string, a: ActivityContent) {
  if (a.kind === "mcq") return createMcq(lessonId, a);
  if (a.kind === "canvas") return createCanvas(lessonId, a);
  return createQuantus(lessonId, a);
}

async function createMcq(lessonId: string, a: McqContent) {
  const act = await prisma.mcqActivity.create({
    data: { lessonId, title: a.title, instructions: a.instructions, context: a.context },
  });
  for (let qi = 0; qi < a.questions.length; qi++) {
    const q = a.questions[qi];
    const qRow = await prisma.mcqQuestion.create({
      data: { activityId: act.id, questionText: q.q, explanation: q.explanation, orderIndex: qi },
    });
    for (let oi = 0; oi < q.options.length; oi++) {
      const o = q.options[oi];
      await prisma.mcqOption.create({
        data: { questionId: qRow.id, optionText: o.text, isCorrect: !!o.correct, orderIndex: oi },
      });
    }
  }
  return act;
}

async function createCanvas(lessonId: string, a: CanvasContent) {
  const act = await prisma.canvasActivity.create({
    data: {
      lessonId, title: a.title, instructions: a.instructions, context: a.context,
      assemblyMode: a.assemblyMode, scoringMode: "partial", penaltyWeight: 0.5, passThreshold: 70,
    },
  });
  const tokenId: Record<string, string> = {};
  for (let i = 0; i < a.tokens.length; i++) {
    const tk = a.tokens[i];
    const row = await prisma.canvasToken.create({
      data: { activityId: act.id, displayText: tk.text, tokenRole: tk.role, shape: tk.shape ?? "rect", isDistractor: !!tk.distractor, orderIndex: i },
    });
    tokenId[tk.ref] = row.id;
  }
  for (const e of a.edges) {
    await prisma.canvasSolutionEdge.create({
      data: {
        activityId: act.id,
        fromTokenId: tokenId[e.from], toTokenId: tokenId[e.to],
        operandSlot: e.slot ?? null, isCommutative: !!e.commutative,
        edgeRole: e.role, edgeOrder: e.order ?? null, edgeLabel: e.label ?? null,
      },
    });
  }
  return act;
}

async function createQuantus(lessonId: string, a: QuantusContent) {
  const act = await prisma.quantusActivity.create({
    data: { lessonId, title: a.title, instructions: a.instructions, context: a.context },
  });
  for (let i = 0; i < a.colGroups.length; i++) {
    const g = a.colGroups[i];
    await prisma.quantusColumnGroup.create({
      data: { activityId: act.id, label: g.label, colStart: g.start, colEnd: g.end, bgColor: g.bg ?? "#e8e8ff", orderIndex: i },
    });
  }
  for (const c of a.cols) {
    await prisma.quantusColumn.create({
      data: { activityId: act.id, label: c.label, colIndex: c.index, widthPx: c.width ?? 100 },
    });
  }
  for (const cell of a.cells) {
    await prisma.quantusCell.create({
      data: {
        activityId: act.id, rowIndex: cell.r, colIndex: cell.c, cellType: cell.type,
        displayValue: cell.display ?? null, expectedValue: cell.expected ?? null,
        formula: cell.formula ?? null, formatType: cell.format ?? null,
        isEditable: !!cell.editable, tolerancePct: cell.tolerancePct ?? null, hintText: cell.hint ?? null,
      },
    });
  }
  return act;
}

async function seedHints(lessonId: string, a: ActivityContent, hints: string[]) {
  let activityId: string | null = null;
  if (a.kind === "mcq") activityId = (await prisma.mcqActivity.findUnique({ where: { lessonId } }))?.id ?? null;
  if (a.kind === "canvas") activityId = (await prisma.canvasActivity.findUnique({ where: { lessonId } }))?.id ?? null;
  if (a.kind === "quantus") activityId = (await prisma.quantusActivity.findUnique({ where: { lessonId } }))?.id ?? null;
  if (!activityId) return;
  for (let i = 0; i < hints.length; i++) {
    await prisma.activityHint.create({
      data: { activityType: a.kind, activityId, hintText: hints[i], orderIndex: i },
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ADDITIONAL MCQ CONTENT (from seed_mcq_quantus.ts)
// These add extra MCQ activities to lessons that only have canvas/quantus
// ═══════════════════════════════════════════════════════════════════════════

interface ExtMcqOptionDef { optionText: string; isCorrect: boolean; orderIndex: number; }
interface ExtMcqQuestionDef { questionText: string; explanation: string; hints: string[]; orderIndex: number; options: ExtMcqOptionDef[]; }
interface ExtMcqDef { title: string; instructions: string; context: string; questions: ExtMcqQuestionDef[]; }
interface ExtQuantusCellDef { rowIndex: number; colIndex: number; cellType: string; displayValue?: string; expectedValue?: string; formula?: string; formatType?: string; isEditable: boolean; tolerancePct?: number; hintText?: string; rowSpan?: number; colSpan?: number; }
interface ExtQuantusDef { title: string; instructions: string; context: string; columnGroups: { label: string; colStart: number; colEnd: number; bgColor: string; textColor: string; orderIndex: number; }[]; columns: { label: string; colIndex: number; widthPx: number; }[]; cells: ExtQuantusCellDef[]; }

async function upsertExtMcq(lessonId: string, def: ExtMcqDef) {
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
        activityId: mcq.id, questionText: q.questionText, explanation: q.explanation, orderIndex: q.orderIndex,
        options: { create: q.options },
      },
    });
    for (let i = 0; i < q.hints.length; i++) {
      const hintOrderIndex = q.orderIndex * 10 + i;
      await prisma.activityHint.upsert({
        where: { activityId_activityType_orderIndex: { activityId: mcq.id, activityType: "mcq", orderIndex: hintOrderIndex } },
        update: { hintText: q.hints[i] },
        create: { activityId: mcq.id, activityType: "mcq", orderIndex: hintOrderIndex, hintText: q.hints[i] },
      });
    }
  }
  await prisma.lessonActivity.upsert({
    where: { lessonId_activityType: { lessonId, activityType: "mcq" } },
    update: { orderIndex: 10 },
    create: { lessonId, activityType: "mcq", orderIndex: 10 },
  });
}

async function upsertExtQuantus(lessonId: string, def: ExtQuantusDef) {
  const existing = await prisma.quantusActivity.findUnique({ where: { lessonId } });
  if (existing) return; // already has one
  const act = await prisma.quantusActivity.create({
    data: { lessonId, title: def.title, instructions: def.instructions, context: def.context },
  });
  await prisma.quantusColumnGroup.createMany({ data: def.columnGroups.map(g => ({ ...g, activityId: act.id })), skipDuplicates: true });
  await prisma.quantusColumn.createMany({ data: def.columns.map(c => ({ ...c, activityId: act.id })), skipDuplicates: true });
  await prisma.quantusCell.createMany({ data: def.cells.map(c => ({ ...c, activityId: act.id })), skipDuplicates: true });
  await prisma.lessonActivity.upsert({
    where: { lessonId_activityType: { lessonId, activityType: "quantus" } },
    update: { orderIndex: 20 },
    create: { lessonId, activityType: "quantus", orderIndex: 20 },
  });
}

// ── Extra MCQ definitions (condensed from seed_mcq_quantus.ts) ───────────────

const ext_mcq_fs_easy: ExtMcqDef = {
  title: "Financial Statements — Fundamentals", instructions: "Select the single best answer for each question.", context: "The three core financial statements — Income Statement, Balance Sheet, and Cash Flow Statement — form the backbone of all financial analysis. The Income Statement shows revenue and expenses over a period. The Balance Sheet is a snapshot of assets, liabilities, and equity at one point in time and must always satisfy Assets = Liabilities + Equity. The Cash Flow Statement reconciles net income to actual cash movements.",
  questions: [
    { questionText: "Which financial statement provides a snapshot at a single point in time?", explanation: "The Balance Sheet captures assets, liabilities, and equity on a specific date.", hints: ["Think: which uses 'as of' rather than 'for the period ended'?", "One statement is a photograph; the others are videos.", "The accounting equation defines a specific statement.", "The Balance Sheet shows position at one moment."], orderIndex: 0, options: [{ optionText: "Income Statement", isCorrect: false, orderIndex: 0 }, { optionText: "Balance Sheet", isCorrect: true, orderIndex: 1 }, { optionText: "Cash Flow Statement", isCorrect: false, orderIndex: 2 }, { optionText: "Statement of Retained Earnings", isCorrect: false, orderIndex: 3 }] },
    { questionText: "Revenue minus COGS gives which line item?", explanation: "Gross Profit = Revenue − COGS.", hints: ["COGS = direct costs of producing goods.", "The result sits at the top of the P&L waterfall.", "Gross Profit ÷ Revenue = Gross Margin.", "Gross Profit = Revenue − COGS."], orderIndex: 1, options: [{ optionText: "EBITDA", isCorrect: false, orderIndex: 0 }, { optionText: "Operating Income (EBIT)", isCorrect: false, orderIndex: 1 }, { optionText: "Gross Profit", isCorrect: true, orderIndex: 2 }, { optionText: "Net Income", isCorrect: false, orderIndex: 3 }] },
    { questionText: "Which section includes the purchase of PP&E?", explanation: "Purchasing PP&E is CapEx — classified as an Investing Activity.", hints: ["Divide cash flows into: operations, long-term assets, capital.", "CapEx acquires physical assets for the long term.", "The Investing section contains asset purchases.", "CapEx → Investing Activities."], orderIndex: 2, options: [{ optionText: "Operating Activities", isCorrect: false, orderIndex: 0 }, { optionText: "Investing Activities", isCorrect: true, orderIndex: 1 }, { optionText: "Financing Activities", isCorrect: false, orderIndex: 2 }, { optionText: "Supplemental Disclosures", isCorrect: false, orderIndex: 3 }] },
    { questionText: "Under the indirect method, depreciation is:", explanation: "Depreciation is added back in Operating Activities because it is non-cash.", hints: ["The indirect method starts with Net Income and adjusts for non-cash items.", "Depreciation reduced Net Income but no cash left — so reverse it.", "Adding back undoes its effect on net income.", "Depreciation → added back in Operating Activities."], orderIndex: 3, options: [{ optionText: "Deducted in Operating Activities", isCorrect: false, orderIndex: 0 }, { optionText: "Added back in Operating Activities", isCorrect: true, orderIndex: 1 }, { optionText: "Shown as outflow in Investing Activities", isCorrect: false, orderIndex: 2 }, { optionText: "Excluded entirely", isCorrect: false, orderIndex: 3 }] },
  ],
};

const ext_mcq_fs_medium: ExtMcqDef = {
  title: "Financial Statements — Statement Linkages", instructions: "These questions test how the three financial statements connect.", context: "When Net Income changes, it ripples across all three statements simultaneously: it feeds into Retained Earnings on the Balance Sheet and serves as the starting point for the Cash Flow Statement. When a company collects a receivable, Cash increases but Revenue does not — revenue was already recognised.",
  questions: [
    { questionText: "If Net Income increases by $50M with no other changes, which Balance Sheet item increases?", explanation: "Net Income flows into Retained Earnings, which is part of Shareholders' Equity.", hints: ["Net Income is retained or distributed as dividends.", "If no dividend is paid, it stays in the company.", "Retained Earnings is the cumulative sum of past net incomes not paid as dividends.", "Retained Earnings increases by $50M."], orderIndex: 0, options: [{ optionText: "Common Stock", isCorrect: false, orderIndex: 0 }, { optionText: "Accounts Payable", isCorrect: false, orderIndex: 1 }, { optionText: "Retained Earnings", isCorrect: true, orderIndex: 2 }, { optionText: "Long-term Debt", isCorrect: false, orderIndex: 3 }] },
    { questionText: "A company collects $80M of Accounts Receivable in cash. Net Income effect?", explanation: "Revenue was already recognised. Collecting cash is purely a Balance Sheet transaction.", hints: ["Under accrual accounting, revenue is recognised when earned.", "Collecting AR converts one asset (AR) into another (cash).", "No new revenue or expense is created.", "Net Income unchanged — purely a balance sheet event."], orderIndex: 1, options: [{ optionText: "Net Income increases by $80M", isCorrect: false, orderIndex: 0 }, { optionText: "Net Income decreases by $80M", isCorrect: false, orderIndex: 1 }, { optionText: "No impact on Net Income", isCorrect: true, orderIndex: 2 }, { optionText: "Gross Profit increases by $80M", isCorrect: false, orderIndex: 3 }] },
    { questionText: "EBITDA adds back D&A to EBIT. Why?", explanation: "D&A is non-cash and reduces EBIT. Adding it back gives a closer approximation of operating cash generation.", hints: ["D&A reduces accounting profit but involves no actual cash payment.", "EBITDA approximates operating cash flow before working capital.", "Adding back D&A reverses a non-cash deduction.", "EBITDA = EBIT + D&A."], orderIndex: 2, options: [{ optionText: "Because D&A is a financing cost", isCorrect: false, orderIndex: 0 }, { optionText: "Because D&A is non-cash and reduces accounting profit without using cash", isCorrect: true, orderIndex: 1 }, { optionText: "Because D&A always equals CapEx", isCorrect: false, orderIndex: 2 }, { optionText: "Because regulators require it", isCorrect: false, orderIndex: 3 }] },
    { questionText: "A company raises $200M of new debt. Which statements are directly affected?", explanation: "Debt issuance increases Cash and increases Long-term Debt (Balance Sheet) and is a cash inflow in Financing Activities.", hints: ["Debt puts cash in the bank and creates a liability.", "Which CFS section covers raising capital?", "The Income Statement is only affected when interest is charged.", "Balance Sheet (Cash↑, Debt↑) and CFS Financing Activities."], orderIndex: 3, options: [{ optionText: "Income Statement (revenue) and Balance Sheet (assets)", isCorrect: false, orderIndex: 0 }, { optionText: "Balance Sheet (cash + debt) and CFS Financing Activities", isCorrect: true, orderIndex: 1 }, { optionText: "Balance Sheet only", isCorrect: false, orderIndex: 2 }, { optionText: "CFS Operating Activities and Balance Sheet", isCorrect: false, orderIndex: 3 }] },
  ],
};

const ext_mcq_fs_hard: ExtMcqDef = {
  title: "Financial Statements — Advanced Analysis", instructions: "Advanced questions on accounting policies and quality of earnings.", context: "Advanced analysis questions the quality and sustainability of reported numbers. Accounting choices such as revenue recognition timing, inventory costing (FIFO vs LIFO), and R&D treatment can materially affect reported earnings. Sophisticated analysts normalise for one-off items, assess working capital trends, and compare cash conversion.",
  questions: [
    { questionText: "Company switches from FIFO to LIFO during rising input prices. Effect on COGS and Net Income?", explanation: "Under LIFO, most recently purchased (higher-priced) inventory is expensed first, raising COGS and reducing Net Income.", hints: ["LIFO: last in, first expensed.", "If prices rise, most recent inventory is most expensive.", "Higher COGS → lower Gross Profit → lower Net Income.", "LIFO raises COGS and reduces Net Income in rising-price environments."], orderIndex: 0, options: [{ optionText: "COGS decreases, Net Income increases", isCorrect: false, orderIndex: 0 }, { optionText: "COGS increases, Net Income decreases", isCorrect: true, orderIndex: 1 }, { optionText: "COGS unchanged, Net Income unchanged", isCorrect: false, orderIndex: 2 }, { optionText: "COGS increases, Net Income increases due to tax shield", isCorrect: false, orderIndex: 3 }] },
    { questionText: "Company A: Net Income $100M, FCF $20M. Company B: Net Income $100M, FCF $90M. Higher earnings quality?", explanation: "Company B converts 90% of earnings into cash (FCF/NI = 90%). Company A only 20%. Higher FCF/NI = higher earnings quality.", hints: ["Earnings quality measures how closely profit resembles actual cash received.", "FCF/NI: Company A = 20%, Company B = 90%.", "Higher FCF/NI = higher quality.", "Company B wins."], orderIndex: 1, options: [{ optionText: "Company A — higher CapEx signals more growth investment", isCorrect: false, orderIndex: 0 }, { optionText: "Company B — higher FCF/NI ratio means earnings are backed by real cash", isCorrect: true, orderIndex: 1 }, { optionText: "Equal — Net Income is the same", isCorrect: false, orderIndex: 2 }, { optionText: "Company A — lower FCF signals confidence", isCorrect: false, orderIndex: 3 }] },
    { questionText: "Company capitalises $150M of software development costs. Impact on Operating Income vs expensing?", explanation: "Capitalising delays the full cost. Only amortisation hits the P&L this period, inflating Operating Income.", hints: ["Capitalising = asset on Balance Sheet; only amortisation hits P&L.", "Expensing = full $150M hits Income Statement immediately.", "Capitalising spreads cost over multiple years.", "Capitalising inflates Operating Income this year."], orderIndex: 2, options: [{ optionText: "Operating Income decreases — CapEx creates higher depreciation", isCorrect: false, orderIndex: 0 }, { optionText: "Operating Income increases — only amortisation, not full cost, is expensed", isCorrect: true, orderIndex: 1 }, { optionText: "Operating Income unchanged", isCorrect: false, orderIndex: 2 }, { optionText: "Operating Income decreases — capitalising increases liabilities", isCorrect: false, orderIndex: 3 }] },
    { questionText: "To compare operating performance without capital structure distortion, use:", explanation: "EBIT strips out interest expense, which is driven by debt levels. Two companies with identical operations but different debt will have different Net Income.", hints: ["Capital structure = mix of debt and equity.", "Interest expense is the cost of debt.", "To compare operations fairly, remove financing cost.", "EBIT or EBITDA neutralises impact of different debt levels."], orderIndex: 3, options: [{ optionText: "Net Income", isCorrect: false, orderIndex: 0 }, { optionText: "EPS", isCorrect: false, orderIndex: 1 }, { optionText: "EBIT or EBITDA", isCorrect: true, orderIndex: 2 }, { optionText: "Return on Equity (ROE)", isCorrect: false, orderIndex: 3 }] },
  ],
};

// Extra quantus for fs/hard (P&L forecast model)
const ext_quantus_fs_hard: ExtQuantusDef = {
  title: "Three-Statement Model — P&L Forecast", instructions: "Complete the highlighted cells to build a 3-year P&L forecast. Yellow cells are editable. Values in $M.", context: "This model projects a company's Income Statement for FY2023E and FY2024E using FY2022 actuals as the base.",
  columnGroups: [
    { label: "Assumptions", colStart: 1, colEnd: 1, bgColor: "#e8f4fd", textColor: "#1a6fa8", orderIndex: 0 },
    { label: "Actuals", colStart: 2, colEnd: 2, bgColor: "#f0f0f0", textColor: "#555", orderIndex: 1 },
    { label: "Forecast", colStart: 3, colEnd: 4, bgColor: "#fffbe6", textColor: "#8a6a00", orderIndex: 2 },
  ],
  columns: [
    { label: "Line Item", colIndex: 0, widthPx: 230 }, { label: "Driver", colIndex: 1, widthPx: 170 },
    { label: "FY2022A ($M)", colIndex: 2, widthPx: 120 }, { label: "FY2023E ($M)", colIndex: 3, widthPx: 120 }, { label: "FY2024E ($M)", colIndex: 4, widthPx: 120 },
  ],
  cells: [
    { rowIndex: 0, colIndex: 0, cellType: "header", displayValue: "INCOME STATEMENT MODEL", isEditable: false, colSpan: 5 },
    { rowIndex: 1, colIndex: 0, cellType: "label", displayValue: "Revenue", isEditable: false },
    { rowIndex: 1, colIndex: 1, cellType: "prefilled", displayValue: "+12% / +10% YoY", isEditable: false },
    { rowIndex: 1, colIndex: 2, cellType: "prefilled", displayValue: "800.0", isEditable: false },
    { rowIndex: 1, colIndex: 3, cellType: "editable", expectedValue: "896.0", isEditable: true, tolerancePct: 1, hintText: "Revenue FY2023 = 800 × 1.12" },
    { rowIndex: 1, colIndex: 4, cellType: "editable", expectedValue: "985.6", isEditable: true, tolerancePct: 1, hintText: "Revenue FY2024 = FY2023 × 1.10" },
    { rowIndex: 2, colIndex: 0, cellType: "label", displayValue: "COGS", isEditable: false },
    { rowIndex: 2, colIndex: 1, cellType: "prefilled", displayValue: "58% of Revenue", isEditable: false },
    { rowIndex: 2, colIndex: 2, cellType: "prefilled", displayValue: "464.0", isEditable: false },
    { rowIndex: 2, colIndex: 3, cellType: "editable", expectedValue: "519.7", isEditable: true, tolerancePct: 1, hintText: "COGS = Revenue × 58%" },
    { rowIndex: 2, colIndex: 4, cellType: "editable", expectedValue: "571.6", isEditable: true, tolerancePct: 1, hintText: "COGS = Revenue × 58%" },
    { rowIndex: 3, colIndex: 0, cellType: "label", displayValue: "Gross Profit", isEditable: false },
    { rowIndex: 3, colIndex: 2, cellType: "prefilled", displayValue: "336.0", isEditable: false },
    { rowIndex: 3, colIndex: 3, cellType: "formula", formula: "=D2-D3", expectedValue: "376.3", isEditable: false },
    { rowIndex: 3, colIndex: 4, cellType: "formula", formula: "=E2-E3", expectedValue: "414.0", isEditable: false },
    { rowIndex: 4, colIndex: 0, cellType: "label", displayValue: "SG&A", isEditable: false },
    { rowIndex: 4, colIndex: 1, cellType: "prefilled", displayValue: "18% of Revenue", isEditable: false },
    { rowIndex: 4, colIndex: 2, cellType: "prefilled", displayValue: "144.0", isEditable: false },
    { rowIndex: 4, colIndex: 3, cellType: "editable", expectedValue: "161.3", isEditable: true, tolerancePct: 1, hintText: "SG&A = Revenue × 18%" },
    { rowIndex: 4, colIndex: 4, cellType: "editable", expectedValue: "177.4", isEditable: true, tolerancePct: 1, hintText: "SG&A = Revenue × 18%" },
    { rowIndex: 5, colIndex: 0, cellType: "label", displayValue: "D&A", isEditable: false },
    { rowIndex: 5, colIndex: 1, cellType: "prefilled", displayValue: "Fixed $30M/yr", isEditable: false },
    { rowIndex: 5, colIndex: 2, cellType: "prefilled", displayValue: "30.0", isEditable: false },
    { rowIndex: 5, colIndex: 3, cellType: "editable", expectedValue: "30.0", isEditable: true, tolerancePct: 0, hintText: "D&A is fixed at $30M per year" },
    { rowIndex: 5, colIndex: 4, cellType: "editable", expectedValue: "30.0", isEditable: true, tolerancePct: 0, hintText: "D&A is fixed at $30M per year" },
    { rowIndex: 6, colIndex: 0, cellType: "label", displayValue: "EBIT", isEditable: false },
    { rowIndex: 6, colIndex: 2, cellType: "prefilled", displayValue: "162.0", isEditable: false },
    { rowIndex: 6, colIndex: 3, cellType: "formula", formula: "=D4-D5-D6", expectedValue: "185.0", isEditable: false },
    { rowIndex: 6, colIndex: 4, cellType: "formula", formula: "=E4-E5-E6", expectedValue: "206.6", isEditable: false },
    { rowIndex: 7, colIndex: 0, cellType: "label", displayValue: "Interest Expense", isEditable: false },
    { rowIndex: 7, colIndex: 1, cellType: "prefilled", displayValue: "Fixed $25M/yr", isEditable: false },
    { rowIndex: 7, colIndex: 2, cellType: "prefilled", displayValue: "25.0", isEditable: false },
    { rowIndex: 7, colIndex: 3, cellType: "editable", expectedValue: "25.0", isEditable: true, tolerancePct: 0, hintText: "Interest Expense is fixed at $25M" },
    { rowIndex: 7, colIndex: 4, cellType: "editable", expectedValue: "25.0", isEditable: true, tolerancePct: 0, hintText: "Interest Expense is fixed at $25M" },
    { rowIndex: 8, colIndex: 0, cellType: "label", displayValue: "EBT", isEditable: false },
    { rowIndex: 8, colIndex: 2, cellType: "prefilled", displayValue: "137.0", isEditable: false },
    { rowIndex: 8, colIndex: 3, cellType: "formula", formula: "=D7-D8", expectedValue: "160.0", isEditable: false },
    { rowIndex: 8, colIndex: 4, cellType: "formula", formula: "=E7-E8", expectedValue: "181.6", isEditable: false },
    { rowIndex: 9, colIndex: 0, cellType: "label", displayValue: "Taxes", isEditable: false },
    { rowIndex: 9, colIndex: 1, cellType: "prefilled", displayValue: "25% tax rate", isEditable: false },
    { rowIndex: 9, colIndex: 2, cellType: "prefilled", displayValue: "34.3", isEditable: false },
    { rowIndex: 9, colIndex: 3, cellType: "editable", expectedValue: "40.0", isEditable: true, tolerancePct: 1, hintText: "Tax = EBT × 25%" },
    { rowIndex: 9, colIndex: 4, cellType: "editable", expectedValue: "45.4", isEditable: true, tolerancePct: 1, hintText: "Tax = EBT × 25%" },
    { rowIndex: 10, colIndex: 0, cellType: "label", displayValue: "Net Income", isEditable: false },
    { rowIndex: 10, colIndex: 2, cellType: "prefilled", displayValue: "102.8", isEditable: false },
    { rowIndex: 10, colIndex: 3, cellType: "formula", formula: "=D9-D10", expectedValue: "120.0", isEditable: false },
    { rowIndex: 10, colIndex: 4, cellType: "formula", formula: "=E9-E10", expectedValue: "136.2", isEditable: false },
  ],
};

// ── DuPont subtopic extra activities (finance/0/3/*) ─────────────────────────

const ext_mcq_dupont_easy: ExtMcqDef = {
  title: "DuPont Analysis — 3-Factor Model",
  instructions: "Select the single best answer for each question.",
  context: "The 3-factor DuPont model decomposes ROE into Net Profit Margin × Asset Turnover × Equity Multiplier. NPM = Net Income ÷ Revenue. AT = Revenue ÷ Total Assets. EM = Total Assets ÷ Equity. The decomposition reveals whether ROE is driven by margin, asset efficiency, or leverage.",
  questions: [
    {
      questionText: "ROE = 20%, Asset Turnover = 1.6×, Equity Multiplier = 2.5×. What is the Net Profit Margin?",
      explanation: "ROE = NPM × AT × EM → 20% = NPM × 1.6 × 2.5 → NPM = 20% ÷ 4 = 5%.",
      hints: ["Rearrange: NPM = ROE ÷ (AT × EM).", "AT × EM = 1.6 × 2.5 = 4.0.", "20% ÷ 4.0 = 5%.", "NPM = 5%."],
      orderIndex: 0,
      options: [
        { optionText: "5.0%", isCorrect: true, orderIndex: 0 },
        { optionText: "8.0%", isCorrect: false, orderIndex: 1 },
        { optionText: "12.5%", isCorrect: false, orderIndex: 2 },
        { optionText: "3.2%", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText: "Company A's ROE rises from 12% to 18% while Net Profit Margin and Asset Turnover stay unchanged. What drove it?",
      explanation: "If NPM and AT are constant, only Equity Multiplier changed — meaning the firm took on more debt relative to equity.",
      hints: ["Three DuPont factors: NPM, AT, EM.", "Two are constant — the third must have changed.", "EM = Total Assets ÷ Equity.", "Rising EM means more leverage."],
      orderIndex: 1,
      options: [
        { optionText: "An increase in the Equity Multiplier (higher leverage)", isCorrect: true, orderIndex: 0 },
        { optionText: "A reduction in COGS", isCorrect: false, orderIndex: 1 },
        { optionText: "Faster inventory turnover", isCorrect: false, orderIndex: 2 },
        { optionText: "A lower effective tax rate", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText: "What does a rising Equity Multiplier indicate?",
      explanation: "EM = Total Assets ÷ Equity. A higher ratio means the firm funds more assets per unit of equity — i.e., more of the asset base is financed by debt.",
      hints: ["EM = Total Assets ÷ Equity.", "More assets per unit of equity = more debt.", "High EM = higher financial leverage.", "It is the leverage component of the DuPont identity."],
      orderIndex: 2,
      options: [
        { optionText: "The firm is increasingly funded by debt relative to equity", isCorrect: true, orderIndex: 0 },
        { optionText: "Operating efficiency of assets is improving", isCorrect: false, orderIndex: 1 },
        { optionText: "The proportion of revenue that becomes profit is rising", isCorrect: false, orderIndex: 2 },
        { optionText: "The dividend payout ratio is increasing", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText: "Firm A: NPM 15%, AT 0.6×. Firm B: NPM 4%, AT 1.5×. Both have ROE = 18%. What can you infer?",
      explanation: "Firm A earns its ROE through high margin (premium/pharma model). Firm B earns the same ROE through high turnover (retail/FMCG model). The same ROE can arise from structurally different business models.",
      hints: ["Calculate EM for each: ROE ÷ (NPM × AT).", "Firm A EM = 18% ÷ (15% × 0.6) = 2.0×.", "Firm B EM = 18% ÷ (4% × 1.5) = 3.0×.", "Different levers, same ROE outcome."],
      orderIndex: 3,
      options: [
        { optionText: "Firm A is margin-driven; Firm B is turnover-driven — different industry models producing equal ROE", isCorrect: true, orderIndex: 0 },
        { optionText: "Firm B is less profitable and should be avoided by investors", isCorrect: false, orderIndex: 1 },
        { optionText: "Firm A is more financially leveraged than Firm B", isCorrect: false, orderIndex: 2 },
        { optionText: "Both firms must operate in the same sector", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText: "A company collects receivables faster (days outstanding fall) with no change in revenue or net income. Which DuPont factor improves?",
      explanation: "Faster collections mean accounts receivable (a current asset) shrinks, reducing Total Assets. Asset Turnover = Revenue ÷ Total Assets therefore rises — the same revenue is generated from a leaner asset base.",
      hints: ["Which factor involves Total Assets?", "AT = Revenue ÷ Total Assets.", "Fewer assets for the same revenue = higher turnover.", "Asset Turnover improves."],
      orderIndex: 4,
      options: [
        { optionText: "Asset Turnover", isCorrect: true, orderIndex: 0 },
        { optionText: "Net Profit Margin", isCorrect: false, orderIndex: 1 },
        { optionText: "Equity Multiplier", isCorrect: false, orderIndex: 2 },
        { optionText: "All three factors improve equally", isCorrect: false, orderIndex: 3 },
      ],
    },
  ],
};

const ext_mcq_dupont_medium: ExtMcqDef = {
  title: "DuPont Analysis — 5-Factor Model & ROE Drivers",
  instructions: "These questions deepen the DuPont analysis to the 5-factor model and its strategic implications.",
  context: "The 5-factor DuPont: ROE = Tax Burden × Interest Burden × Operating Margin × Asset Turnover × Equity Multiplier. Tax Burden = NI ÷ EBT. Interest Burden = EBT ÷ EBIT. Operating Margin = EBIT ÷ Revenue. The model isolates tax and interest effects that the 3-factor model bundles together.",
  questions: [
    {
      questionText: "Tax Burden = 0.72. What is the company's effective tax rate?",
      explanation: "Tax Burden = NI ÷ EBT = 1 − effective tax rate. So 0.72 = 1 − ETR → ETR = 28%.",
      hints: ["Tax Burden = NI ÷ EBT = 1 − tax rate.", "0.72 = 1 − tax rate.", "Tax rate = 1 − 0.72 = 0.28 = 28%.", "Higher Tax Burden = lower effective tax."],
      orderIndex: 0,
      options: [
        { optionText: "28% — the company retains 72% of pre-tax income after tax", isCorrect: true, orderIndex: 0 },
        { optionText: "72% — the company pays 72% of pre-tax income as tax", isCorrect: false, orderIndex: 1 },
        { optionText: "72% of revenue becomes pre-tax income", isCorrect: false, orderIndex: 2 },
        { optionText: "EBIT equals 72% of EBT", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText: "A firm issues new long-term debt and uses proceeds for a share buyback. Which two 5-factor components change immediately?",
      explanation: "More debt → higher interest expense → EBT falls → Interest Burden (EBT ÷ EBIT) falls. Fewer shares → lower equity → Equity Multiplier (Assets ÷ Equity) rises. Operating Margin, Asset Turnover, and Tax Burden are unaffected.",
      hints: ["Which factor contains interest?", "Interest Burden = EBT ÷ EBIT: more interest → lower EBT.", "Buyback reduces equity → EM rises.", "Interest Burden falls; Equity Multiplier rises."],
      orderIndex: 1,
      options: [
        { optionText: "Interest Burden (falls) and Equity Multiplier (rises)", isCorrect: true, orderIndex: 0 },
        { optionText: "Operating Margin (falls) and Tax Burden (rises)", isCorrect: false, orderIndex: 1 },
        { optionText: "Asset Turnover (rises) and Operating Margin (rises)", isCorrect: false, orderIndex: 2 },
        { optionText: "Tax Burden (falls) and Asset Turnover (falls)", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText: "Interest Burden is closest to 1.0 when:",
      explanation: "Interest Burden = EBT ÷ EBIT. If interest expense is near zero (debt-free firm), EBT ≈ EBIT and the ratio approaches 1.0.",
      hints: ["IB = EBT ÷ EBIT.", "If interest = 0, EBT = EBIT → IB = 1.0.", "A debt-free company has IB exactly 1.0.", "Higher debt → more interest → lower IB."],
      orderIndex: 2,
      options: [
        { optionText: "The company has minimal or no debt and negligible interest expense", isCorrect: true, orderIndex: 0 },
        { optionText: "The company is heavily leveraged with high interest payments", isCorrect: false, orderIndex: 1 },
        { optionText: "Operating Margin is at its maximum", isCorrect: false, orderIndex: 2 },
        { optionText: "The effective tax rate is near zero", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText: "A company negotiates a lower effective tax rate from 30% to 20%. All else equal, which single 5-factor component improves?",
      explanation: "A lower tax rate means more EBT is retained as NI. Tax Burden = NI ÷ EBT rises from 0.70 to 0.80. None of the other four factors involves the tax rate.",
      hints: ["Which factor = NI ÷ EBT?", "Tax Burden = 1 − effective tax rate.", "Lower tax → higher NI for same EBT → Tax Burden rises.", "Only Tax Burden changes."],
      orderIndex: 3,
      options: [
        { optionText: "Tax Burden", isCorrect: true, orderIndex: 0 },
        { optionText: "Interest Burden", isCorrect: false, orderIndex: 1 },
        { optionText: "Operating Margin", isCorrect: false, orderIndex: 2 },
        { optionText: "Equity Multiplier", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText: "A software company and a supermarket both have 20% ROE. The software firm has 30% Operating Margin; the supermarket has 2%. Which factor compensates for the supermarket's thin margin?",
      explanation: "The supermarket compensates with extremely high Asset Turnover — it cycles through large sales volumes on a relatively lean asset base. Low margin × very high turnover can match high margin × low turnover.",
      hints: ["ROE = Tax Burden × IB × Operating Margin × AT × EM.", "Supermarket: thin margin but enormous volume relative to assets.", "AT = Revenue ÷ Total Assets.", "High Asset Turnover compensates for thin Operating Margin."],
      orderIndex: 4,
      options: [
        { optionText: "Asset Turnover — supermarkets generate high revenue relative to their asset base", isCorrect: true, orderIndex: 0 },
        { optionText: "Tax Burden — supermarkets pay very low effective tax rates", isCorrect: false, orderIndex: 1 },
        { optionText: "Interest Burden — supermarkets carry no debt", isCorrect: false, orderIndex: 2 },
        { optionText: "Equity Multiplier — supermarkets use virtually no leverage", isCorrect: false, orderIndex: 3 },
      ],
    },
  ],
};

const ext_mcq_dupont_hard: ExtMcqDef = {
  title: "DuPont Analysis — ROCE, Value Creation & Advanced Diagnostics",
  instructions: "Advanced questions on ROCE, the ROCE vs WACC test, and cross-company return analysis.",
  context: "ROCE = EBIT ÷ Capital Employed. Capital Employed = Total Assets − Current Liabilities. The central value-creation test: ROCE > WACC creates value; ROCE < WACC destroys it regardless of growth. ROCE and ROE tell different stories — ROCE is capital-structure neutral; ROE rewards leverage.",
  questions: [
    {
      questionText: "Capital Employed = ?",
      explanation: "Capital Employed = Total Assets − Current Liabilities. It represents the long-term funding base: equity plus long-term debt. Subtracting current liabilities removes the short-term trade-financed portion of assets.",
      hints: ["CE excludes short-term creditor funding.", "Short-term funding = current liabilities.", "CE = Total Assets − Current Liabilities.", "CE also equals Long-term Debt + Equity."],
      orderIndex: 0,
      options: [
        { optionText: "Total Assets − Current Liabilities", isCorrect: true, orderIndex: 0 },
        { optionText: "Equity + Short-term Debt", isCorrect: false, orderIndex: 1 },
        { optionText: "Total Assets − Total Debt", isCorrect: false, orderIndex: 2 },
        { optionText: "Fixed Assets + Cash", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText: "Company A: ROCE 9%, WACC 12%. Company B: ROCE 16%, WACC 11%. Which is creating value?",
      explanation: "Value is created only when ROCE > WACC. Company A (9% < 12%) destroys value on each invested rupee. Company B (16% > 11%) creates value. Growth at Company A only accelerates destruction.",
      hints: ["ROCE > WACC = value creation.", "ROCE < WACC = value destruction.", "Company A: 9% < 12% → destroys value.", "Company B: 16% > 11% → creates value."],
      orderIndex: 1,
      options: [
        { optionText: "Company B creates value; Company A destroys it", isCorrect: true, orderIndex: 0 },
        { optionText: "Company A creates value; Company B destroys it", isCorrect: false, orderIndex: 1 },
        { optionText: "Both create value since ROCE is positive", isCorrect: false, orderIndex: 2 },
        { optionText: "Neither — ROCE always equals WACC at equilibrium", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText: "A company sells a non-core property for cash at book value. What happens to ROCE?",
      explanation: "The asset sale removes PP&E from Total Assets, reducing Capital Employed. EBIT is unchanged (non-operating asset). ROCE = EBIT ÷ CE rises because the denominator shrinks.",
      hints: ["ROCE = EBIT ÷ Capital Employed.", "Selling an asset reduces Total Assets → lower CE.", "EBIT unchanged — the property was non-operating.", "Smaller denominator → ROCE rises."],
      orderIndex: 2,
      options: [
        { optionText: "ROCE rises — Capital Employed shrinks while EBIT stays the same", isCorrect: true, orderIndex: 0 },
        { optionText: "ROCE falls — the asset sale removes productive capacity", isCorrect: false, orderIndex: 1 },
        { optionText: "ROCE is unchanged — numerator and denominator adjust proportionally", isCorrect: false, orderIndex: 2 },
        { optionText: "ROCE falls — cash is a lower-return asset than PP&E", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText: "Levered firm: ROE 22%, ROCE 10%. Ungeared peer: ROE 11%, ROCE 10%. What does the comparison reveal?",
      explanation: "Identical ROCE means identical operational performance. The levered firm's higher ROE is entirely explained by debt amplifying returns to equity holders — not by superior operations. The Equity Multiplier captures this.",
      hints: ["ROCE strips out capital structure.", "Same ROCE = same operational efficiency.", "Higher ROE for levered firm = leverage amplification.", "The Equity Multiplier bridges the gap."],
      orderIndex: 3,
      options: [
        { optionText: "Both firms have identical operations; the levered firm's higher ROE is purely a leverage effect", isCorrect: true, orderIndex: 0 },
        { optionText: "The levered firm is operationally superior because ROE is double", isCorrect: false, orderIndex: 1 },
        { optionText: "The ungeared firm is in a declining sector since ROE is half", isCorrect: false, orderIndex: 2 },
        { optionText: "The comparison is invalid — ROCE and ROE cannot be compared directly", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      questionText: "Capital-intensive industries (steel, utilities) have structurally lower ROCE than asset-light businesses (software, consulting). Why?",
      explanation: "ROCE = EBIT ÷ Capital Employed. Steel and utilities hold massive PP&E, making CE very large relative to EBIT. Asset-light firms deliver high EBIT from a tiny capital base. Same EBIT divided by a far larger denominator produces lower ROCE — a structural fact, not a management failure.",
      hints: ["ROCE = EBIT ÷ CE.", "Steel, utilities: huge PP&E → very large CE.", "Software: minimal fixed assets → small CE.", "Large denominator → lower ROCE, structurally."],
      orderIndex: 4,
      options: [
        { optionText: "Large PP&E makes Capital Employed high relative to EBIT, mathematically compressing ROCE", isCorrect: true, orderIndex: 0 },
        { optionText: "Capital-intensive firms have weaker pricing power and hence lower EBIT margins", isCorrect: false, orderIndex: 1 },
        { optionText: "Asset-light firms pay less tax, inflating their EBIT numerator", isCorrect: false, orderIndex: 2 },
        { optionText: "Regulation forces capital-intensive firms to hold more current liabilities", isCorrect: false, orderIndex: 3 },
      ],
    },
  ],
};

const ext_quantus_dupont_easy: ExtQuantusDef = {
  title: "3-Factor DuPont Calculation",
  instructions: "Calculate the three DuPont components and verify ROE. Enter formulas in the yellow editable cells. Values in $m.",
  context: "Given: Net Income $120m, Revenue $2,400m, Total Assets $1,800m, Equity $900m. Apply the 3-factor DuPont: ROE = Net Profit Margin × Asset Turnover × Equity Multiplier.",
  columnGroups: [
    { label: "Input Data", colStart: 1, colEnd: 1, bgColor: "#f0f0f0", textColor: "#555555", orderIndex: 0 },
    { label: "DuPont Result", colStart: 2, colEnd: 2, bgColor: "#e8e8ff", textColor: "#1a1a8a", orderIndex: 1 },
  ],
  columns: [
    { label: "Line Item", colIndex: 0, widthPx: 240 },
    { label: "Value ($m)", colIndex: 1, widthPx: 110 },
    { label: "Formula / Result", colIndex: 2, widthPx: 160 },
  ],
  cells: [
    { rowIndex: 0, colIndex: 0, cellType: "header", displayValue: "INPUT DATA", isEditable: false },
    { rowIndex: 1, colIndex: 0, cellType: "prefilled", displayValue: "Net Income", isEditable: false },
    { rowIndex: 1, colIndex: 1, cellType: "prefilled", displayValue: "120", isEditable: false },
    { rowIndex: 2, colIndex: 0, cellType: "prefilled", displayValue: "Revenue", isEditable: false },
    { rowIndex: 2, colIndex: 1, cellType: "prefilled", displayValue: "2400", isEditable: false },
    { rowIndex: 3, colIndex: 0, cellType: "prefilled", displayValue: "Total Assets", isEditable: false },
    { rowIndex: 3, colIndex: 1, cellType: "prefilled", displayValue: "1800", isEditable: false },
    { rowIndex: 4, colIndex: 0, cellType: "prefilled", displayValue: "Equity", isEditable: false },
    { rowIndex: 4, colIndex: 1, cellType: "prefilled", displayValue: "900", isEditable: false },
    { rowIndex: 5, colIndex: 0, cellType: "header", displayValue: "DUPONT COMPONENTS", isEditable: false },
    { rowIndex: 6, colIndex: 0, cellType: "prefilled", displayValue: "Net Profit Margin (NI ÷ Rev)", isEditable: false },
    { rowIndex: 6, colIndex: 2, cellType: "editable", expectedValue: "5.0", formula: "=B1/B2*100", formatType: "percent", isEditable: true, tolerancePct: 1, hintText: "Net Income ÷ Revenue × 100" },
    { rowIndex: 7, colIndex: 0, cellType: "prefilled", displayValue: "Asset Turnover (Rev ÷ Assets)", isEditable: false },
    { rowIndex: 7, colIndex: 2, cellType: "editable", expectedValue: "1.33", formula: "=B2/B3", formatType: "number", isEditable: true, tolerancePct: 2, hintText: "Revenue ÷ Total Assets" },
    { rowIndex: 8, colIndex: 0, cellType: "prefilled", displayValue: "Equity Multiplier (Assets ÷ Equity)", isEditable: false },
    { rowIndex: 8, colIndex: 2, cellType: "editable", expectedValue: "2.0", formula: "=B3/B4", formatType: "number", isEditable: true, tolerancePct: 1, hintText: "Total Assets ÷ Equity" },
    { rowIndex: 9, colIndex: 0, cellType: "header", displayValue: "ROE — DuPont Cross-Check (NI ÷ Equity)", isEditable: false },
    { rowIndex: 9, colIndex: 2, cellType: "formula", expectedValue: "13.3", formula: "=B1/B4*100", formatType: "percent", isEditable: false },
  ],
};

const ext_quantus_dupont_medium: ExtQuantusDef = {
  title: "5-Factor DuPont — Two Companies, Same ROE",
  instructions: "Compute all five DuPont factors for both companies. Notice how two businesses arrive at identical ROE through completely different operational and financial profiles. Enter ratios in the yellow editable cells (Operating Margin as a %, others as plain ratios).",
  context: "Company A (High-Margin): NI $300m, EBT $360m, EBIT $400m, Revenue $2,000m, Total Assets $3,000m, Equity $1,500m. Company B (Asset-Light): NI $80m, EBT $100m, EBIT $110m, Revenue $4,000m, Total Assets $800m, Equity $400m. Both target 20% ROE via different paths.",
  columnGroups: [
    { label: "Company A — High Margin", colStart: 1, colEnd: 1, bgColor: "#e8f5e8", textColor: "#1a5c1a", orderIndex: 0 },
    { label: "Company B — Asset-Light", colStart: 2, colEnd: 2, bgColor: "#fff0e8", textColor: "#7a3300", orderIndex: 1 },
  ],
  columns: [
    { label: "DuPont Factor", colIndex: 0, widthPx: 260 },
    { label: "Company A", colIndex: 1, widthPx: 130 },
    { label: "Company B", colIndex: 2, widthPx: 130 },
  ],
  cells: [
    { rowIndex: 0, colIndex: 0, cellType: "header", displayValue: "INPUT: Net Income ($m)", isEditable: false },
    { rowIndex: 0, colIndex: 1, cellType: "prefilled", displayValue: "300", isEditable: false },
    { rowIndex: 0, colIndex: 2, cellType: "prefilled", displayValue: "80", isEditable: false },
    { rowIndex: 1, colIndex: 0, cellType: "prefilled", displayValue: "EBT ($m)", isEditable: false },
    { rowIndex: 1, colIndex: 1, cellType: "prefilled", displayValue: "360", isEditable: false },
    { rowIndex: 1, colIndex: 2, cellType: "prefilled", displayValue: "100", isEditable: false },
    { rowIndex: 2, colIndex: 0, cellType: "prefilled", displayValue: "EBIT ($m)", isEditable: false },
    { rowIndex: 2, colIndex: 1, cellType: "prefilled", displayValue: "400", isEditable: false },
    { rowIndex: 2, colIndex: 2, cellType: "prefilled", displayValue: "110", isEditable: false },
    { rowIndex: 3, colIndex: 0, cellType: "prefilled", displayValue: "Revenue ($m)", isEditable: false },
    { rowIndex: 3, colIndex: 1, cellType: "prefilled", displayValue: "2000", isEditable: false },
    { rowIndex: 3, colIndex: 2, cellType: "prefilled", displayValue: "4000", isEditable: false },
    { rowIndex: 4, colIndex: 0, cellType: "prefilled", displayValue: "Total Assets ($m)", isEditable: false },
    { rowIndex: 4, colIndex: 1, cellType: "prefilled", displayValue: "3000", isEditable: false },
    { rowIndex: 4, colIndex: 2, cellType: "prefilled", displayValue: "800", isEditable: false },
    { rowIndex: 5, colIndex: 0, cellType: "prefilled", displayValue: "Equity ($m)", isEditable: false },
    { rowIndex: 5, colIndex: 1, cellType: "prefilled", displayValue: "1500", isEditable: false },
    { rowIndex: 5, colIndex: 2, cellType: "prefilled", displayValue: "400", isEditable: false },
    { rowIndex: 6, colIndex: 0, cellType: "header", displayValue: "5-FACTOR DUPONT", isEditable: false },
    { rowIndex: 7, colIndex: 0, cellType: "prefilled", displayValue: "Tax Burden (NI ÷ EBT)", isEditable: false },
    { rowIndex: 7, colIndex: 1, cellType: "editable", expectedValue: "0.833", formula: "=B0/B1", formatType: "number", isEditable: true, tolerancePct: 2, hintText: "Net Income ÷ EBT" },
    { rowIndex: 7, colIndex: 2, cellType: "editable", expectedValue: "0.800", formula: "=C0/C1", formatType: "number", isEditable: true, tolerancePct: 2, hintText: "Net Income ÷ EBT" },
    { rowIndex: 8, colIndex: 0, cellType: "prefilled", displayValue: "Interest Burden (EBT ÷ EBIT)", isEditable: false },
    { rowIndex: 8, colIndex: 1, cellType: "editable", expectedValue: "0.900", formula: "=B1/B2", formatType: "number", isEditable: true, tolerancePct: 1, hintText: "EBT ÷ EBIT" },
    { rowIndex: 8, colIndex: 2, cellType: "editable", expectedValue: "0.909", formula: "=C1/C2", formatType: "number", isEditable: true, tolerancePct: 2, hintText: "EBT ÷ EBIT" },
    { rowIndex: 9, colIndex: 0, cellType: "prefilled", displayValue: "Operating Margin — % (EBIT ÷ Rev)", isEditable: false },
    { rowIndex: 9, colIndex: 1, cellType: "editable", expectedValue: "20.0", formula: "=B2/B3*100", formatType: "percent", isEditable: true, tolerancePct: 1, hintText: "EBIT ÷ Revenue × 100" },
    { rowIndex: 9, colIndex: 2, cellType: "editable", expectedValue: "2.75", formula: "=C2/C3*100", formatType: "percent", isEditable: true, tolerancePct: 2, hintText: "EBIT ÷ Revenue × 100" },
    { rowIndex: 10, colIndex: 0, cellType: "prefilled", displayValue: "Asset Turnover (Rev ÷ Assets)", isEditable: false },
    { rowIndex: 10, colIndex: 1, cellType: "editable", expectedValue: "0.667", formula: "=B3/B4", formatType: "number", isEditable: true, tolerancePct: 2, hintText: "Revenue ÷ Total Assets" },
    { rowIndex: 10, colIndex: 2, cellType: "editable", expectedValue: "5.0", formula: "=C3/C4", formatType: "number", isEditable: true, tolerancePct: 1, hintText: "Revenue ÷ Total Assets" },
    { rowIndex: 11, colIndex: 0, cellType: "prefilled", displayValue: "Equity Multiplier (Assets ÷ Equity)", isEditable: false },
    { rowIndex: 11, colIndex: 1, cellType: "editable", expectedValue: "2.0", formula: "=B4/B5", formatType: "number", isEditable: true, tolerancePct: 1, hintText: "Total Assets ÷ Equity" },
    { rowIndex: 11, colIndex: 2, cellType: "editable", expectedValue: "2.0", formula: "=C4/C5", formatType: "number", isEditable: true, tolerancePct: 1, hintText: "Total Assets ÷ Equity" },
    { rowIndex: 12, colIndex: 0, cellType: "header", displayValue: "ROE — Direct Check (NI ÷ Equity)", isEditable: false },
    { rowIndex: 12, colIndex: 1, cellType: "formula", expectedValue: "20.0", formula: "=B0/B5*100", formatType: "percent", isEditable: false },
    { rowIndex: 12, colIndex: 2, cellType: "formula", expectedValue: "20.0", formula: "=C0/C5*100", formatType: "percent", isEditable: false },
  ],
};

const ext_quantus_dupont_hard: ExtQuantusDef = {
  title: "ROCE Trend Analysis — 3-Year Bridge",
  instructions: "Calculate Capital Employed and ROCE for each year, then measure the improvement over the period. Enter formulas in the yellow editable cells.",
  context: "A manufacturing company's financials over three years: EBIT grows from $180m to $252m while total assets and current liabilities also change. Track whether ROCE improves or deteriorates and by how many percentage points.",
  columnGroups: [
    { label: "FY2021", colStart: 1, colEnd: 1, bgColor: "#f0f0f0", textColor: "#555555", orderIndex: 0 },
    { label: "FY2022", colStart: 2, colEnd: 2, bgColor: "#f0f0f0", textColor: "#555555", orderIndex: 1 },
    { label: "FY2023", colStart: 3, colEnd: 3, bgColor: "#fffbe6", textColor: "#8a6a00", orderIndex: 2 },
    { label: "3-Year Change", colStart: 4, colEnd: 4, bgColor: "#e8f5e8", textColor: "#1a5c1a", orderIndex: 3 },
  ],
  columns: [
    { label: "Metric", colIndex: 0, widthPx: 240 },
    { label: "FY2021 ($m)", colIndex: 1, widthPx: 110 },
    { label: "FY2022 ($m)", colIndex: 2, widthPx: 110 },
    { label: "FY2023 ($m)", colIndex: 3, widthPx: 110 },
    { label: "Change (pp)", colIndex: 4, widthPx: 110 },
  ],
  cells: [
    { rowIndex: 0, colIndex: 0, cellType: "prefilled", displayValue: "EBIT", isEditable: false },
    { rowIndex: 0, colIndex: 1, cellType: "prefilled", displayValue: "180", isEditable: false },
    { rowIndex: 0, colIndex: 2, cellType: "prefilled", displayValue: "210", isEditable: false },
    { rowIndex: 0, colIndex: 3, cellType: "prefilled", displayValue: "252", isEditable: false },
    { rowIndex: 1, colIndex: 0, cellType: "prefilled", displayValue: "Total Assets", isEditable: false },
    { rowIndex: 1, colIndex: 1, cellType: "prefilled", displayValue: "2400", isEditable: false },
    { rowIndex: 1, colIndex: 2, cellType: "prefilled", displayValue: "2520", isEditable: false },
    { rowIndex: 1, colIndex: 3, cellType: "prefilled", displayValue: "2600", isEditable: false },
    { rowIndex: 2, colIndex: 0, cellType: "prefilled", displayValue: "Current Liabilities", isEditable: false },
    { rowIndex: 2, colIndex: 1, cellType: "prefilled", displayValue: "600", isEditable: false },
    { rowIndex: 2, colIndex: 2, cellType: "prefilled", displayValue: "630", isEditable: false },
    { rowIndex: 2, colIndex: 3, cellType: "prefilled", displayValue: "700", isEditable: false },
    { rowIndex: 3, colIndex: 0, cellType: "header", displayValue: "Capital Employed (TA − CL)", isEditable: false },
    { rowIndex: 3, colIndex: 1, cellType: "editable", expectedValue: "1800", formula: "=B1-B2", formatType: "number", isEditable: true, tolerancePct: 0, hintText: "Total Assets − Current Liabilities" },
    { rowIndex: 3, colIndex: 2, cellType: "editable", expectedValue: "1890", formula: "=C1-C2", formatType: "number", isEditable: true, tolerancePct: 0, hintText: "Total Assets − Current Liabilities" },
    { rowIndex: 3, colIndex: 3, cellType: "editable", expectedValue: "1900", formula: "=D1-D2", formatType: "number", isEditable: true, tolerancePct: 0, hintText: "Total Assets − Current Liabilities" },
    { rowIndex: 4, colIndex: 0, cellType: "header", displayValue: "ROCE (%)", isEditable: false },
    { rowIndex: 4, colIndex: 1, cellType: "editable", expectedValue: "10.0", formula: "=B0/B3*100", formatType: "percent", isEditable: true, tolerancePct: 1, hintText: "EBIT ÷ Capital Employed × 100" },
    { rowIndex: 4, colIndex: 2, cellType: "editable", expectedValue: "11.1", formula: "=C0/C3*100", formatType: "percent", isEditable: true, tolerancePct: 1, hintText: "EBIT ÷ Capital Employed × 100" },
    { rowIndex: 4, colIndex: 3, cellType: "editable", expectedValue: "13.3", formula: "=D0/D3*100", formatType: "percent", isEditable: true, tolerancePct: 1, hintText: "EBIT ÷ Capital Employed × 100" },
    { rowIndex: 4, colIndex: 4, cellType: "editable", expectedValue: "3.3", formula: "=D4-B4", formatType: "number", isEditable: true, tolerancePct: 5, hintText: "FY2023 ROCE − FY2021 ROCE (percentage points)" },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN LEARNING TREE SEED
// ═══════════════════════════════════════════════════════════════════════════

async function seedLearningTree(professions: Record<string, { id: string; slug: string }>) {
  const lessonIndex: Record<string, { id: string; name: string; difficulty: Difficulty; activityType: ActivityType; activityId: string }> = {};
  const subtopicTags: { subtopicId: string; professionSlugs: string[] }[] = [];

  for (let mi = 0; mi < MODULES.length; mi++) {
    const m = MODULES[mi];
    const moduleRow = await prisma.module.create({
      data: { slug: m.slug, name: m.name, description: m.description, accentColor: m.accent, iconKey: m.icon, orderIndex: mi },
    });

    for (let ti = 0; ti < m.topics.length; ti++) {
      const t = m.topics[ti];
      const topicRow = await prisma.topic.create({
        data: {
          moduleId: moduleRow.id, name: t.name, subtitle: t.subtitle, description: t.description,
          orderIndex: ti, type: "topic",
        },
      });

      for (let si = 0; si < t.subtopics.length; si++) {
        const s = t.subtopics[si];
        const subtopicRow = await prisma.subtopic.create({
          data: { topicId: topicRow.id, name: s.name, description: s.description, orderIndex: si, type: "topic" },
        });
        if (s.professionSlugs?.length) subtopicTags.push({ subtopicId: subtopicRow.id, professionSlugs: s.professionSlugs });

        for (let li = 0; li < s.lessons.length; li++) {
          const l = s.lessons[li];
          const lessonRow = await prisma.lesson.create({
            data: {
              subtopicId: subtopicRow.id, name: l.name, description: l.description,
              difficulty: l.difficulty, orderIndex: li, estimatedMins: l.estMins,
            },
          });

          await prisma.lessonActivity.create({
            data: { lessonId: lessonRow.id, activityType: l.activity.kind, orderIndex: 0 },
          });

          const act = await createActivity(lessonRow.id, l.activity);
          await seedHints(lessonRow.id, l.activity, l.hints);

          lessonIndex[`${m.slug}/${ti}/${si}/${l.difficulty}`] = {
            id: lessonRow.id, name: l.name, difficulty: l.difficulty, activityType: l.activity.kind, activityId: act.id,
          };
        }
      }
    }
  }

  // SubtopicProfessionTags — using composite @@id, so create not upsert
  for (const tag of subtopicTags) {
    for (const slug of tag.professionSlugs) {
      const prof = professions[slug];
      if (prof) {
        await prisma.subtopicProfessionTag.create({
          data: { subtopicId: tag.subtopicId, professionId: prof.id },
        });
      }
    }
  }

  // Add extra MCQ + Quantus activities from the second seed file
  await seedExtraActivities(lessonIndex);

  return lessonIndex;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXTRA ACTIVITIES SEED (additional MCQ + Quantus per lesson)
// ═══════════════════════════════════════════════════════════════════════════

async function seedExtraActivities(
  lessonIndex: Record<string, { id: string; name: string; difficulty: Difficulty; activityType: ActivityType }>
) {
  console.log("  Adding extra MCQ + Quantus activities...");

  function lid(key: string) {
    const l = lessonIndex[key];
    if (!l) throw new Error(`lessonIndex key not found: ${key}`);
    return l.id;
  }

  // Income Statement lessons — add extra MCQ sets
  await upsertExtMcq(lid("finance/0/0/easy"), ext_mcq_fs_easy); console.log("    ✓ fs/easy extra MCQ");
  await upsertExtMcq(lid("finance/0/0/medium"), ext_mcq_fs_medium); console.log("    ✓ fs/medium extra MCQ");
  await upsertExtMcq(lid("finance/0/0/hard"), ext_mcq_fs_hard); console.log("    ✓ fs/hard extra MCQ");
  await upsertExtQuantus(lid("finance/0/0/hard"), ext_quantus_fs_hard); console.log("    ✓ fs/hard extra Quantus (P&L model)");

  // DuPont subtopic (finance/0/3/*)
  await upsertExtMcq(lid("finance/0/3/easy"),   ext_mcq_dupont_easy);     console.log("    ✓ dupont/easy extra MCQ");
  await upsertExtQuantus(lid("finance/0/3/easy"),   ext_quantus_dupont_easy); console.log("    ✓ dupont/easy extra Quantus");
  await upsertExtMcq(lid("finance/0/3/medium"), ext_mcq_dupont_medium);   console.log("    ✓ dupont/medium extra MCQ");
  await upsertExtQuantus(lid("finance/0/3/medium"), ext_quantus_dupont_medium); console.log("    ✓ dupont/medium extra Quantus");
  await upsertExtMcq(lid("finance/0/3/hard"),   ext_mcq_dupont_hard);     console.log("    ✓ dupont/hard extra MCQ");
  await upsertExtQuantus(lid("finance/0/3/hard"),   ext_quantus_dupont_hard); console.log("    ✓ dupont/hard extra Quantus");

  console.log("  ✅ Extra activities complete");
}

// ═══════════════════════════════════════════════════════════════════════════
// CASE SIMULATIONS
// ═══════════════════════════════════════════════════════════════════════════

async function seedCaseSimulations() {
  console.log("  Seeding case simulations...");

  // ── CASE 1: Zomato UAE Market Entry (Strategy — medium) ──────────────────
  const zomato = await prisma.caseSimulation.create({
    data: {
      title: "Zomato's UAE Market Entry",
      description: "Evaluate Zomato's strategic options to enter the UAE food delivery market, dominated by Talabat (60% share) and Deliveroo. Analyse competitive forces, regulatory constraints and unit economics to recommend the optimal entry strategy.",
      difficulty: "medium",
      isPublished: true,
      orderIndex: 0,
    },
  });

  await prisma.caseStudy.createMany({
    data: [
      {
        caseSimulationId: zomato.id,
        title: "Zomato's India Playbook & Business Model",
        orderIndex: 0,
        content: `Zomato Limited is an Indian multinational food-service marketplace founded in 2008. By 2022, it was operating in 850 cities in India, with a Gross Order Value (GOV) run-rate of ~$3.0 billion annualised and ~80 million monthly active users.

BUSINESS MODEL (India)
Zomato's core India model operates on a three-sided marketplace:

1. RESTAURANTS: ~350,000 restaurant partners listed. Zomato charges a commission of 18–25% on delivery orders. Restaurants also pay for "Gold" visibility and sponsored listing packages. Many restaurants rely on Zomato for 30–60% of their delivery revenue.

2. DELIVERY FLEET: ~200,000 active delivery partners (gig economy workers) in India. Average 4–6 deliveries per hour during peak, ~₹15–25 per delivery payment. Zomato does not classify these as employees (platform economy structure), reducing fixed labour costs.

3. CONSUMERS: Core cohort is 25–40 year urban professionals. Average Order Value (AOV) in India: ~₹320 ($4). Consumer subsidies (discounts, free delivery coupons) remain a significant operating cost.

UNIT ECONOMICS (FY2023 — India food delivery)
GOV:                      ₹28,600 Crore (~$3.5bn)
Revenue (take rate ~20%): ₹5,720 Crore
Contribution Margin:       ~4.5% of GOV
Adjusted EBITDA:           ~₹250 Crore (positive for first time, Q4 FY2023)

GROWTH DRIVERS IN INDIA
• Tier 2/3 city expansion: Penetrating 300+ cities beyond the top 8 metro markets
• Hyperpure (B2B ingredient supply to restaurants): ₹2,600 Crore GOV, growing 80% YoY
• Blinkit (10-minute grocery delivery): Strategic acquisition for ₹4,447 Crore (2022)

TRANSFERABLE ADVANTAGES
(a) Deep logistics technology and demand prediction algorithms built on 500M+ Indian orders
(b) Restaurant relationship management playbook and onboarding infrastructure
(c) Hyperpure B2B supply chain platform — adaptable to new geographies`,
      },
      {
        caseSimulationId: zomato.id,
        title: "UAE Market Landscape & Competitive Dynamics",
        orderIndex: 1,
        content: `The UAE food delivery market was estimated at $1.8–2.2 billion in GMV (2022), growing at ~18% CAGR. Dubai and Abu Dhabi collectively account for ~85% of market GMV.

COMPETITIVE LANDSCAPE (2022)

TALABAT (Delivery Hero): Dominant market leader. ~60–65% market share in UAE. Pan-GCC presence across 9 markets. Deep restaurant exclusivity arrangements. Charges restaurants 20–27% commission.

DELIVEROO: UK-based. ~20–25% UAE market share. Premium positioning — focused on upscale restaurants. Higher AOVs (~AED 95 vs. Talabat's ~AED 78). Strong with European expat segments.

CAREEM (Uber subsidiary): Multi-service super-app (rides, food, grocery). Food delivery ~8–10% share. Unique: existing customer relationship through ride-hailing.

STRUCTURAL CONSTRAINTS FOR A NEW ENTRANT
• Top-2 players control ~85% share — entrenched positions, restaurant exclusivity as a moat
• UAE's kafala (sponsorship) system: Delivery riders must be under sponsored employment visas. This converts variable gig costs into fixed employment obligations (AED 3,500–4,500/month per rider including salary + accommodation + visa). India's per-rider cost is ~AED 800 equivalent
• Consumer expectations: Average delivery time expectation is 25–30 minutes (vs. 40–45 in India tier 1)
• Payment gateway fees: ~2.5% vs. ~0.9% UPI in India
• UAE Average Order Value: ~AED 78 (~$21) vs. India ~₹320 (~$4) — higher absolute commission, but operating costs are proportionally higher

ENTRY OPTIONS
Option A — ORGANIC BUILD: Invest AED 500M+ over 3 years. Risk: high, timeline: slow, full control.
Option B — ACQUISITION: Acquire a mid-size UAE player (e.g., Noon Food). Faster market access, existing regulatory licenses. Integration challenges.
Option C — JV/PARTNERSHIP: White-label arrangement with UAE conglomerate. Lower risk, limited upside.`,
      },
      {
        caseSimulationId: zomato.id,
        title: "Regulatory Environment & Unit Economics Deep Dive",
        orderIndex: 2,
        content: `REGULATORY ENVIRONMENT
BUSINESS STRUCTURE: Foreign companies can operate in UAE through:
(a) Mainland LLC — requires UAE national partner OR full ownership in designated sectors post-2021 Foreign Ownership Law
(b) Free Zone Entity — 100% foreign ownership, but restricted to free zone geography
(c) Branch Office — extends the Indian entity, subject to 9% corporate tax (effective 2023)

DATA LOCALISATION: UAE's Federal Decree Law No. 45 of 2021 requires customer data of UAE residents to be stored on UAE servers. This affects Zomato's AWS-based India infrastructure — requiring either a UAE data centre or an approved cloud provider.

PAYMENT REGULATION: Zomato's wallet/UPI infrastructure used in India would require a fresh Payment Services License from the UAE Central Bank. Process: 9–18 months.

CULTURAL CONTEXT
• UAE's 89% expatriate population creates a diverse, segmented food market (South Asian 38%, Arab non-UAE 27%, European 10%, Filipino 10%)
• Halal certification mandatory for all food businesses
• Ramadan season: late-night delivery spikes 200–300% — requires pre-positioned rider capacity (3–4 month visa processing lead time)
• Arabic-language interface required for UAE national and Arab expat segments

UAE UNIT ECONOMICS (Estimated, Year 1)
Average Order Value (AOV):       AED 78.0  (~$21)
Take Rate (commission):          20%
Revenue per Order:               AED 15.6
Delivery Cost per Order:         AED 32.0  (fixed employment cost ÷ ~110 orders/day)
Payment Gateway Fee:             AED 2.0   (2.5% of AOV)
Customer Acquisition Cost:       AED 8.0   (amortised over 18-month LTV)
Marketing & Promotions:          AED 5.0   (per order, Year 1 growth phase)
Contribution Margin per Order:   AED (31.4) — negative in Year 1 (investment phase)

YEAR 3 TARGETS (assuming 25% market share, scale benefits)
Delivery Cost per Order:         AED 22.0  (higher rider density, more orders/hour)
Marketing per Order:             AED 2.5   (reduced promotions at scale)
Contribution Margin per Order:   AED (10.9) — still negative but narrowing rapidly`,
      },
    ],
  });

  // Zomato activities
  await prisma.caseActivity.create({
    data: {
      caseSimulationId: zomato.id,
      activityType: "canvas",
      orderIndex: 0,
      activityData: {
        title: "Porter's Five Forces — UAE Food Delivery",
        instructions: "Map the competitive intensity of the UAE food delivery market using Porter's Five Forces. Drag each force from the palette onto the canvas, then draw arrows connecting each force to the 'Industry Attractiveness' node in the centre. When all five connections are in place, click Check Answer.",
        context: "Apply Porter's Five Forces to Zomato's UAE market entry decision. Consider: buyer power (consumers switching between apps + restaurants' dependency on platforms), supplier power (delivery riders under kafala employment + brand restaurant exclusivity), competitive rivalry (Talabat 60% + Deliveroo 25%), threat of new entrants (high capital requirements + regulatory licenses), and threat of substitutes (dine-in, dark kitchens, corporate canteens).",
        scoringMode: "partial",
        paletteItems: [
          { id: "pf-buyer", label: "Buyer Power\n(Consumers & Restaurants)", shape: "rectangle", color: "#dbeafe" },
          { id: "pf-supplier", label: "Supplier Power\n(Riders & Restaurant Brands)", shape: "rectangle", color: "#dbeafe" },
          { id: "pf-rivalry", label: "Competitive Rivalry\n(Talabat, Deliveroo, Careem)", shape: "rectangle", color: "#ffe4e6" },
          { id: "pf-entry", label: "Threat of New Entrants\n(Capital + Licenses Required)", shape: "rectangle", color: "#f3e8ff" },
          { id: "pf-subs", label: "Threat of Substitutes\n(Dine-in, Dark Kitchens)", shape: "rectangle", color: "#f3e8ff" },
          { id: "pf-attract", label: "Industry Attractiveness", shape: "ellipse", color: "#fef3c7" },
        ],
        solutionSnapshot: {
          edges: [
            { sourceId: "pf-buyer", targetId: "pf-attract" },
            { sourceId: "pf-supplier", targetId: "pf-attract" },
            { sourceId: "pf-rivalry", targetId: "pf-attract" },
            { sourceId: "pf-entry", targetId: "pf-attract" },
            { sourceId: "pf-subs", targetId: "pf-attract" },
          ],
          nodePositions: [
            { id: "pf-buyer", x: 50, y: 50 },
            { id: "pf-supplier", x: 50, y: 200 },
            { id: "pf-rivalry", x: 50, y: 350 },
            { id: "pf-entry", x: 580, y: 50 },
            { id: "pf-subs", x: 580, y: 350 },
            { id: "pf-attract", x: 290, y: 200 },
          ],
        },
      },
    },
  });

  await prisma.caseActivity.create({
    data: {
      caseSimulationId: zomato.id,
      activityType: "mcq",
      orderIndex: 1,
      activityData: {
        instructions: "Answer all questions based on the case studies you have read. Each question has exactly one correct answer.",
        context: "UAE food delivery GMV: ~$2bn, growing 18% CAGR. Talabat: 60–65% share. Deliveroo: 20–25% share. UAE AOV: ~AED 78 (~$21). India AOV: ~₹320 (~$4). Delivery cost per order: UAE AED 32, India equivalent ~AED 5. Payment fees: UAE 2.5%, India 0.9%.",
        questions: [
          {
            id: "zom-q1",
            questionText: "What is Zomato's most defensible competitive advantage from India that UAE incumbents would find hardest to replicate quickly?",
            explanation: "Zomato's deep logistics technology — demand prediction algorithms, dynamic pricing, and restaurant supply chain tools (Hyperpure) — was built on 500M+ orders over 15 years. Restaurant commission rates and consumer discounts can be matched immediately by well-capitalised incumbents like Talabat; the underlying technology stack and B2B supply chain integration represent years of operational learning.",
            options: [
              { id: "zom-q1-a", optionText: "Ability to offer lower restaurant commissions (18% vs Talabat's 27%)", isCorrect: false },
              { id: "zom-q1-b", optionText: "Deep logistics technology and demand prediction algorithms built on 500M+ Indian orders", isCorrect: true },
              { id: "zom-q1-c", optionText: "Strong brand recognition among UAE's South Asian expat population", isCorrect: false },
              { id: "zom-q1-d", optionText: "Access to Blinkit's 10-minute quick-commerce capabilities", isCorrect: false },
            ],
          },
          {
            id: "zom-q2",
            questionText: "The UAE's kafala (sponsorship) system most directly impacts Zomato's unit economics by:",
            explanation: "In India, Zomato's delivery riders are gig workers — independent contractors paid per delivery. The kafala system requires UAE delivery riders to be under sponsored employment visas, making Zomato their legal employer with full obligations (salary AED 2,000 + accommodation AED 1,200 + visa fees). This converts a variable per-delivery cost into a largely fixed monthly employment cost, dramatically increasing cost per order at low delivery density.",
            options: [
              { id: "zom-q2-a", optionText: "Limiting the number of restaurants Zomato can onboard to licensed halal food businesses only", isCorrect: false },
              { id: "zom-q2-b", optionText: "Converting delivery labour from variable gig costs to fixed employment obligations, inflating cost per order", isCorrect: true },
              { id: "zom-q2-c", optionText: "Requiring Zomato to cede 51% of its UAE subsidiary to a UAE national partner", isCorrect: false },
              { id: "zom-q2-d", optionText: "Mandating Arabic-language customer interfaces and halal certification audits at significant cost", isCorrect: false },
            ],
          },
          {
            id: "zom-q3",
            questionText: "Among organic build, acquisition, and JV/partnership, which entry strategy best balances speed-to-market with strategic control for Zomato's UAE entry?",
            explanation: "Acquiring a mid-size UAE player (e.g., Noon Food) transfers existing Payment Service Licenses (critical given 9–18 month processing timelines), an existing restaurant network, and kafala-compliant rider workforce — compressing time to operational scale. Organic build gives full control but a 3+ year timeline burning cash against entrenched competitors. JV limits upside and creates governance friction.",
            options: [
              { id: "zom-q3-a", optionText: "Organic build — maintains brand purity and avoids integration risk", isCorrect: false },
              { id: "zom-q3-b", optionText: "Acquisition — transfers regulatory licenses, restaurant relationships, and compliant workforce rapidly", isCorrect: true },
              { id: "zom-q3-c", optionText: "JV/partnership — zero capital risk with a UAE conglomerate absorbing all regulatory complexity", isCorrect: false },
              { id: "zom-q3-d", optionText: "Franchise model — license the Zomato brand to a UAE operator with no equity commitment", isCorrect: false },
            ],
          },
          {
            id: "zom-q4",
            questionText: "Zomato's UAE AOV (~AED 78, $21) is roughly 5× its India AOV (~$4). Why does higher UAE AOV NOT automatically mean higher per-order profitability?",
            explanation: "Higher AOV generates higher absolute commission revenue (20% × AED 78 = AED 15.6 per order). But UAE delivery costs per order are AED 32 (kafala employment fixed costs) versus India's AED ~5 equivalent. Payment gateway fees are 2.5% vs 0.9%. Combined, the cost base per order is 6–7× higher than India's, completely offsetting the AOV advantage in the early years.",
            options: [
              { id: "zom-q4-a", optionText: "UAE imposes 9% corporate tax on profits, wiping out the AOV advantage net of tax", isCorrect: false },
              { id: "zom-q4-b", optionText: "UAE delivery costs per order (AED 32) are disproportionately higher than India, compressing margins despite 5× AOV", isCorrect: true },
              { id: "zom-q4-c", optionText: "UAE restaurants demand lower commission rates because orders are larger, reducing Zomato's take-rate", isCorrect: false },
              { id: "zom-q4-d", optionText: "UAE consumers tip less, increasing rider churn and replacement costs", isCorrect: false },
            ],
          },
        ],
      },
    },
  });

  await prisma.caseActivity.create({
    data: {
      caseSimulationId: zomato.id,
      activityType: "quantus",
      orderIndex: 2,
      activityData: {
        title: "Zomato UAE — Unit Economics Model",
        instructions: "Complete the unit economics model for Zomato's UAE market entry. Yellow cells are editable. Enter numbers as AED values (no currency symbols, decimals allowed). Work through from revenue per order down to contribution margin. Negative contributions should be entered as negative numbers.",
        context: "Zomato UAE Year 1 assumptions: Average Order Value (AOV) = AED 78.0, Commission Take Rate = 20%, Delivery Cost per Order = AED 32.0 (kafala employment), Payment Gateway Fee = 2.5% of AOV, Customer Acquisition Cost (amortised) = AED 8.0 per order, Marketing & Promotions = AED 5.0 per order. Targets for Year 3: Delivery Cost falls to AED 22.0 at scale, Marketing reduces to AED 2.5.",
        gridRows: 9,
        gridCols: 3,
        gridValues: {
          "0-0": "Metric", "0-1": "Year 1", "0-2": "Year 3 Target",
          "1-0": "Average Order Value (AOV)", "1-1": "78.0", "1-2": "82.0",
          "2-0": "Take Rate (Commission)", "2-1": "20%", "2-2": "21%",
          "3-0": "Revenue per Order (AED)", "3-2": "17.2",
          "4-0": "Delivery Cost per Order (AED)", "4-1": "32.0", "4-2": "22.0",
          "5-0": "Payment Gateway Fee (AED)", "5-2": "2.1",
          "6-0": "Customer Acquisition Cost (AED)", "6-1": "8.0", "6-2": "3.0",
          "7-0": "Marketing & Promotions (AED)", "7-1": "5.0", "7-2": "2.5",
          "8-0": "Contribution Margin per Order (AED)",
        },
        correctAnswers: {
          "3-1": "15.6",
          "5-1": "1.95",
          "8-1": "-31.35",
          "8-2": "-12.4",
        },
      },
    },
  });

  // ── CASE 2: Tata Steel Acquires Corus (Finance — hard) ────────────────────
  const tata = await prisma.caseSimulation.create({
    data: {
      title: "Tata Steel Acquires Corus — M&A Deep Dive",
      description: "Analyse the $12.1 billion acquisition of Corus Group by Tata Steel in 2007 — one of India's largest outbound M&A deals. Assess strategic rationale, valuation multiples, synergy assumptions, and the post-acquisition reality in a commodity downturn.",
      difficulty: "hard",
      isPublished: true,
      orderIndex: 1,
    },
  });

  await prisma.caseStudy.createMany({
    data: [
      {
        caseSimulationId: tata.id,
        title: "The Deal: Strategic Rationale & Bidding Process",
        orderIndex: 0,
        content: `In January 2007, Tata Steel completed the acquisition of Corus Group plc for approximately $12.1 billion, making it one of the largest overseas acquisitions by an Indian company at the time.

BACKGROUND
Corus Group was formed in 1999 through the merger of British Steel and Hoogovens (Netherlands). By 2006, Corus was the second-largest steelmaker in Europe with ~18 million tonnes annual capacity and revenues of approximately £9.2 billion.

Tata Steel was India's largest steel producer with ~5 million tonnes capacity and revenues of ~$4.4 billion. Highly profitable on a per-tonne basis due to low-cost Indian operations, but a fraction of the size of global players.

STRATEGIC RATIONALE (Three Drivers)
1. SCALE & GLOBAL REACH: Combined entity = world's fifth-largest steelmaker (~24 million tonnes). Enables participation in large-scale global tenders with multinationals like Jaguar Land Rover, Airbus, Ford.

2. PRODUCT MIX UPGRADE: Corus's Strip Products division had deep R&D in high-value automotive steels, aerospace alloys, specialty packaging — 2–3× the margin of commodity steel. Tata's Indian plants primarily produced commodity-grade flat steel.

3. RAW MATERIAL ARBITRAGE: Tata Steel's Indian operations had captive iron ore and coal mines (~$100–120/tonne raw material cost vs. Corus's ~$240–260/tonne). Routing semi-finished slabs from India to Corus's European finishing mills targeted $400–600M in annual savings.

THE BIDDING PROCESS
Brazilian steelmaker CSN launched a competing bid in November 2006, triggering a nine-round auction. Tata Steel's final winning bid of 608 pence per share represented a ~34% premium to Corus's undisturbed share price and an EV/EBITDA multiple of approximately 9.2× on trailing EBITDA — a significant premium to the sector average of 6–8×.`,
      },
      {
        caseSimulationId: tata.id,
        title: "Corus Valuation & The Hidden Pension Liability",
        orderIndex: 1,
        content: `INCOME STATEMENT SNAPSHOT (FY2006, £ millions)
Revenue:                 9,200
Raw Materials:          (5,060)   — 55% of revenue
Labour & Overheads:    (1,472)   — 16% of revenue
EBITDA:                 1,380    — 15% EBITDA margin
D&A:                     (480)
EBIT:                      900
Net Interest:             (220)
PBT:                       680
Tax (30%):                (204)
Net Profit:                476

BALANCE SHEET HIGHLIGHTS (FY2006, £ millions)
Total Assets:            8,400
Net Debt:                1,320   (Debt: 2,100 | Cash: 780)
Pension Deficit:         1,300   (the "hidden liability")
Equity:                  3,200

VALUATION AT BID PRICE
Equity Value:    £4.3bn  (708m shares × 608p)
Add: Net Debt:   £1.3bn
Add: Pension:    £1.3bn
Enterprise Value:£6.9bn  (~$13.5bn)
EV/EBITDA:       ~9.2× (including pension) | ~5.0× (excluding pension)

THE PENSION DEBATE
The £1.3bn pension deficit was an off-balance-sheet liability — not included in Corus's reported net debt. Analysts who evaluated the deal on EV/EBITDA using reported net debt only significantly underestimated true enterprise value. Post-acquisition, this liability constrained Tata Steel Europe's restructuring options and required direct UK government intervention in 2017.`,
      },
      {
        caseSimulationId: tata.id,
        title: "Post-Acquisition Reality: Commodity Cycle & Integration",
        orderIndex: 2,
        content: `THE 2008–2009 STRESS TEST
Within 18 months of closing, global steel demand collapsed:
• HRC (Hot Rolled Coil) spot prices fell from $1,100/tonne (mid-2008) to $380/tonne (early 2009) — a 65% decline
• Corus's UK operations were running at ~60% utilisation
• Tata Steel Group's net debt peaked at $10+ billion
• Blast furnaces temporarily shut at Llanwern and Teesside

This stress test revealed that the acquisition debt load was sustainable only in a benign commodity environment.

SYNERGY REALISATION (2007–2012)
Management targeted $400–600M/year in synergies by Year 5. Actual realisation was mixed:

COST SYNERGIES (partially achieved):
• Raw material procurement: Combined scale generated ~$80M/year
• Slab routing (India → Europe): Only ~0.5M tonnes/year by 2010 vs. 3M tonne target (blast furnace grade compatibility issues)
• Shared services: ~$50M/year achieved on schedule

REVENUE SYNERGIES (largely unrealised):
• Cross-selling Corus high-grade steel in Indian automotive: Limited by OEM preference for local supply
• Joint R&D: Strong — "Tata Steel Europe" became a leader in Docol® and Ympress® advanced steels

FINANCIAL OUTCOME BY 2015
Net synergies realised: ~$250–300M/year (vs. $500M target)
Total impairment charges on Corus assets: ~$3–4 billion (2012–2016)
Tata Steel Europe consistently loss-making post-2009; Indian operations cross-subsidising

KEY LESSONS
1. Cyclical industry acquisitions require conservative leverage — peak-cycle premiums are dangerous
2. "Slab arbitrage" synergies depend on operational compatibility that is hard to assess pre-close
3. Pension liabilities in mature industrial companies are larger and stickier than headline numbers suggest`,
      },
    ],
  });

  await prisma.caseActivity.create({
    data: {
      caseSimulationId: tata.id,
      activityType: "canvas",
      orderIndex: 0,
      activityData: {
        title: "Synergy Value Framework — Tata-Corus Deal",
        instructions: "Map how the four synergy drivers and one cost drag combine to determine the net synergy value, which in turn determines acquisition payback. Drag all six nodes from the palette onto the canvas. Draw arrows from each synergy source and integration cost into the 'Net Synergy Value' node, then connect 'Net Synergy Value' to 'Acquisition Payback Period'. When all connections are correct, click Check Answer.",
        context: "Tata Steel identified four value-creation levers: Revenue Synergies (cross-selling, new markets), Cost Synergies (procurement, logistics), Working Capital Savings (supply chain optimisation), and Tax Synergies (cross-border structure). These are offset by Integration Costs (severance, IT migration, management bandwidth). The net of these determines how quickly the premium paid is recovered.",
        scoringMode: "partial",
        paletteItems: [
          { id: "s-rev", label: "Revenue Synergies\n(Cross-sell, New Markets)", shape: "rectangle", color: "#d1fae5" },
          { id: "s-cost", label: "Cost Synergies\n(Procurement, Slab Routing)", shape: "rectangle", color: "#d1fae5" },
          { id: "s-wc", label: "Working Capital Savings\n(Supply Chain Optimisation)", shape: "rectangle", color: "#d1fae5" },
          { id: "s-int", label: "Integration Costs\n(Severance + IT + Management)", shape: "rectangle", color: "#ffe4e6" },
          { id: "s-net", label: "Net Synergy Value", shape: "ellipse", color: "#fef3c7" },
          { id: "s-pay", label: "Acquisition Payback Period", shape: "diamond", color: "#e0f2fe" },
        ],
        solutionSnapshot: {
          edges: [
            { sourceId: "s-rev", targetId: "s-net" },
            { sourceId: "s-cost", targetId: "s-net" },
            { sourceId: "s-wc", targetId: "s-net" },
            { sourceId: "s-int", targetId: "s-net" },
            { sourceId: "s-net", targetId: "s-pay" },
          ],
          nodePositions: [
            { id: "s-rev", x: 60, y: 60 },
            { id: "s-cost", x: 280, y: 60 },
            { id: "s-wc", x: 500, y: 60 },
            { id: "s-int", x: 280, y: 260 },
            { id: "s-net", x: 280, y: 420 },
            { id: "s-pay", x: 380, y: 560 },
          ],
        },
      },
    },
  });

  await prisma.caseActivity.create({
    data: {
      caseSimulationId: tata.id,
      activityType: "mcq",
      orderIndex: 1,
      activityData: {
        instructions: "Answer all questions based on the Tata Steel–Corus case studies. Each question has exactly one correct answer.",
        context: "Tata Steel acquired Corus for $12.1 billion (608 pence/share, ~34% premium). Corus FY2006: Revenue £9.2bn, EBITDA £1.38bn (15% margin), Net Debt £1.32bn, Pension Deficit £1.3bn. HRC prices: peak $1,100/tonne (mid-2008) → $380/tonne (early 2009).",
        questions: [
          {
            id: "tata-q1",
            questionText: "At the winning bid price, what EV/EBITDA multiple was Tata Steel paying when the pension deficit IS included in enterprise value?",
            explanation: "Enterprise Value = Equity Value + Net Debt + Pension Deficit. Equity = 708M shares × 608p = £4.3bn. EV = £4.3bn + £1.32bn + £1.3bn = £6.92bn. EV/EBITDA = £6.92bn ÷ £1.38bn ≈ 9.2× — which is the figure cited in case study 1. Without pension, EV = £5.62bn, multiple ≈ 5.0×.",
            options: [
              { id: "tata-q1-a", optionText: "Approximately 5.0× (excluding pension deficit from EV)", isCorrect: false },
              { id: "tata-q1-b", optionText: "Approximately 9.2× (including pension deficit in EV)", isCorrect: true },
              { id: "tata-q1-c", optionText: "Approximately 6.5× (equity only, no debt adjustments)", isCorrect: false },
              { id: "tata-q1-d", optionText: "Approximately 12.0× (including goodwill intangibles)", isCorrect: false },
            ],
          },
          {
            id: "tata-q2",
            questionText: "Why is EV/EBITDA preferred over P/E when comparing companies with different capital structures?",
            explanation: "EBITDA is a pre-interest, pre-tax metric — it measures operating cash generation before the effects of financing decisions. EV/EBITDA therefore allows comparison of companies regardless of whether they are debt-heavy or equity-funded. P/E is post-interest, so a highly-leveraged company like Corus (significant debt interest) shows artificially low earnings relative to its operating performance, making P/E comparison misleading.",
            options: [
              { id: "tata-q2-a", optionText: "EBITDA is always higher than earnings, so EV/EBITDA gives a more conservative multiple", isCorrect: false },
              { id: "tata-q2-b", optionText: "EV/EBITDA strips out financing (interest) and tax effects, enabling operating comparison across capital structures", isCorrect: true },
              { id: "tata-q2-c", optionText: "P/E ratios are unavailable for private companies, so EV/EBITDA is used by default", isCorrect: false },
              { id: "tata-q2-d", optionText: "EV/EBITDA includes depreciation, which provides a more accurate picture of asset quality", isCorrect: false },
            ],
          },
          {
            id: "tata-q3",
            questionText: "The acquisition debt load proved most dangerous when which specific market condition materialised in 2008–2009?",
            explanation: "HRC spot prices collapsed from ~$1,100/tonne to ~$380/tonne — a 65% decline. This destroyed Corus's EBITDA generation precisely when debt service obligations were highest. This illustrates the fundamental danger of peak-cycle leverage in commodity industries: debt was sized against peak-year EBITDA, not through-the-cycle cash flows.",
            options: [
              { id: "tata-q3-a", optionText: "Indian rupee appreciated sharply, eliminating raw material cost advantages", isCorrect: false },
              { id: "tata-q3-b", optionText: "UK government imposed windfall taxes on steel profits, reducing EBITDA", isCorrect: false },
              { id: "tata-q3-c", optionText: "Global steel prices collapsed ~65%, destroying EBITDA while acquisition debt obligations remained fixed", isCorrect: true },
              { id: "tata-q3-d", optionText: "CSN (Brazil) launched competing products that eroded Corus's European market share", isCorrect: false },
            ],
          },
        ],
      },
    },
  });

  await prisma.caseActivity.create({
    data: {
      caseSimulationId: tata.id,
      activityType: "quantus",
      orderIndex: 2,
      activityData: {
        title: "Corus Valuation — EV/EBITDA Bridge at Different Multiples",
        instructions: "Complete the Corus valuation model. Calculate Enterprise Value at both 6× and 8× EBITDA multiples for FY2006A and FY2007E, then derive Equity Value by subtracting Net Debt. Enter numbers in £ millions (no commas, decimals allowed).",
        context: "Corus FY2006A: Revenue £9,200m, EBITDA £1,380m, Net Debt £1,320m. FY2007E: Revenue £9,960m, EBITDA £1,295m (lower margin due to input cost pressure), Net Debt £1,150m. The sector average EV/EBITDA was 6–8× in 2006–2007. Tata paid 9.2× (pension-inclusive).",
        gridRows: 6,
        gridCols: 3,
        gridValues: {
          "0-0": "Metric", "0-1": "FY2006A (£m)", "0-2": "FY2007E (£m)",
          "1-0": "EBITDA", "1-1": "1380", "1-2": "1295",
          "2-0": "EV at 6× EBITDA", "2-1": "", "2-2": "",
          "3-0": "EV at 8× EBITDA", "3-1": "", "3-2": "",
          "4-0": "Net Debt", "4-1": "1320", "4-2": "1150",
          "5-0": "Implied Equity Value at 6×",
        },
        correctAnswers: {
          "2-1": "8280",
          "2-2": "7770",
          "3-1": "11040",
          "3-2": "10360",
          "5-1": "6960",
          "5-2": "6620",
        },
      },
    },
  });

  console.log("  ✅ Case simulations seeded: Zomato UAE + Tata-Corus");
}

// ═══════════════════════════════════════════════════════════════════════════
// SKILL TESTS (Skill Building)
// ═══════════════════════════════════════════════════════════════════════════

async function seedSkillTests(
  lessonIndex: Record<string, { id: string; name: string; difficulty: Difficulty; activityType: ActivityType; activityId: string }>,
  professions: Record<string, { id: string; slug: string }>
) {
  console.log("  Seeding skill tests...");

  // ── Investment Banking Analyst — Financial Statements & Valuation ─────────
  const ibProf = professions["ib"];
  if (!ibProf) throw new Error("IB profession not found");

  const ibTopic = await prisma.skillTopic.create({
    data: {
      professionId: ibProf.id,
      name: "Financial Statements & Valuation",
      description: "Master the three financial statements, cash flow analysis, and core valuation multiples — the quantitative foundation of every IB role.",
      orderIndex: 0,
      isActive: true,
    },
  });

  const ibTest = await prisma.skillTest.create({
    data: {
      professionId: ibProf.id,
      topicId: ibTopic.id,
      name: "IB Foundation — Set 1",
      description: "Three activities covering gross-profit identity (Canvas), working capital concepts (MCQ), and operating cash flow construction (Quantus). Complete all three to benchmark your financial statement fluency.",
      isPublished: true,
      isActive: true,
      orderIndex: 0,
    },
  });

  // Look up the extra MCQ activity IDs (seeded by seedExtraActivities)
  // finance/0/0/easy = Revenue to Gross Profit (primary = canvas, extra MCQ also exists)
  // finance/0/1/medium = Working Capital (primary = mcq)
  // finance/0/2/medium = Building Cash From Operations (primary = quantus)
  const gpLesson    = lessonIndex["finance/0/0/easy"];   // canvas
  const wcLesson    = lessonIndex["finance/0/1/medium"]; // mcq
  const cfoLesson   = lessonIndex["finance/0/2/medium"]; // quantus

  if (!gpLesson || !wcLesson || !cfoLesson) {
    throw new Error("Required lesson keys not found in lessonIndex. Check FINANCE module layout.");
  }

  // Fetch the extra MCQ activity for the gross-profit lesson (added by seedExtraActivities)
  const gpExtraMcq = await prisma.mcqActivity.findUnique({ where: { lessonId: gpLesson.id } });
  const wcMcq      = await prisma.mcqActivity.findUnique({ where: { lessonId: wcLesson.id } });
  const cfoQuantus = await prisma.quantusActivity.findUnique({ where: { lessonId: cfoLesson.id } });
  const gpCanvas   = await prisma.canvasActivity.findUnique({ where: { lessonId: gpLesson.id } });

  if (!wcMcq || !cfoQuantus || !gpCanvas) {
    throw new Error("Could not find required activities for skill test items.");
  }

  // Type configs: one row per activity type present in this test
  await prisma.skillTestTypeConfig.createMany({
    data: [
      { testId: ibTest.id, activityType: "canvas",  timeLimitMins: 25 },
      { testId: ibTest.id, activityType: "mcq",     timeLimitMins: 20 },
      { testId: ibTest.id, activityType: "quantus", timeLimitMins: 30 },
    ],
  });

  // Test items
  await prisma.skillTestItem.createMany({
    data: [
      {
        testId: ibTest.id,
        lessonId: gpLesson.id,
        activityType: "canvas",
        activityId: gpCanvas.id,
        orderIndex: 0,
      },
      {
        testId: ibTest.id,
        lessonId: wcLesson.id,
        activityType: "mcq",
        activityId: wcMcq.id,
        orderIndex: 1,
      },
      {
        testId: ibTest.id,
        lessonId: cfoLesson.id,
        activityType: "quantus",
        activityId: cfoQuantus.id,
        orderIndex: 2,
      },
    ],
  });

  // ── Chartered Accountant — Financial Statements ────────────────────────────
  const caProf = professions["ca"];
  if (!caProf) throw new Error("CA profession not found");

  const caTopic = await prisma.skillTopic.create({
    data: {
      professionId: caProf.id,
      name: "Financial Statements & Analysis",
      description: "Build proficiency in reading and interpreting financial statements — income statement, balance sheet, cash flow — as required in CA Foundation and Intermediate examinations.",
      orderIndex: 0,
      isActive: true,
    },
  });

  const caTest = await prisma.skillTest.create({
    data: {
      professionId: caProf.id,
      topicId: caTopic.id,
      name: "CA Foundation — Financial Statements Set 1",
      description: "Covers income statement structure (Canvas), balance sheet linkages (MCQ), and common-size analysis (Quantus). Aligned to ICAI Foundation Paper 1 competencies.",
      isPublished: true,
      isActive: true,
      orderIndex: 0,
    },
  });

  // finance/0/0/medium = Operating Income & EBIT (canvas)
  // finance/0/1/easy   = Accounting Equation (canvas) — but this is also canvas, need mcq
  // Use: finance/0/0/medium = EBIT canvas, finance/0/0/easy extra mcq, finance/0/1/hard = asset composition quantus
  const ebitLesson = lessonIndex["finance/0/0/medium"];  // canvas
  const acaLesson  = lessonIndex["finance/0/1/hard"];    // quantus (Asset Composition Analysis)

  if (!ebitLesson || !acaLesson) {
    throw new Error("Required lesson keys for CA test not found in lessonIndex.");
  }

  const ebitCanvas  = await prisma.canvasActivity.findUnique({ where: { lessonId: ebitLesson.id } });
  const acaQuantus  = await prisma.quantusActivity.findUnique({ where: { lessonId: acaLesson.id } });
  const ebitExtraMcq = gpExtraMcq; // use the extra MCQ from the easy lesson for variety

  if (!ebitCanvas || !acaQuantus) {
    throw new Error("Could not find required activities for CA skill test items.");
  }

  await prisma.skillTestTypeConfig.createMany({
    data: [
      { testId: caTest.id, activityType: "canvas",  timeLimitMins: 20 },
      { testId: caTest.id, activityType: "quantus", timeLimitMins: 30 },
      ...(ebitExtraMcq ? [{ testId: caTest.id, activityType: "mcq" as const, timeLimitMins: 20 }] : []),
    ],
  });

  await prisma.skillTestItem.createMany({
    data: [
      {
        testId: caTest.id,
        lessonId: ebitLesson.id,
        activityType: "canvas",
        activityId: ebitCanvas.id,
        orderIndex: 0,
      },
      {
        testId: caTest.id,
        lessonId: acaLesson.id,
        activityType: "quantus",
        activityId: acaQuantus.id,
        orderIndex: 1,
      },
      ...(ebitExtraMcq ? [{
        testId: caTest.id,
        lessonId: gpLesson.id,
        activityType: "mcq" as const,
        activityId: ebitExtraMcq.id,
        orderIndex: 2,
      }] : []),
    ],
  });

  console.log("  ✅ Skill tests seeded: IB Foundation Set 1 + CA Foundation Set 1");
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("Resetting…");
  await reset();
  console.log("Seeding users & professions…");
  await seedUser();
  const { professions } = await seedProfessions();
  console.log("Seeding learning tree…");
  const lessonIndex = await seedLearningTree(professions);
  console.log("Seeding case simulations…");
  await seedCaseSimulations();
  console.log("Seeding skill tests…");
  await seedSkillTests(lessonIndex, professions);
  console.log("Done.");
  console.log("\n──────────────────────────────────────────────────────────");
  console.log("  DEMO CREDENTIALS");
  console.log("  Learner:  demo@shankh.app  / shankh-demo");
  console.log("  Admin:    admin@shankh.app / shankh-admin");
  console.log("");
  console.log("  LEARNING (3 flows × all activity types)");
  console.log("  3 modules (Finance, Strategy, Operations)");
  console.log("  54 lessons — Canvas + MCQ + Quantus per lesson");
  console.log("  Extra MCQ activities on Income Statement lessons");
  console.log("");
  console.log("  CASE SIMULATIONS");
  console.log("  • Zomato UAE Market Entry  (medium) — Canvas + MCQ + Quantus");
  console.log("  • Tata Steel Acquires Corus (hard)  — Canvas + MCQ + Quantus");
  console.log("");
  console.log("  SKILL BUILDING");
  console.log("  • IB Foundation Set 1  (Investment Banking Analyst)");
  console.log("    Canvas (25 min) + MCQ (20 min) + Quantus (30 min)");
  console.log("  • CA Foundation Set 1  (Chartered Accountant)");
  console.log("    Canvas (20 min) + MCQ (20 min) + Quantus (30 min)");
  console.log("──────────────────────────────────────────────────────────");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());