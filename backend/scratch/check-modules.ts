import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const modules = await prisma.module.findMany({
    select: {
      id: true,
      title: true,
      description: true
    }
  });

  console.log(JSON.stringify(modules, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
