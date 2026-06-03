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
    prisma.user.deleteMany(),
  ]);
}

// ═══════════════════════════════════════════════════════════════════════════
// USERS & PROFESSIONS
// ═══════════════════════════════════════════════════════════════════════════

async function seedUser() {
  const passwordHash = await bcrypt.hash("shankh-demo", 10);
  return prisma.user.create({
    data: {
      email: "demo@shankh.app",
      name: "Demo Learner",
      passwordHash,
      role: "learner",
      planType: "pro",
      timezone: "Asia/Kathmandu",
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

// ═══════════════════════════════════════════════════════════════════════════
// MAIN LEARNING TREE SEED
// ═══════════════════════════════════════════════════════════════════════════

async function seedLearningTree(professions: Record<string, { id: string; slug: string }>) {
  const lessonIndex: Record<string, { id: string; name: string; difficulty: Difficulty; activityType: ActivityType }> = {};
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

          await createActivity(lessonRow.id, l.activity);
          await seedHints(lessonRow.id, l.activity, l.hints);

          lessonIndex[`${m.slug}/${ti}/${si}/${l.difficulty}`] = {
            id: lessonRow.id, name: l.name, difficulty: l.difficulty, activityType: l.activity.kind,
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

  console.log("  ✅ Extra activities complete");
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
  await seedLearningTree(professions);
  console.log("Done.");
  console.log("\n────────────────────────────────────────────────────");
  console.log("  1 demo user          demo@shankh.app / shankh-demo");
  console.log("  8 professions");
  console.log("  3 modules (Finance, Strategy, Operations)");
  console.log("  54 lessons with canvas/mcq/quantus activities");
  console.log("  Extra MCQ activities on Income Statement lessons");
  console.log("  SubtopicProfessionTags for cross-promotion");
  console.log("────────────────────────────────────────────────────");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());