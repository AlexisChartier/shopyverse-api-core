// AVANT (Incorrect maintenant) :
// import { PrismaClient } from '../src/generated/client';

// APRÈS (Correct pour Prisma 5 standard) :
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');
  
  // Création du rôle Admin
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { name: 'Admin' },
  });

  console.log('Created role:', adminRole);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });