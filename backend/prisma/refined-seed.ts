import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up database...");
  // Clear existing data in reverse order of dependencies
  await prisma.attemptAnswer.deleteMany();
  await prisma.attemptResult.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.activityVersion.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.level.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.module.deleteMany();
  await prisma.studyPlan.deleteMany();

  console.log("Seeding refined pedagogical content...");

  // 1. Study Plan
  const plan = await prisma.studyPlan.create({
    data: {
      title: "Shankh Professional Learning Path",
      description: "Master the art of financial analysis through rigorous practice and real-world scenarios.",
      position: 1,
    },
  });

  // 2. Module
  const module = await prisma.module.create({
    data: {
      studyPlanId: plan.id,
      title: "Introduction to Assets & Liquidity",
      description: "Foundational concepts for building accurate balance sheets.",
      stage: "foundation",
      skillTags: ["Accounting", "Financial Analysis"],
      learningObjective: "Distinguish current from non-current assets and build asset subtotals correctly.",
      caseContext: "A small distribution company is preparing an opening balance-sheet training file after its first full operating quarter.",
      position: 1,
    },
  });

  // 3. Topic: Overview & Concepts
  const topic1 = await prisma.topic.create({
    data: {
      moduleId: module.id,
      title: "Overview & Concepts",
      description: "Core theory and classification logic.",
      position: 1,
    },
  });

  // 4. Topic: Practical Modeling
  const topic2 = await prisma.topic.create({
    data: {
      moduleId: module.id,
      title: "Practical Modeling",
      description: "Applying concepts to spreadsheet and canvas models.",
      position: 2,
    },
  });

  // --- Level: Easy (Topic 1) ---
  const levelEasy = await prisma.level.create({
    data: {
      topicId: topic1.id,
      difficulty: "easy",
      title: "Conceptual Basics",
      description: "Introductory knowledge checks.",
      position: 1,
    },
  });

  // Activity 1: MCQ
  const act1 = await prisma.activity.create({
    data: {
      levelId: levelEasy.id,
      title: "Knowledge Check Test",
      instructions: "Answer the following questions to verify your understanding of asset classification.",
      type: "mcq",
      position: 1,
    },
  });

  await prisma.activityVersion.create({
    data: {
      activityId: act1.id,
      version: 1,
      isPublished: true,
      contentJson: {
        questions: [
          {
            id: "q1",
            prompt: "Which item is ordinarily a current asset?",
            options: ["Factory building", "Cash", "Patent", "Long-term loan receivable"],
            rationale: "Cash is available within the operating cycle.",
            correctAnswer: "B"
          },
          {
            id: "q2",
            prompt: "Accounts receivable refers to",
            options: ["Money owed to suppliers", "Money owed by customers", "Future tax", "Owner capital"],
            rationale: "Receivables arise from sales before collecting cash.",
            correctAnswer: "B"
          }
        ]
      },
      validationRulesJson: {}
    }
  });

  // Activity 2: Spreadsheet
  const act2 = await prisma.activity.create({
    data: {
      levelId: levelEasy.id,
      title: "Asset Totals Calculation",
      instructions: "Identify the current assets and calculate the total.",
      type: "spreadsheet",
      position: 2,
    },
  });

  await prisma.activityVersion.create({
    data: {
      activityId: act2.id,
      version: 1,
      isPublished: true,
      contentJson: {
        prompt: "Calculate Total Current Assets",
        inputs: "Cash₹5000; Accounts Receivable₹8000; Inventory₹12000; Prepayments₹2000",
        expectedAnswer: 27000,
        expectedFormula: "5000 + 8000 + 12000 + 2000",
        difficulty: "easy",
        coach: {
          hint: "Sum all the listed current asset values.",
          correct: "Excellent! You correctly identified and summed all current assets.",
          incorrect: "The sum is not correct. Re-add the four values provided."
        }
      },
      validationRulesJson: {
        type: "spreadsheet",
        mode: "exact"
      }
    }
  });

  // --- Level: Medium (Topic 1) ---
  const levelMed = await prisma.level.create({
    data: {
      topicId: topic1.id,
      difficulty: "medium",
      title: "Liquidity Strategy",
      description: "Decision making and implications.",
      position: 2,
    },
  });

  // Activity 3: Decision
  const act3 = await prisma.activity.create({
    data: {
      levelId: levelMed.id,
      title: "Liquidity Management",
      instructions: "Choose the most appropriate action to improve short-term liquidity.",
      type: "decision",
      position: 1,
    },
  });

  await prisma.activityVersion.create({
    data: {
      activityId: act3.id,
      version: 1,
      isPublished: true,
      contentJson: {
        prompt: "A CFO needs to improve short-term liquidity. Which action is most effective?",
        options: [
          "Accelerate collection of accounts receivable",
          "Purchase new long-term equipment",
          "Increase annual dividend payments",
          "Prepay a five-year lease agreement"
        ],
        scoring: "15 pts for A: Direct cash inflow. 0 pts for others: These decrease cash or are long-term.",
        itemType: "decision"
      },
      validationRulesJson: {}
    }
  });

  // --- Level: Hard (Topic 2) ---
  const levelHard = await prisma.level.create({
    data: {
      topicId: topic2.id,
      difficulty: "hard",
      title: "Asset Hierarchy",
      description: "Complex structural mapping.",
      position: 1,
    },
  });

  // Activity 4: Canvas
  const act4 = await prisma.activity.create({
    data: {
      levelId: levelHard.id,
      title: "Asset Flow Mapping",
      instructions: "Build the structural flow of asset classification on the canvas.",
      type: "canvas",
      position: 1,
    },
  });

  await prisma.activityVersion.create({
    data: {
      activityId: act4.id,
      version: 1,
      isPublished: true,
      contentJson: {
        prompt: "Map the Asset Classification Flow",
        canvasBackgroundText: "Total Assets = Current Assets + Non-Current Assets",
        expectedStructure: "Hierarchy Root -> [Current, Non-Current]",
        coach: {
          hint: "Think about the main subcategories under Total Assets.",
          correct: "The mapping is accurate. You understand the high-level hierarchy.",
          incorrect: "The connections or node counts are not matching the target structure."
        }
      },
      validationRulesJson: {}
    }
  });

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
