/**
 * ============================================================
 * SHANKH — Framework Case Simulation Seed
 * ============================================================
 * Creates one fully-authored case simulation that uses the framework library:
 *
 *   "BrewBean Coffee — Entering the Indian Market"  (medium · Strategy)
 *     · 3 case studies (reading material)
 *     · Activity 1: Framework drill — learner picks the right framework
 *                   (Market Entry, vs Due Diligence / Porter distractors)
 *                   and fills its blank nodes.
 *     · Activity 2: MCQ (2 questions)
 *
 * Requires seed_frameworks.ts to have been run first (snapshots their structure).
 * RESETS case data: deletes ALL existing case simulations, then re-creates this one
 * on the snapshot flow (each case owns a full copy of the framework it uses).
 *
 * Run standalone:
 *   npx ts-node --transpile-only prisma/seed_framework_case.ts
 * ============================================================
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CASE_ID = "case-brewbean-market-entry-001";
const ACT_FW = "act-brewbean-framework-001";
const ACT_MCQ = "act-brewbean-mcq-001";

const STUDIES = [
  {
    id: "study-brewbean-1",
    title: "Company Background",
    orderIndex: 0,
    content:
      "BrewBean Coffee is a mid-sized specialty coffee chain from Australia with 220 outlets and strong unit economics at home. " +
      "Its board wants to enter India — the world's fastest-growing café market — but is unsure whether the move is worthwhile and, if so, how to enter. " +
      "BrewBean's strengths are premium roasting, a loyalty app, and a lean franchise model. It has never operated outside Australia.",
  },
  {
    id: "study-brewbean-2",
    title: "The Indian Café Market",
    orderIndex: 1,
    content:
      "India's organized café market is ~$0.6B and growing ~12% annually, concentrated in the top 20 cities. " +
      "Younger, urban customers drive demand; price sensitivity is high outside metros. Real-estate and import duties on equipment are significant entry barriers. " +
      "Local sourcing of beans is feasible but quality varies.",
  },
  {
    id: "study-brewbean-3",
    title: "Competitive Landscape",
    orderIndex: 2,
    content:
      "Incumbents include a dominant domestic chain, two global majors, and a long tail of independents. " +
      "Differentiation hinges on product mix, store experience, and delivery partnerships. " +
      "Most successful foreign entrants used joint ventures with local real-estate or F&B partners to navigate regulation.",
  },
];

const MCQ_QUESTIONS = [
  {
    id: "q-brewbean-1",
    questionText: "Which entry mode have most successful foreign café chains used in India, per the case?",
    explanation: "The competitive landscape note states successful entrants used joint ventures with local partners to navigate regulation.",
    options: [
      { id: "q1-o1", optionText: "Joint venture with a local partner", isCorrect: true },
      { id: "q1-o2", optionText: "Wholly-owned greenfield rollout", isCorrect: false },
      { id: "q1-o3", optionText: "Pure online delivery only", isCorrect: false },
      { id: "q1-o4", optionText: "Licensing the brand and exiting", isCorrect: false },
    ],
  },
  {
    id: "q-brewbean-2",
    questionText: "What is the single biggest reason to size the market before deciding to enter?",
    explanation: "Market entry economics hinge on Mkt. Size × Mkt. Share × (Price − Variable Cost) − Fixed Cost — sizing is the core of the worthwhile-to-enter question.",
    options: [
      { id: "q2-o1", optionText: "To estimate whether the opportunity is economically worthwhile", isCorrect: true },
      { id: "q2-o2", optionText: "To choose a store's wall colour", isCorrect: false },
      { id: "q2-o3", optionText: "To set employee uniforms", isCorrect: false },
      { id: "q2-o4", optionText: "To pick a logo", isCorrect: false },
    ],
  },
];

const FW_IDS = ["fw-market-entry-001", "fw-due-diligence-001", "fw-five-forces-001"];
const CORRECT_FW = "fw-market-entry-001";

async function main() {
  // Frameworks must exist — the case snapshots their structure at seed time.
  const frameworks = await prisma.framework.findMany({ where: { id: { in: FW_IDS } } });
  if (frameworks.length < FW_IDS.length) {
    console.error("Missing frameworks. Run `npx ts-node --transpile-only prisma/seed_frameworks.ts` first.");
    process.exit(1);
  }

  // ── Fresh slate: remove ALL existing case studies (cascades studies, activities,
  //    sessions, responses) so we re-seed cleanly on the snapshot flow. ──
  const removed = await prisma.caseSimulation.deleteMany({});
  console.log(`✗ Removed ${removed.count} existing case simulation(s).`);

  // Case
  await prisma.caseSimulation.create({
    data: {
      id: CASE_ID, title: "BrewBean Coffee — Entering the Indian Market",
      description: "Decide whether and how BrewBean should enter India, then build the right framework.",
      difficulty: "medium", isPublished: true, orderIndex: 10,
    },
  });

  // Studies
  for (const s of STUDIES) {
    await prisma.caseStudy.create({
      data: { id: s.id, caseSimulationId: CASE_ID, title: s.title, content: s.content, orderIndex: s.orderIndex },
    });
  }

  // Build the case-OWNED snapshots — a full copy of each framework's structure is
  // embedded in the activity, so later edits to the master library never change
  // this case. This is the exact shape the admin editor now writes.
  const byId = new Map(frameworks.map((f) => [f.id, f]));
  const frameworkSnapshots: Record<string, any> = {};
  for (const id of FW_IDS) {
    const f = byId.get(id)!;
    frameworkSnapshots[id] = {
      id: f.id, name: f.name, category: f.category, description: f.description,
      structure: f.structure, // copied into the case (case owns it from here on)
    };
  }

  // Activity 1 — framework drill (correct = Market Entry; distractors = Due Diligence, Five Forces)
  const fwData = {
    mode: "framework",
    title: "Structure the BrewBean entry decision",
    instructions:
      "Choose the framework that best fits a market-entry decision, then fill the blank boxes by analysing the BrewBean case.",
    context:
      "BrewBean must decide whether entering India is worthwhile and, if so, the best way to enter. Pick the right framework and complete its missing nodes.",
    frameworkIds: FW_IDS,
    correctFrameworkId: CORRECT_FW,
    frameworkSnapshots,
  };
  await prisma.caseActivity.create({
    data: { id: ACT_FW, caseSimulationId: CASE_ID, activityType: "canvas", activityData: fwData, orderIndex: 0 },
  });

  // Activity 2 — MCQ
  const mcqData = { instructions: "Answer based on the case studies.", context: "", questions: MCQ_QUESTIONS };
  await prisma.caseActivity.create({
    data: { id: ACT_MCQ, caseSimulationId: CASE_ID, activityType: "mcq", activityData: mcqData, orderIndex: 1 },
  });

  console.log("✓ Seeded case: BrewBean Coffee — Entering the Indian Market");
  console.log("  · 3 studies · framework drill (Market Entry correct, snapshotted) · 2-question MCQ");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
