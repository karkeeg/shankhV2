import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tree = await prisma.studyPlan.findMany({
    include: {
      modules: {
        include: {
          topics: {
            include: {
              levels: {
                include: {
                  activities: true
                }
              }
            }
          }
        }
      }
    }
  });

  console.log(JSON.stringify(tree, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
