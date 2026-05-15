import { PrismaClient, ActivityType, ModuleStage, LevelDifficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Single-Module Hierarchical Seed...');

  // 1. Create a Study Plan
  const studyPlan = await prisma.studyPlan.upsert({
    where: { slug: 'shankh-professional' },
    update: {},
    create: {
      slug: 'shankh-professional',
      title: 'Shankh Professional Learning Path',
      description: 'The complete 12-module finance curriculum based on context.txt',
    },
  });

  await prisma.module.deleteMany({
    where: { studyPlanId: studyPlan.id, slug: 'introduction-to-assets' }
  });

  // 2. Create the "Introduction to Assets" Module
  const createdModule = await prisma.module.upsert({
    where: { studyPlanId_slug: { studyPlanId: studyPlan.id, slug: 'introduction-to-assets' } },
    update: {},
    create: {
      studyPlanId: studyPlan.id,
      slug: 'introduction-to-assets',
      title: 'Introduction to Assets',
      description: 'Distinguish current from non-current assets, build asset subtotals correctly, and connect classification to liquidity.',
      stage: ModuleStage.foundation,
      skillTags: ['current-assets', 'non-current-assets', 'liquidity-basics'],
      learningObjective: 'Distinguish current from non-current assets and build asset subtotals correctly.',
      caseContext: 'A small distribution company is preparing an opening balance-sheet training file after its first full operating quarter.',
      position: 1,
    },
  });

  /* ─── Topic 1: Overview & Concepts (MCQs) ─── */
  await prisma.topic.create({
    data: {
      moduleId: createdModule.id,
      slug: 'overview-concepts',
      title: 'Overview & Concepts',
      position: 1,
      levels: {
        create: {
          slug: 'concept-warmup',
          title: 'Warm-up',
          difficulty: LevelDifficulty.easy,
          position: 1,
          activities: {
            create: [
              {
                slug: 'module-overview',
                title: 'Module Overview',
                type: ActivityType.lesson,
                position: 0,
                versions: {
                  create: {
                    version: 1,
                    isPublished: true,
                    contentJson: {
                      itemType: 'lesson',
                      title: 'Introduction to Assets',
                      learningObjective: 'Distinguish current from non-current assets.',
                    },
                    validationRulesJson: {},
                  }
                }
              },
              {
                slug: 'mcq-test',
                title: 'Knowledge Check Test',
                type: ActivityType.mcq,
                position: 1,
                versions: {
                  create: {
                    version: 1,
                    isPublished: true,
                    contentJson: {
                      itemType: 'mcq',
                      questions: [
                        {
                          id: 'q1',
                          prompt: 'Which item is ordinarily a current asset?',
                          options: ['Factory building', 'Cash', 'Patent', 'Long-term loan receivable'],
                          correctAnswer: 'B',
                          rationale: 'Cash is available within the operating cycle.'
                        },
                        {
                          id: 'q2',
                          prompt: 'Accounts receivable refers to',
                          options: ['Money owed to suppliers', 'Money owed by customers', 'Future tax', 'Owner capital'],
                          correctAnswer: 'B',
                          rationale: 'Receivables arise from sales before collecting cash.'
                        }
                      ]
                    },
                    validationRulesJson: {},
                  }
                }
              }
            ]
          }
        }
      }
    }
  });

  /* ─── Topic 2: Quantus Practice (Spreadsheets) ─── */
  const quantusTopic = await prisma.topic.create({
    data: {
      moduleId: createdModule.id,
      slug: 'quantus-practice',
      title: 'Quantus Practice',
      position: 2,
    }
  });

  // Level: Current Assets
  await prisma.level.create({
    data: {
      topicId: quantusTopic.id,
      slug: 'current-assets-easy',
      title: 'Total Current Assets',
      difficulty: LevelDifficulty.easy,
      position: 1,
      activities: {
        create: {
          slug: 'quantus-1',
          title: 'Calculate Total Current Assets',
          type: ActivityType.spreadsheet,
          position: 1,
          versions: {
            create: {
              version: 1,
              isPublished: true,
              contentJson: {
                itemType: 'spreadsheet',
                prompt: 'Calculate total current assets',
                inputs: 'Cash ₹12,000; Accounts receivable ₹15,000; Inventory ₹8,000',
                expectedFormula: 'cash + ar + inventory',
                expectedAnswer: '₹35,000',
                difficulty: 'easy'
              },
              validationRulesJson: {},
            }
          }
        }
      }
    }
  });

  // Level: Non-current Assets
  await prisma.level.create({
    data: {
      topicId: quantusTopic.id,
      slug: 'non-current-assets-easy',
      title: 'Total Non-current Assets',
      difficulty: LevelDifficulty.easy,
      position: 2,
      activities: {
        create: {
          slug: 'quantus-2',
          title: 'Calculate Total Non-current Assets',
          type: ActivityType.spreadsheet,
          position: 1,
          versions: {
            create: {
              version: 1,
              isPublished: true,
              contentJson: {
                itemType: 'spreadsheet',
                prompt: 'Calculate total non-current assets',
                inputs: 'PPE ₹50,000; Patents ₹10,000; Long-term investments ₹12,000',
                expectedFormula: 'ppe + patents + lti',
                expectedAnswer: '₹72,000',
                difficulty: 'easy'
              },
              validationRulesJson: {},
            }
          }
        }
      }
    }
  });

  /* ─── Topic 3: Canvas Practice (Visual) ─── */
  const canvasTopic = await prisma.topic.create({
    data: {
      moduleId: createdModule.id,
      slug: 'canvas-practice',
      title: 'Canvas Practice',
      position: 3,
    }
  });

  await prisma.level.create({
    data: {
      topicId: canvasTopic.id,
      slug: 'asset-classification-medium',
      title: 'Asset Classification',
      difficulty: LevelDifficulty.medium,
      position: 1,
      activities: {
        create: {
          slug: 'canvas-1',
          title: 'Bucket Classification',
          type: ActivityType.canvas,
          position: 1,
          versions: {
            create: {
              version: 1,
              isPublished: true,
              contentJson: {
                itemType: 'canvas',
                prompt: 'Drag asset cards into Current Assets and Non-current Assets buckets',
                expectedStructure: 'Current: Cash, AR, Inventory. Non-current: Land, Machinery, Patent, LTI.',
                scoringRubric: '12 pts total'
              },
              validationRulesJson: {},
            }
          }
        }
      }
    }
  });

  /* ─── Topic 4: Conclusion ─── */
  const conclusionTopic = await prisma.topic.create({
    data: {
      moduleId: createdModule.id,
      slug: 'conclusion',
      title: 'Conclusion',
      position: 4,
    }
  });

  await prisma.level.create({
    data: {
      topicId: conclusionTopic.id,
      slug: 'liquidity-decision',
      title: 'Strategic Decision',
      difficulty: LevelDifficulty.medium,
      position: 1,
      activities: {
        create: {
          slug: 'final-decision',
          title: 'Final Decision',
          type: ActivityType.decision,
          position: 1,
          versions: {
            create: {
              version: 1,
              isPublished: true,
              contentJson: {
                itemType: 'decision',
                prompt: 'A CFO needs to improve short-term liquidity...',
                options: ['Collect receivables faster', 'Buy machinery', 'Increase dividends', 'Prepay lease'],
                scoring: '15 pts for A'
              },
              validationRulesJson: {},
            }
          }
        }
      }
    }
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
