/**
 * ============================================================
 * SHANKH — Case Simulation Seed (framework-based)
 * ============================================================
 * Creates 3 case simulations. EVERY case follows the "framework chosen" model:
 * the learner reads the studies, then on the canvas activity must PICK the right
 * consulting framework (from the correct one + distractors), fill its blank nodes,
 * AND write a free-text recommendation about the case.
 *
 *  1. BrewBean Coffee — Entering the Indian Market   (medium · Strategy)
 *     correct: Market Entry   · distractors: Due Diligence, Porter's Five Forces
 *  2. Meridian Foods — Profits Are Sliding           (easy   · Finance)
 *     correct: Profitability  · distractors: Pricing Strategy, Growth Strategy
 *  3. Summit Capital — Evaluating an Investment       (hard   · Finance)
 *     correct: Due Diligence  · distractors: M&A, Market Entry
 *
 * Each case: studies + 1 framework drill (recommendation enabled) + 1 MCQ.
 *
 * Requires seed_frameworks.ts to have been run first (snapshots their structure).
 * RESETS case data: deletes ALL existing case simulations (cascades studies,
 * activities, sessions, responses), then re-creates these three on the snapshot
 * flow (each case owns a full copy of every framework it offers).
 *
 * Run standalone:
 *   npx ts-node --transpile-only prisma/seed_cases.ts
 * ============================================================
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Framework library IDs (from seed_frameworks.ts) ──────────────────────────

const FW = {
  marketEntry: "fw-market-entry-001",
  newProduct: "fw-new-product-001",
  dueDiligence: "fw-due-diligence-001",
  profitability: "fw-profitability-001",
  ma: "fw-mergers-acquisitions-001",
  pricing: "fw-pricing-strategy-001",
  growth: "fw-growth-strategy-001",
  fiveForces: "fw-five-forces-001",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudyDef { id: string; title: string; orderIndex: number; content: string; }
interface QuestionDef {
  id: string; questionText: string; explanation: string;
  options: { id: string; optionText: string; isCorrect: boolean }[];
}
interface FrameworkActivityDef {
  id: string; title: string; instructions: string; context: string;
  frameworkIds: string[];        // order shown to the learner (correct + distractors)
  correctFrameworkId: string;
  recommendationPrompt: string;
}
interface CaseDef {
  id: string; title: string; description: string;
  difficulty: "easy" | "medium" | "hard"; orderIndex: number;
  studies: StudyDef[];
  framework: FrameworkActivityDef;
  mcq: { id: string; instructions: string; context: string; questions: QuestionDef[] };
}

// ─── CASE 1: BrewBean Coffee — India Market Entry ─────────────────────────────

const CASE_1: CaseDef = {
  id: "case-brewbean-market-entry-001",
  title: "BrewBean Coffee — Entering the Indian Market",
  description: "Decide whether and how BrewBean should enter India, then structure the decision with the right framework.",
  difficulty: "medium",
  orderIndex: 0,
  studies: [
    {
      id: "cs1-study-1", title: "Company Background", orderIndex: 0,
      content: "BrewBean Coffee is a mid-sized specialty coffee chain from Australia with 220 outlets and strong unit economics at home. Its board wants to enter India — the world's fastest-growing café market — but is unsure whether the move is worthwhile and, if so, how to enter. BrewBean's strengths are premium roasting, a loyalty app, and a lean franchise model. It has never operated outside Australia.",
    },
    {
      id: "cs1-study-2", title: "The Indian Café Market", orderIndex: 1,
      content: "India's organized café market is ~$0.6B and growing ~12% annually, concentrated in the top 20 cities. Younger, urban customers drive demand; price sensitivity is high outside metros. Real-estate and import duties on equipment are significant entry barriers. Local sourcing of beans is feasible but quality varies.",
    },
    {
      id: "cs1-study-3", title: "Competitive Landscape", orderIndex: 2,
      content: "Incumbents include a dominant domestic chain, two global majors, and a long tail of independents. Differentiation hinges on product mix, store experience, and delivery partnerships. Most successful foreign entrants used joint ventures with local real-estate or F&B partners to navigate regulation.",
    },
  ],
  framework: {
    id: "ca1-framework-001",
    title: "Structure the BrewBean entry decision",
    instructions: "Choose the framework that best fits a market-entry decision, then fill the blank boxes by analysing the BrewBean case.",
    context: "BrewBean must decide whether entering India is worthwhile and, if so, the best way to enter. Pick the right framework and complete its missing nodes.",
    frameworkIds: [FW.dueDiligence, FW.marketEntry, FW.fiveForces],
    correctFrameworkId: FW.marketEntry,
    recommendationPrompt: "Having structured the problem, write your recommendation: should BrewBean enter India, and if so, through which entry mode? Justify using the customer, company, and competition factors from your framework.",
  },
  mcq: {
    id: "ca1-mcq-001",
    instructions: "Answer based on the case studies. Each question has exactly one correct answer.",
    context: "BrewBean Coffee is weighing entry into India's ~$0.6B café market.",
    questions: [
      {
        id: "ca1-q1",
        questionText: "Which entry mode have most successful foreign café chains used in India, per the case?",
        explanation: "The competitive landscape note states successful entrants used joint ventures with local partners to navigate regulation.",
        options: [
          { id: "ca1-q1-o1", optionText: "Joint venture with a local partner", isCorrect: true },
          { id: "ca1-q1-o2", optionText: "Wholly-owned greenfield rollout", isCorrect: false },
          { id: "ca1-q1-o3", optionText: "Pure online delivery only", isCorrect: false },
          { id: "ca1-q1-o4", optionText: "Licensing the brand and exiting", isCorrect: false },
        ],
      },
      {
        id: "ca1-q2",
        questionText: "What is the single biggest reason to size the market before deciding to enter?",
        explanation: "Market entry economics hinge on Market Size × Market Share × (Price − Variable Cost) − Fixed Cost — sizing is the core of the 'is it worthwhile' question.",
        options: [
          { id: "ca1-q2-o1", optionText: "To estimate whether the opportunity is economically worthwhile", isCorrect: true },
          { id: "ca1-q2-o2", optionText: "To choose a store's wall colour", isCorrect: false },
          { id: "ca1-q2-o3", optionText: "To set employee uniforms", isCorrect: false },
          { id: "ca1-q2-o4", optionText: "To pick a logo", isCorrect: false },
        ],
      },
    ],
  },
};

// ─── CASE 2: Meridian Foods — Profits Are Sliding ─────────────────────────────

const CASE_2: CaseDef = {
  id: "case-meridian-profitability-001",
  title: "Meridian Foods — Profits Are Sliding",
  description: "Meridian's profits have fallen despite flat sales. Diagnose where the profit is leaking using the right framework.",
  difficulty: "easy",
  orderIndex: 1,
  studies: [
    {
      id: "cs2-study-1", title: "The Situation", orderIndex: 0,
      content: "Meridian Foods is a packaged-snacks maker with ₹800 Cr in annual revenue. Over the last two years revenue has stayed roughly flat, but operating profit has fallen ~30%. The CEO wants to know exactly where the profit is leaking before deciding on any action. Nothing obvious has changed in the product line-up.",
    },
    {
      id: "cs2-study-2", title: "Revenue Picture", orderIndex: 1,
      content: "Units sold are flat year-on-year. Average selling price has held steady because the market is competitive and Meridian has avoided price hikes. There is no obvious volume or pricing collapse — revenue is stable across both major product lines (namkeen and baked snacks).",
    },
    {
      id: "cs2-study-3", title: "Cost Picture", orderIndex: 2,
      content: "Raw-material (edible oil, wheat) prices have risen sharply over two years, lifting variable cost per unit. Meanwhile a new automated plant added fixed depreciation and maintenance overhead that is under-utilised at current volumes. Distribution costs per unit have also crept up as fuel prices rose.",
    },
  ],
  framework: {
    id: "ca2-framework-001",
    title: "Diagnose Meridian's profit decline",
    instructions: "Choose the framework that best isolates where profit is leaking, then fill the blank boxes by analysing Meridian's revenue and cost picture.",
    context: "Revenue is flat but profit is down ~30%. Pick the framework that decomposes profit into its drivers and complete its missing nodes.",
    frameworkIds: [FW.pricing, FW.profitability, FW.growth],
    correctFrameworkId: FW.profitability,
    recommendationPrompt: "Based on your decomposition, write your recommendation: which one or two cost drivers should Meridian attack first, and why? Reference the revenue and cost branches of your framework.",
  },
  mcq: {
    id: "ca2-mcq-001",
    instructions: "Answer based on the case studies. Each question has exactly one correct answer.",
    context: "Meridian Foods: revenue flat, operating profit down ~30% over two years.",
    questions: [
      {
        id: "ca2-q1",
        questionText: "Given the case, the profit decline is driven primarily by which side of the profit equation?",
        explanation: "Revenue (price × volume) is flat, while variable costs (raw materials) and fixed costs (under-utilised new plant) have risen. The leak is on the cost side, not revenue.",
        options: [
          { id: "ca2-q1-o1", optionText: "Rising costs (variable + fixed), with revenue roughly flat", isCorrect: true },
          { id: "ca2-q1-o2", optionText: "Falling unit volumes", isCorrect: false },
          { id: "ca2-q1-o3", optionText: "Falling average selling price", isCorrect: false },
          { id: "ca2-q1-o4", optionText: "A collapse in both price and volume", isCorrect: false },
        ],
      },
      {
        id: "ca2-q2",
        questionText: "Why is the new automated plant a profitability problem at current volumes?",
        explanation: "Its depreciation and maintenance are fixed costs. Spread over flat (not higher) volumes, the fixed cost per unit stays high — the plant is under-utilised, dragging margins.",
        options: [
          { id: "ca2-q2-o1", optionText: "Its fixed costs are spread over too few units (under-utilisation)", isCorrect: true },
          { id: "ca2-q2-o2", optionText: "It raised the average selling price", isCorrect: false },
          { id: "ca2-q2-o3", optionText: "It reduced raw-material prices", isCorrect: false },
          { id: "ca2-q2-o4", optionText: "It increased unit volumes too quickly", isCorrect: false },
        ],
      },
    ],
  },
};

// ─── CASE 3: Summit Capital — Evaluating an Investment ────────────────────────

const CASE_3: CaseDef = {
  id: "case-summit-due-diligence-001",
  title: "Summit Capital — Evaluating an Investment",
  description: "A PE fund must decide whether to invest in a fast-growing D2C brand. Structure the evaluation with the right framework.",
  difficulty: "hard",
  orderIndex: 2,
  studies: [
    {
      id: "cs3-study-1", title: "The Opportunity", orderIndex: 0,
      content: "Summit Capital, a private-equity fund, is considering a ₹300 Cr minority investment in NestNutrition, a direct-to-consumer health-foods brand growing 60% a year. Before committing, the investment committee wants a structured commercial assessment — not just the founder's pitch deck — covering the market, the competition, the business, and the customer.",
    },
    {
      id: "cs3-study-2", title: "Market & Competition", orderIndex: 1,
      content: "The Indian health-foods market is large and growing, but crowded: several well-funded D2C brands and legacy FMCG players compete on similar claims. NestNutrition's apparent moat is its subscriber base and repeat-purchase rate, but it is unclear how defensible this is against deep-pocketed incumbents. Market sizing and the durability of the growth rate are the committee's biggest open questions.",
    },
    {
      id: "cs3-study-3", title: "Business & Customer", orderIndex: 2,
      content: "NestNutrition is not yet profitable; growth is partly fuelled by heavy marketing spend, so unit economics and cohort retention need scrutiny. Customer concentration, acquisition cost trends, and whether early cohorts actually retain are unknown. Summit also needs a clear view on valuation, growth plan, and eventual exit options before it can price the deal.",
    },
  ],
  framework: {
    id: "ca3-framework-001",
    title: "Structure Summit's investment evaluation",
    instructions: "Choose the framework that fits a pre-investment commercial assessment, then fill the blank boxes by analysing the NestNutrition opportunity.",
    context: "Summit must assess an investment across market, competition, business and customer before pricing it. Pick the right framework and complete its missing nodes.",
    frameworkIds: [FW.ma, FW.dueDiligence, FW.marketEntry],
    correctFrameworkId: FW.dueDiligence,
    recommendationPrompt: "Based on your diligence structure, write your recommendation: should Summit invest in NestNutrition, and what are the two biggest risks to confirm before closing? Reference the diligence branches from your framework.",
  },
  mcq: {
    id: "ca3-mcq-001",
    instructions: "Answer based on the case studies. Each question has exactly one correct answer.",
    context: "Summit Capital is evaluating a ₹300 Cr minority investment in NestNutrition, a D2C health-foods brand.",
    questions: [
      {
        id: "ca3-q1",
        questionText: "Why is NestNutrition's 60% growth rate not, by itself, enough to justify the investment?",
        explanation: "Growth is partly bought with heavy marketing spend and the business isn't profitable. Diligence must test the durability of growth and the underlying unit economics/retention — not just the headline rate.",
        options: [
          { id: "ca3-q1-o1", optionText: "Its durability and underlying unit economics are unproven", isCorrect: true },
          { id: "ca3-q1-o2", optionText: "Growth rates are irrelevant to investors", isCorrect: false },
          { id: "ca3-q1-o3", optionText: "60% is below the market growth rate", isCorrect: false },
          { id: "ca3-q1-o4", optionText: "The founder declined to share a pitch deck", isCorrect: false },
        ],
      },
      {
        id: "ca3-q2",
        questionText: "Which factor is the most important to verify about NestNutrition's claimed moat?",
        explanation: "The apparent moat is its subscriber base and repeat-purchase rate. Whether early cohorts actually retain — and how defensible that is against deep-pocketed incumbents — is the crux of the moat question.",
        options: [
          { id: "ca3-q2-o1", optionText: "Whether early customer cohorts genuinely retain and repurchase", isCorrect: true },
          { id: "ca3-q2-o2", optionText: "The colour scheme of its packaging", isCorrect: false },
          { id: "ca3-q2-o3", optionText: "The number of office locations it operates", isCorrect: false },
          { id: "ca3-q2-o4", optionText: "The founder's university degree", isCorrect: false },
        ],
      },
    ],
  },
};

const CASES: CaseDef[] = [CASE_1, CASE_2, CASE_3];

// ─── Build the case-OWNED framework snapshot bundle for an activity ───────────
// Each attached framework is copied into the case so later edits to the master
// library never change the case. This is the exact shape the admin editor writes.

function buildFrameworkActivityData(def: FrameworkActivityDef, byId: Map<string, any>) {
  const frameworkSnapshots: Record<string, any> = {};
  for (const fid of def.frameworkIds) {
    const f = byId.get(fid);
    if (!f) throw new Error(`Framework ${fid} not found — run seed_frameworks.ts first.`);
    frameworkSnapshots[fid] = {
      id: f.id, name: f.name, category: f.category, description: f.description,
      structure: f.structure,
    };
  }
  return {
    mode: "framework",
    title: def.title,
    instructions: def.instructions,
    context: def.context,
    frameworkIds: def.frameworkIds,
    correctFrameworkId: def.correctFrameworkId,
    frameworkSnapshots,
    // The learner writes a free-text recommendation after completing the canvas.
    recommendationEnabled: true,
    recommendationPrompt: def.recommendationPrompt,
  };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function seedCases() {
  console.log("Seeding framework-based case simulations…");

  // Frameworks must exist — each case snapshots their structure at seed time.
  const usedFwIds = Array.from(new Set(CASES.flatMap((c) => c.framework.frameworkIds)));
  const frameworks = await prisma.framework.findMany({ where: { id: { in: usedFwIds } } });
  if (frameworks.length < usedFwIds.length) {
    console.error("Missing frameworks. Run `npx ts-node --transpile-only prisma/seed_frameworks.ts` first.");
    process.exit(1);
  }
  const byId = new Map(frameworks.map((f) => [f.id, f]));

  // ── Fresh slate: remove ALL existing case simulations (cascades studies,
  //    activities, sessions, responses) so we re-seed cleanly. ──
  const removed = await prisma.caseSimulation.deleteMany({});
  console.log(`✗ Removed ${removed.count} existing case simulation(s).`);

  for (const c of CASES) {
    console.log(`  ↳ Creating case: ${c.title}`);

    await prisma.caseSimulation.create({
      data: {
        id: c.id, title: c.title, description: c.description,
        difficulty: c.difficulty, isPublished: true, orderIndex: c.orderIndex,
      },
    });

    for (const s of c.studies) {
      await prisma.caseStudy.create({
        data: { id: s.id, caseSimulationId: c.id, title: s.title, content: s.content, orderIndex: s.orderIndex },
      });
    }

    // Activity 1 — framework drill (recommendation enabled)
    await prisma.caseActivity.create({
      data: {
        id: c.framework.id, caseSimulationId: c.id, activityType: "canvas",
        activityData: buildFrameworkActivityData(c.framework, byId) as any, orderIndex: 0,
      },
    });

    // Activity 2 — MCQ
    await prisma.caseActivity.create({
      data: {
        id: c.mcq.id, caseSimulationId: c.id, activityType: "mcq",
        activityData: { instructions: c.mcq.instructions, context: c.mcq.context, questions: c.mcq.questions } as any,
        orderIndex: 1,
      },
    });

    console.log(`     ✓ ${c.studies.length} studies · framework drill (recommendation on) · ${c.mcq.questions.length}-question MCQ`);
  }

  console.log("Case simulation seed complete.");
}

seedCases()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
