import { PrismaClient } from '@prisma/client'; // Utilisez votre chemin généré

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Création des rôles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { name: 'Admin' },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'Manager Catalogue' },
    update: {},
    create: { name: 'Manager Catalogue' },
  });

  console.log({ adminRole, managerRole });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });