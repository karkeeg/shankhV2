import { PrismaClient, Difficulty, ActivityType } from "@prisma/client";

const prisma = new PrismaClient();

async function createMcqActivity(lessonId: string, title: string, instructions: string, topicName: string) {
  const mcqActivity = await prisma.mcqActivity.create({
    data: {
      lessonId,
      title: `${title} - MCQ Quiz`,
      instructions,
      context: `This diagnostic assessment tests your core understanding of ${topicName} concepts. Carefully read each question and select the most appropriate option. Review the explanations after submission.`,
    }
  });

  // Question 1
  const q1 = await prisma.mcqQuestion.create({
    data: {
      activityId: mcqActivity.id,
      questionText: `Which of the following is a primary objective or core metric in ${topicName}?`,
      explanation: `Understanding key baseline definitions is essential for master-level calculations and strategic analysis within ${topicName}.`,
      orderIndex: 0,
    }
  });
  await prisma.mcqOption.createMany({
    data: [
      { questionId: q1.id, optionText: "The primary driver of intrinsic value and operational focus", isCorrect: true, orderIndex: 0 },
      { questionId: q1.id, optionText: "A secondary, optional metric of minor relevance", isCorrect: false, orderIndex: 1 },
      { questionId: q1.id, optionText: "An unmeasurable qualitative factor", isCorrect: false, orderIndex: 2 },
      { questionId: q1.id, optionText: "A short-term compliance requirement only", isCorrect: false, orderIndex: 3 },
    ]
  });

  // Question 2
  const q2 = await prisma.mcqQuestion.create({
    data: {
      activityId: mcqActivity.id,
      questionText: `When analyzing a typical scenario in ${topicName}, what is a critical driver of variance?`,
      explanation: `Analyzing variance and key sensitivity drivers is the cornerstone of professional decision-making.`,
      orderIndex: 1,
    }
  });
  await prisma.mcqOption.createMany({
    data: [
      { questionId: q2.id, optionText: "Systemic operational, financial, or strategic alignment variables", isCorrect: true, orderIndex: 0 },
      { questionId: q2.id, optionText: "Purely random statistical noise", isCorrect: false, orderIndex: 1 },
      { questionId: q2.id, optionText: "Isolated micro-fluctuations with zero ripple effect", isCorrect: false, orderIndex: 2 },
      { questionId: q2.id, optionText: "Static parameters that never change", isCorrect: false, orderIndex: 3 },
    ]
  });

  // Question 3
  const q3 = await prisma.mcqQuestion.create({
    data: {
      activityId: mcqActivity.id,
      questionText: `Which of the following represents the most sustainable best practice for continuous improvement in ${topicName}?`,
      explanation: `Long-term performance requires active, dynamic alignment and continuous tracking rather than a one-off configuration.`,
      orderIndex: 2,
    }
  });
  await prisma.mcqOption.createMany({
    data: [
      { questionId: q3.id, optionText: "Continuous feedback integration and model sensitivity calibration", isCorrect: true, orderIndex: 0 },
      { questionId: q3.id, optionText: "A singular, permanent initial parameter set", isCorrect: false, orderIndex: 1 },
      { questionId: q3.id, optionText: "Outsourcing structural diagnostic reviews entirely", isCorrect: false, orderIndex: 2 },
      { questionId: q3.id, optionText: "Relying on legacy default settings and heuristics", isCorrect: false, orderIndex: 3 },
    ]
  });

  // Hints
  await prisma.activityHint.createMany({
    data: [
      { activityType: "mcq", activityId: mcqActivity.id, hintText: "Focus on the definition that maximizes long-term enterprise value and efficiency.", orderIndex: 1 },
      { activityType: "mcq", activityId: mcqActivity.id, hintText: "Eliminate choices that treat the topic as purely static or low-impact.", orderIndex: 2 },
      { activityType: "mcq", activityId: mcqActivity.id, hintText: "Select the option emphasizing adaptability and active sensitivity mapping.", orderIndex: 3 }
    ]
  });
}

async function createQuantusActivity(lessonId: string, title: string, instructions: string, topicName: string) {
  const quantusActivity = await prisma.quantusActivity.create({
    data: {
      lessonId,
      title: `${title} - Spreadsheet Lab`,
      instructions,
      context: `Welcome to the interactive Quantus Lab. Fill in the yellow cells with the appropriate inputs, and construct formula cells to compute the key rollup outputs for ${topicName}.`,
    }
  });

  // Create columns
  const col1 = await prisma.quantusColumn.create({
    data: { activityId: quantusActivity.id, label: "Metric / Driver", colIndex: 0, widthPx: 220 }
  });
  const col2 = await prisma.quantusColumn.create({
    data: { activityId: quantusActivity.id, label: "Current Year (A)", colIndex: 1, widthPx: 120 }
  });
  const col3 = await prisma.quantusColumn.create({
    data: { activityId: quantusActivity.id, label: "Projected Year (E)", colIndex: 2, widthPx: 120 }
  });

  // Create section
  const section = await prisma.quantusSection.create({
    data: { activityId: quantusActivity.id, label: `${topicName} Projections`, orderIndex: 0 }
  });

  // Create rows
  const row1 = await prisma.quantusRow.create({
    data: { sectionId: section.id, label: "Base Parameter", rowKey: "base_val", orderIndex: 0 }
  });
  const row2 = await prisma.quantusRow.create({
    data: { sectionId: section.id, label: "Projected Growth Rate", rowKey: "growth_rate", orderIndex: 1 }
  });
  const row3 = await prisma.quantusRow.create({
    data: { sectionId: section.id, label: "Forecasted Value", rowKey: "forecast_val", orderIndex: 2, isBold: true }
  });

  // Cells for Base Parameter
  await prisma.quantusCell.create({
    data: { rowId: row1.id, columnId: col1.id, cellType: "empty" }
  });
  await prisma.quantusCell.create({
    data: { rowId: row1.id, columnId: col2.id, cellType: "prefilled", defaultValue: 1000, styleClass: "blue" }
  });
  await prisma.quantusCell.create({
    data: { rowId: row1.id, columnId: col3.id, cellType: "prefilled", defaultValue: 1000, styleClass: "blue" }
  });

  // Cells for Projected Growth Rate
  await prisma.quantusCell.create({
    data: { rowId: row2.id, columnId: col1.id, cellType: "empty" }
  });
  await prisma.quantusCell.create({
    data: { rowId: row2.id, columnId: col2.id, cellType: "empty" }
  });
  await prisma.quantusCell.create({
    data: { rowId: row2.id, columnId: col3.id, cellType: "editable", defaultValue: 0.12, styleClass: "yellow" }
  });

  // Cells for Forecasted Value
  await prisma.quantusCell.create({
    data: { rowId: row3.id, columnId: col1.id, cellType: "empty" }
  });
  await prisma.quantusCell.create({
    data: { rowId: row3.id, columnId: col2.id, cellType: "empty" }
  });
  await prisma.quantusCell.create({
    data: { rowId: row3.id, columnId: col3.id, cellType: "formula", formulaExpression: "base_val[1] * (1 + growth_rate[2])", styleClass: "bold" }
  });

  // Hints
  await prisma.activityHint.createMany({
    data: [
      { activityType: "quantus", activityId: quantusActivity.id, hintText: "Locate the yellow input cell and verify the decimal growth representation.", orderIndex: 1 },
      { activityType: "quantus", activityId: quantusActivity.id, hintText: "Construct the projection formula: reference the base cell in current year times (1 + growth rate).", orderIndex: 2 }
    ]
  });
}

async function createCanvasActivity(lessonId: string, title: string, instructions: string, topicName: string) {
  const canvasActivity = await prisma.canvasActivity.create({
    data: {
      lessonId,
      title: `${title} - Framework Drill`,
      instructions,
      context: `Map the key structural components of ${topicName} into their proper conceptual domains to master model categorization.`,
      subtype: "drag_drop",
    }
  });

  // Create zones
  const zoneA = await prisma.canvasZone.create({
    data: { activityId: canvasActivity.id, zoneKey: "inflows_inputs", label: "Inputs / Drivers", color: "#01696F", bgColor: "#E6F0F1", orderIndex: 0 }
  });
  const zoneB = await prisma.canvasZone.create({
    data: { activityId: canvasActivity.id, zoneKey: "outflows_outputs", label: "Outputs / Rollups", color: "#A67C00", bgColor: "#FDF4D5", orderIndex: 1 }
  });

  // Create items
  await prisma.canvasItem.create({
    data: { activityId: canvasActivity.id, label: "Core Input Factor", description: "Independent driver variable", correctZoneId: zoneA.id, orderIndex: 0 }
  });
  await prisma.canvasItem.create({
    data: { activityId: canvasActivity.id, label: "Sensitivity Coefficient", description: "Configurable multiplier", correctZoneId: zoneA.id, orderIndex: 1 }
  });
  await prisma.canvasItem.create({
    data: { activityId: canvasActivity.id, label: "Aggregated Summary Rollup", description: "Cumulative calculated metric", correctZoneId: zoneB.id, orderIndex: 2 }
  });
  await prisma.canvasItem.create({
    data: { activityId: canvasActivity.id, label: "Final Performance Output", description: "Bottom-line result or yield", correctZoneId: zoneB.id, orderIndex: 3 }
  });

  // Hints
  await prisma.activityHint.createMany({
    data: [
      { activityType: "canvas", activityId: canvasActivity.id, hintText: "Think of inputs/drivers as independent variables you configure, and rollups as final calculations.", orderIndex: 1 },
      { activityType: "canvas", activityId: canvasActivity.id, hintText: "Match coefficients and basic driver nodes to Zone A, and summaries and yields to Zone B.", orderIndex: 2 }
    ]
  });
}

async function main() {
  console.log("🌱 Cleaning up existing databases...");
  
  // Wiping all progress and session tables to ensure clean seeding
  await prisma.userMcqAnswer.deleteMany({});
  await prisma.userMcqSession.deleteMany({});
  await prisma.userCanvasPlacement.deleteMany({});
  await prisma.userCanvasSession.deleteMany({});
  await prisma.userQuantusSession.deleteMany({});
  await prisma.userHintUsage.deleteMany({});
  await prisma.userActivityDraft.deleteMany({});
  await prisma.userLessonSession.deleteMany({});
  await prisma.userLessonProgress.deleteMany({});
  await prisma.userSubtopicProgress.deleteMany({});
  await prisma.userTopicProgress.deleteMany({});
  await prisma.userModuleProgress.deleteMany({});
  await prisma.skillBundleItem.deleteMany({});
  await prisma.skillBundleProfession.deleteMany({});
  await prisma.skillBundle.deleteMany({});
  await prisma.profession.deleteMany({});
  await prisma.skillSection.deleteMany({});
  await prisma.topicProfessionTag.deleteMany({});
  await prisma.activityHint.deleteMany({});
  
  // Wiping primary content hierarchy tables
  await prisma.lessonActivity.deleteMany({});
  await prisma.mcqActivity.deleteMany({});
  await prisma.canvasActivity.deleteMany({});
  await prisma.quantusActivity.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.subtopic.deleteMany({});
  await prisma.topic.deleteMany({});
  await prisma.module.deleteMany({});

  console.log("✅ Wiped database clean.");

  // Seeding the 3 Modules
  const modulesData = [
    {
      slug: "finance",
      name: "Finance",
      description: "Master investment banking standards, corporate valuation models, capital structure trade-offs, and dynamic spreadsheet linkages.",
      accentColor: "#01696F",
      iconKey: "TrendingUp",
      orderIndex: 0
    },
    {
      slug: "strategy",
      name: "Strategy",
      description: "Acquire professional frameworks for industry diagnostic testing, competitive matrix mapping, SWOT dynamics, and case formulation.",
      accentColor: "#6B5CE7",
      iconKey: "Compass",
      orderIndex: 1
    },
    {
      slug: "operations",
      name: "Operations",
      description: "Master supply chain forecast logistics, capacity safety inventory controls, lean workflow designs, and continuous cycle diagnostics.",
      accentColor: "#D97706",
      iconKey: "Cpu",
      orderIndex: 2
    }
  ];

  const modulesMap: Record<string, string> = {};

  for (const m of modulesData) {
    const created = await prisma.module.create({ data: m });
    modulesMap[m.slug] = created.id;
    console.log(`Created Module: ${m.name}`);
  }

  // Finance Topic & Subtopics
  const financeTopic = await prisma.topic.create({
    data: {
      moduleId: modulesMap["finance"],
      name: "Core Concepts",
      subtitle: "Corporate Finance & Modeling Foundations",
      description: "Establish the fundamental skills required to link financial statements, model debt service, and compute capital costs.",
      tags: ["Accounting", "Modeling", "Valuation"],
      orderIndex: 0
    }
  });

  const financeSubtopics = [
    { name: "Financial Statements", description: "Understand linkages, flows, and the comprehensive balance sheet reconciliation.", orderIndex: 0 },
    { name: "Capital Structure", description: "Analyze the trade-offs of leverage, debt services, and weighted average cost calculations.", orderIndex: 1 }
  ];

  // Strategy Topic & Subtopics
  const strategyTopic = await prisma.topic.create({
    data: {
      moduleId: modulesMap["strategy"],
      name: "Strategic Frameworks",
      subtitle: "Industry Diagnostics & Case Prep",
      description: "Develop the diagnostic thinking required to dissect business models, competitive dynamics, and growth horizons.",
      tags: ["Frameworks", "SWOT", "CasePrep"],
      orderIndex: 0
    }
  });

  const strategySubtopics = [
    { name: "Competitive Analysis", description: "Map industry value chains, SWOT trade-offs, and competitive intensity matrices.", orderIndex: 0 },
    { name: "Growth Strategy", description: "Evaluate growth boundaries, market entries, diversification matrices, and integration flows.", orderIndex: 1 }
  ];

  // Operations Topic & Subtopics
  const operationsTopic = await prisma.topic.create({
    data: {
      moduleId: modulesMap["operations"],
      name: "Supply Chain & Process",
      subtitle: "Operations Logistics & Lean Workflows",
      description: "Acquire industrial-grade systems knowledge on forecast modeling, cycles, constraints, and safety planning.",
      tags: ["SupplyChain", "Lean", "KPIs"],
      orderIndex: 0
    }
  });

  const operationsSubtopics = [
    { name: "Demand Planning", description: "Understand forecasting variables, inventory controls, and supply chain logistics.", orderIndex: 0 },
    { name: "Process Design", description: "Map visual flows, cycles, constraints, and apply lean optimization drills.", orderIndex: 1 }
  ];

  const subtopicSeeds = [
    { topicId: financeTopic.id, list: financeSubtopics, topicName: "Finance" },
    { topicId: strategyTopic.id, list: strategySubtopics, topicName: "Strategy" },
    { topicId: operationsTopic.id, list: operationsSubtopics, topicName: "Operations" }
  ];

  for (const seed of subtopicSeeds) {
    for (const sub of seed.list) {
      const createdSubtopic = await prisma.subtopic.create({
        data: {
          topicId: seed.topicId,
          name: sub.name,
          description: sub.description,
          orderIndex: sub.orderIndex,
          type: "topic"
        }
      });

      console.log(`  Created Subtopic: ${sub.name} under ${seed.topicName}`);

      // Seed 3 Lessons for this Subtopic
      const difficulties: Difficulty[] = ["easy", "medium", "hard"];
      const lessonTemplates = [
        { suffix: "Foundations & Theory", desc: "Acquire baseline qualitative definitions, concepts, and framework parameters." },
        { suffix: "Core Quantitative Framework", desc: "Explore multi-variable linkage flows, core sensitivities, and structural mechanics." },
        { suffix: "Advanced Case Simulation", desc: "Formulate complex forecasts, link multi-stage variables, and interpret strategic outputs." }
      ];

      for (let i = 0; i < 3; i++) {
        const difficulty = difficulties[i];
        const template = lessonTemplates[i];
        const lessonName = `L${i + 1}: ${createdSubtopic.name} ${template.suffix}`;

        const createdLesson = await prisma.lesson.create({
          data: {
            subtopicId: createdSubtopic.id,
            name: lessonName,
            description: template.desc,
            difficulty,
            orderIndex: i,
            estimatedMins: 15 + (i * 10)
          }
        });

        console.log(`    Created Lesson: ${lessonName} (${difficulty})`);

        // Link activities via junction table
        await prisma.lessonActivity.createMany({
          data: [
            { lessonId: createdLesson.id, activityType: ActivityType.mcq, orderIndex: 0 },
            { lessonId: createdLesson.id, activityType: ActivityType.canvas, orderIndex: 1 },
            { lessonId: createdLesson.id, activityType: ActivityType.quantus, orderIndex: 2 }
          ]
        });

        // Seed all three activities per lesson (User Request: all 3 in all lessons)
        await createMcqActivity(createdLesson.id, createdLesson.name, `Master the foundations of ${createdSubtopic.name} with this dynamic quiz.`, createdSubtopic.name);
        await createCanvasActivity(createdLesson.id, createdLesson.name, `Drag and drop the structural blocks of ${createdSubtopic.name} into their correct segments.`, createdSubtopic.name);
        await createQuantusActivity(createdLesson.id, createdLesson.name, `Complete the financial model and compute sensitivity ratios for ${createdSubtopic.name}.`, createdSubtopic.name);
      }
    }
  }

  console.log("\n🎉 Database Seeding completed successfully!");
  console.log("Seeding summary:");
  console.log(" - Modules: 3");
  console.log(" - Topics: 3");
  console.log(" - Subtopics: 6");
  console.log(" - Lessons: 18");
  console.log(" - MCQ Activities: 18");
  console.log(" - Canvas Activities: 18");
  console.log(" - Quantus Activities: 18");
  console.log(" - Hints: 108");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
