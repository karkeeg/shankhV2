// ═══════════════════════════════════════════════════════════════════════════
// Shankh — Database Seed
// ═══════════════════════════════════════════════════════════════════════════
//
// Populates:
//   • Learning tree: 3 Modules → 2 Topics each → 3 Subtopics each → 3 Lessons each
//     = 54 lessons, one themed activity per lesson (mcq | canvas | quantus).
//   • Canvas activities use the NEW token-edge graph model.
//   • Skill Building: the NEW decoupled system (Profession → SkillTopic →
//     SkillLesson), SkillSections, and SubtopicProfessionTags for cross-promo.
//   • One demo user. NO progress rows are seeded — progress is earned at runtime
//     via the session-submit cascade, and pre-seeding it would fight that logic.
//
// Run:  npx prisma db seed
// ═══════════════════════════════════════════════════════════════════════════

import { PrismaClient, Prisma } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── Small helpers ───────────────────────────────────────────────────────────

type ActivityType = "mcq" | "canvas" | "quantus";
type Difficulty = "easy" | "medium" | "hard";

const DIFFS: Difficulty[] = ["easy", "medium", "hard"];

// Reset (idempotent dev seed). Order respects FK dependencies.
async function reset() {
  // Children first, parents last.
  await prisma.$transaction([
    prisma.skillMcqAnswer.deleteMany(),
    prisma.skillMcqSession.deleteMany(),
    prisma.skillCanvasSession.deleteMany(),
    prisma.skillQuantusSession.deleteMany(),
    prisma.userSkillLessonProgress.deleteMany(),
    prisma.userSkillTopicProgress.deleteMany(),
    prisma.skillLesson.deleteMany(),
    prisma.skillTopic.deleteMany(),
    prisma.userSkillItemProgress.deleteMany(),
    prisma.userSkillBundleProgress.deleteMany(),
    prisma.skillBundleItem.deleteMany(),
    prisma.skillBundleProfession.deleteMany(),
    prisma.skillBundle.deleteMany(),
    prisma.subtopicProfessionTag.deleteMany(),
    prisma.skillSection.deleteMany(),
    prisma.profession.deleteMany(),
    prisma.userHintUsage.deleteMany(),
    prisma.activityHint.deleteMany(),
    prisma.userMcqAnswer.deleteMany(),
    prisma.userMcqSession.deleteMany(),
    prisma.userCanvasSession.deleteMany(),
    prisma.userQuantusSession.deleteMany(),
    prisma.userActivityDraft.deleteMany(),
    prisma.userLessonSession.deleteMany(),
    prisma.userLessonProgress.deleteMany(),
    prisma.userSubtopicProgress.deleteMany(),
    prisma.userTopicProgress.deleteMany(),
    prisma.userModuleProgress.deleteMany(),
    prisma.userStreak.deleteMany(),
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
    prisma.subtopic.deleteMany(),
    prisma.topic.deleteMany(),
    prisma.module.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}


async function main() {
  console.log("Resetting…");
  await reset();
  console.log("Seeding…");
  const user = await seedUser();
  const { professions } = await seedProfessions();
  await seedSkillSections();
  await seedLearningTree(professions);
  console.log("Done.");
}
// ═══════════════════════════════════════════════════════════════════════════
// Seed part 2 — User, Professions, Skill Sections
// ═══════════════════════════════════════════════════════════════════════════

async function seedUser() {
  const passwordHash = await bcrypt.hash("shankh-demo", 10);
  const user = await prisma.user.create({
    data: {
      email: "demo@shankh.app",
      name: "Demo Learner",
      passwordHash,
      role: "learner",
      planType: "pro",
      timezone: "Asia/Kathmandu",
    },
  });
  return user;
}

// The 8 professions from the Skill Building design.
const PROFESSIONS = [
  {
    slug: "ca", name: "Chartered Accountant", icon: "calculator", order: 1,
    description: "Audit, taxation, financial reporting and assurance. Strong on statement preparation, IFRS/Ind-AS treatment, and reconciliations."
  },
  {
    slug: "account_head", name: "Account Head", icon: "ledger", order: 2,
    description: "Owns the books end-to-end: closing cycles, controls, consolidation and management reporting for a business unit."
  },
  {
    slug: "ib", name: "Investment Banker", icon: "trending-up", order: 3,
    description: "Valuation, deal structuring and capital raising. Lives in three-statement models, DCFs, comparables and LBOs."
  },
  {
    slug: "pe", name: "Private Equity Analyst", icon: "briefcase", order: 4,
    description: "Screens and underwrites buyouts. Builds LBO models, tests returns sensitivity, and diligences operating leverage."
  },
  {
    slug: "strategy", name: "Strategy Consultant", icon: "target", order: 5,
    description: "Frames business problems with structured frameworks — Porter, value chain, MECE issue trees — and quantifies the upside."
  },
  {
    slug: "ops_mgr", name: "Operations Manager", icon: "settings", order: 6,
    description: "Runs throughput, inventory and process flow. Optimises EOQ, cycle time, capacity and the cost of quality."
  },
  {
    slug: "mgmt_consultant", name: "Management Consultant", icon: "users", order: 7,
    description: "Cross-functional problem solver spanning strategy, finance and operations for senior stakeholders."
  },
  {
    slug: "fin_analyst", name: "Financial Analyst", icon: "bar-chart", order: 8,
    description: "Forecasting, budgeting and variance analysis. Translates operating drivers into financial outcomes."
  },
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

// The 4 Skill Building sidebar sections.
const SKILL_SECTIONS = [
  {
    slug: "quant_lab", name: "Quant Lab", activityType: "quantus" as ActivityType | null, tabLabel: "Quantus Sheets", icon: "grid", order: 1,
    description: "Spreadsheet modeling practice — build and stress-test financial models cell by cell."
  },
  {
    slug: "mcqs", name: "MCQs", activityType: "mcq" as ActivityType | null, tabLabel: "Multiple Choice Questions", icon: "check-square", order: 2,
    description: "Rapid concept drills to lock in definitions, treatments and rules of thumb."
  },
  {
    slug: "framework_drills", name: "Framework Drills", activityType: "canvas" as ActivityType | null, tabLabel: "Canvas", icon: "share-2", order: 3,
    description: "Construct financial identities and strategy frameworks by assembling the right pieces in the right relationships."
  },
  {
    slug: "case_simulations", name: "Case Simulations", activityType: null, tabLabel: "Case Simulations", icon: "layers", order: 4,
    description: "Full multi-activity cases that combine modeling, frameworks and judgement end-to-end."
  },
];

async function seedSkillSections() {
  for (const s of SKILL_SECTIONS) {
    await prisma.skillSection.create({
      data: {
        slug: s.slug, name: s.name, description: s.description,
        activityType: s.activityType ?? null, tabLabel: s.tabLabel,
        iconKey: s.icon, orderIndex: s.order,
      },
    });
  }
}
// ═══════════════════════════════════════════════════════════════════════════
// Seed part 3 — The Learning content tree (declarative)
// ═══════════════════════════════════════════════════════════════════════════
//
// Shape:
//   Module → Topic[] → Subtopic[] → Lesson[] (exactly 3: easy, medium, hard)
//   Each Lesson has exactly ONE activity (mcq | canvas | quantus), themed to fit.
//   Each activity carries hand-authored instructions + context (100–200 words)
//   and full child content. Each also gets 3 progressive hints.
//
// Activity content shapes:
//   mcq:     questions[] → each has text, explanation, options[] (one isCorrect)
//   canvas:  assemblyMode, tokens[] (incl. distractors), edges[] (slot-aware)
//   quantus: columnGroups[], columns[], cells[] (editable/formula/prefilled)
// ═══════════════════════════════════════════════════════════════════════════

// ── Content type definitions ────────────────────────────────────────────────

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
    // ── TOPIC 1.1 ────────────────────────────────────────────────────────────
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
                instructions:
                  "Assemble the gross-profit calculation from the tokens in the sidebar. Drag the pieces onto the canvas and order them left to right so they form the correct accounting identity that takes you from the top line of the income statement down to gross profit. You are building an equation, not sorting items into boxes — the order and the operator both matter. The sidebar contains more pieces than you need: some are valid income-statement terms that simply do not belong in this particular relationship. Choose only the operands and the operator that define gross profit, place the equals sign, and finish with the correct result term. When you are confident the expression reads correctly from left to right, click Check Answer.",
                context:
                  "Gross profit is the first profitability subtotal on the income statement. It measures how much a company keeps from each unit of sales after paying only the direct cost of producing what it sold — its cost of goods sold (COGS). It deliberately excludes operating expenses such as salaries, rent and marketing, which sit further down the statement. Analysts watch the gross margin (gross profit ÷ revenue) closely because it reveals pricing power and production efficiency independent of how the business is run or financed. A retailer might run a 30% gross margin while a software firm runs 85%; the difference is structural, not a sign that one is better managed.",
                tokens: [
                  { ref: "rev", text: "Revenue", role: "operand", shape: "rect" },
                  { ref: "minus", text: "−", role: "operator", shape: "diamond" },
                  { ref: "cogs", text: "COGS", role: "operand", shape: "rect" },
                  { ref: "eq", text: "=", role: "relation", shape: "diamond" },
                  { ref: "gp", text: "Gross Profit", role: "result", shape: "pill" },
                  // distractors — real P&L terms that don't belong in THIS identity
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
                instructions:
                  "Construct the identity that takes you from gross profit to operating income, also called EBIT. Drag tokens from the sidebar onto the canvas and arrange them left to right into the correct equation. Remember that operating income measures profitability from core operations only — it is calculated before the company's financing choices (interest) and before tax. The sidebar includes distractor tokens that belong elsewhere on the income statement, such as interest and tax line items; including them here would describe a different subtotal entirely. Select the correct starting subtotal, the right cost to subtract, the equals sign and the correct result, then order them and click Check Answer.",
                context:
                  "Operating income — EBIT, earnings before interest and taxes — is the profit a business generates from its core activities. By stopping above interest and tax, it lets you compare the operating performance of two companies regardless of how they are financed or which tax regime they fall under. This is why EBIT and the related EBITDA are the workhorses of valuation multiples: an acquirer cares about the operating engine first and will layer on its own financing afterwards. Moving from gross profit to EBIT means absorbing operating expenses — the SG&A, R&D and depreciation that keep the business running but are not part of the direct cost of each sale.",
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
                instructions:
                  "This is a two-step bridge, so you will build it as a graph rather than a single line. Drag the tokens onto the canvas and draw arrows to connect them into the correct flow: first show how EBIT becomes pre-tax income, then how pre-tax income becomes net income. Each subtraction has a left and a right side, and direction matters — interest is subtracted from EBIT, not the other way around. The sidebar contains distractors, including operating-level items that have already been accounted for above this point in the statement. Connect only the tokens that belong in the financing-and-tax portion of the income statement, then click Check Answer.",
                context:
                  "Below operating income, two forces reduce profit to its final figure. First, interest expense — the cost of the company's debt — is subtracted from EBIT to give pre-tax income (also called EBT). This is where capital structure finally enters: a heavily leveraged firm and a debt-free firm with identical operations will diverge here. Second, tax is applied to pre-tax income, leaving net income, the bottom line that flows to retained earnings and, ultimately, to shareholders. Understanding this bridge is essential for valuation and for the tax shield concept in particular: because interest is deducted before tax, debt financing carries a tax advantage that equity does not.",
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
                instructions:
                  "Assemble the fundamental accounting equation from the sidebar tokens. Drag the pieces onto the canvas and order them so the equation reads correctly from left to right. Think about what a balance sheet is really saying: everything the business controls had to be paid for by someone. Note that the right-hand side combines two funding sources with a plus, and because addition is commutative, the system will accept those two operands in either order — what it will not accept is the wrong term, the wrong operator, or the assets total on the wrong side. The sidebar includes distractor tokens drawn from the income statement that have no place in this identity. Build the equation and click Check Answer.",
                context:
                  "The accounting equation — Assets = Liabilities + Equity — is the bedrock of double-entry bookkeeping and the reason a balance sheet always balances. Read it as a statement about funding: the left side lists everything the company owns and controls, while the right side shows where the money to acquire those assets came from. Liabilities represent claims from outside parties such as lenders and suppliers; equity represents the residual claim of the owners. Every transaction touches at least two accounts and preserves the equality. When an analyst sees a balance sheet that does not balance, it is not a judgement call — it is an error, because the identity holds by construction.",
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
                instructions:
                  "Answer the following questions on working capital. Each question has exactly one correct answer. Working capital is a practical, everyday concept for anyone managing a business's liquidity, and these questions move from the basic definition toward how changes in working capital actually affect cash. Read each question carefully — several of the distractor options are statements that are true in a different context but wrong for the specific question asked. Use the explanations after each question to reinforce why the correct answer holds and why the common traps are tempting but incorrect. There are no hints needed for the definitions, but the cash-flow linkage in the final question is the one most people get backwards.",
                context:
                  "Working capital measures a company's short-term financial health — its ability to cover obligations coming due within a year using assets that will convert to cash within a year. Net working capital is current assets minus current liabilities. But the figure on its own is less interesting than its movement: when working capital rises (say, inventory builds up or customers are slow to pay), cash is consumed, even if the income statement looks healthy. This is why a profitable, fast-growing company can still run out of cash. The management of receivables, inventory and payables — the cash conversion cycle — is where operations and finance meet most directly.",
                questions: [
                  {
                    q: "What is net working capital?",
                    explanation: "Net working capital is current assets minus current liabilities — the short-term resources left over after meeting short-term obligations.",
                    options: [
                      { text: "Current assets − current liabilities", correct: true },
                      { text: "Total assets − total liabilities" },
                      { text: "Revenue − operating expenses" },
                      { text: "Cash + inventory" },
                    ],
                  },
                  {
                    q: "A company's inventory increases significantly during the year, with all else equal. What is the effect on cash flow?",
                    explanation: "Building inventory ties up cash — you have paid for goods you have not yet sold. An increase in a current asset is a use of cash.",
                    options: [
                      { text: "Cash flow decreases", correct: true },
                      { text: "Cash flow increases" },
                      { text: "No effect on cash flow" },
                      { text: "Net income decreases but cash is unaffected" },
                    ],
                  },
                  {
                    q: "Which change is a SOURCE of cash?",
                    explanation: "An increase in accounts payable means you are holding onto cash longer by paying suppliers later — a source of cash. Increases in current assets are uses of cash.",
                    options: [
                      { text: "An increase in accounts payable", correct: true },
                      { text: "An increase in accounts receivable" },
                      { text: "An increase in inventory" },
                      { text: "An increase in prepaid expenses" },
                    ],
                  },
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
                instructions:
                  "Complete the common-size balance sheet by filling in the percentage column. For each asset and funding line, express it as a percentage of total assets by entering the correct formula in the yellow editable cells. Common-sizing strips out the effect of company size, letting you compare the structural shape of two very different businesses on equal footing. The dollar figures are already provided in the prefilled column; your task is the right-hand percentage column. Total assets is the denominator for every line. When you have filled each editable cell, the asset percentages should sum to 100% and the funding side (liabilities plus equity) should also sum to 100%, confirming the balance sheet balances. Click Check Answer when complete.",
                context:
                  "A common-size balance sheet restates every line item as a percentage of total assets. This simple transformation is one of the most powerful comparative tools in financial analysis because it removes scale: a $50m firm and a $5bn firm become directly comparable in structure. You can immediately see whether a company is asset-heavy or asset-light, how much of its funding comes from debt versus equity, and how its mix shifts over time. Lenders use it to spot rising leverage; equity analysts use it to compare a target against its peers. The discipline of dividing each line by the same denominator also reinforces the balance-sheet identity — both sides must resolve to 100%.",
                colGroups: [
                  { label: "Balance Sheet", start: 1, end: 2, bg: "#e8e8ff" },
                ],
                cols: [
                  { label: "Line Item", index: 0, width: 180 },
                  { label: "Amount ($m)", index: 1, width: 110 },
                  { label: "% of Total Assets", index: 2, width: 140 },
                ],
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
                instructions:
                  "Answer these questions on the difference between accounting profit and cash flow. This is one of the most important distinctions in finance, and it trips up newcomers constantly because the income statement and the cash flow statement can tell very different stories about the same period. Each question has one correct answer. Pay particular attention to the treatment of non-cash items and the direction of working-capital effects — these are the mechanisms that drive a wedge between net income and cash from operations. The explanations spell out the reasoning so you can build the intuition rather than memorising rules.",
                context:
                  "Net income and cash flow diverge for two main reasons. First, the income statement includes non-cash expenses — depreciation and amortisation chief among them — that reduce reported profit without any cash leaving the business. Second, accrual accounting records revenue when earned and expenses when incurred, not when cash changes hands, so timing differences accumulate in working capital. The cash flow statement reconciles the two: it starts from net income, adds back non-cash charges, and adjusts for changes in working capital to arrive at cash generated by operations. A company can report record profits while bleeding cash, or post a loss while generating healthy cash — which is why seasoned analysts read the cash flow statement first.",
                questions: [
                  {
                    q: "Why is depreciation added back when calculating cash from operations?",
                    explanation: "Depreciation reduces net income but no cash actually leaves the business in that period — the cash was spent when the asset was purchased. So it is added back.",
                    options: [
                      { text: "It is a non-cash expense already deducted from net income", correct: true },
                      { text: "It increases the value of the asset" },
                      { text: "It is a cash inflow from operations" },
                      { text: "It represents new capital expenditure" },
                    ],
                  },
                  {
                    q: "A company reports strong net income but negative operating cash flow. What is the most likely cause?",
                    explanation: "A large build-up in receivables or inventory consumes cash even as the income statement shows profit — sales booked but not yet collected.",
                    options: [
                      { text: "A large increase in working capital", correct: true },
                      { text: "High depreciation charges" },
                      { text: "Repaying long-term debt" },
                      { text: "Issuing new equity" },
                    ],
                  },
                  {
                    q: "Which item appears in cash from operations but NOT on the income statement?",
                    explanation: "Changes in working capital (e.g. the movement in receivables) adjust operating cash flow but are not income-statement line items themselves.",
                    options: [
                      { text: "Change in accounts receivable", correct: true },
                      { text: "Cost of goods sold" },
                      { text: "Interest expense" },
                      { text: "Depreciation" },
                    ],
                  },
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
                instructions:
                  "Build the operating section of the cash flow statement using the indirect method. Starting from net income, enter formulas in the yellow editable cells to add back non-cash charges and adjust for the change in working capital, arriving at cash from operations. The prefilled cells give you net income, depreciation and the working-capital movement for the year. Remember the sign convention: depreciation is added back because it is non-cash, while an increase in working capital is subtracted because it consumes cash. The final cell should compute total cash from operations. Enter each formula, check that the arithmetic ties, and click Check Answer.",
                context:
                  "The indirect method is how almost every real company presents operating cash flow. Rather than listing every cash receipt and payment, it starts from net income — the figure investors already know — and reconciles it to cash by reversing the accounting adjustments that separate the two. Non-cash expenses like depreciation are added back. Then each component of working capital is adjusted: increases in current assets (receivables, inventory) are subtracted because they tie up cash, while increases in current liabilities (payables) are added because they defer cash outflows. The result is a clear bridge from reported profit to the cash the business actually threw off, which is the number that ultimately funds dividends, debt repayment and reinvestment.",
                colGroups: [
                  { label: "Cash Flow from Operations", start: 1, end: 1, bg: "#e8f5e8" },
                ],
                cols: [
                  { label: "Line Item", index: 0, width: 220 },
                  { label: "$m", index: 1, width: 100 },
                ],
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
                instructions:
                  "Assemble the definition of free cash flow from the sidebar. Drag the tokens onto the canvas and order them into the correct identity that takes cash from operations down to the free cash flow available to investors. Free cash flow is the single most important number in intrinsic valuation, so getting its definition exactly right matters. The sidebar deliberately mixes in distractors — financing items like dividends and debt repayment that come after free cash flow is defined, not as part of its calculation. Choose the correct starting cash figure, the right investment outflow to subtract, the equals sign and the correct result. Order the expression left to right and click Check Answer.",
                context:
                  "Free cash flow (FCF) is the cash a business generates after funding the investment needed to maintain and grow its operations. In its most common form, FCF equals cash from operations minus capital expenditure — the spending on property, plant and equipment that keeps the company competitive. What remains is genuinely 'free': it can be returned to shareholders as dividends or buybacks, used to repay debt, or stockpiled. Because it represents real, distributable cash rather than accounting profit, FCF is the figure discounted in a DCF valuation. The distinction between FCF and the financing decisions that follow it is crucial: paying a dividend does not reduce free cash flow, it is a use of free cash flow already earned.",
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
    // ── TOPIC 1.2 ────────────────────────────────────────────────────────────
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
              hints: [
                "Money in the future is worth less today because of opportunity cost.",
                "Divide the future amount by one plus the rate, raised to the number of periods.",
                "PV = FV ÷ (1 + r)^n.",
              ],
              activity: {
                kind: "mcq",
                title: "Present value fundamentals",
                instructions:
                  "Answer these questions on the time value of money and present value. This concept underpins every valuation technique in finance, so a solid grasp here pays off everywhere downstream. Each question has a single correct answer. The questions progress from the core intuition — why future money is discounted — through the mechanics of the present-value formula to the effect of the discount rate. Several distractor options reflect common misunderstandings, such as confusing the direction of the rate's effect. Read the explanations to cement why discounting works the way it does.",
                context:
                  "The time value of money is the principle that a sum received today is worth more than the same sum received later, because today's money can be invested to earn a return. Present value reverses this logic: it asks what a future cash flow is worth in today's terms, by discounting it at a rate that reflects risk and opportunity cost. The formula PV = FV ÷ (1 + r)^n captures it — the further away the cash flow (larger n) or the higher the required return (larger r), the smaller its present value. This single idea scales up into discounted cash flow valuation, bond pricing and capital budgeting.",
                questions: [
                  {
                    q: "What is the present value of $1,100 received in one year, discounted at 10%?",
                    explanation: "PV = 1100 ÷ (1.10) = 1000. The future amount is divided by one plus the rate.",
                    options: [
                      { text: "$1,000", correct: true },
                      { text: "$1,210" },
                      { text: "$990" },
                      { text: "$1,100" },
                    ],
                  },
                  {
                    q: "All else equal, a higher discount rate produces a _____ present value.",
                    explanation: "A higher rate discounts future cash flows more heavily, lowering their present value.",
                    options: [
                      { text: "Lower", correct: true },
                      { text: "Higher" },
                      { text: "Unchanged" },
                      { text: "Negative" },
                    ],
                  },
                  {
                    q: "Why does a cash flow further in the future have a lower present value?",
                    explanation: "Discounting compounds over time, so a more distant cash flow is divided by a larger factor, reducing its value today.",
                    options: [
                      { text: "It is discounted over more periods", correct: true },
                      { text: "Inflation does not affect it" },
                      { text: "The discount rate decreases over time" },
                      { text: "Future cash is always worth more" },
                    ],
                  },
                ],
              },
            },
            {
              name: "Discounting Cash Flows", difficulty: "medium", estMins: 25,
              description: "Discount a multi-year stream to its present value.",
              hints: [
                "Each year's cash flow is discounted by its own factor, then summed.",
                "The discount factor for year n is 1 ÷ (1 + r)^n.",
                "Sum the discounted values across all years to get total PV.",
              ],
              activity: {
                kind: "quantus",
                title: "Discount a 3-year cash flow stream",
                instructions:
                  "Discount a three-year stream of cash flows to its present value at a 10% discount rate. The undiscounted cash flows are prefilled for each year. In the yellow editable cells, enter the discount factor for each year and then the present value of each year's cash flow. Finally, sum the present values to get the total. The discount factor for year n is 1 ÷ (1.10)^n, and the present value of each cash flow is that flow multiplied by its discount factor. This is the engine inside every DCF model — once you can discount a stream by hand, the only thing that changes in practice is the number of periods. Enter all formulas and click Check Answer.",
                context:
                  "Discounting a stream of cash flows is the operational core of valuation. Each future cash flow is brought back to today using a discount factor specific to its timing, and the present values are summed. The discount rate reflects the riskiness of the cash flows and the return investors could earn elsewhere; in corporate valuation it is usually the weighted average cost of capital. The further out a cash flow sits, the smaller its discount factor and the less it contributes to value today — which is why terminal value, capturing everything beyond the explicit forecast, often dominates a DCF and why small changes in the discount rate move valuations so much.",
                colGroups: [
                  { label: "DCF (r = 10%)", start: 1, end: 3, bg: "#e8e8ff" },
                ],
                cols: [
                  { label: "Year", index: 0, width: 80 },
                  { label: "Cash Flow", index: 1, width: 110 },
                  { label: "Discount Factor", index: 2, width: 130 },
                  { label: "Present Value", index: 3, width: 120 },
                ],
                cells: [
                  { r: 0, c: 0, type: "prefilled", display: "1" },
                  { r: 0, c: 1, type: "prefilled", display: "100" },
                  { r: 0, c: 2, type: "editable", expected: "0.909", formula: "=1/1.1^1", format: "number", editable: true, tolerancePct: 1, hint: "1 ÷ 1.10^1" },
                  { r: 0, c: 3, type: "editable", expected: "90.9", formula: "=B0*C0", format: "number", editable: true, tolerancePct: 1, hint: "Cash flow × discount factor" },
                  { r: 1, c: 0, type: "prefilled", display: "2" },
                  { r: 1, c: 1, type: "prefilled", display: "120" },
                  { r: 1, c: 2, type: "editable", expected: "0.826", formula: "=1/1.1^2", format: "number", editable: true, tolerancePct: 1, hint: "1 ÷ 1.10^2" },
                  { r: 1, c: 3, type: "editable", expected: "99.2", formula: "=B1*C1", format: "number", editable: true, tolerancePct: 1, hint: "Cash flow × discount factor" },
                  { r: 2, c: 0, type: "prefilled", display: "3" },
                  { r: 2, c: 1, type: "prefilled", display: "150" },
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
              hints: [
                "Terminal value captures every cash flow after your explicit forecast window.",
                "The Gordon growth model divides the next year's cash flow by (rate − growth).",
                "TV = CF × (1 + g) ÷ (r − g).",
              ],
              activity: {
                kind: "canvas", assemblyMode: "graph",
                title: "Build the Gordon growth terminal value",
                instructions:
                  "Construct the Gordon growth (perpetuity) terminal-value formula as a graph. Drag the tokens onto the canvas and draw arrows to connect them into the correct structure: the final-year cash flow grown by one period, divided by the discount rate less the perpetual growth rate. Pay close attention to the denominator — it is rate minus growth, and the order is not interchangeable, so the slots matter. The sidebar contains distractors, including an addition operator and a plain cash-flow term that would describe a single-period value rather than a perpetuity. Connect only the tokens that form the terminal-value identity and click Check Answer.",
                context:
                  "Terminal value addresses a practical problem in DCF valuation: you cannot forecast cash flows forever, but a business does not stop generating them at the end of your five- or ten-year window. The Gordon growth model solves this by treating all cash flows beyond the forecast as a growing perpetuity. The formula — next year's cash flow divided by the discount rate minus the long-term growth rate — collapses an infinite stream into a single figure. It is powerful but sensitive: because the denominator is a small difference between two rates, modest changes in either the discount rate or the growth assumption swing the terminal value dramatically. This is why analysts stress-test the terminal value more than any other input.",
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
              hints: [
                "Enterprise value belongs to all investors; equity value belongs only to shareholders.",
                "Subtract net debt from enterprise value to reach equity value.",
                "Equity Value = Enterprise Value − Net Debt.",
              ],
              activity: {
                kind: "canvas", assemblyMode: "sequence",
                title: "Build the EV-to-equity bridge",
                instructions:
                  "Assemble the bridge from enterprise value to equity value. Drag the tokens onto the canvas and order them into the correct identity. The core idea is that enterprise value represents the worth of the operating business to all providers of capital, while equity value is what is left for shareholders after the debtholders' claim is settled. The sidebar includes distractor tokens — items like cash and operating income that relate to the calculation of enterprise value but are not part of this particular bridge. Select the correct starting value, the right item to subtract, the equals sign and the correct result, order them left to right, and click Check Answer.",
                context:
                  "Enterprise value (EV) and equity value answer two different questions. EV is the value of the entire operating business — what it would cost to acquire the operations free of their existing financing. Equity value, or market capitalisation for a listed firm, is the value of just the shareholders' stake. The bridge between them is net debt: because debtholders have a prior claim on the business, their net position is subtracted from EV to leave equity value. This is why two companies with identical operations can have very different equity values — leverage shifts value between debt and equity holders without changing the underlying enterprise. Getting this bridge right is fundamental to every comparable-company analysis.",
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
              hints: [
                "A multiple expresses value as a ratio to an operating or earnings metric.",
                "EV/EBITDA uses enterprise value; P/E uses equity value (price).",
                "Match the numerator to the denominator: EV with EBITDA, price with earnings.",
              ],
              activity: {
                kind: "mcq",
                title: "Valuation multiples",
                instructions:
                  "Answer these questions on trading multiples, the most widely used valuation shorthand in practice. Each question has one correct answer. The key discipline being tested is consistency between numerator and denominator: enterprise-value multiples must pair with metrics available to all investors, while equity multiples pair with metrics available only to shareholders. Several distractors deliberately mismatch these — a classic and costly error. Work through the explanations to internalise why EV/EBITDA and P/E are not interchangeable and when each is the more appropriate lens.",
                context:
                  "Trading multiples value a company by comparison rather than from first principles. You take a value measure — enterprise value or share price — and divide it by an operating or earnings metric to get a ratio, then apply the ratio observed at comparable companies to the target. The cardinal rule is consistency: enterprise value, which belongs to all capital providers, must be paired with a pre-financing metric such as EBITDA or revenue, while the equity-based price must be paired with a post-financing, post-tax metric such as net earnings. Mixing them — dividing enterprise value by net income, say — double-counts or omits the effect of capital structure and produces a meaningless figure.",
                questions: [
                  {
                    q: "Which metric correctly pairs with Enterprise Value?",
                    explanation: "EBITDA is a pre-financing, pre-tax measure available to all investors, matching EV which also belongs to all investors.",
                    options: [
                      { text: "EBITDA", correct: true },
                      { text: "Net income" },
                      { text: "Dividends per share" },
                      { text: "Earnings per share" },
                    ],
                  },
                  {
                    q: "The P/E ratio relates share price to which figure?",
                    explanation: "P/E divides price (an equity value) by earnings per share (a post-tax, post-interest figure attributable to shareholders).",
                    options: [
                      { text: "Earnings per share", correct: true },
                      { text: "EBITDA" },
                      { text: "Revenue" },
                      { text: "Enterprise value" },
                    ],
                  },
                  {
                    q: "Why is EV/EBITDA often preferred for comparing companies with different leverage?",
                    explanation: "Both EV and EBITDA are independent of capital structure, so the multiple is not distorted by how each company is financed.",
                    options: [
                      { text: "It is capital-structure neutral", correct: true },
                      { text: "It includes the tax shield" },
                      { text: "It ignores operating performance" },
                      { text: "It is always lower than P/E" },
                    ],
                  },
                ],
              },
            },
            {
              name: "EV Build-Up", difficulty: "hard", estMins: 30,
              description: "Construct enterprise value from market cap and the capital structure.",
              hints: [
                "Enterprise value starts from equity value and adds back the other claims.",
                "Add debt and minority interest, then subtract cash.",
                "EV = Equity Value + Debt + Minority Interest − Cash.",
              ],
              activity: {
                kind: "quantus",
                title: "Build enterprise value",
                instructions:
                  "Construct enterprise value from the components of the capital structure. The equity value (market capitalisation), total debt, minority interest and cash are prefilled. In the yellow editable cell, enter the formula that builds enterprise value from these pieces. Remember the logic: enterprise value reflects the cost of acquiring the whole operating business, so you start from the equity holders' stake, add the claims of debtholders and minority shareholders, and subtract cash because an acquirer effectively recovers it. Get the signs right — debt and minority interest add, cash subtracts. Enter the formula and click Check Answer.",
                context:
                  "Enterprise value is most often built up from the bottom rather than estimated directly. You begin with equity value — readily observable as market capitalisation for a listed company — and adjust for everything else with a claim on the business. Debt is added because an acquirer assumes it. Minority interest is added because the consolidated operating metrics include subsidiaries not wholly owned. Cash is subtracted because it is a non-operating asset the buyer effectively gets back, reducing the true cost of the operations. The resulting figure is the value of the operating enterprise itself, the number that sits in the numerator of EV-based multiples and the endpoint of an unlevered DCF.",
                colGroups: [
                  { label: "EV Build-Up ($m)", start: 1, end: 1, bg: "#fff0e8" },
                ],
                cols: [
                  { label: "Component", index: 0, width: 200 },
                  { label: "$m", index: 1, width: 100 },
                ],
                cells: [
                  { r: 0, c: 0, type: "prefilled", display: "Equity Value (Market Cap)" },
                  { r: 0, c: 1, type: "prefilled", display: "1200" },
                  { r: 1, c: 0, type: "prefilled", display: "(+) Total Debt" },
                  { r: 1, c: 1, type: "prefilled", display: "400" },
                  { r: 2, c: 0, type: "prefilled", display: "(+) Minority Interest" },
                  { r: 2, c: 1, type: "prefilled", display: "50" },
                  { r: 3, c: 0, type: "prefilled", display: "(−) Cash" },
                  { r: 3, c: 1, type: "prefilled", display: "150" },
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
    // ── TOPIC 2.1 ────────────────────────────────────────────────────────────
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
              hints: [
                "Industry rivalry sits at the centre; four other forces press on it from outside.",
                "Think suppliers and buyers on the sides, and two kinds of competition: new and substitute.",
                "The four outer forces all influence the central force of competitive rivalry.",
              ],
              activity: {
                kind: "canvas", assemblyMode: "graph",
                title: "Map Porter's Five Forces",
                instructions:
                  "Build Porter's Five Forces framework as a graph. Drag the five forces onto the canvas and connect each of the four peripheral forces to the central force of competitive rivalry with an arrow, showing that each one shapes the intensity of competition within the industry. The framework's logic is that rivalry is not determined in isolation — it is pressured by suppliers, buyers, the threat of newcomers and the threat of substitutes. The sidebar contains distractor tokens that are real business concepts but are not one of Porter's five forces, such as government regulation and complementary products. Connect only the genuine five forces in the correct hub-and-spoke structure and click Check Answer.",
                context:
                  "Porter's Five Forces is the canonical framework for analysing why some industries earn persistently higher returns than others. Rather than focusing on individual competitors, it examines five structural forces: the intensity of rivalry among existing firms, the bargaining power of suppliers, the bargaining power of buyers, the threat of new entrants, and the threat of substitute products. Where these forces are strong, they compete away industry profits; where they are weak, incumbents can sustain attractive margins. The framework reframes strategy as a question of industry structure and positioning rather than operational excellence alone, and it remains the starting point for most rigorous market-entry and competitive-strategy work.",
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
              hints: [
                "A force is strong when it can squeeze industry profits.",
                "Few suppliers or high switching costs mean strong supplier power.",
                "Low entry barriers mean a high threat of new entrants.",
              ],
              activity: {
                kind: "mcq",
                title: "Diagnosing the five forces",
                instructions:
                  "Answer these questions about how to assess the strength of each of Porter's forces in a real industry. Each question has one correct answer. The skill being tested is moving from naming the forces to diagnosing them — recognising the specific conditions that make a force strong or weak. Several distractor options describe conditions that affect a different force than the one asked about, which is the most common analytical slip. Read the explanations to connect each structural condition to its effect on industry profitability.",
                context:
                  "Naming the five forces is easy; assessing their strength in a specific industry is the real analytical work. Each force is strong — and therefore a drag on industry profits — under identifiable conditions. Supplier power is high when suppliers are concentrated, their input is critical, or switching is costly. Buyer power is high when buyers are large, the product is undifferentiated, or they can integrate backwards. The threat of entry is high when barriers such as capital requirements, scale economies or brand loyalty are low. Substitutes are threatening when they offer a comparable value proposition. A disciplined analyst evaluates each force against these conditions rather than relying on impressions.",
                questions: [
                  {
                    q: "Supplier power is strongest when:",
                    explanation: "When few suppliers control a critical input and switching is costly, they can dictate terms — strong supplier power.",
                    options: [
                      { text: "There are few suppliers of a critical input", correct: true },
                      { text: "Many suppliers compete for the same buyers" },
                      { text: "The input is a commodity with many sources" },
                      { text: "Buyers can easily make the input themselves" },
                    ],
                  },
                  {
                    q: "Which condition raises the threat of new entrants?",
                    explanation: "Low barriers to entry — little capital needed, no scale advantage — make it easy for newcomers to enter and compete.",
                    options: [
                      { text: "Low barriers to entry", correct: true },
                      { text: "Strong incumbent brand loyalty" },
                      { text: "High capital requirements" },
                      { text: "Significant economies of scale" },
                    ],
                  },
                  {
                    q: "An industry where buyers are large and the product is undifferentiated will have:",
                    explanation: "Large buyers purchasing an undifferentiated product can play suppliers off against each other — strong buyer power.",
                    options: [
                      { text: "Strong buyer power", correct: true },
                      { text: "Weak buyer power" },
                      { text: "Low rivalry" },
                      { text: "High entry barriers" },
                    ],
                  },
                ],
              },
            },
            {
              name: "Industry Profitability Scoring", difficulty: "hard", estMins: 25,
              description: "Quantify overall industry attractiveness from force ratings.",
              hints: [
                "Convert each force's strength into a score, then combine them.",
                "A weighted average of the five force scores gives an attractiveness index.",
                "Multiply each force score by its weight, then sum.",
              ],
              activity: {
                kind: "quantus",
                title: "Score industry attractiveness",
                instructions:
                  "Quantify the overall attractiveness of an industry by combining the five force ratings into a weighted score. Each force has been rated from 1 (very unfavourable, the force is strong) to 5 (very favourable, the force is weak), and each carries a weight reflecting its importance in this industry. In the yellow editable cells, calculate the weighted contribution of each force, then sum them into a single attractiveness index. Higher scores indicate a more attractive industry. The ratings and weights are prefilled; your task is the weighted-score column and the total. Enter each formula and click Check Answer.",
                context:
                  "Turning a qualitative framework into a comparable score is a common consulting technique for ranking opportunities. By rating each of the five forces on a consistent scale and weighting them by relevance, an analyst can collapse a rich structural analysis into a single index that supports portfolio decisions — which market to enter, which to exit. The weighting matters: in a capital-intensive industry the threat of entry might carry little weight because barriers are inherently high, while rivalry might dominate. The technique is only as good as the judgement behind the ratings and weights, but it imposes a useful discipline and makes the reasoning transparent and challengeable.",
                colGroups: [
                  { label: "Industry Attractiveness", start: 1, end: 3, bg: "#f0e8ff" },
                ],
                cols: [
                  { label: "Force", index: 0, width: 200 },
                  { label: "Rating (1-5)", index: 1, width: 110 },
                  { label: "Weight", index: 2, width: 90 },
                  { label: "Weighted Score", index: 3, width: 130 },
                ],
                cells: [
                  { r: 0, c: 0, type: "prefilled", display: "Rivalry" },
                  { r: 0, c: 1, type: "prefilled", display: "3" },
                  { r: 0, c: 2, type: "prefilled", display: "0.3" },
                  { r: 0, c: 3, type: "editable", expected: "0.9", formula: "=B0*C0", format: "number", editable: true, tolerancePct: 1, hint: "Rating × weight" },
                  { r: 1, c: 0, type: "prefilled", display: "Supplier Power" },
                  { r: 1, c: 1, type: "prefilled", display: "4" },
                  { r: 1, c: 2, type: "prefilled", display: "0.2" },
                  { r: 1, c: 3, type: "editable", expected: "0.8", formula: "=B1*C1", format: "number", editable: true, tolerancePct: 1, hint: "Rating × weight" },
                  { r: 2, c: 0, type: "prefilled", display: "Buyer Power" },
                  { r: 2, c: 1, type: "prefilled", display: "2" },
                  { r: 2, c: 2, type: "prefilled", display: "0.2" },
                  { r: 2, c: 3, type: "editable", expected: "0.4", formula: "=B2*C2", format: "number", editable: true, tolerancePct: 1, hint: "Rating × weight" },
                  { r: 3, c: 0, type: "prefilled", display: "Threat of Entry" },
                  { r: 3, c: 1, type: "prefilled", display: "4" },
                  { r: 3, c: 2, type: "prefilled", display: "0.15" },
                  { r: 3, c: 3, type: "editable", expected: "0.6", formula: "=B3*C3", format: "number", editable: true, tolerancePct: 1, hint: "Rating × weight" },
                  { r: 4, c: 0, type: "prefilled", display: "Threat of Substitutes" },
                  { r: 4, c: 1, type: "prefilled", display: "3" },
                  { r: 4, c: 2, type: "prefilled", display: "0.15" },
                  { r: 4, c: 3, type: "editable", expected: "0.45", formula: "=B4*C4", format: "number", editable: true, tolerancePct: 1, hint: "Rating × weight" },
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
              hints: [
                "Primary activities create and deliver the product; support activities enable them.",
                "Inbound logistics, operations, outbound logistics, marketing and service are primary.",
                "Procurement, technology, HR and infrastructure are support activities.",
              ],
              activity: {
                kind: "mcq",
                title: "The value chain",
                instructions:
                  "Answer these questions on Porter's value chain. Each question has a single correct answer. The framework divides a firm's activities into those that directly create and deliver value (primary) and those that enable the primary activities (support). The skill being tested is correctly categorising activities and understanding how the framework is used to locate competitive advantage. Some distractor options place a support activity among the primary ones or vice versa — a frequent error. The explanations clarify the boundary between the two categories and why the distinction matters strategically.",
                context:
                  "The value chain disaggregates a company into the discrete activities it performs to design, produce, market, deliver and support its product. Porter splits these into primary activities — inbound logistics, operations, outbound logistics, marketing and sales, and service — which directly handle the product, and support activities — procurement, technology development, human resource management, and firm infrastructure — which underpin the primary ones. The framework's purpose is diagnostic: by examining each activity's cost and its contribution to differentiation, a firm can identify where it holds or could build a competitive advantage. It also clarifies which activities to own and which to outsource.",
                questions: [
                  {
                    q: "Which of the following is a PRIMARY activity?",
                    explanation: "Operations — transforming inputs into the finished product — is a core primary activity that directly handles the product.",
                    options: [
                      { text: "Operations", correct: true },
                      { text: "Procurement" },
                      { text: "Human resource management" },
                      { text: "Technology development" },
                    ],
                  },
                  {
                    q: "Which is a SUPPORT activity?",
                    explanation: "Procurement — sourcing inputs — enables the primary activities rather than directly handling the product, making it a support activity.",
                    options: [
                      { text: "Procurement", correct: true },
                      { text: "Outbound logistics" },
                      { text: "Marketing and sales" },
                      { text: "Service" },
                    ],
                  },
                  {
                    q: "What is the main strategic purpose of value chain analysis?",
                    explanation: "It pinpoints where a firm adds value and where its competitive advantage lies, activity by activity.",
                    options: [
                      { text: "To locate sources of competitive advantage", correct: true },
                      { text: "To calculate net income" },
                      { text: "To forecast cash flow" },
                      { text: "To set the discount rate" },
                    ],
                  },
                ],
              },
            },
            {
              name: "Mapping the Chain", difficulty: "medium", estMins: 20,
              description: "Connect the primary activities into the correct sequence.",
              hints: [
                "Primary activities follow the flow of the product through the firm.",
                "It starts with bringing inputs in and ends with after-sales service.",
                "Inbound → Operations → Outbound → Marketing & Sales → Service.",
              ],
              activity: {
                kind: "canvas", assemblyMode: "sequence",
                title: "Sequence the primary value-chain activities",
                instructions:
                  "Arrange the five primary value-chain activities into the correct left-to-right flow that a product follows through the firm. Drag the activity tokens onto the canvas and order them to reflect the sequence from receiving raw inputs all the way through to supporting the customer after the sale. The order is not arbitrary — it traces the physical and commercial journey of the product. The sidebar contains distractor tokens drawn from the support activities, which sit outside this primary flow. Place only the five primary activities in the correct order and click Check Answer.",
                context:
                  "The primary activities of the value chain are best understood as a sequence that mirrors the journey of the product. Inbound logistics brings raw materials and components into the firm. Operations transforms them into finished goods. Outbound logistics distributes those goods to customers. Marketing and sales generates demand and closes transactions. Finally, service supports the product after purchase, maintaining its value and the customer relationship. Viewing them as an ordered chain rather than a list helps a strategist trace where cost accumulates and where differentiation is created, and reveals how a weakness in one link — slow distribution, poor service — can undermine value built elsewhere.",
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
              hints: [
                "Margin is what's left after each activity takes its share of cost.",
                "Subtract each activity's cost from the price to track the running margin.",
                "Total value added is price minus the sum of all activity costs.",
              ],
              activity: {
                kind: "quantus",
                title: "Value-chain margin build-up",
                instructions:
                  "Analyse where margin is created and consumed across the value chain. The selling price and the cost of each primary activity are prefilled. In the yellow editable cells, compute each activity's cost as a percentage of the selling price, then calculate the total cost and the final margin. This activity-level view reveals which parts of the chain are cost-heavy and where the firm's value is genuinely added versus eroded. A firm might discover that distribution consumes far more of the price than expected, pointing to where efficiency or outsourcing could lift the overall margin. Enter the formulas and click Check Answer.",
                context:
                  "Allocating cost to individual value-chain activities turns a structural framework into a quantitative diagnostic. By expressing each activity's cost as a share of the selling price and tracking the cumulative total, a strategist can see exactly where the firm spends to create its product and how much margin survives to the bottom. This is more revealing than a single aggregate cost figure: two firms with identical total costs might have very different chains, one investing heavily in service and brand, the other in efficient operations. The analysis directs attention to the activities that matter most for cost leadership or differentiation, and frames make-versus-buy and process-improvement decisions.",
                colGroups: [
                  { label: "Value-Chain Economics", start: 1, end: 2, bg: "#f0e8ff" },
                ],
                cols: [
                  { label: "Activity", index: 0, width: 180 },
                  { label: "Cost ($)", index: 1, width: 100 },
                  { label: "% of Price", index: 2, width: 110 },
                ],
                cells: [
                  { r: 0, c: 0, type: "prefilled", display: "Selling Price" },
                  { r: 0, c: 1, type: "prefilled", display: "100" },
                  { r: 1, c: 0, type: "prefilled", display: "Inbound Logistics" },
                  { r: 1, c: 1, type: "prefilled", display: "15" },
                  { r: 1, c: 2, type: "editable", expected: "15", formula: "=B1/B0*100", format: "percent", editable: true, tolerancePct: 1, hint: "Cost ÷ price" },
                  { r: 2, c: 0, type: "prefilled", display: "Operations" },
                  { r: 2, c: 1, type: "prefilled", display: "30" },
                  { r: 2, c: 2, type: "editable", expected: "30", formula: "=B2/B0*100", format: "percent", editable: true, tolerancePct: 1, hint: "Cost ÷ price" },
                  { r: 3, c: 0, type: "prefilled", display: "Outbound & Marketing" },
                  { r: 3, c: 1, type: "prefilled", display: "25" },
                  { r: 3, c: 2, type: "editable", expected: "25", formula: "=B3/B0*100", format: "percent", editable: true, tolerancePct: 1, hint: "Cost ÷ price" },
                  { r: 4, c: 0, type: "header", display: "Total Cost" },
                  { r: 4, c: 1, type: "editable", expected: "70", formula: "=SUM(B1:B3)", format: "number", editable: true, tolerancePct: 0, hint: "Sum of activity costs" },
                  { r: 5, c: 0, type: "header", display: "Margin" },
                  { r: 5, c: 1, type: "editable", expected: "30", formula: "=B0-B4", format: "number", editable: true, tolerancePct: 0, hint: "Price − total cost" },
                ],
              },
            },
          ],
        },
      ],
    },
    // ── TOPIC 2.2 ────────────────────────────────────────────────────────────
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
              hints: [
                "Growth comes from combining existing or new products with existing or new markets.",
                "Existing product + existing market is the lowest-risk option.",
                "New product + new market — diversification — is the highest-risk.",
              ],
              activity: {
                kind: "mcq",
                title: "Ansoff growth strategies",
                instructions:
                  "Answer these questions on the Ansoff matrix, a simple but durable framework for thinking about growth options. Each question has one correct answer. The matrix crosses two choices — whether to pursue existing or new products, and existing or new markets — to yield four named strategies with sharply different risk profiles. The questions test both naming the quadrants and reasoning about their relative risk. Several distractors swap the definitions of adjacent quadrants, the classic confusion. Use the explanations to fix each strategy to its product–market combination.",
                context:
                  "The Ansoff matrix maps four growth strategies against two dimensions: products (existing or new) and markets (existing or new). Market penetration — selling more existing product into existing markets — is the lowest-risk path, relying on capabilities the firm already has. Market development takes existing products into new markets; product development brings new products to existing customers; both raise risk by introducing one unfamiliar element. Diversification, pursuing new products in new markets, is the riskiest because nothing is familiar, though it can offer the highest reward and the greatest spread of risk. The framework forces an explicit, risk-aware choice rather than undirected expansion.",
                questions: [
                  {
                    q: "Selling more of an existing product to existing customers is called:",
                    explanation: "Market penetration deepens the firm's position in markets and products it already knows — the lowest-risk quadrant.",
                    options: [
                      { text: "Market penetration", correct: true },
                      { text: "Market development" },
                      { text: "Product development" },
                      { text: "Diversification" },
                    ],
                  },
                  {
                    q: "Which Ansoff strategy carries the highest risk?",
                    explanation: "Diversification combines a new product with a new market, so the firm has no existing capability or customer base to rely on.",
                    options: [
                      { text: "Diversification", correct: true },
                      { text: "Market penetration" },
                      { text: "Product development" },
                      { text: "Market development" },
                    ],
                  },
                  {
                    q: "Taking an existing product into a new geographic market is:",
                    explanation: "Market development keeps the product the same but enters a new market, raising risk on the market dimension only.",
                    options: [
                      { text: "Market development", correct: true },
                      { text: "Market penetration" },
                      { text: "Diversification" },
                      { text: "Product development" },
                    ],
                  },
                ],
              },
            },
            {
              name: "Mapping Growth Options", difficulty: "medium", estMins: 20,
              description: "Place each strategy in the right product–market cell.",
              hints: [
                "Each quadrant is defined by a product choice and a market choice.",
                "Connect each strategy to its product condition and its market condition.",
                "Penetration = existing product + existing market; diversification = new + new.",
              ],
              activity: {
                kind: "canvas", assemblyMode: "graph",
                title: "Build the Ansoff matrix relationships",
                instructions:
                  "Construct the relationships in the Ansoff matrix as a graph. Drag the four strategy tokens and the product/market condition tokens onto the canvas, then draw arrows connecting each strategy to the product condition and market condition that define it. For example, market penetration should connect to both 'existing product' and 'existing market'. The structure makes explicit why each strategy carries the risk it does. The sidebar includes a distractor condition that does not belong to the two-by-two structure. Connect each of the four strategies to its correct pair of conditions and click Check Answer.",
                context:
                  "The power of the Ansoff matrix lies in its two-by-two structure: each growth strategy is precisely defined by one product condition and one market condition. Making those connections explicit — rather than just memorising four names — is what lets a strategist reason about risk and capability. A strategy that pairs an existing product with an existing market leans entirely on current strengths; one that pairs new with new leans on none. By mapping each strategy to its defining conditions, you can also see the natural progression of risk and why firms typically exhaust penetration before reaching for development or diversification.",
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
                  { from: "pen", to: "exP", role: "connection" },
                  { from: "pen", to: "exM", role: "connection" },
                  { from: "mdev", to: "exP", role: "connection" },
                  { from: "mdev", to: "newM", role: "connection" },
                  { from: "pdev", to: "newP", role: "connection" },
                  { from: "pdev", to: "exM", role: "connection" },
                  { from: "div", to: "newP", role: "connection" },
                  { from: "div", to: "newM", role: "connection" },
                ],
              },
            },
            {
              name: "Expected Value of Growth Bets", difficulty: "hard", estMins: 25,
              description: "Weight growth options by probability to compare them.",
              hints: [
                "Each growth bet has a payoff and a probability of success.",
                "Expected value multiplies the payoff by its probability of success.",
                "Compare options by expected value = payoff × probability.",
              ],
              activity: {
                kind: "quantus",
                title: "Expected value of growth options",
                instructions:
                  "Compare four growth options by their expected value. Each option has an estimated payoff if it succeeds and a probability of success, both prefilled, reflecting the risk profile from the Ansoff matrix. In the yellow editable cells, compute the expected value of each option by weighting its payoff by its probability, then identify which has the highest expected value. This brings quantitative discipline to a qualitative framework: a high-payoff, low-probability diversification bet may be worth less in expectation than a modest, near-certain penetration play. Enter each formula and click Check Answer.",
                context:
                  "Expected value translates the risk language of the Ansoff matrix into comparable numbers. Each growth option is characterised by a payoff if it works and a probability of working; multiplying the two gives the probability-weighted value the firm can expect on average. This lets management compare a safe, low-return penetration strategy against a risky, high-return diversification move on a single yardstick. The technique does not eliminate judgement — the probabilities and payoffs are estimates — but it makes the trade-off between risk and reward explicit and forces decision-makers to state their assumptions. It is the bridge between strategic framing and capital allocation.",
                colGroups: [
                  { label: "Growth Options", start: 1, end: 3, bg: "#f0e8ff" },
                ],
                cols: [
                  { label: "Option", index: 0, width: 180 },
                  { label: "Payoff ($m)", index: 1, width: 110 },
                  { label: "P(success)", index: 2, width: 100 },
                  { label: "Expected Value", index: 3, width: 130 },
                ],
                cells: [
                  { r: 0, c: 0, type: "prefilled", display: "Penetration" },
                  { r: 0, c: 1, type: "prefilled", display: "50" },
                  { r: 0, c: 2, type: "prefilled", display: "0.9" },
                  { r: 0, c: 3, type: "editable", expected: "45", formula: "=B0*C0", format: "number", editable: true, tolerancePct: 1, hint: "Payoff × probability" },
                  { r: 1, c: 0, type: "prefilled", display: "Market Development" },
                  { r: 1, c: 1, type: "prefilled", display: "90" },
                  { r: 1, c: 2, type: "prefilled", display: "0.6" },
                  { r: 1, c: 3, type: "editable", expected: "54", formula: "=B1*C1", format: "number", editable: true, tolerancePct: 1, hint: "Payoff × probability" },
                  { r: 2, c: 0, type: "prefilled", display: "Product Development" },
                  { r: 2, c: 1, type: "prefilled", display: "110" },
                  { r: 2, c: 2, type: "prefilled", display: "0.5" },
                  { r: 2, c: 3, type: "editable", expected: "55", formula: "=B2*C2", format: "number", editable: true, tolerancePct: 1, hint: "Payoff × probability" },
                  { r: 3, c: 0, type: "prefilled", display: "Diversification" },
                  { r: 3, c: 1, type: "prefilled", display: "200" },
                  { r: 3, c: 2, type: "prefilled", display: "0.25" },
                  { r: 3, c: 3, type: "editable", expected: "50", formula: "=B3*C3", format: "number", editable: true, tolerancePct: 1, hint: "Payoff × probability" },
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
              hints: [
                "Two axes: market growth rate and relative market share.",
                "High growth + high share is a star; low growth + high share is a cash cow.",
                "Low growth + low share is a dog; high growth + low share is a question mark.",
              ],
              activity: {
                kind: "mcq",
                title: "BCG portfolio classification",
                instructions:
                  "Answer these questions on the BCG growth-share matrix. Each question has one correct answer. The matrix classifies business units along two axes — market growth and relative market share — into four memorable categories, each implying a different cash dynamic and strategic prescription. The questions test both the classification and the cash-flow logic behind it. Some distractors swap the cash-generating and cash-consuming quadrants, which is the heart of the framework. Read the explanations to connect each quadrant to whether it produces or absorbs cash.",
                context:
                  "The BCG matrix helps a diversified company decide how to allocate cash across its business units. It plots each unit on two axes: the growth rate of its market and its market share relative to the largest competitor. Stars (high growth, high share) need investment but lead attractive markets. Cash cows (low growth, high share) generate more cash than they need and fund the rest of the portfolio. Question marks (high growth, low share) demand cash and an investment decision — back them to become stars, or divest. Dogs (low growth, low share) tie up resources for little return. The framework's central insight is using cash-cow surpluses to nurture question marks into stars.",
                questions: [
                  {
                    q: "A business unit with high market share in a low-growth market is a:",
                    explanation: "A cash cow holds a strong position in a mature market, generating surplus cash with little need for reinvestment.",
                    options: [
                      { text: "Cash cow", correct: true },
                      { text: "Star" },
                      { text: "Question mark" },
                      { text: "Dog" },
                    ],
                  },
                  {
                    q: "Which quadrant typically funds the rest of the portfolio?",
                    explanation: "Cash cows produce more cash than they consume, so their surplus is used to invest in stars and question marks.",
                    options: [
                      { text: "Cash cows", correct: true },
                      { text: "Dogs" },
                      { text: "Question marks" },
                      { text: "Stars" },
                    ],
                  },
                  {
                    q: "A high-growth, low-share unit requiring an invest-or-divest decision is a:",
                    explanation: "Question marks sit in attractive markets but lack share; they consume cash and force a clear strategic choice.",
                    options: [
                      { text: "Question mark", correct: true },
                      { text: "Cash cow" },
                      { text: "Star" },
                      { text: "Dog" },
                    ],
                  },
                ],
              },
            },
            {
              name: "Positioning Units", difficulty: "medium", estMins: 20,
              description: "Connect each business unit to its quadrant by its characteristics.",
              hints: [
                "Each quadrant is defined by a growth level and a share level.",
                "Connect each unit type to its growth condition and its share condition.",
                "Star = high growth + high share; dog = low growth + low share.",
              ],
              activity: {
                kind: "canvas", assemblyMode: "graph",
                title: "Build the BCG matrix relationships",
                instructions:
                  "Construct the BCG matrix as a graph of relationships. Drag the four quadrant tokens and the growth/share condition tokens onto the canvas, then draw arrows connecting each quadrant to the market-growth condition and the market-share condition that define it. A star, for instance, should connect to both 'high growth' and 'high share'. Making these defining conditions explicit clarifies why each quadrant has its characteristic cash behaviour. The sidebar contains a distractor condition that is not part of the two-by-two. Connect each of the four quadrants to its correct pair of conditions and click Check Answer.",
                context:
                  "The four BCG quadrants are not arbitrary labels — each is precisely defined by a combination of market growth and relative market share, and that definition drives its cash dynamics. High growth demands investment; high share generates margin and cash. A star has both, so it is attractive but cash-hungry. A cash cow's low growth means little reinvestment is needed, so its high share throws off surplus cash. A dog has neither advantage. Mapping each quadrant to its underlying conditions, rather than memorising the grid, lets a strategist reason about borderline units and anticipate how a unit might migrate between quadrants as its market matures.",
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
                  { from: "star", to: "hg", role: "connection" },
                  { from: "star", to: "hs", role: "connection" },
                  { from: "cow", to: "lg", role: "connection" },
                  { from: "cow", to: "hs", role: "connection" },
                  { from: "qm", to: "hg", role: "connection" },
                  { from: "qm", to: "ls", role: "connection" },
                  { from: "dog", to: "lg", role: "connection" },
                  { from: "dog", to: "ls", role: "connection" },
                ],
              },
            },
            {
              name: "Portfolio Cash Balance", difficulty: "hard", estMins: 25,
              description: "Net the cash generated and consumed across the portfolio.",
              hints: [
                "Cash cows generate cash; stars and question marks consume it.",
                "Sum the cash flows across all units, respecting their signs.",
                "Net portfolio cash = sum of each unit's cash generation (negative if consuming).",
              ],
              activity: {
                kind: "quantus",
                title: "Balance the portfolio's cash",
                instructions:
                  "Assess whether the business portfolio is self-funding by netting the cash each unit generates or consumes. Each unit's cash flow is prefilled — positive for cash cows that throw off surplus, negative for stars and question marks that absorb investment. In the yellow editable cells, compute the net cash position of the portfolio and determine whether it is self-sustaining. A healthy portfolio uses cash-cow surpluses to fund its stars and the most promising question marks without external financing. Enter the formula to total the cash flows and click Check Answer.",
                context:
                  "A core use of the BCG matrix is checking that a portfolio is in cash balance — that the units generating surplus cash can fund those consuming it without the company having to raise external capital. Cash cows are the engine: their low-growth markets need little reinvestment, leaving cash to redeploy. Stars are roughly self-funding at best, and question marks are net consumers that management hopes to convert into future stars. By netting these flows, a strategist tests the portfolio's sustainability. A portfolio with too few cash cows and too many question marks will run a cash deficit and either starve its growth bets or depend on outside funding — a warning sign the framework surfaces early.",
                colGroups: [
                  { label: "Portfolio Cash Flow ($m)", start: 1, end: 1, bg: "#f0e8ff" },
                ],
                cols: [
                  { label: "Business Unit", index: 0, width: 200 },
                  { label: "Cash Flow ($m)", index: 1, width: 130 },
                ],
                cells: [
                  { r: 0, c: 0, type: "prefilled", display: "Cash Cow A" },
                  { r: 0, c: 1, type: "prefilled", display: "80" },
                  { r: 1, c: 0, type: "prefilled", display: "Cash Cow B" },
                  { r: 1, c: 1, type: "prefilled", display: "50" },
                  { r: 2, c: 0, type: "prefilled", display: "Star" },
                  { r: 2, c: 1, type: "prefilled", display: "-20" },
                  { r: 3, c: 0, type: "prefilled", display: "Question Mark" },
                  { r: 3, c: 1, type: "prefilled", display: "-70" },
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
    // ── TOPIC 3.1 ────────────────────────────────────────────────────────────
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
              hints: [
                "A chain is only as fast as its slowest link.",
                "The bottleneck is the step with the lowest capacity.",
                "Process capacity equals the capacity of its bottleneck step.",
              ],
              activity: {
                kind: "mcq",
                title: "Bottlenecks and throughput",
                instructions:
                  "Answer these questions on identifying bottlenecks and their effect on process throughput. Each question has one correct answer. The central idea is deceptively simple but constantly misapplied: a process can move no faster than its slowest resource, so improving any other step does nothing for overall output. The questions test both finding the bottleneck and reasoning about where improvement effort should go. Distractor options often reflect the tempting but wrong instinct to speed up a non-bottleneck step. Read the explanations to internalise why the bottleneck governs the system.",
                context:
                  "In any multi-step process, throughput — the rate at which units are completed — is limited by the step with the lowest capacity, known as the bottleneck. This is the operational equivalent of a chain being only as strong as its weakest link. The crucial managerial implication is that effort and investment should focus on the bottleneck: speeding up any other step simply builds inventory in front of the constraint without raising output. Once the bottleneck is relieved, the constraint may shift elsewhere, and the analysis repeats. This logic, formalised in the Theory of Constraints, redirects improvement energy to where it actually changes the result.",
                questions: [
                  {
                    q: "A process has three steps with capacities of 100, 60 and 90 units/hour. What is the process throughput?",
                    explanation: "Throughput equals the bottleneck's capacity — the slowest step at 60 units/hour limits the whole process.",
                    options: [
                      { text: "60 units/hour", correct: true },
                      { text: "90 units/hour" },
                      { text: "100 units/hour" },
                      { text: "250 units/hour" },
                    ],
                  },
                  {
                    q: "To increase throughput, you should first improve:",
                    explanation: "Only improving the bottleneck raises output; speeding up other steps just accumulates work-in-progress before the constraint.",
                    options: [
                      { text: "The bottleneck step", correct: true },
                      { text: "The fastest step" },
                      { text: "Every step equally" },
                      { text: "The final step" },
                    ],
                  },
                  {
                    q: "After the bottleneck is improved beyond the other steps, what happens?",
                    explanation: "The constraint moves to whichever step is now slowest — the bottleneck shifts, and the analysis must be repeated.",
                    options: [
                      { text: "The bottleneck shifts to another step", correct: true },
                      { text: "Throughput becomes unlimited" },
                      { text: "The process has no bottleneck" },
                      { text: "All steps slow down" },
                    ],
                  },
                ],
              },
            },
            {
              name: "Little's Law", difficulty: "medium", estMins: 20,
              description: "The relationship between inventory, throughput and flow time.",
              hints: [
                "Little's Law links how much is in the system, how fast it flows, and how long it takes.",
                "Inventory equals throughput multiplied by flow time.",
                "I = R × T (inventory = throughput rate × flow time).",
              ],
              activity: {
                kind: "canvas", assemblyMode: "sequence",
                title: "Build Little's Law",
                instructions:
                  "Assemble Little's Law from the sidebar tokens. Drag the pieces onto the canvas and order them into the correct identity relating the average inventory in a process to its throughput rate and its flow time. This law is one of the most useful results in operations because it holds for any stable process regardless of its internal complexity. Note that the two terms on the right are multiplied; the system will accept them in either order because multiplication is commutative, but it will not accept the wrong term or the wrong operator. The sidebar includes distractor tokens such as a capacity term and an addition operator. Build the equation and click Check Answer.",
                context:
                  "Little's Law states that the average inventory in a stable process equals its throughput rate multiplied by the average flow time: I = R × T. Its beauty is its generality — it makes no assumptions about the distribution of arrivals or service times, so it applies to a factory line, a hospital ward, or a queue of software tickets. Rearranged, it answers practical questions: knowing how many items sit in the system and how fast they flow tells you the average wait; knowing the target wait and the throughput tells you the inventory the system will hold. It is the workhorse linking the three fundamental measures of any flow.",
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
              hints: [
                "Utilisation compares the work demanded of a resource to its available capacity.",
                "Utilisation = demand ÷ capacity, expressed as a percentage.",
                "The resource with the highest utilisation is the bottleneck.",
              ],
              activity: {
                kind: "quantus",
                title: "Compute resource utilisation",
                instructions:
                  "Calculate the utilisation of each resource in a process and identify the bottleneck. The demand placed on each resource and its available capacity (both in units per hour) are prefilled. In the yellow editable cells, compute each resource's utilisation as a percentage of its capacity. The resource with the highest utilisation — the one working closest to or beyond its limit — is the constraint that governs the whole process. This is how operations managers locate bottlenecks quantitatively rather than by intuition, and where they target investment. Enter each formula and click Check Answer.",
                context:
                  "Capacity utilisation measures how intensively a resource is being used: the demand placed on it divided by its available capacity. A resource running at 95% utilisation has almost no slack and is a likely bottleneck; one at 50% has ample headroom. Comparing utilisation across resources pinpoints the constraint objectively, replacing guesswork. Utilisation also carries a subtler lesson: as any resource approaches 100%, waiting times rise sharply and non-linearly because of variability, which is why well-run operations deliberately hold buffer capacity rather than chasing full utilisation everywhere. The metric ties directly to the bottleneck analysis and to decisions about where added capacity will actually lift throughput.",
                colGroups: [
                  { label: "Resource Utilisation", start: 1, end: 3, bg: "#ffe8d8" },
                ],
                cols: [
                  { label: "Resource", index: 0, width: 160 },
                  { label: "Demand (u/hr)", index: 1, width: 120 },
                  { label: "Capacity (u/hr)", index: 2, width: 120 },
                  { label: "Utilisation", index: 3, width: 110 },
                ],
                cells: [
                  { r: 0, c: 0, type: "prefilled", display: "Cutting" },
                  { r: 0, c: 1, type: "prefilled", display: "80" },
                  { r: 0, c: 2, type: "prefilled", display: "100" },
                  { r: 0, c: 3, type: "editable", expected: "80", formula: "=B0/C0*100", format: "percent", editable: true, tolerancePct: 1, hint: "Demand ÷ capacity" },
                  { r: 1, c: 0, type: "prefilled", display: "Assembly" },
                  { r: 1, c: 1, type: "prefilled", display: "80" },
                  { r: 1, c: 2, type: "prefilled", display: "85" },
                  { r: 1, c: 3, type: "editable", expected: "94.1", formula: "=B1/C1*100", format: "percent", editable: true, tolerancePct: 1, hint: "Demand ÷ capacity" },
                  { r: 2, c: 0, type: "prefilled", display: "Packaging" },
                  { r: 2, c: 1, type: "prefilled", display: "80" },
                  { r: 2, c: 2, type: "prefilled", display: "120" },
                  { r: 2, c: 3, type: "editable", expected: "66.7", formula: "=B2/C2*100", format: "percent", editable: true, tolerancePct: 1, hint: "Demand ÷ capacity" },
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
              hints: [
                "Quality has two kinds of cost: the cost of achieving it and the cost of failing.",
                "Prevention and appraisal are costs of conformance; failures are costs of non-conformance.",
                "Internal failures are caught before delivery; external failures reach the customer.",
              ],
              activity: {
                kind: "mcq",
                title: "The cost of quality",
                instructions:
                  "Answer these questions on the cost of quality framework. Each question has one correct answer. The framework splits all quality-related spending into four categories and reveals a powerful trade-off: spending more on preventing defects usually reduces the far larger costs of failures. The questions test the categorisation and the economic logic. Some distractors place a cost in the wrong category — confusing appraisal with prevention, or internal with external failure — which is the usual point of confusion. Read the explanations to fix each cost type and understand why prevention pays.",
                context:
                  "The cost of quality framework divides quality spending into four buckets. Prevention costs are incurred to stop defects happening — training, process design, supplier qualification. Appraisal costs are incurred to detect defects — inspection, testing, audits. Internal failure costs arise when defects are caught before reaching the customer — scrap, rework. External failure costs arise when defects reach the customer — returns, warranty claims, lost reputation, and these are usually by far the most expensive. The framework's central insight is the trade-off: modest investment in prevention typically slashes the much larger failure costs, so the cheapest quality is built in, not inspected in.",
                questions: [
                  {
                    q: "Inspecting finished products for defects is which type of quality cost?",
                    explanation: "Inspection to detect defects is an appraisal cost — it finds problems rather than preventing them.",
                    options: [
                      { text: "Appraisal cost", correct: true },
                      { text: "Prevention cost" },
                      { text: "Internal failure cost" },
                      { text: "External failure cost" },
                    ],
                  },
                  {
                    q: "A customer returns a defective product under warranty. This is:",
                    explanation: "A defect that reached the customer generates an external failure cost — typically the most damaging category.",
                    options: [
                      { text: "External failure cost", correct: true },
                      { text: "Internal failure cost" },
                      { text: "Appraisal cost" },
                      { text: "Prevention cost" },
                    ],
                  },
                  {
                    q: "Which spending typically reduces total quality cost the most?",
                    explanation: "Prevention stops defects at the source, avoiding the much larger appraisal and failure costs downstream.",
                    options: [
                      { text: "Prevention", correct: true },
                      { text: "More inspection" },
                      { text: "More rework capacity" },
                      { text: "Larger warranty reserves" },
                    ],
                  },
                ],
              },
            },
            {
              name: "Defect Rate Analysis", difficulty: "medium", estMins: 20,
              description: "Compute defect rates and first-pass yield.",
              hints: [
                "Defect rate is the share of units that fail; yield is the share that pass.",
                "Defect rate = defects ÷ total units produced.",
                "First-pass yield = 1 − defect rate.",
              ],
              activity: {
                kind: "quantus",
                title: "Defect rate and yield",
                instructions:
                  "Calculate defect rates and first-pass yield across three production lines. The number of units produced and the number of defects found are prefilled for each line. In the yellow editable cells, compute each line's defect rate as a percentage and its first-pass yield, then determine the overall yield. First-pass yield — the proportion of units that pass without rework — is one of the most watched operational quality metrics because it captures efficiency and quality in a single number. Enter each formula and click Check Answer.",
                context:
                  "Defect rate and first-pass yield are the everyday vital signs of process quality. The defect rate is simply defects divided by units produced; first-pass yield is its complement — the share of units that come through correctly the first time, without rework or scrap. Yield matters more than a raw defect count because it normalises for volume and connects directly to cost: every point of yield lost means materials, labour and capacity consumed to produce something that must be reworked or discarded. Tracking yield by line or shift surfaces where quality problems concentrate, and rolling it up across sequential steps (rolled throughput yield) reveals how small per-step losses compound into large total waste.",
                colGroups: [
                  { label: "Quality Metrics", start: 1, end: 3, bg: "#ffe8d8" },
                ],
                cols: [
                  { label: "Line", index: 0, width: 100 },
                  { label: "Units", index: 1, width: 100 },
                  { label: "Defects", index: 2, width: 100 },
                  { label: "Defect Rate", index: 3, width: 110 },
                ],
                cells: [
                  { r: 0, c: 0, type: "prefilled", display: "Line A" },
                  { r: 0, c: 1, type: "prefilled", display: "1000" },
                  { r: 0, c: 2, type: "prefilled", display: "20" },
                  { r: 0, c: 3, type: "editable", expected: "2", formula: "=C0/B0*100", format: "percent", editable: true, tolerancePct: 1, hint: "Defects ÷ units" },
                  { r: 1, c: 0, type: "prefilled", display: "Line B" },
                  { r: 1, c: 1, type: "prefilled", display: "1500" },
                  { r: 1, c: 2, type: "prefilled", display: "45" },
                  { r: 1, c: 3, type: "editable", expected: "3", formula: "=C1/B1*100", format: "percent", editable: true, tolerancePct: 1, hint: "Defects ÷ units" },
                  { r: 2, c: 0, type: "prefilled", display: "Line C" },
                  { r: 2, c: 1, type: "prefilled", display: "800" },
                  { r: 2, c: 2, type: "prefilled", display: "8" },
                  { r: 2, c: 3, type: "editable", expected: "1", formula: "=C2/B2*100", format: "percent", editable: true, tolerancePct: 1, hint: "Defects ÷ units" },
                  { r: 3, c: 0, type: "header", display: "Overall Defect Rate" },
                  { r: 3, c: 3, type: "editable", expected: "2.15", formula: "=SUM(C0:C2)/SUM(B0:B2)*100", format: "percent", editable: true, tolerancePct: 2, hint: "Total defects ÷ total units" },
                ],
              },
            },
            {
              name: "Six Sigma DPMO", difficulty: "hard", estMins: 30,
              description: "Defects per million opportunities and sigma level.",
              hints: [
                "DPMO scales defects to a per-million basis so processes can be compared.",
                "DPMO = (defects ÷ (units × opportunities per unit)) × 1,000,000.",
                "Lower DPMO means a higher sigma level and a more capable process.",
              ],
              activity: {
                kind: "quantus",
                title: "Calculate DPMO",
                instructions:
                  "Compute defects per million opportunities (DPMO), the standard Six Sigma measure of process capability. The number of units, the defect opportunities per unit, and the defects observed are prefilled. In the yellow editable cells, calculate the total opportunities and then the DPMO. DPMO normalises quality to a per-million scale so that processes of very different complexity and volume can be compared on equal footing — a key advantage over a raw defect rate. A world-class 'six sigma' process runs at about 3.4 DPMO. Enter the formulas and click Check Answer.",
                context:
                  "Defects per million opportunities is the lingua franca of Six Sigma quality. Rather than counting defects per unit, it counts them against every opportunity for a defect — recognising that a complex product with many features has more chances to go wrong than a simple one. The calculation divides defects by the total number of opportunities (units multiplied by opportunities per unit), then scales to a million. This normalisation lets an organisation compare the capability of, say, an invoice-processing step against a precision-machining step on a single scale. DPMO maps to a sigma level, with the celebrated six-sigma standard corresponding to roughly 3.4 defects per million — near-perfection that demands tightly controlled, low-variability processes.",
                colGroups: [
                  { label: "Six Sigma DPMO", start: 1, end: 1, bg: "#ffe8d8" },
                ],
                cols: [
                  { label: "Metric", index: 0, width: 240 },
                  { label: "Value", index: 1, width: 120 },
                ],
                cells: [
                  { r: 0, c: 0, type: "prefilled", display: "Units Produced" },
                  { r: 0, c: 1, type: "prefilled", display: "5000" },
                  { r: 1, c: 0, type: "prefilled", display: "Opportunities per Unit" },
                  { r: 1, c: 1, type: "prefilled", display: "4" },
                  { r: 2, c: 0, type: "prefilled", display: "Defects Found" },
                  { r: 2, c: 1, type: "prefilled", display: "30" },
                  { r: 3, c: 0, type: "header", display: "Total Opportunities" },
                  { r: 3, c: 1, type: "editable", expected: "20000", formula: "=B0*B1", format: "number", editable: true, tolerancePct: 0, hint: "Units × opportunities per unit" },
                  { r: 4, c: 0, type: "header", display: "DPMO" },
                  { r: 4, c: 1, type: "editable", expected: "1500", formula: "=B2/B3*1000000", format: "number", editable: true, tolerancePct: 1, hint: "Defects ÷ total opportunities × 1,000,000" },
                ],
              },
            },
          ],
        },
      ],
    },
    // ── TOPIC 3.2 ────────────────────────────────────────────────────────────
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
              hints: [
                "Ordering often means high ordering cost; ordering rarely means high holding cost.",
                "Total cost is the sum of ordering cost and holding cost.",
                "The optimal order balances the two opposing costs.",
              ],
              activity: {
                kind: "mcq",
                title: "Inventory cost trade-offs",
                instructions:
                  "Answer these questions on the fundamental trade-off in inventory management. Each question has one correct answer. The core tension is that the two main inventory costs move in opposite directions as order size changes: larger orders cut ordering costs but raise holding costs, and vice versa. The questions test understanding of this trade-off and what drives each cost. Distractors often describe the effect on the wrong cost. Read the explanations to see why an optimal order quantity exists at the point where the two costs balance.",
                context:
                  "Inventory management is governed by a trade-off between two opposing costs. Ordering cost is incurred each time an order is placed — administration, setup, shipping — and falls as you order in larger, less frequent batches. Holding cost is incurred to keep stock on hand — capital tied up, storage, insurance, obsolescence — and rises with larger batches because more inventory sits waiting. Order too frequently and ordering costs balloon; order too rarely and holding costs balloon. Total inventory cost is the sum of the two, and it is minimised at an intermediate order size where the marginal saving in one cost just offsets the marginal increase in the other. This balance point is what the EOQ model pinpoints.",
                questions: [
                  {
                    q: "As order quantity increases, holding cost per year:",
                    explanation: "Larger orders mean more average inventory sitting in the warehouse, so annual holding cost rises.",
                    options: [
                      { text: "Increases", correct: true },
                      { text: "Decreases" },
                      { text: "Stays constant" },
                      { text: "Becomes zero" },
                    ],
                  },
                  {
                    q: "As order quantity increases, annual ordering cost:",
                    explanation: "Larger orders mean fewer orders per year, so total annual ordering cost falls.",
                    options: [
                      { text: "Decreases", correct: true },
                      { text: "Increases" },
                      { text: "Stays constant" },
                      { text: "Doubles" },
                    ],
                  },
                  {
                    q: "Total inventory cost is minimised when:",
                    explanation: "The optimum is where ordering and holding costs are balanced — at the EOQ, they are in fact equal.",
                    options: [
                      { text: "Ordering cost equals holding cost", correct: true },
                      { text: "Ordering cost is zero" },
                      { text: "Holding cost is maximised" },
                      { text: "Orders are placed daily" },
                    ],
                  },
                ],
              },
            },
            {
              name: "The EOQ Formula", difficulty: "medium", estMins: 25,
              description: "Build the economic order quantity formula.",
              hints: [
                "EOQ balances annual demand and ordering cost against holding cost.",
                "It is the square root of (2 × demand × order cost ÷ holding cost).",
                "EOQ = √(2DS / H).",
              ],
              activity: {
                kind: "canvas", assemblyMode: "graph",
                title: "Build the EOQ formula",
                instructions:
                  "Construct the economic order quantity (EOQ) formula as a graph. Drag the tokens onto the canvas and connect them into the correct structure: the square root of a fraction whose numerator is two times annual demand times the ordering cost, and whose denominator is the holding cost per unit. Pay attention to which terms sit in the numerator versus the denominator — placing holding cost on top would invert the relationship. The sidebar contains distractor tokens, including a unit-price term that does not appear in the basic EOQ. Connect the tokens into the correct formula and click Check Answer.",
                context:
                  "The economic order quantity is the order size that minimises total inventory cost by balancing ordering and holding costs. Its formula, EOQ = √(2DS/H), packs the trade-off into one expression: D is annual demand, S is the cost per order, and H is the holding cost per unit per year. The numerator captures the forces pushing toward larger orders — high demand and costly ordering — while the denominator captures the force pushing toward smaller orders — costly holding. The square root reflects the diminishing returns of batching. Though the model rests on simplifying assumptions like steady demand, it remains a foundational benchmark and the starting point for more elaborate replenishment policies.",
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
              hints: [
                "Plug demand, order cost and holding cost into the EOQ formula.",
                "Then orders per year = demand ÷ EOQ.",
                "Total cost = ordering cost + holding cost at the EOQ.",
              ],
              activity: {
                kind: "quantus",
                title: "Compute EOQ and total cost",
                instructions:
                  "Apply the EOQ model to a real inventory item. Annual demand, the cost per order and the annual holding cost per unit are prefilled. In the yellow editable cells, compute the economic order quantity using the formula, then the number of orders per year, and finally the total annual inventory cost. The total cost combines annual ordering cost and annual holding cost at the optimal order size — and at the EOQ these two should come out roughly equal, confirming the balance point. Enter each formula and click Check Answer.",
                context:
                  "Applying the EOQ formula turns the inventory trade-off into a concrete order policy. With annual demand, ordering cost and holding cost in hand, the formula yields the order quantity that minimises total cost. From there, two follow-on figures matter operationally: the number of orders per year (demand divided by EOQ), which sets the replenishment rhythm, and the total annual cost, which combines ordering and holding costs. A useful check is that at the true EOQ the annual ordering cost and annual holding cost are equal — a direct consequence of the formula's derivation. Managers use these outputs to set reorder schedules and to test how sensitive the cost is to errors in the demand or cost estimates.",
                colGroups: [
                  { label: "EOQ Model", start: 1, end: 1, bg: "#ffe8d8" },
                ],
                cols: [
                  { label: "Metric", index: 0, width: 240 },
                  { label: "Value", index: 1, width: 120 },
                ],
                cells: [
                  { r: 0, c: 0, type: "prefilled", display: "Annual Demand (D)" },
                  { r: 0, c: 1, type: "prefilled", display: "10000" },
                  { r: 1, c: 0, type: "prefilled", display: "Order Cost (S)" },
                  { r: 1, c: 1, type: "prefilled", display: "50" },
                  { r: 2, c: 0, type: "prefilled", display: "Holding Cost per Unit (H)" },
                  { r: 2, c: 1, type: "prefilled", display: "4" },
                  { r: 3, c: 0, type: "header", display: "EOQ" },
                  { r: 3, c: 1, type: "editable", expected: "500", formula: "=SQRT(2*B0*B1/B2)", format: "number", editable: true, tolerancePct: 1, hint: "√(2DS / H)" },
                  { r: 4, c: 0, type: "header", display: "Orders per Year" },
                  { r: 4, c: 1, type: "editable", expected: "20", formula: "=B0/B3", format: "number", editable: true, tolerancePct: 1, hint: "Demand ÷ EOQ" },
                  { r: 5, c: 0, type: "header", display: "Total Annual Cost" },
                  { r: 5, c: 1, type: "editable", expected: "2000", formula: "=B0/B3*B1+B3/2*B2", format: "number", editable: true, tolerancePct: 2, hint: "Ordering cost + holding cost at EOQ" },
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
              hints: [
                "Turnover measures how quickly inventory is sold and replaced.",
                "It divides the cost of goods sold by average inventory.",
                "Inventory Turnover = COGS ÷ Average Inventory.",
              ],
              activity: {
                kind: "canvas", assemblyMode: "sequence",
                title: "Build the inventory turnover ratio",
                instructions:
                  "Assemble the inventory turnover ratio from the sidebar tokens. Drag the pieces onto the canvas and order them into the correct identity that measures how many times a company sells and replaces its inventory over a period. Be careful about which figure goes on top: turnover uses cost of goods sold, not revenue, divided by average inventory — using revenue is a common error that inflates the ratio because of the margin. The sidebar includes a revenue distractor for exactly this reason. Build the ratio correctly and click Check Answer.",
                context:
                  "Inventory turnover measures how efficiently a company converts its stock into sales: it is the cost of goods sold divided by average inventory held over the period. A high turnover means inventory moves quickly, tying up less cash and reducing the risk of obsolescence; a low turnover signals overstocking or slow-moving goods. The choice of numerator matters — cost of goods sold, not revenue, because inventory is carried at cost, and using revenue would overstate turnover by the gross margin. Turnover feeds directly into days inventory outstanding (365 divided by turnover) and into the broader cash conversion cycle, making it a bridge between operational efficiency and working-capital performance.",
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
              hints: [
                "Days metrics translate a turnover ratio into an intuitive number of days.",
                "Days inventory = 365 ÷ inventory turnover.",
                "Days sales outstanding = receivables ÷ revenue × 365.",
              ],
              activity: {
                kind: "quantus",
                title: "Days inventory and DSO",
                instructions:
                  "Convert turnover and receivables figures into days-based metrics. The cost of goods sold, average inventory, revenue and accounts receivable are prefilled. In the yellow editable cells, compute inventory turnover, days inventory outstanding, and days sales outstanding. Days-based metrics are often more intuitive than ratios — telling you, for instance, that inventory sits for 60 days or that customers take 45 days to pay. These feed the cash conversion cycle, which measures how long cash is tied up in operations before it returns. Enter each formula and click Check Answer.",
                context:
                  "Days-based working-capital metrics restate turnover ratios in the more intuitive unit of time. Days inventory outstanding (365 divided by inventory turnover) tells you how long, on average, stock sits before being sold. Days sales outstanding (receivables divided by revenue, times 365) tells you how long customers take to pay. Together with days payable outstanding, they form the cash conversion cycle: the number of days between paying suppliers and collecting from customers. A shorter cycle frees cash; a longer one consumes it. These metrics translate operational and commercial habits — how fast inventory moves, how generous the credit terms — directly into a financing requirement, which is why both operations managers and finance analysts watch them.",
                colGroups: [
                  { label: "Working Capital Days", start: 1, end: 1, bg: "#ffe8d8" },
                ],
                cols: [
                  { label: "Metric", index: 0, width: 240 },
                  { label: "Value", index: 1, width: 120 },
                ],
                cells: [
                  { r: 0, c: 0, type: "prefilled", display: "COGS" },
                  { r: 0, c: 1, type: "prefilled", display: "7300" },
                  { r: 1, c: 0, type: "prefilled", display: "Average Inventory" },
                  { r: 1, c: 1, type: "prefilled", display: "1200" },
                  { r: 2, c: 0, type: "prefilled", display: "Revenue" },
                  { r: 2, c: 1, type: "prefilled", display: "10950" },
                  { r: 3, c: 0, type: "prefilled", display: "Accounts Receivable" },
                  { r: 3, c: 1, type: "prefilled", display: "1350" },
                  { r: 4, c: 0, type: "header", display: "Inventory Turnover" },
                  { r: 4, c: 1, type: "editable", expected: "6.08", formula: "=B0/B1", format: "number", editable: true, tolerancePct: 2, hint: "COGS ÷ average inventory" },
                  { r: 5, c: 0, type: "header", display: "Days Inventory Outstanding" },
                  { r: 5, c: 1, type: "editable", expected: "60", formula: "=365/B4", format: "number", editable: true, tolerancePct: 2, hint: "365 ÷ inventory turnover" },
                  { r: 6, c: 0, type: "header", display: "Days Sales Outstanding" },
                  { r: 6, c: 1, type: "editable", expected: "45", formula: "=B3/B2*365", format: "number", editable: true, tolerancePct: 2, hint: "Receivables ÷ revenue × 365" },
                ],
              },
            },
            {
              name: "Cash Conversion Cycle", difficulty: "hard", estMins: 25,
              description: "Combine the days metrics into the cash conversion cycle.",
              hints: [
                "The cycle measures the gap between paying suppliers and collecting from customers.",
                "Add days inventory and days receivable, then subtract days payable.",
                "CCC = DIO + DSO − DPO.",
              ],
              activity: {
                kind: "canvas", assemblyMode: "graph",
                title: "Build the cash conversion cycle",
                instructions:
                  "Construct the cash conversion cycle as a graph. Drag the tokens onto the canvas and connect them into the correct structure: days inventory outstanding plus days sales outstanding, minus days payable outstanding. The signs and order matter — inventory days and receivable days lengthen the cycle (cash tied up), while payable days shorten it (supplier financing). The sidebar contains a distractor term, days of cash on hand, which is a liquidity measure unrelated to this cycle. Connect the three correct components with the right operators and click Check Answer.",
                context:
                  "The cash conversion cycle measures how many days a company's cash is tied up in operations before it is recovered from customers. It sums two delays that consume cash — days inventory outstanding (how long stock waits to be sold) and days sales outstanding (how long customers take to pay) — and subtracts one delay that supplies cash, days payable outstanding (how long the company takes to pay its own suppliers). A shorter cycle means cash returns faster and less financing is needed to run the business; some elite operators even achieve a negative cycle, collecting from customers before paying suppliers. The metric is where operational efficiency, commercial terms and financing all converge, making it a favourite of investors assessing working-capital discipline.",
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

// All three modules, in display order.
const MODULES: ModuleDef[] = [FINANCE, STRATEGY, OPERATIONS];
// ═══════════════════════════════════════════════════════════════════════════
// Seed part 4 — Generic insert loop + Skill Building tree
// ═══════════════════════════════════════════════════════════════════════════

// Column letter for Quantus formula references (A, B, C, …) — display helper.
function colLetter(i: number): string { return String.fromCharCode(65 + i); }

async function seedLearningTree(professions: Record<string, { id: string; slug: string }>) {
  // Track lessons by a stable key so Skill Building can reference them.
  // key = `${moduleSlug}/${topicIdx}/${subtopicIdx}/${difficulty}`
  const lessonIndex: Record<string, { id: string; name: string; difficulty: Difficulty; activityType: ActivityType }> = {};
  // Track subtopic ids for profession tagging.
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
          level: t.level ?? null, durationWeeks: t.durationWeeks != null ? new Prisma.Decimal(t.durationWeeks) : null,
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

          // Register the activity type on the lesson (junction).
          await prisma.lessonActivity.create({
            data: { lessonId: lessonRow.id, activityType: l.activity.kind, orderIndex: 0 },
          });

          // Create the activity itself.
          await createActivity(lessonRow.id, l.activity);

          // Hints (progressive) — attach to the activity by its type.
          await seedHints(lessonRow.id, l.activity, l.hints);

          lessonIndex[`${m.slug}/${ti}/${si}/${l.difficulty}`] = {
            id: lessonRow.id, name: l.name, difficulty: l.difficulty, activityType: l.activity.kind,
          };
        }
      }
    }
  }

  // Subtopic → profession tags (cross-promotion).
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

  // Skill Building tree (new decoupled system).
  await seedSkillBuilding(professions, lessonIndex);
}

// ─── Activity creators ───────────────────────────────────────────────────────

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
  // Tokens — keep a ref→id map to wire edges.
  const tokenId: Record<string, string> = {};
  for (let i = 0; i < a.tokens.length; i++) {
    const tk = a.tokens[i];
    const row = await prisma.canvasToken.create({
      data: {
        activityId: act.id, displayText: tk.text, tokenRole: tk.role,
        shape: tk.shape ?? "rect", isDistractor: !!tk.distractor, orderIndex: i,
      },
    });
    tokenId[tk.ref] = row.id;
  }
  // Solution edges.
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
  // ActivityHint keys off (activityId, activityType). We use the lesson's
  // single activity, so activityId here = the lesson's activity id. To keep the
  // seed simple and consistent with the lookup-based session bridge, we store
  // hints against the lessonId-scoped activity via its own id.
  // Resolve the activity id we just created:
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

// ─── Skill Building (decoupled: Profession → SkillTopic → SkillLesson) ─────────

async function seedSkillBuilding(
  professions: Record<string, { id: string; slug: string }>,
  lessonIndex: Record<string, { id: string; name: string; difficulty: Difficulty; activityType: ActivityType }>,
) {
  // A SkillTopic is a profession-specific practice track. Each pulls relevant
  // lessons from the Learning tree by reference (lessonId), no content copied.
  // We define a few realistic tracks; each SkillLesson references a Learning lesson.

  interface SkillLessonDef { lessonKey: string; label?: string; }
  interface SkillTopicDef { professionSlug: string; name: string; level: string; weeks: number; description: string; lessons: SkillLessonDef[]; }

  const SKILL_TOPICS: SkillTopicDef[] = [
    {
      professionSlug: "ca", name: "Individual Financial Statement Modeling", level: "Beginners / Intermediate", weeks: 1.5,
      description: "Build the three statements from the ground up — income statement, balance sheet and cash flow.",
      lessons: [
        { lessonKey: "finance/0/0/easy", label: "Gross Profit Identity" },
        { lessonKey: "finance/0/0/medium", label: "Operating Income" },
        { lessonKey: "finance/0/1/easy", label: "Accounting Equation" },
        { lessonKey: "finance/0/2/medium", label: "Operating Cash Flow" },
      ],
    },
    {
      professionSlug: "ib", name: "Valuation Fundamentals", level: "Intermediate / Advanced", weeks: 2.0,
      description: "From discounting to enterprise value — the core valuation toolkit.",
      lessons: [
        { lessonKey: "finance/1/0/easy", label: "Present Value" },
        { lessonKey: "finance/1/0/medium", label: "Discounting a Stream" },
        { lessonKey: "finance/1/0/hard", label: "Terminal Value" },
        { lessonKey: "finance/1/1/easy", label: "EV-to-Equity Bridge" },
        { lessonKey: "finance/1/1/hard", label: "EV Build-Up" },
      ],
    },
    {
      professionSlug: "strategy", name: "Competitive Strategy Frameworks", level: "Beginners / Intermediate", weeks: 1.5,
      description: "The structural frameworks every strategist reaches for first.",
      lessons: [
        { lessonKey: "strategy/0/0/easy", label: "Five Forces" },
        { lessonKey: "strategy/0/1/medium", label: "Value Chain Flow" },
        { lessonKey: "strategy/1/0/easy", label: "Ansoff Matrix" },
        { lessonKey: "strategy/1/1/medium", label: "BCG Matrix" },
      ],
    },
    {
      professionSlug: "ops_mgr", name: "Operations & Flow Essentials", level: "Beginners / Intermediate", weeks: 1.5,
      description: "Throughput, inventory and the metrics that keep a process honest.",
      lessons: [
        { lessonKey: "operations/0/0/easy", label: "Bottlenecks" },
        { lessonKey: "operations/0/0/medium", label: "Little's Law" },
        { lessonKey: "operations/1/0/medium", label: "EOQ Formula" },
        { lessonKey: "operations/1/0/hard", label: "EOQ Calculation" },
        { lessonKey: "operations/1/1/hard", label: "Cash Conversion Cycle" },
      ],
    },
    {
      professionSlug: "fin_analyst", name: "Working Capital & Forecasting", level: "Intermediate", weeks: 1.5,
      description: "The working-capital mechanics that drive a forecast's cash line.",
      lessons: [
        { lessonKey: "finance/0/1/medium", label: "Working Capital" },
        { lessonKey: "finance/0/2/easy", label: "Profit vs Cash" },
        { lessonKey: "operations/1/1/medium", label: "Days Inventory & DSO" },
      ],
    },
  ];

  for (let ti = 0; ti < SKILL_TOPICS.length; ti++) {
    const st = SKILL_TOPICS[ti];
    const prof = professions[st.professionSlug];
    if (!prof) continue;
    const topicRow = await prisma.skillTopic.create({
      data: {
        professionId: prof.id, name: st.name, description: st.description,
        level: st.level, durationWeeks: new Prisma.Decimal(st.weeks), orderIndex: ti,
      },
    });
    for (let li = 0; li < st.lessons.length; li++) {
      const sl = st.lessons[li];
      const learning = lessonIndex[sl.lessonKey];
      if (!learning) { console.warn(`Skill lesson key not found: ${sl.lessonKey}`); continue; }
      await prisma.skillLesson.create({
        data: {
          skillTopicId: topicRow.id, lessonId: learning.id,
          name: sl.label ?? learning.name, difficulty: learning.difficulty,
          orderIndex: li,
        },
      });
    }
  }
}

// ─── Run ───────────────────────────────────────────────────────────────────
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());